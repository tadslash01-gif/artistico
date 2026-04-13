import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "../admin";
import * as admin from "firebase-admin";

const MAX_NOTIFY_BATCH = 499; // Firestore batch limit is 500
const MAX_ACTIVITY_EVENTS = 100;

/**
 * Fires when a project document is created or updated.
 * When status transitions to "published" for the first time:
 *   1. Writes an activityEvent document for the homepage feed
 *   2. Notifies all followers of the creator
 */
export const onProjectPublished = onDocumentWritten("projects/{projectId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after) return;

  // Only fire when status transitions TO "published"
  const wasPublished = before?.status === "published";
  const isPublished = after.status === "published";
  if (wasPublished || !isPublished) return;

  const { projectId, creatorId, title, slug } = after;
  if (!creatorId || !projectId) return;

  // Fetch creator to get current name/avatar (denormalized fields may not exist yet)
  const creatorDoc = await db.collection("users").doc(creatorId).get();
  const creatorName: string = creatorDoc.data()?.displayName || after.creatorName || "A creator";
  const creatorAvatar: string | null = creatorDoc.data()?.photoURL || after.creatorAvatar || null;

  // 1. Write activityEvent
  const activityRef = db.collection("activityEvents").doc();
  await activityRef.set({
    eventId: activityRef.id,
    type: "project_published",
    actorId: creatorId,
    actorName: creatorName,
    actorAvatar: creatorAvatar,
    entityId: projectId,
    entityTitle: title || "Untitled Project",
    entitySlug: slug || projectId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 2. Trim activityEvents collection to MAX_ACTIVITY_EVENTS (fire-and-forget)
  trimActivityEvents().catch(() => {});

  // 3. Notify all followers
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
      type: "new_post",
      actorId: creatorId,
      actorName: creatorName,
      actorAvatar: creatorAvatar,
      entityId: projectId,
      entityTitle: title || "Untitled Project",
      entitySlug: slug || projectId,
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
