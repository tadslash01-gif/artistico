import { onRequest } from "firebase-functions/v2/https";
import { verifyAuth } from "./middleware/auth";
import { checkRateLimit, RATE_LIMIT_READ, RATE_LIMIT_WRITE } from "./middleware/rateLimit";
import { createCheckoutSession } from "./stripe/checkout";
import { createStripeConnectLink, getStripeDashboardLink } from "./stripe/connect";
import { stripeSecretKey, getStripe } from "./stripe/client";
import { db, auth, storage } from "./admin";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateReviewSchema,
  FulfillOrderSchema,
  CreateCreatorProfileSchema,
} from "@artistico/shared";

// Simple router for Cloud Functions HTTP endpoint
// Each route handler receives (req, res) with req.user set by auth middleware

interface ApiRequest {
  method: string;
  url: string;
  path: string;
  body: any;
  query: Record<string, any>;
  headers: Record<string, any>;
  ip?: string;
  rawBody: Buffer;
  user?: { uid: string };
  params?: Record<string, string>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: any): void;
  send(body: any): void;
}

type RouteHandler = (req: ApiRequest, res: ApiResponse) => Promise<void>;

const routes: Record<string, RouteHandler> = {
  // ─── Projects ────────────────────────────────────────
  "POST /projects": async (req, res) => {
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { title, description, images, materialsUsed, tags, category } = parsed.data;
    const slug =
      title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      Date.now().toString(36);

    const projectRef = db.collection("projects").doc();
    const project = {
      projectId: projectRef.id,
      creatorId: req.user!.uid,
      title,
      slug,
      description,
      images: images || [],
      materialsUsed: materialsUsed || [],
      tags: tags || [],
      category,
      status: "draft",
      productCount: 0,
      averageRating: 0,
      reviewCount: 0,
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await projectRef.set(project);
    res.status(201).json({ projectId: projectRef.id, slug });
  },

  "GET /projects": async (req, res) => {
    const { category, status, creatorId, limit: limitStr, startAfter } = req.query;
    let query: admin.firestore.Query = db.collection("projects");

    if (category) query = query.where("category", "==", category);
    if (creatorId) query = query.where("creatorId", "==", creatorId);

    // Public queries only see published projects unless filtered by creator
    if (!creatorId) {
      query = query.where("status", "==", "published");
    } else if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc");
    const limit = Math.min(parseInt(limitStr as string) || 20, 50);
    query = query.limit(limit);

    if (startAfter) {
      const startDoc = await db.collection("projects").doc(startAfter as string).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }

    const snapshot = await query.get();
    const projects = snapshot.docs.map((doc) => doc.data());
    res.json({ projects, hasMore: projects.length === limit });
  },

  "GET /projects/:slug": async (req, res) => {
    const slug = req.params!.slug;
    const snapshot = await db.collection("projects").where("slug", "==", slug).limit(1).get();

    if (snapshot.empty) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json(snapshot.docs[0].data());
  },

  "PUT /projects/:projectId": async (req, res) => {
    const projectId = req.params!.projectId;
    const parsed = UpdateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const doc = await db.collection("projects").doc(projectId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (doc.data()?.creatorId !== req.user!.uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await db
      .collection("projects")
      .doc(projectId)
      .update({
        ...parsed.data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    res.json({ success: true });
  },

  "DELETE /projects/:projectId": async (req, res) => {
    const projectId = req.params!.projectId;

    const doc = await db.collection("projects").doc(projectId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (doc.data()?.creatorId !== req.user!.uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await db.collection("projects").doc(projectId).update({
      status: "archived",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  },

  // ─── Products ────────────────────────────────────────
  "POST /products": async (req, res) => {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { projectId, title, description, type, price, images, digitalFileUrl, inventory, shippingRequired, shippingDetails, commissionDetails } = parsed.data;

    // Verify the project belongs to this creator
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.creatorId !== req.user!.uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const productRef = db.collection("products").doc();
    const product = {
      productId: productRef.id,
      projectId,
      creatorId: req.user!.uid,
      title,
      description,
      type,
      price, // cents
      currency: "usd",
      images: images || [],
      digitalFileUrl: digitalFileUrl || null,
      inventory: inventory ?? null,
      shippingRequired: shippingRequired || false,
      shippingDetails: shippingDetails || null,
      commissionDetails: commissionDetails || null,
      status: "active",
      salesCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await productRef.set(product);

    // Update project product count
    await db
      .collection("projects")
      .doc(projectId)
      .update({
        productCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.status(201).json({ productId: productRef.id });
  },

  "GET /products": async (req, res) => {
    const { projectId, creatorId } = req.query;
    let query: admin.firestore.Query = db.collection("products");

    if (projectId) query = query.where("projectId", "==", projectId);
    if (creatorId) query = query.where("creatorId", "==", creatorId);
    query = query.where("status", "==", "active");
    query = query.limit(50);

    const snapshot = await query.get();
    res.json({ products: snapshot.docs.map((doc) => doc.data()) });
  },

  "PUT /products/:productId": async (req, res) => {
    const productId = req.params!.productId;
    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const doc = await db.collection("products").doc(productId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (doc.data()?.creatorId !== req.user!.uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await db
      .collection("products")
      .doc(productId)
      .update({
        ...parsed.data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    res.json({ success: true });
  },

  "DELETE /products/:productId": async (req, res) => {
    const productId = req.params!.productId;

    const doc = await db.collection("products").doc(productId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (doc.data()?.creatorId !== req.user!.uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await db.collection("products").doc(productId).update({
      status: "inactive",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  },

  // ─── Checkout ────────────────────────────────────────
  "POST /checkout/create-session": async (req, res) => {
    await createCheckoutSession(req as any, res);
  },

  // ─── Orders ──────────────────────────────────────────
  "GET /orders": async (req, res) => {
    const { role } = req.query; // "buyer" | "creator"
    const field = role === "creator" ? "creatorId" : "buyerId";
    const snapshot = await db
      .collection("orders")
      .where(field, "==", req.user!.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    res.json({ orders: snapshot.docs.map((doc) => doc.data()) });
  },

  "PUT /orders/:orderId/fulfill": async (req, res) => {
    const orderId = req.params!.orderId;
    const parsed = FulfillOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const doc = await db.collection("orders").doc(orderId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (doc.data()?.creatorId !== req.user!.uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const orderData = doc.data()!;
    if (orderData.status !== "paid" && orderData.status !== "fulfilled" && orderData.status !== "shipped") {
      res.status(400).json({ error: "Order cannot be fulfilled in its current status" });
      return;
    }

    const update: Record<string, any> = {
      status: parsed.data.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (parsed.data.trackingNumber !== undefined) update.trackingNumber = parsed.data.trackingNumber;
    if (parsed.data.digitalDownloadUrl !== undefined) update.digitalDownloadUrl = parsed.data.digitalDownloadUrl;
    if (parsed.data.status === "fulfilled") update.fulfilledAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("orders").doc(orderId).update(update);
    res.json({ success: true });
  },

  // ─── Reviews ─────────────────────────────────────────
  "POST /reviews": async (req, res) => {
    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    // Verify the user actually purchased the product
    const orderSnapshot = await db
      .collection("orders")
      .where("orderId", "==", parsed.data.orderId)
      .where("buyerId", "==", req.user!.uid)
      .where("productId", "==", parsed.data.productId)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      res.status(403).json({ error: "You must purchase this product before reviewing" });
      return;
    }

    const order = orderSnapshot.docs[0].data();
    if (order.status !== "paid" && order.status !== "fulfilled" && order.status !== "shipped" && order.status !== "delivered") {
      res.status(400).json({ error: "Order must be completed before reviewing" });
      return;
    }

    // Check for duplicate review
    const existingReview = await db
      .collection("reviews")
      .where("orderId", "==", parsed.data.orderId)
      .where("buyerId", "==", req.user!.uid)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      res.status(409).json({ error: "You have already reviewed this order" });
      return;
    }

    const reviewRef = db.collection("reviews").doc();
    const review = {
      reviewId: reviewRef.id,
      ...parsed.data,
      buyerId: req.user!.uid,
      creatorId: order.creatorId,
      images: parsed.data.images || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await reviewRef.set(review);

    // Update project average rating atomically via transaction
    const projectRef = db.collection("projects").doc(parsed.data.projectId);
    await db.runTransaction(async (tx) => {
      const projectDoc = await tx.get(projectRef);
      if (!projectDoc.exists) return;
      const projectData = projectDoc.data()!;
      const newCount = (projectData.reviewCount || 0) + 1;
      const newAverage =
        ((projectData.averageRating || 0) * (projectData.reviewCount || 0) + parsed.data.rating) / newCount;

      tx.update(projectRef, {
        reviewCount: newCount,
        averageRating: Math.round(newAverage * 100) / 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(201).json({ reviewId: reviewRef.id });
  },

  "GET /reviews": async (req, res) => {
    const { projectId, productId } = req.query;
    let query: admin.firestore.Query = db.collection("reviews");

    if (productId) query = query.where("productId", "==", productId);
    else if (projectId) query = query.where("projectId", "==", projectId);

    query = query.orderBy("createdAt", "desc").limit(50);
    const snapshot = await query.get();
    res.json({ reviews: snapshot.docs.map((doc) => doc.data()) });
  },

  // ─── Download ────────────────────────────────────────
  "GET /users/:uid/download/:productId": async (req, res) => {
    const uid = req.params!.uid;
    const productId = req.params!.productId;

    if (req.user!.uid !== uid) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    // Verify the user purchased this product
    const orderSnapshot = await db
      .collection("orders")
      .where("buyerId", "==", uid)
      .where("productId", "==", productId)
      .where("status", "in", ["paid", "fulfilled", "shipped", "delivered"])
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      res.status(403).json({ error: "No qualifying order found" });
      return;
    }

    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists || !productDoc.data()?.digitalFileUrl) {
      res.status(404).json({ error: "Digital file not found" });
      return;
    }

    const filePath = productDoc.data()!.digitalFileUrl;
    // Generate a signed URL valid for 1 hour
    const bucket = storage.bucket();
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    res.json({ downloadUrl: signedUrl });
  },

  // ─── Stripe Connect ─────────────────────────────────
  "POST /users/stripe-onboarding": async (req, res) => {
    await createStripeConnectLink(req as any, res);
  },

  "GET /users/stripe-dashboard": async (req, res) => {
    await getStripeDashboardLink(req as any, res);
  },

  // ─── Creator Profile ────────────────────────────────
  "POST /users/creator-profile": async (req, res) => {
    const parsed = CreateCreatorProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { bio, location, specialties, socialLinks } = parsed.data;
    await db
      .collection("users")
      .doc(req.user!.uid)
      .update({
        isCreator: true,
        creatorProfile: {
          bio,
          location,
          specialties: specialties || [],
          socialLinks: socialLinks || [],
          stripeAccountId: "",
          stripeOnboardingComplete: false,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    res.json({ success: true });
  },

  // ─── Delete Account ──────────────────────────────
  "DELETE /users/me": async (req, res) => {
    const uid = req.user!.uid;

    // Delete Stripe Connect account if it exists
    const userDoc = await db.collection("users").doc(uid).get();
    const stripeAccountId = userDoc.data()?.creatorProfile?.stripeAccountId;
    if (stripeAccountId) {
      try {
        const stripe = getStripe();
        await stripe.accounts.del(stripeAccountId);
      } catch (e) {
        // Non-fatal — account may already be deleted
        console.warn("Failed to delete Stripe account:", e);
      }
    }

    // Delete user document from Firestore
    await db.collection("users").doc(uid).delete();

    // Delete Firebase Auth account
    await auth.deleteUser(uid);

    res.json({ success: true });
  },

  "GET /users/:uid": async (req, res) => {
    const uid = req.params!.uid;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const data = doc.data()!;
    // Return public profile only
    res.json({
      uid: data.uid,
      displayName: data.displayName,
      photoURL: data.photoURL,
      isCreator: data.isCreator,
      creatorProfile: data.isCreator
        ? {
            bio: data.creatorProfile?.bio,
            location: data.creatorProfile?.location,
            specialties: data.creatorProfile?.specialties,
            socialLinks: data.creatorProfile?.socialLinks,
          }
        : null,
    });
  },
};

import * as admin from "firebase-admin";
import cors from "cors";

const ALLOWED_ORIGINS = [
  "https://artistico-78f75.web.app",
  "https://artistico-78f75.firebaseapp.com",
  "https://artistico.redphantomops.com",
  process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "",
].filter(Boolean);

const corsHandler = cors({ origin: ALLOWED_ORIGINS });

// Simple path matching
function matchRoute(method: string, path: string): { handler: RouteHandler; params?: Record<string, string> } | null {
  // Try exact match first
  const key = `${method} ${path}`;
  if (routes[key]) return { handler: routes[key] };

  // Try parameterized routes
  for (const [routeKey, handler] of Object.entries(routes)) {
    const [routeMethod, routePattern] = routeKey.split(" ");
    if (routeMethod !== method) continue;

    const routeParts = routePattern.split("/");
    const pathParts = path.split("/");
    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return { handler, params };
  }
  return null;
}

// Public routes that don't need auth
const PUBLIC_ROUTES = [
  "GET /projects",
  "GET /projects/:slug",
  "GET /products",
  "GET /users/:uid",
  "GET /reviews",
];

function isPublicRoute(method: string, path: string): boolean {
  // Check exact match first to avoid wildcard collisions
  // (e.g. "GET /users/stripe-dashboard" must NOT match "GET /users/:uid")
  const exactKey = `${method} ${path}`;
  if (routes[exactKey]) {
    return PUBLIC_ROUTES.includes(exactKey);
  }

  for (const route of PUBLIC_ROUTES) {
    const [routeMethod, routePattern] = route.split(" ");
    if (routeMethod !== method) continue;

    const routeParts = routePattern.split("/");
    const pathParts = path.split("/");
    if (routeParts.length !== pathParts.length) continue;

    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (!routeParts[i].startsWith(":") && routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export const api = onRequest({ cors: false, secrets: [stripeSecretKey], invoker: "public" }, (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Strip /api prefix if present
      const path = req.path.replace(/^\/api/, "") || "/";
      const method = req.method;

      const route = matchRoute(method, path);
      if (!route) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      // Rate limit by IP — stricter for writes
      const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
      const identifier = typeof clientIp === "string" ? clientIp : String(clientIp);
      const isWrite = method !== "GET";
      const rateLimitKey = isWrite ? `write:${identifier}` : `read:${identifier}`;
      const rateLimitConfig = isWrite ? RATE_LIMIT_WRITE : RATE_LIMIT_READ;
      if (!checkRateLimit(rateLimitKey, rateLimitConfig)) {
        res.status(429).json({ error: "Too many requests" });
        return;
      }

      // Auth check for protected routes
      if (!isPublicRoute(method, path)) {
        const user = await verifyAuth(req);
        if (!user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        (req as any).user = user;
      }

      if (route.params) {
        (req as any).params = route.params;
      }

      await route.handler(req as any, res);
    } catch (error: any) {
      console.error("API Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});
