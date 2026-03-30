import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onUserDocCreated = onDocumentCreated(
  "users/{uid}",
  async (event) => {
    // This trigger runs after Firebase Auth trigger creates the user doc.
    // It ensures default fields exist.
    const data = event.data?.data();
    if (!data) return;

    const defaults: Record<string, any> = {};
    if (data.isCreator === undefined) defaults.isCreator = false;
    if (data.creatorProfile === undefined) defaults.creatorProfile = null;

    if (Object.keys(defaults).length > 0) {
      await event.data?.ref.update(defaults);
    }
  }
);
