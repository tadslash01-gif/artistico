import { getStripe } from "./client";
import { db } from "../admin";

const DEFAULT_ORIGIN = "https://artistico--artistico-78f75.us-central1.hosted.app";

// Allowed origins for Stripe onboarding redirect URLs (H2 fix)
const ALLOWED_ONBOARDING_ORIGINS = [
  "https://artistico-78f75.web.app",
  "https://artistico-78f75.firebaseapp.com",
  "https://artistico.redphantomops.com",
  "https://artistico--artistico-78f75.us-central1.hosted.app",
];

/**
 * Helper: create a new Stripe Express account and persist the ID to Firestore.
 * Returns the new account ID.
 *
 * IMPORTANT: This must be called inside a Firestore transaction to prevent
 * duplicate Stripe account creation from concurrent requests (C2 fix).
 */
async function createStripeAccountAndGetId(
  stripe: ReturnType<typeof getStripe>,
  uid: string
): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    metadata: { firebaseUid: uid },
  });
  return account.id;
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
    const userRef = db.collection("users").doc(uid);

    // Use a transaction to prevent duplicate Stripe account creation (C2 fix).
    // If two requests arrive simultaneously, only the first creates an account;
    // the second will see the existing accountId after the transaction retries.
    let accountId = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.data();
      const existingAccountId = userData?.creatorProfile?.stripeAccountId;

      if (existingAccountId) {
        // Account already exists — validate it outside the transaction
        return existingAccountId as string;
      }

      // No account yet — create one (Stripe API call is outside transaction scope
      // but we hold the Firestore lock via the transaction write below)
      const newAccountId = await createStripeAccountAndGetId(stripe, uid);

      // Persist atomically. If creatorProfile is null/missing, set the entire object.
      if (!userData?.creatorProfile) {
        tx.update(userRef, {
          isCreator: true,
          creatorProfile: {
            bio: "",
            location: "",
            specialties: [],
            socialLinks: [],
            stripeAccountId: newAccountId,
            stripeOnboardingComplete: false,
          },
        });
      } else {
        tx.update(userRef, {
          "creatorProfile.stripeAccountId": newAccountId,
        });
      }

      return newAccountId;
    });

    // Validate that a stored Stripe account still exists on Stripe's side.
    // If it was deleted externally, create a fresh one in a new transaction.
    try {
      await stripe.accounts.retrieve(accountId);
    } catch (retrieveError: any) {
      console.warn("Stored Stripe account is invalid, creating a new one:", {
        uid,
        oldAccountId: accountId,
        error: retrieveError.message,
      });
      accountId = await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const current = snap.data()?.creatorProfile?.stripeAccountId;
        // Another request may have already fixed it — re-check
        if (current && current !== accountId) return current;

        const newId = await createStripeAccountAndGetId(stripe, uid);
        tx.update(userRef, { "creatorProfile.stripeAccountId": newId });
        return newId;
      });
    }

    // Resolve origin from whitelist only — never trust raw headers (H2 fix)
    const requestOrigin = req.headers.origin || "";
    const origin = ALLOWED_ONBOARDING_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : DEFAULT_ORIGIN;
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
