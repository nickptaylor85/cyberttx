export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { validateApiKey, type AIProvider } from "@/lib/ai/providers";
import { encrypt, decrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS org_ai_provider (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'anthropic',
    api_key_encrypted TEXT,
    model TEXT,
    enabled BOOLEAN DEFAULT false,
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);
}

// GET — fetch current BYOK config (without exposing full key)
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId || user.role !== "CLIENT_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureTable();

  const rows = await db.$queryRawUnsafe(
    `SELECT provider, api_key_encrypted, model, enabled, validated_at FROM org_ai_provider WHERE org_id = $1`,
    user.orgId
  ) as any[];

  if (rows.length === 0) {
    return NextResponse.json({ provider: "anthropic", hasKey: false, model: null, enabled: false, byokAvailable: await isByokTier(user.orgId) });
  }

  const row = rows[0];
  let maskedKey = null;
  if (row.api_key_encrypted) {
    try { maskedKey = maskKey(decrypt(row.api_key_encrypted)); } catch { maskedKey = "••••••••(encrypted)"; }
  }

  return NextResponse.json({
    provider: row.provider,
    hasKey: !!row.api_key_encrypted,
    maskedKey,
    model: row.model,
    enabled: row.enabled,
    validatedAt: row.validated_at,
    byokAvailable: await isByokTier(user.orgId),
  });
}

// POST — save BYOK config
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId || user.role !== "CLIENT_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check tier
  const available = await isByokTier(user.orgId);
  if (!available) {
    return NextResponse.json({ error: "BYOK is available on Pro and Enterprise plans only. Upgrade to use your own API keys." }, { status: 403 });
  }

  await ensureTable();

  const body = await req.json();
  const { provider, apiKey, model, enabled } = body;

  if (!["anthropic", "openai", "google"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  // Rate limit key validation: 3 per hour
  const rl = rateLimit("byok:" + user.id, 3, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many key validation attempts. Try again later." }, { status: 429 });

  // Validate the API key if provided
  if (apiKey && apiKey !== "unchanged") {
    const validation = await validateApiKey(provider as AIProvider, apiKey);
    if (!validation.valid) {
      return NextResponse.json({ error: `Invalid API key: ${validation.error}` }, { status: 400 });
    }
  }

  // Upsert
  const keyToStore = apiKey === "unchanged" ? undefined : (apiKey ? encrypt(apiKey) : undefined);

  const existing = await db.$queryRawUnsafe(
    `SELECT id FROM org_ai_provider WHERE org_id = $1`, user.orgId
  ) as any[];

  if (existing.length > 0) {
    if (keyToStore !== undefined) {
      await db.$executeRawUnsafe(
        `UPDATE org_ai_provider SET provider = $1, api_key_encrypted = $2, model = $3, enabled = $4, validated_at = NOW(), updated_at = NOW() WHERE org_id = $5`,
        provider, keyToStore, model || null, enabled ?? false, user.orgId
      );
    } else {
      await db.$executeRawUnsafe(
        `UPDATE org_ai_provider SET provider = $1, model = $2, enabled = $3, updated_at = NOW() WHERE org_id = $4`,
        provider, model || null, enabled ?? false, user.orgId
      );
    }
  } else {
    await db.$executeRawUnsafe(
      `INSERT INTO org_ai_provider (org_id, provider, api_key_encrypted, model, enabled, validated_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
      user.orgId, provider, keyToStore || null, model || null, enabled ?? false
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove BYOK config (revert to platform default)
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId || user.role !== "CLIENT_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureTable();
  await db.$executeRawUnsafe(`DELETE FROM org_ai_provider WHERE org_id = $1`, user.orgId);

  return NextResponse.json({ success: true });
}

// ─── Helpers ───────────────────────────────────

async function isByokTier(orgId: string): Promise<boolean> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  return org?.plan === "PROFESSIONAL" || org?.plan === "ENTERPRISE";
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
}
