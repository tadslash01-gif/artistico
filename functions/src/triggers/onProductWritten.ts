import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "../admin";

/**
 * When a product is created, updated, or deleted, denormalize
 * minPrice, creatorName, and creatorAvatar onto the parent project doc.
 * This avoids N+1 queries when listing projects with price/creator info.
 */
export const onProductWritten = onDocumentWritten("products/{productId}", async (event) => {
  const after = event.data?.after?.data();
  const before = event.data?.before?.data();

  // Determine the projectId from whichever snapshot exists
  const projectId = after?.projectId || before?.projectId;
  if (!projectId) return;

  // Fetch all active products for this project
  const productsSnap = await db
    .collection("products")
    .where("projectId", "==", projectId)
    .where("status", "==", "active")
    .get();

  // Calculate min price across active products
  let minPrice: number | null = null;
  for (const doc of productsSnap.docs) {
    const price = doc.data().price as number;
    if (minPrice === null || price < minPrice) {
      minPrice = price;
    }
  }

  // Fetch the project to get creatorId
  const projectDoc = await db.collection("projects").doc(projectId).get();
  if (!projectDoc.exists) return;
  const projectData = projectDoc.data()!;

  // Fetch creator info
  const creatorDoc = await db.collection("users").doc(projectData.creatorId).get();
  const creatorData = creatorDoc.exists ? creatorDoc.data()! : null;

  const updates: Record<string, any> = {
    minPrice,
    productCount: productsSnap.size,
    creatorName: creatorData?.displayName || "Unknown",
    creatorAvatar: creatorData?.photoURL || null,
  };

  // Only write if values actually changed to avoid triggering project update loops
  const current = projectData;
  const changed =
    current.minPrice !== updates.minPrice ||
    current.productCount !== updates.productCount ||
    current.creatorName !== updates.creatorName ||
    current.creatorAvatar !== updates.creatorAvatar;

  if (changed) {
    await projectDoc.ref.update(updates);
  }
});
