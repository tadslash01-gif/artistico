// Generic Timestamp type compatible with both firebase and firebase-admin
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

// ─── Users ───────────────────────────────────────────────

export interface SocialLink {
  platform: string;
  url: string;
}

export interface CreatorProfile {
  bio: string;
  location: string;
  specialties: string[];
  stripeAccountId: string;
  stripeOnboardingComplete: boolean;
  socialLinks: SocialLink[];
}

export interface NotificationPreferences {
  emailOnNewOrder: boolean;
  emailOnNewReview: boolean;
  emailOnNewFollower: boolean;
  emailMarketing: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  creatorProfile: CreatorProfile | null;
  followersCount: number;
  followingCount: number;
  totalSales: number;
  isVerified: boolean;
  notificationPreferences: NotificationPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Projects ────────────────────────────────────────────

export type ProjectStatus = "draft" | "published" | "archived";

export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";

// ─── Materials ───────────────────────────────────────────

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number | null; // cents
  url: string | null; // optional affiliate/purchase link
  notes: string | null;
}

// ─── Licensing ───────────────────────────────────────────

export const LICENSE_TYPES = [
  "personal",
  "commercial",
  "extended-commercial",
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number];

export interface Project {
  projectId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  materialsUsed: string[];
  materials: MaterialItem[];
  tags: string[];
  category: string;
  status: ProjectStatus;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  creatorStory: string | null;
  useCase: string | null;
  difficulty: ProjectDifficulty | null;
  timeToBuild: string | null;
  savesCount: number;
  trendingScore: number;
  minPrice: number | null;
  creatorName: string;
  creatorAvatar: string | null;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDuration?: number;
  clipUrl?: string;
  clipThumbnailUrl?: string;
  clipPlaybackId?: string;
  clipStatus?: "processing" | "ready";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Products ────────────────────────────────────────────

export type ProductType = "physical" | "digital" | "template" | "commission";
export type ProductStatus = "active" | "sold_out" | "inactive";

export interface ShippingDetails {
  weight: number;
  dimensions: string;
}

export interface CommissionDetails {
  turnaroundDays: number;
  maxActiveCommissions: number;
}

export interface Product {
  productId: string;
  projectId: string | null;
  creatorId: string;
  category: string | null;
  title: string;
  description: string;
  type: ProductType;
  licenseType: LicenseType;
  price: number; // cents
  currency: string;
  images: string[];
  digitalFileUrl: string | null;
  inventory: number | null;
  shippingRequired: boolean;
  shippingDetails: ShippingDetails | null;
  commissionDetails: CommissionDetails | null;
  status: ProductStatus;
  salesCount: number;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Orders ──────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "refunded"
  | "disputed";

export interface ShippingAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  orderId: string;
  buyerId: string;
  creatorId: string;
  productId: string;
  projectId: string | null;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string;
  amount: number;
  platformFee: number;
  creatorPayout: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress | null;
  digitalDownloadUrl: string | null;
  trackingNumber: string | null;
  disputeReason: string | null;
  disputeOpenedAt: Timestamp | null;
  disputeDeadline: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt: Timestamp | null;
  fulfilledAt: Timestamp | null;
}

// ─── Reviews ─────────────────────────────────────────────

export interface Review {
  reviewId: string;
  projectId: string;
  productId: string;
  orderId: string;
  buyerId: string;
  creatorId: string;
  rating: number;
  title: string;
  body: string;
  images: string[] | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Messages ────────────────────────────────────────────

export interface LastMessage {
  text: string;
  senderId: string;
  sentAt: Timestamp;
}

export interface Conversation {
  conversationId: string;
  participants: string[];
  relatedOrderId: string | null;
  relatedProjectId: string | null;
  lastMessage: LastMessage;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageEntry {
  entryId: string;
  senderId: string;
  text: string;
  attachments: string[] | null;
  readAt: Timestamp | null;
  sentAt: Timestamp;
}

// ─── Categories ──────────────────────────────────────────

export const PROJECT_CATEGORIES = [
  "3d-printing",
  "ceramics",
  "crafts",
  "digital-art",
  "electronics",
  "fiber-arts",
  "jewelry",
  "other",
  "painting",
  "paper-crafts",
  "photography",
  "textiles",
  "woodworking",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

// ─── Saves ───────────────────────────────────────────────

export interface Save {
  saveId: string;
  userId: string;
  projectId: string;
  createdAt: Timestamp;
}

// ─── Likes ───────────────────────────────────────────────

export interface Like {
  likeId: string;
  userId: string;
  projectId: string;
  createdAt: Timestamp;
}

// ─── Shares ──────────────────────────────────────────────

export type SharePlatform = "copy_link" | "native" | "twitter";

export interface Share {
  shareId: string;
  userId: string;
  projectId: string;
  platform: SharePlatform;
  /** Referral userId — populated when link contains ?ref=userId */
  ref?: string;
  createdAt: Timestamp;
}

// ─── Follows ─────────────────────────────────────────────

export interface Follow {
  followId: string;
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}

// ─── Recent Views ────────────────────────────────────────

export interface RecentView {
  viewId: string;
  projectId: string;
  viewedAt: Timestamp;
}

// ─── Reports ─────────────────────────────────────────────

export type ReportTargetType = "project" | "product" | "user" | "review";
export type ReportStatus = "pending" | "reviewed" | "resolved";

export interface Report {
  reportId: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: Timestamp;
}

// ─── Notifications ───────────────────────────────────────

export type NotificationType =
  | "follow"
  | "bookmark"
  | "like_on_project"
  | "new_post"
  | "comment_on_project"
  | "reply_to_comment"
  | "new_message"
  | "project_video_added"
  | "creator_went_live";

export interface Notification {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  entityId?: string;
  entityTitle?: string;
  entitySlug?: string;
  read: boolean;
  createdAt: Timestamp;
}

// ─── Comments ────────────────────────────────────────────

export interface Comment {
  commentId: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string | null;
  content: string;
  parentId: string | null;
  likeCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
}

// ─── Presence ────────────────────────────────────────────

export type PresenceStatus = "online" | "offline";

export interface Presence {
  userId: string;
  status: PresenceStatus;
  lastActiveAt: Timestamp;
}

// ─── Live Streams ─────────────────────────────────────────

export type StreamStatus = "live" | "ended" | "scheduled";

export interface Stream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  title: string;
  status: StreamStatus;
  playbackId: string;
  viewerCount: number;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  thumbnailUrl: string | null;
  /** Optional: link this stream to a project so a clip can be auto-generated on stream end */
  projectId?: string;
}

export interface StreamViewerPresence {
  userId: string;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string | null;
  content: string;
  createdAt: Timestamp;
}
