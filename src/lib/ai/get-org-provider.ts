import { db } from "@/lib/db";
import { getDefaultProvider, type AIProviderConfig } from "@/lib/ai/providers";
import { decrypt } from "@/lib/crypto";

/**
 * Get the AI provider config for an organization.
 * Returns the org's BYOK config if set and enabled, otherwise the platform default.
 */
export async function getOrgAIProvider(orgId: string): Promise<AIProviderConfig> {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT provider, api_key_encrypted, model, enabled FROM org_ai_provider WHERE org_id = $1 AND enabled = true`,
      orgId
    ) as any[];

    if (rows.length > 0 && rows[0].api_key_encrypted) {
      return {
        provider: rows[0].provider,
        apiKey: decrypt(rows[0].api_key_encrypted),
        model: rows[0].model || undefined,
      };
    }
  } catch {
    // Table might not exist yet — fall through to default
  }

  return getDefaultProvider();
}
