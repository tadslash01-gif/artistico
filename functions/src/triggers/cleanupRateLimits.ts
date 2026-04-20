import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../admin";

/**
 * Scheduled function that cleans up expired rate limit documents.
 * Runs every 6 hours. Deletes documents whose `expiresAt` is in the past.
 *
 * Without this, the `_rateLimits` collection grows unbounded since each
 * rate-limit window creates a new document with no automatic TTL.
 */
export const cleanupRateLimits = onSchedule("every 6 hours", async () => {
  const now = new Date();
  const expiredSnap = await db
    .collection("_rateLimits")
    .where("expiresAt", "<", now)
    .limit(500)
    .get();

  if (expiredSnap.empty) {
    console.log("[cleanupRateLimits] no expired documents found");
    return;
  }

  // Firestore batch limit is 500 — matches our query limit
  const batch = db.batch();
  expiredSnap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`[cleanupRateLimits] deleted ${expiredSnap.size} expired rate-limit documents`);
});
