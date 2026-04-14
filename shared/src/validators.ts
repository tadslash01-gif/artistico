import { z } from "zod";
import { PROJECT_CATEGORIES, LICENSE_TYPES } from "./types";
import type { ProjectCategory } from "./types";

// ─── Constants ───────────────────────────────────────────

export const PLATFORM_FEE_PERCENT = 5;

// ─── Utility functions ───────────────────────────────────

export function calculatePlatformFee(priceInCents: number): number {
  return Math.round(priceInCents * (PLATFORM_FEE_PERCENT / 100));
}

export function calculateCreatorPayout(priceInCents: number): number {
  return priceInCents - calculatePlatformFee(priceInCents);
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// ─── Zod Schemas ─────────────────────────────────────────

// Material item schema
export const MaterialItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(50),
  estimatedPrice: z.number().int().min(0).nullable().optional(),
  url: z.string().url().max(2000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// Project schemas
export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  images: z.array(z.string().url()).max(20).optional(),
  materialsUsed: z.array(z.string().max(100)).max(30).optional(),
  materials: z.array(MaterialItemSchema).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.enum(PROJECT_CATEGORIES),
  creatorStory: z.string().min(10).max(500).nullable().optional(),
  useCase: z.string().min(10).max(200).nullable().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  timeToBuild: z.string().max(100).nullable().optional(),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  images: z.array(z.string().url()).max(20).optional(),
  materialsUsed: z.array(z.string().max(100)).max(30).optional(),
  materials: z.array(MaterialItemSchema).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.enum(PROJECT_CATEGORIES).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  creatorStory: z.string().min(10).max(500).nullable().optional(),
  useCase: z.string().min(10).max(200).nullable().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  timeToBuild: z.string().max(100).nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  videoThumbnailUrl: z.string().url().nullable().optional(),
  videoDuration: z.number().min(0).nullable().optional(),
});

// Product schemas
export const CreateProductSchema = z.object({
  projectId: z.string().min(1).nullable().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(["physical", "digital", "template", "commission"]),
  licenseType: z.enum(LICENSE_TYPES).optional(),
  price: z.number().int().min(50), // minimum 50 cents
  category: z.enum(PROJECT_CATEGORIES).optional(),
  images: z.array(z.string().url()).max(20).optional(),
  digitalFileUrl: z.string().url().nullable().optional(),
  inventory: z.number().int().min(0).nullable().optional(),
  shippingRequired: z.boolean().optional(),
  shippingDetails: z
    .object({
      weight: z.number().min(0),
      dimensions: z.string().max(100),
    })
    .nullable()
    .optional(),
  commissionDetails: z
    .object({
      turnaroundDays: z.number().int().min(1),
      maxActiveCommissions: z.number().int().min(1),
    })
    .nullable()
    .optional(),
});

export const UpdateProductSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  licenseType: z.enum(LICENSE_TYPES).optional(),
  price: z.number().int().min(50).optional(),
  images: z.array(z.string().url()).max(20).optional(),
  digitalFileUrl: z.string().url().nullable().optional(),
  inventory: z.number().int().min(0).nullable().optional(),
  shippingRequired: z.boolean().optional(),
  shippingDetails: z
    .object({
      weight: z.number().min(0),
      dimensions: z.string().max(100),
    })
    .nullable()
    .optional(),
  commissionDetails: z
    .object({
      turnaroundDays: z.number().int().min(1),
      maxActiveCommissions: z.number().int().min(1),
    })
    .nullable()
    .optional(),
  status: z.enum(["active", "sold_out", "inactive"]).optional(),
  videoUrl: z.string().url().nullable().optional(),
  videoThumbnailUrl: z.string().url().nullable().optional(),
});

// Review schema
export const CreateReviewSchema = z.object({
  projectId: z.string().min(1),
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  images: z.array(z.string().url()).max(10).nullable().optional(),
});

// Order fulfillment schema
export const FulfillOrderSchema = z.object({
  status: z.enum(["fulfilled", "shipped", "delivered"]),
  trackingNumber: z.string().max(200).nullable().optional(),
  digitalDownloadUrl: z.string().url().nullable().optional(),
});

// Creator profile schema
export const CreateCreatorProfileSchema = z.object({
  bio: z.string().min(10).max(2000),
  location: z.string().min(1).max(200),
  specialties: z.array(z.string().max(100)).min(1).max(20),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1).max(50),
        url: z.string().url().refine((val) => val.startsWith("https://"), {
          message: "Social links must use HTTPS",
        }),
      })
    )
    .max(10)
    .optional(),
});

// Type exports for use in API handlers
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type FulfillOrderInput = z.infer<typeof FulfillOrderSchema>;
export type CreateCreatorProfileInput = z.infer<typeof CreateCreatorProfileSchema>;

// Save / Follow schemas
export const SaveProjectSchema = z.object({
  projectId: z.string().min(1),
});

export const FollowCreatorSchema = z.object({
  followingId: z.string().min(1),
});

export type SaveProjectInput = z.infer<typeof SaveProjectSchema>;
export type FollowCreatorInput = z.infer<typeof FollowCreatorSchema>;

// Report schema
export const CreateReportSchema = z.object({
  targetType: z.enum(["project", "product", "user", "review"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "spam",
    "inappropriate",
    "copyright",
    "fraud",
    "harassment",
    "other",
  ]),
  description: z.string().min(10).max(2000),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

// Notification preferences schema
export const UpdateNotificationPrefsSchema = z.object({
  emailOnNewOrder: z.boolean().optional(),
  emailOnNewReview: z.boolean().optional(),
  emailOnNewFollower: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
});

export type UpdateNotificationPrefsInput = z.infer<typeof UpdateNotificationPrefsSchema>;

// Comment schemas
export const CreateCommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(1000),
  parentId: z.string().min(1).nullable().optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

// ─── Live Stream schemas ──────────────────────────────────

export const StartStreamSchema = z.object({
  title: z.string().min(1).max(100).transform((v) => v.trim()),
});

export const ChatMessageSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(500)
    .transform((v) => v.trim()),
});

export type StartStreamInput = z.infer<typeof StartStreamSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
