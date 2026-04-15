import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type DocumentSnapshot,
  type Firestore,
} from "firebase/firestore";
/** Minimal project shape required by the smart feed (scoring + display). */
export interface FeedProject {
  projectId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  viewCount?: number;
  savesCount?: number;
  likeCount?: number;
  commentCount?: number;
  totalSalesCount?: number;
  minPrice?: number | null;
  creatorName?: string;
  creatorAvatar?: string | null;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  clipUrl?: string;
  clipThumbnailUrl?: string;
  clipPlaybackId?: string;
  clipStatus?: "processing" | "ready";
  status: string;
  trendingScore?: number;
  // Firestore Timestamp shape
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

/** Number of projects scored in each Firestore batch */
export const FEED_BATCH_SIZE = 60;

/** Number of scored projects shown per page */
export const FEED_PAGE_SIZE = 20;

/** Hourly decay factor — reduces score by 0.5 points per hour of age */
const HOURLY_DECAY = 0.5;

/** Boost applied to projects whose creator you follow */
const FOLLOW_BOOST = 30;

/** Boost applied to projects whose creator is currently live */
const LIVE_BOOST = 50;

/**
 * Score a project for feed ranking.
 *
 * Formula (client-side, fast):
 *   (likeCount * 3) + (commentCount * 5) + (viewCount * 1) + (savesCount * 2)
 *   + (isLive ? 50 : 0) + (hasVideo ? 10 : 0) + (isFollowed ? 30 : 0)
 *   - ageInHours * 0.5
 *
 * Live content surfaces first (short TTL since onSnapshot refreshes liveCreatorIds).
 * Followed creators get a strong personalisation boost.
 */
export function scoreProject(
  project: FeedProject,
  followedIds: Set<string>,
  liveCreatorIds: Set<string>
): number {
  const likeCount = project.likeCount ?? 0;
  const commentCount = project.commentCount ?? 0;
  const viewCount = project.viewCount ?? 0;
  const savesCount = project.savesCount ?? 0;
  const hasVideo = !!project.videoUrl;
  const isLive = liveCreatorIds.has(project.creatorId);
  const isFollowed = followedIds.has(project.creatorId);

  const createdMs =
    project.createdAt && "seconds" in project.createdAt
      ? project.createdAt.seconds * 1000
      : Date.now();
  const ageInHours = (Date.now() - createdMs) / (1000 * 60 * 60);

  return (
    likeCount * 3 +
    commentCount * 5 +
    viewCount * 1 +
    savesCount * 2 +
    (isLive ? LIVE_BOOST : 0) +
    (hasVideo ? 10 : 0) +
    (isFollowed ? FOLLOW_BOOST : 0) -
    ageInHours * HOURLY_DECAY
  );
}

/**
 * Fetch a batch of recent published projects from Firestore.
 *
 * Single bounded query — no per-creator fan-out, no N+1.
 * Returns up to FEED_BATCH_SIZE projects ordered by createdAt DESC.
 *
 * @param db         Firestore client instance
 * @param cursor     Last document from a previous batch (for pagination)
 */
export async function fetchFeedBatch(
  db: Firestore,
  cursor?: DocumentSnapshot
): Promise<{ projects: FeedProject[]; lastDoc: DocumentSnapshot | null }> {
  const baseQuery = [
    collection(db, "projects"),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(FEED_BATCH_SIZE),
  ] as const;

  const q = cursor
    ? query(...baseQuery, startAfter(cursor))
    : query(...baseQuery);

  const snap = await getDocs(q);
  const projects = snap.docs.map((d) => d.data() as FeedProject);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { projects, lastDoc };
}
