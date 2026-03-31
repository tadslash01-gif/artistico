import { getStripe } from "./client";
import { db } from "../admin";

const DEFAULT_ORIGIN = "https://artistico.redphantomops.com";

export async function createStripeConnectLink(
  req: { headers: Record<string, any>; user?: { uid: string } },
  res: { status(code: number): any; json(body: any): void }
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const stripe = getStripe();
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    let accountId = userData?.creatorProfile?.stripeAccountId;

    // Create a new Stripe Connect Express account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { firebaseUid: uid },
      });
      accountId = account.id;

      // If creatorProfile is null/missing, set the entire object instead of
      // using dot-notation (Firestore rejects dot-notation updates into null).
      if (!userData?.creatorProfile) {
        await db.collection("users").doc(uid).update({
          creatorProfile: {
            stripeAccountId: accountId,
            stripeOnboardingComplete: false,
          },
        });
      } else {
        await db.collection("users").doc(uid).update({
          "creatorProfile.stripeAccountId": accountId,
        });
      }
    }

    // Use origin header with a safe fallback for environments where it's absent
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, "") || DEFAULT_ORIGIN;

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: `${origin}/dashboard/settings?stripe=refresh`,
      return_url: `${origin}/dashboard/settings?stripe=complete`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect onboarding error:", {
      uid: req.user.uid,
      code: error.code,
      type: error.type,
      message: error.message,
      stack: error.stack,
    });

    if (error.type === "StripeAuthenticationError") {
      res.status(500).json({ error: "Payment service configuration error" });
    } else if (error.type === "StripeInvalidRequestError") {
      res.status(400).json({ error: "Invalid payment setup request" });
    } else {
      res.status(500).json({ error: "Failed to start Stripe onboarding" });
    }
  }
}

export async function getStripeDashboardLink(
  req: { user?: { uid: string } },
  res: { status(code: number): any; json(body: any): void }
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const stripe = getStripe();
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    const accountId = userDoc.data()?.creatorProfile?.stripeAccountId;

    if (!accountId) {
      res.status(400).json({ error: "No Stripe account found" });
      return;
    }

    // Verify the account has completed onboarding before creating a login link
    const account = await stripe.accounts.retrieve(accountId);
    if (!account.charges_enabled || !account.details_submitted) {
      res.status(400).json({ error: "Stripe onboarding incomplete", needsOnboarding: true });
      return;
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);
    res.json({ url: loginLink.url });
  } catch (error: any) {
    console.error("Stripe dashboard link error:", {
      uid: req.user.uid,
      code: error.code,
      type: error.type,
      message: error.message,
    });
    res.status(500).json({ error: "Failed to open Stripe dashboard" });
  }
}
