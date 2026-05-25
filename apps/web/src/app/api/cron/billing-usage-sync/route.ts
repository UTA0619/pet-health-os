import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

/**
 * GET /api/cron/billing-usage-sync
 * Scheduled: Daily 01:00 UTC
 * Syncs subscription status from Stripe to Supabase for any subscriptions
 * that may have expired, been cancelled, or entered past_due.
 * This is a reconciliation safety net — Stripe webhooks are the primary mechanism.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    console.warn("[cron/billing-usage-sync] STRIPE_SECRET_KEY not configured, skipping");
    return NextResponse.json({ skipped: true, reason: "stripe_not_configured" });
  }

  const supabase = createServiceClient();
  const startTime = Date.now();

  console.log("[cron/billing-usage-sync] starting daily subscription reconciliation");

  // Get all active subscriptions that have a Stripe subscription ID
  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select("id, user_id, stripe_subscription_id, status, plan")
    .not("stripe_subscription_id", "is", null)
    .in("status", ["active", "trialing", "past_due"]);

  if (subsError) {
    console.error("[cron/billing-usage-sync] failed to fetch subscriptions", subsError);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    console.log("[cron/billing-usage-sync] no subscriptions to reconcile");
    return NextResponse.json({ reconciled: 0, updated: 0, errors: 0, duration_ms: 0 });
  }

  let reconciled = 0;
  let updated = 0;
  let errors = 0;

  for (const sub of subs) {
    if (!sub.stripe_subscription_id) continue;

    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

      // Note: current_period_end was removed in Stripe API 2026-04-22.dahlia.
      // We reconcile status only; period end is managed via webhooks.
      const newStatus = stripeSub.status; // active | trialing | past_due | canceled | unpaid

      // Check if local record is out of sync with Stripe
      if (sub.status !== newStatus) {
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: newStatus,
            // Downgrade to free plan if subscription is no longer active
            ...(newStatus === "canceled" || newStatus === "unpaid"
              ? { plan: "free" }
              : {}),
          })
          .eq("id", sub.id);

        if (updateError) {
          console.error(
            `[cron/billing-usage-sync] update error for sub ${sub.id}`,
            updateError
          );
          errors++;
        } else {
          console.log(
            `[cron/billing-usage-sync] updated sub ${sub.id}: status=${newStatus} (was ${sub.status})`
          );
          updated++;
        }
      }

      reconciled++;
    } catch (err) {
      console.error(
        `[cron/billing-usage-sync] stripe error for sub ${sub.stripe_subscription_id}`,
        err
      );
      errors++;
    }
  }

  const duration_ms = Date.now() - startTime;
  console.log(
    `[cron/billing-usage-sync] completed — reconciled:${reconciled} updated:${updated} errors:${errors} duration:${duration_ms}ms`
  );

  return NextResponse.json({
    reconciled,
    updated,
    errors,
    total: subs.length,
    duration_ms,
  });
}
