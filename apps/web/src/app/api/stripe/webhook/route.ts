import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || !session.customer || !session.subscription) break;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: "active",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const status = event.type === "customer.subscription.deleted" ? "cancelled" :
        sub.status === "active" ? "active" :
        sub.status === "trialing" ? "trialing" : "past_due";

      await supabase.from("subscriptions").update({
        status,
        plan: status === "cancelled" ? "free" : "pro",
      }).eq("stripe_customer_id", customerId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await supabase.from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", customerId);

      await supabase.from("billing_events").insert({
        stripe_event_id: event.id,
        event_type: "payment_failed",
        amount_cents: invoice.amount_due,
        metadata: { invoice_id: invoice.id, customer_id: customerId },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
