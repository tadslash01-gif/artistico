import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "../admin";

/**
 * When a product is created, updated, or deleted:
 *   1. Compute and write trendingScore on the product itself.
 *   2. Denormalize minPrice, productCount, creatorName, and creatorAvatar onto
 *      the parent project doc.
 *
 * trendingScore algorithm:
 *   salesCount × 10 + max(0, 70 − 10 × days_since_created)
 * This gives new products a head-start (up to +70) that decays to 0 after 7 days,
 * then purely reflects sales volume.
 */
function computeTrendingScore(salesCount: number, createdAtSeconds: number): number {
  const daysSinceCreated = (Date.now() / 1000 - createdAtSeconds) / 86400;
  const recencyBoost = Math.max(0, 70 - Math.floor(daysSinceCreated) * 10);
  return salesCount * 10 + recencyBoost;
}

export const onProductWritten = onDocumentWritten("products/{productId}", async (event) => {
  const after = event.data?.after?.data();
  const before = event.data?.before?.data();

  // ── 1. Update trendingScore on the product itself ──────────────
  if (after) {
    const salesCount = (after.salesCount as number) || 0;
    const createdAtSeconds = (after.createdAt?.seconds as number) || Date.now() / 1000;
    const newScore = computeTrendingScore(salesCount, createdAtSeconds);
    const currentScore = (after.trendingScore as number) ?? -1;

    // Only write when the score has actually changed (prevents trigger loops)
    const salesCountChanged = !before || before.salesCount !== after.salesCount;
    const isNew = !before;
    if ((isNew || salesCountChanged) && currentScore !== newScore) {
      await event.data!.after!.ref.update({ trendingScore: newScore });
    }
  }

  // ── 2. Denormalize onto parent project (if product is linked) ──
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

  const updates: Record<string, unknown> = {
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
