import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

const PRICE_TO_PLAN: Record<string, keyof typeof PLAN_LIMITS> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: "STARTER",
  [process.env.STRIPE_PROFESSIONAL_PRICE_ID!]: "PROFESSIONAL",
  [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: "ENTERPRISE",
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Deduplicate
  const existing = await db.stripeEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing?.processed) {
    return NextResponse.json({ received: true });
  }

  await db.stripeEvent.upsert({
    where: { stripeEventId: event.id },
    create: { stripeEventId: event.id, type: event.type },
    update: {},
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        if (!orgId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] || "STARTER";
        const limits = PLAN_LIMITS[plan];

        await db.organization.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan,
            maxUsers: limits.maxUsers,
            maxTtxPerMonth: limits.maxTtxPerMonth,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await db.organization.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!org) break;

        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] || "STARTER";
        const limits = PLAN_LIMITS[plan];

        await db.organization.update({
          where: { id: org.id },
          data: {
            plan,
            maxUsers: limits.maxUsers,
            maxTtxPerMonth: limits.maxTtxPerMonth,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.organization.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            maxUsers: 5,
            maxTtxPerMonth: 3,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`Payment failed for customer ${invoice.customer}`);
        break;
      }
    }

    await db.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
