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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Projects ────────────────────────────────────────────

export type ProjectStatus = "draft" | "published" | "archived";

export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";

export interface Project {
  projectId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  materialsUsed: string[];
  tags: string[];
  category: string;
  status: ProjectStatus;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  creatorStory: string | null;
  useCase: string | null;
  difficulty: ProjectDifficulty | null;
  timeToBuild: string | null;
  savesCount: number;
  trendingScore: number;
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
  "woodworking",
  "digital-art",
  "crafts",
  "jewelry",
  "ceramics",
  "textiles",
  "paper-crafts",
  "3d-printing",
  "electronics",
  "painting",
  "photography",
  "other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

// ─── Saves ───────────────────────────────────────────────

export interface Save {
  saveId: string;
  userId: string;
  projectId: string;
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
