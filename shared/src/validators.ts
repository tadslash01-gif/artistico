import { z } from "zod";
import { PROJECT_CATEGORIES } from "./types";
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

// Project schemas
export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  images: z.array(z.string().url()).max(20).optional(),
  materialsUsed: z.array(z.string().max(100)).max(30).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.enum(PROJECT_CATEGORIES),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  images: z.array(z.string().url()).max(20).optional(),
  materialsUsed: z.array(z.string().max(100)).max(30).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.enum(PROJECT_CATEGORIES).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

// Product schemas
export const CreateProductSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(["physical", "digital", "template", "commission"]),
  price: z.number().int().min(50), // minimum 50 cents
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
        url: z.string().url(),
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
