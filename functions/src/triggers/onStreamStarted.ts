import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../admin";
import * as admin from "firebase-admin";

const MAX_NOTIFY_BATCH = 499; // Firestore batch limit is 500
const MAX_ACTIVITY_EVENTS = 100;

/**
 * Fires when a new stream document is created.
 * When status is "live":
 *   1. Writes an activityEvent for the homepage live feed
 *   2. Notifies all followers of the creator (creator_went_live)
 */
export const onStreamStarted = onDocumentCreated("streams/{streamId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  // Only fan-out when the stream starts live (not scheduled)
  if (data.status !== "live") return;

  const { id: streamId, creatorId, title } = data;
  if (!creatorId || !streamId) return;

  const creatorDoc = await db.collection("users").doc(creatorId).get();
  const creatorName: string = creatorDoc.data()?.displayName || data.creatorName || "A creator";
  const creatorAvatar: string | null = creatorDoc.data()?.photoURL || data.creatorAvatar || null;

  // 1. Write activityEvent
  const activityRef = db.collection("activityEvents").doc();
  await activityRef.set({
    eventId: activityRef.id,
    type: "stream_started",
    actorId: creatorId,
    actorName: creatorName,
    actorAvatar: creatorAvatar,
    entityId: streamId,
    entityTitle: title || "Live Stream",
    entitySlug: streamId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Trim activityEvents to MAX_ACTIVITY_EVENTS (fire-and-forget)
  trimActivityEvents().catch(() => {});

  // 2. Fan-out creator_went_live notifications to all followers
  const followsSnap = await db
    .collection("follows")
    .where("followingId", "==", creatorId)
    .limit(MAX_NOTIFY_BATCH)
    .get();

  if (followsSnap.empty) return;

  const batch = db.batch();
  let opCount = 0;

  for (const followDoc of followsSnap.docs) {
    const followerId = followDoc.data().followerId as string;
    if (followerId === creatorId) continue;

    const notifRef = db.collection("notifications").doc();
    batch.set(notifRef, {
      notificationId: notifRef.id,
      recipientId: followerId,
      type: "creator_went_live",
      actorId: creatorId,
      actorName: creatorName,
      actorAvatar: creatorAvatar,
      entityId: streamId,
      entityTitle: title || "Live Stream",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    opCount++;
    if (opCount >= MAX_NOTIFY_BATCH) break;
  }

  if (opCount > 0) {
    await batch.commit();
  }
});

async function trimActivityEvents() {
  const snap = await db
    .collection("activityEvents")
    .orderBy("createdAt", "desc")
    .offset(MAX_ACTIVITY_EVENTS)
    .limit(50)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
