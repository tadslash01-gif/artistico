import { getStripe } from "./client";
import { db } from "../admin";

const DEFAULT_ORIGIN = "https://artistico--artistico-78f75.us-central1.hosted.app";

/**
 * Helper: create a new Stripe Express account and persist the ID to Firestore.
 * Returns the new account ID.
 */
async function createAndPersistStripeAccount(
  stripe: ReturnType<typeof getStripe>,
  uid: string,
  userData: FirebaseFirestore.DocumentData | undefined
): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    metadata: { firebaseUid: uid },
  });
  const accountId = account.id;

  // If creatorProfile is null/missing, set the entire object instead of
  // using dot-notation (Firestore rejects dot-notation updates into null).
  if (!userData?.creatorProfile) {
    await db.collection("users").doc(uid).update({
      isCreator: true,
      creatorProfile: {
        bio: "",
        location: "",
        specialties: [],
        socialLinks: [],
        stripeAccountId: accountId,
        stripeOnboardingComplete: false,
      },
    });
  } else {
    await db.collection("users").doc(uid).update({
      "creatorProfile.stripeAccountId": accountId,
    });
  }

  return accountId;
}

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

    if (accountId) {
      // Validate that the stored Stripe account still exists.
      // If the account was deleted on Stripe's side, create a fresh one.
      try {
        await stripe.accounts.retrieve(accountId);
      } catch (retrieveError: any) {
        console.warn("Stored Stripe account is invalid, creating a new one:", {
          uid,
          oldAccountId: accountId,
          error: retrieveError.message,
        });
        accountId = await createAndPersistStripeAccount(stripe, uid, userData);
      }
    } else {
      // No account exists yet — create one
      accountId = await createAndPersistStripeAccount(stripe, uid, userData);
    }

    // Use origin header with a safe fallback for environments where it's absent
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, "") || DEFAULT_ORIGIN;
    console.log("Stripe onboarding origin:", origin);

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
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
      // Surface Stripe's actual message so the platform owner can act on it
      // (e.g. "Please review the responsibilities of managing losses…")
      const msg = error.message?.includes("platform-profile")
        ? "Stripe requires the platform owner to complete the Connect platform profile. Please visit the Stripe Dashboard → Settings → Connect → Platform profile to accept the required agreements."
        : error.message || "Invalid payment setup request";
      res.status(400).json({ error: msg, code: error.code });
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
