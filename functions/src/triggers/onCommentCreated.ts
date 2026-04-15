import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../admin";
import * as admin from "firebase-admin";

/**
 * Fires when a new comment is created.
 *  1. Increments commentCount on the parent project
 *  2. Sends "comment_on_project" notification to the project creator
 *  3. If a parentId exists, also sends "reply_to_comment" to the parent comment author
 */
export const onCommentCreated = onDocumentCreated("comments/{commentId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { commentId, projectId, userId, userDisplayName, parentId } = data as {
    commentId: string;
    projectId: string;
    userId: string;
    userDisplayName: string;
    parentId: string | null;
  };

  if (!projectId || !userId) return;

  // 1. Increment project commentCount
  await db
    .collection("projects")
    .doc(projectId)
    .update({ commentCount: admin.firestore.FieldValue.increment(1) })
    .catch((err) => console.warn("[onCommentCreated] commentCount increment failed:", err));

  // Fetch project to get creatorId + meta
  const projectDoc = await db.collection("projects").doc(projectId).get();
  if (!projectDoc.exists) return;

  const { creatorId, title: projectTitle, slug: projectSlug } = projectDoc.data()!;
  if (!creatorId) return;

  // Actor info
  const actorDoc = await db.collection("users").doc(userId).get();
  const actorName: string = actorDoc.data()?.displayName || userDisplayName || "Someone";
  const actorAvatar: string | null = actorDoc.data()?.photoURL || null;

  const batch = db.batch();

  // 2. Notify project creator (if commenter is not the creator)
  if (creatorId !== userId) {
    const notifRef = db.collection("notifications").doc();
    batch.set(notifRef, {
      notificationId: notifRef.id,
      recipientId: creatorId,
      type: "comment_on_project",
      actorId: userId,
      actorName,
      actorAvatar,
      entityId: projectId,
      entityTitle: projectTitle || "Untitled Project",
      entitySlug: projectSlug || projectId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 3. Notify parent comment author on reply (if different from creator and commenter)
  if (parentId) {
    const parentDoc = await db.collection("comments").doc(parentId).get();
    if (parentDoc.exists) {
      const parentAuthorId: string | undefined = parentDoc.data()?.userId;
      if (parentAuthorId && parentAuthorId !== userId && parentAuthorId !== creatorId) {
        const replyNotifRef = db.collection("notifications").doc();
        batch.set(replyNotifRef, {
          notificationId: replyNotifRef.id,
          recipientId: parentAuthorId,
          type: "reply_to_comment",
          actorId: userId,
          actorName,
          actorAvatar,
          entityId: projectId,
          entityTitle: projectTitle || "Untitled Project",
          entitySlug: projectSlug || projectId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (parentAuthorId && parentAuthorId !== userId && parentAuthorId === creatorId) {
        // Creator is replying: still notify them as "reply_to_comment" is moot, skip.
        // But if someone else replies to creator's comment, notify creator as reply_to_comment
        // (already covered by the creator === parentAuthorId case above — skip double-notify)
      }
    }
  }

  await batch.commit();
});
