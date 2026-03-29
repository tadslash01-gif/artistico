import * as admin from "firebase-admin";

admin.initializeApp();

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// ─── API Endpoints ───────────────────────────────────────
export { api } from "./api";

// ─── Stripe Webhooks ─────────────────────────────────────
export { stripeWebhook } from "./stripe/webhooks";

// ─── Firestore Triggers ──────────────────────────────────
export { onUserCreated } from "./triggers/onUserCreate";
