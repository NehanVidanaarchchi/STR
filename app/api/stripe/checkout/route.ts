import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //apiVersion: "2025-01-27.acacia",
});

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  core: process.env.STRIPE_PRICE_CORE,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

type SessionInfo = {
  providerId: string;
  role: "Admin" | "Editor" | "Viewer";
  userType: "provider" | "team_member";
  userId: string;
};
function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>): SessionInfo | null {
  const providerSessionRaw = cookieStore.get("provider_session")?.value;
  const teamSessionRaw = cookieStore.get("team_member_session")?.value;

  // If both exist, clear and force re-login (prevents weird conflicts)
  if (providerSessionRaw && teamSessionRaw) return null;

  if (providerSessionRaw) {
    const s = JSON.parse(providerSessionRaw);
    if (!s?.id) return null;

    return {
      providerId: s.id,
      role: "Admin",
      userType: "provider",
      userId: s.id,
    };
  }

  if (teamSessionRaw) {
    const s = JSON.parse(teamSessionRaw);
    if (!s?.id || !s?.provider_id) return null;

    return {
      providerId: s.provider_id,
      role: (s.role || "Viewer") as SessionInfo["role"],
      userType: "team_member",
      userId: s.id,
    };
  }

  return null;
}

export async function POST(req: Request) {
  try {

    const { planId } = await req.json();

    console.log("Plan ID received:", planId);
    console.log("Core price ID:", process.env.STRIPE_PRICE_CORE);
    console.log("Premium price ID:", process.env.STRIPE_PRICE_PREMIUM);
    console.log("Price map:", PRICE_BY_PLAN);

    const priceId = PRICE_BY_PLAN[planId];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid planId or missing Stripe price" }, { status: 400 });
    }

    // Use your existing provider_session cookie pattern
    const cookieStore = await cookies();
    const sessionCookie = getSession(cookieStore);

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerId = sessionCookie.providerId;

    if (!providerId) {
      return NextResponse.json({ error: "Provider not found in session" }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // use "payment" if you want one-time payment
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/commercial?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/commercial?canceled=1`,
      metadata: {
        providerId,
        planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("checkout error:", e);
    return NextResponse.json({ error: e.message ?? "Checkout error" }, { status: 500 });
  }
}
