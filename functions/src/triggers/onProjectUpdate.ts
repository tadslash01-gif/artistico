import { onDocumentUpdated } from "firebase-functions/v2/firestore";

/**
 * Recalculate trending score on project updates.
 *
 * Score = views + (likes * 3) + (comments * 5) + (saves * 2) + (reviews * 5)
 *       + (rating * 10) + (hasVideo ? 10 : 0)
 *
 * Recency bias: score decays by 10% per week from creation.
 *
 * Note: the isLive (+50) boost is applied client-side in the feed only
 * since live status changes too frequently to persist efficiently.
 */
export const onProjectUpdated = onDocumentUpdated("projects/{projectId}", async (event) => {
  const after = event.data?.after?.data();
  if (!after) return;

  const views = after.viewCount || 0;
  const likes = after.likeCount || 0;
  const comments = after.commentCount || 0;
  const saves = after.savesCount || 0;
  const reviews = after.reviewCount || 0;
  const rating = after.averageRating || 0;
  const hasVideo = !!after.videoUrl;

  const rawScore =
    views +
    likes * 3 +
    comments * 5 +
    saves * 2 +
    reviews * 5 +
    rating * 10 +
    (hasVideo ? 10 : 0);

  // Apply recency decay: 10% per week
  const createdAt = after.createdAt?.toDate?.() || new Date();
  const ageWeeks = (Date.now() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000);
  const decay = Math.pow(0.9, ageWeeks);
  const trendingScore = Math.round(rawScore * decay * 100) / 100;

  // Only write if score actually changed to avoid infinite loops
  const before = event.data?.before?.data();
  if (before && Math.abs((before.trendingScore || 0) - trendingScore) < 0.01) return;

  await event.data!.after!.ref.update({ trendingScore });
});

