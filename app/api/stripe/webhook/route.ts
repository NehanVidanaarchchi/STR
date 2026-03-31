import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 // apiVersion: "2025-01-27.acacia",
});

// export async function POST(req: Request) {
//   const sig = req.headers.get("stripe-signature");
//   if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

//   const body = await req.text();

//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
//   } catch (err: any) {
//     console.error("Webhook signature failed:", err.message);
//     return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
//   }

//   try {
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object as Stripe.Checkout.Session;
//       const providerId = session.metadata?.providerId;
//       const planId = session.metadata?.planId;

//       if (!providerId || !planId) return NextResponse.json({ ok: true });

//       // ✅ Save plan in DB (create a table provider_subscriptions or provider_plan)
//       // Example table: provider_plans(provider_id, plan_id, status, updated_at)
//       await supabaseAdmin.from("provider_plans").upsert(
//         {
//           provider_id: providerId,
//           plan_id: planId,
//           status: "ACTIVE",
//           updated_at: new Date().toISOString(),
//         },
//         { onConflict: "provider_id" }
//       );
//     }

//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     console.error("Webhook handler error:", e);
//     return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
//   }
// }

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const providerId = session.metadata?.providerId;
      const planId = session.metadata?.planId;
console.log("✅ checkout.session.completed received");
console.log("metadata:", session.metadata);
console.log("session.id:", session.id);

      if (!providerId || !planId) return NextResponse.json({ ok: true });

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      const { error } = await supabaseAdmin
        .from("providers")
        .update({
          plan_id: planId,
          plan_status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", providerId);

      if (error) console.error("Supabase update error:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
