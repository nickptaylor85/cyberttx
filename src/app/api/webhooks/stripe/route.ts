import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/types";

function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event: any;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!); }
  catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  const existing = await db.stripeEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing?.processed) return NextResponse.json({ received: true });
  await db.stripeEvent.upsert({ where: { stripeEventId: event.id }, create: { stripeEventId: event.id, type: event.type }, update: {} });
  try {
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await db.organization.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { plan: "FREE", stripeSubscriptionId: null, maxUsers: 5, maxTtxPerMonth: 3 } });
    }
    await db.stripeEvent.update({ where: { stripeEventId: event.id }, data: { processed: true, processedAt: new Date() } });
  } catch (e) { console.error("Stripe webhook error:", e); }
  return NextResponse.json({ received: true });
}
