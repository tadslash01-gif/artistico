import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../admin";
import * as admin from "firebase-admin";

/**
 * Fires when a new message entry is written to a conversation.
 * Sends a "new_message" in-app notification to the recipient
 * (the participant who did NOT send the message).
 */
export const onMessageCreated = onDocumentCreated(
  "messages/{conversationId}/entries/{entryId}",
  async (event) => {
    const entryData = event.data?.data();
    if (!entryData) return;

    const { conversationId } = event.params;
    const senderId: string = entryData.senderId;

    // Fetch the parent conversation to identify the recipient
    const convDoc = await db.collection("messages").doc(conversationId).get();
    if (!convDoc.exists) return;

    const participants: string[] = convDoc.data()?.participants || [];
    const recipientId = participants.find((uid) => uid !== senderId);
    if (!recipientId) return;

    // Fetch sender info for notification enrichment
    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderData = senderDoc.data();

    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      notificationId: notifRef.id,
      recipientId,
      type: "new_message",
      actorId: senderId,
      actorName: senderData?.displayName || "Someone",
      actorAvatar: senderData?.photoURL || null,
      entityId: conversationId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);
