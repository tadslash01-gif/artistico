import { getStripe } from "./client";
import { db } from "../admin";

export async function createStripeConnectLink(
  req: { headers: Record<string, any>; user?: { uid: string } },
  res: { json(body: any): void }
): Promise<void> {
  const stripe = getStripe();
  const uid = req.user!.uid;
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

    await db.collection("users").doc(uid).update({
      "creatorProfile.stripeAccountId": accountId,
    });
  }

  // Create an account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId!,
    refresh_url: `${req.headers.origin}/dashboard/settings?stripe=refresh`,
    return_url: `${req.headers.origin}/dashboard/settings?stripe=complete`,
    type: "account_onboarding",
  });

  res.json({ url: accountLink.url });
}

export async function getStripeDashboardLink(
  req: { user?: { uid: string } },
  res: { status(code: number): any; json(body: any): void }
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
}
