import crypto from "crypto";
import { onRequest } from "firebase-functions/v2/https";
import { verifyAuth } from "./middleware/auth";
import { checkRateLimit, RATE_LIMIT_READ, RATE_LIMIT_WRITE } from "./middleware/rateLimit";
import { auditLog } from "./middleware/auditLog";
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
  SaveProjectSchema,
  FollowCreatorSchema,
  UpdateNotificationPrefsSchema,
  CreateReportSchema,
  PROJECT_CATEGORIES,
} from "@artistico/shared";

/** Strip HTML/script tags from user-supplied text to prevent stored XSS. */
function stripHtml(str: string): string {
  // Decode HTML entities first, then strip tags to prevent encoded XSS bypasses
  const decoded = str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&(lt|gt|amp|quot|apos);/g, (_, entity) => {
      const map: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
      return map[entity] || "";
    });
  return decoded.replace(/<[^>]*>/g, "").trim();
}

/**
 * Defense-in-depth: verify the authenticated user has creator role.
 * Firestore rules enforce this too, but checking here prevents wasted work
 * and provides a clear 403 response. (C3 fix)
 */
async function requireCreator(
  req: ApiRequest,
  res: ApiResponse
): Promise<boolean> {
  const userDoc = await db.collection("users").doc(req.user!.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isCreator) {
    res.status(403).json({ error: "Creator account required" });
    return false;
  }
  return true;
}

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
    if (!(await requireCreator(req, res))) return;

    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { title, description, images, materialsUsed, materials, tags, category, creatorStory, useCase, difficulty, timeToBuild } = parsed.data;
    const safeTitle = stripHtml(title);
    const safeDescription = stripHtml(description);
    const slug =
      safeTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      crypto.randomUUID().slice(0, 8);

    const projectRef = db.collection("projects").doc();
    const project = {
      projectId: projectRef.id,
      creatorId: req.user!.uid,
      title: safeTitle,
      slug,
      description: safeDescription,
      images: images || [],
      materialsUsed: materialsUsed || [],
      materials: materials || [],
      tags: tags || [],
      category,
      creatorStory: creatorStory ? stripHtml(creatorStory) : null,
      useCase: useCase ? stripHtml(useCase) : null,
      difficulty: difficulty || null,
      timeToBuild: timeToBuild || null,
      savesCount: 0,
      trendingScore: 0,
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
    const { category, status, creatorId, difficulty, sort, search, limit: limitStr, startAfter } = req.query;
    let query: admin.firestore.Query = db.collection("projects");

    if (category) {
      if (!PROJECT_CATEGORIES.includes(category as any)) {
        res.status(400).json({ error: "Invalid category" });
        return;
      }
      query = query.where("category", "==", category);
    }
    if (creatorId) query = query.where("creatorId", "==", creatorId);

    // Public queries only see published projects unless filtered by creator
    if (!creatorId) {
      query = query.where("status", "==", "published");
    } else if (status) {
      query = query.where("status", "==", status);
    }

    // Difficulty filter
    if (difficulty && ["beginner", "intermediate", "advanced"].includes(difficulty as string)) {
      query = query.where("difficulty", "==", difficulty);
    }

    // Sort order
    const sortBy = sort as string;
    if (sortBy === "trending") {
      query = query.orderBy("trendingScore", "desc");
    } else if (sortBy === "rating") {
      query = query.orderBy("averageRating", "desc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    const limit = Math.min(parseInt(limitStr as string) || 20, 50);
    query = query.limit(limit);

    if (startAfter) {
      const startDoc = await db.collection("projects").doc(startAfter as string).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }

    const snapshot = await query.get();
    let projects = snapshot.docs.map((doc) => doc.data());

    // Client-side search filter (prefix match on title) — lightweight until Algolia
    if (search) {
      const searchLower = (search as string).toLowerCase();
      projects = projects.filter((p: any) =>
        p.title?.toLowerCase().includes(searchLower)
      );
    }

    res.json({ projects, hasMore: snapshot.docs.length === limit });
  },

  "GET /projects/:slug": async (req, res) => {
    const slug = req.params!.slug;
    const snapshot = await db.collection("projects").where("slug", "==", slug).limit(1).get();

    if (snapshot.empty) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Fire-and-forget view count increment
    const docRef = snapshot.docs[0].ref;
    docRef.update({ viewCount: admin.firestore.FieldValue.increment(1) }).catch(() => {});

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

    const updateData = { ...parsed.data } as Record<string, unknown>;
    if (updateData.title) updateData.title = stripHtml(updateData.title as string);
    if (updateData.description) updateData.description = stripHtml(updateData.description as string);
    if (updateData.creatorStory) updateData.creatorStory = stripHtml(updateData.creatorStory as string);
    if (updateData.useCase) updateData.useCase = stripHtml(updateData.useCase as string);

    await db
      .collection("projects")
      .doc(projectId)
      .update({
        ...updateData,
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
    if (!(await requireCreator(req, res))) return;

    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { projectId, title, description, type, licenseType, price, category, images, digitalFileUrl, inventory, shippingRequired, shippingDetails, commissionDetails } = parsed.data;

    // If projectId is provided, verify the project belongs to this creator
    if (projectId) {
      const projectDoc = await db.collection("projects").doc(projectId).get();
      if (!projectDoc.exists || projectDoc.data()?.creatorId !== req.user!.uid) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
    }

    const productRef = db.collection("products").doc();
    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    const userData = userDoc.data();
    const product = {
      productId: productRef.id,
      projectId: projectId || null,
      creatorId: req.user!.uid,
      creatorName: userData?.displayName || null,
      creatorAvatar: userData?.photoURL || null,
      title: stripHtml(title),
      description: stripHtml(description),
      type,
      licenseType: licenseType || "personal",
      price, // cents
      currency: "usd",
      category: category || null,
      images: images || [],
      digitalFileUrl: digitalFileUrl || null,
      inventory: inventory ?? null,
      shippingRequired: shippingRequired || false,
      shippingDetails: shippingDetails || null,
      commissionDetails: commissionDetails || null,
      status: "active",
      salesCount: 0,
      viewCount: 0,
      trendingScore: 70, // full recency boost at creation; trigger will maintain ongoing
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await productRef.set(product);

    // Update project product count if linked to a project
    if (projectId) {
      await db
        .collection("projects")
        .doc(projectId)
        .update({
          productCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

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
    if (!(await requireCreator(req, res))) return;

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
    if (!(await requireCreator(req, res))) return;

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
    const { role } = req.query;
    if (role && role !== "buyer" && role !== "creator") {
      res.status(400).json({ error: "Invalid role parameter" });
      return;
    }
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

    // Use a deterministic doc ID to prevent duplicate reviews atomically
    const reviewDocId = `${req.user!.uid}_${parsed.data.orderId}`;
    const reviewRef = db.collection("reviews").doc(reviewDocId);

    // Atomic check-and-create inside a transaction to prevent race conditions
    const reviewId = await db.runTransaction(async (tx) => {
      const existingDoc = await tx.get(reviewRef);
      if (existingDoc.exists) return null; // duplicate

      const review = {
        reviewId: reviewRef.id,
        ...parsed.data,
        body: stripHtml(parsed.data.body),
        buyerId: req.user!.uid,
        creatorId: order.creatorId,
        images: parsed.data.images || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      tx.set(reviewRef, review);

      // Update project average rating atomically in the same transaction
      const projectRef = db.collection("projects").doc(parsed.data.projectId);
      const projectDoc = await tx.get(projectRef);
      if (projectDoc.exists) {
        const projectData = projectDoc.data()!;
        const newCount = (projectData.reviewCount || 0) + 1;
        const newAverage =
          ((projectData.averageRating || 0) * (projectData.reviewCount || 0) + parsed.data.rating) / newCount;
        tx.update(projectRef, {
          reviewCount: newCount,
          averageRating: Math.round(newAverage * 100) / 100,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return reviewRef.id;
    });

    if (!reviewId) {
      res.status(409).json({ error: "You have already reviewed this order" });
      return;
    }

    res.status(201).json({ reviewId });
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

    auditLog({ action: "download.access", uid, targetResource: productId, ip: req.ip, userAgent: req.headers["user-agent"] });
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
          bio: stripHtml(bio),
          location: location ? stripHtml(location) : location,
          specialties: specialties || [],
          socialLinks: socialLinks || [],
          stripeAccountId: "",
          stripeOnboardingComplete: false,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    auditLog({ action: "creator.promote", uid: req.user!.uid, ip: req.ip, userAgent: req.headers["user-agent"] });
    res.json({ success: true });
  },

  // ─── Delete Account ──────────────────────────────
  "DELETE /users/me": async (req, res) => {
    const uid = req.user!.uid;
    auditLog({ action: "account.delete", uid, ip: req.ip, userAgent: req.headers["user-agent"] });

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
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0,
      totalSales: data.totalSales || 0,
      isVerified: data.isVerified || false,
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

  // ─── Saves ───────────────────────────────────────────
  "POST /saves": async (req, res) => {
    const parsed = SaveProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { projectId } = parsed.data;

    // Check if already saved
    const existing = await db
      .collection("saves")
      .where("userId", "==", req.user!.uid)
      .where("projectId", "==", projectId)
      .limit(1)
      .get();
    if (!existing.empty) {
      res.status(409).json({ error: "Already saved" });
      return;
    }

    const saveRef = db.collection("saves").doc();
    await saveRef.set({
      saveId: saveRef.id,
      userId: req.user!.uid,
      projectId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment project savesCount
    await db
      .collection("projects")
      .doc(projectId)
      .update({ savesCount: admin.firestore.FieldValue.increment(1) });

    res.status(201).json({ saveId: saveRef.id });
  },

  "DELETE /saves/:projectId": async (req, res) => {
    const projectId = req.params!.projectId;
    const snapshot = await db
      .collection("saves")
      .where("userId", "==", req.user!.uid)
      .where("projectId", "==", projectId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: "Save not found" });
      return;
    }

    await snapshot.docs[0].ref.delete();
    await db
      .collection("projects")
      .doc(projectId)
      .update({ savesCount: admin.firestore.FieldValue.increment(-1) });

    res.json({ success: true });
  },

  "GET /saves": async (req, res) => {
    const snapshot = await db
      .collection("saves")
      .where("userId", "==", req.user!.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const saves = snapshot.docs.map((doc) => doc.data());

    // Fetch projects for the saved items
    if (saves.length > 0) {
      const projectIds = saves.map((s) => s.projectId);
      const projectDocs = await Promise.all(
        projectIds.map((id) => db.collection("projects").doc(id).get())
      );
      const projects = projectDocs.filter((d) => d.exists).map((d) => d.data());
      res.json({ saves, projects });
    } else {
      res.json({ saves: [], projects: [] });
    }
  },

  // ─── Follows ──────────────────────────────────────────
  "POST /follows": async (req, res) => {
    const parsed = FollowCreatorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { followingId } = parsed.data;

    if (followingId === req.user!.uid) {
      res.status(400).json({ error: "Cannot follow yourself" });
      return;
    }

    // Check if already following
    const existing = await db
      .collection("follows")
      .where("followerId", "==", req.user!.uid)
      .where("followingId", "==", followingId)
      .limit(1)
      .get();
    if (!existing.empty) {
      res.status(409).json({ error: "Already following" });
      return;
    }

    const followRef = db.collection("follows").doc();
    await followRef.set({
      followId: followRef.id,
      followerId: req.user!.uid,
      followingId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update follower/following counts
    const batch = db.batch();
    batch.update(db.collection("users").doc(followingId), {
      followersCount: admin.firestore.FieldValue.increment(1),
    });
    batch.update(db.collection("users").doc(req.user!.uid), {
      followingCount: admin.firestore.FieldValue.increment(1),
    });
    await batch.commit();

    res.status(201).json({ followId: followRef.id });
  },

  "DELETE /follows/:followingId": async (req, res) => {
    const followingId = req.params!.followingId;
    const snapshot = await db
      .collection("follows")
      .where("followerId", "==", req.user!.uid)
      .where("followingId", "==", followingId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: "Follow not found" });
      return;
    }

    await snapshot.docs[0].ref.delete();

    const batch = db.batch();
    batch.update(db.collection("users").doc(followingId), {
      followersCount: admin.firestore.FieldValue.increment(-1),
    });
    batch.update(db.collection("users").doc(req.user!.uid), {
      followingCount: admin.firestore.FieldValue.increment(-1),
    });
    await batch.commit();

    res.json({ success: true });
  },

  "GET /follows/status/:followingId": async (req, res) => {
    const followingId = req.params!.followingId;
    const snapshot = await db
      .collection("follows")
      .where("followerId", "==", req.user!.uid)
      .where("followingId", "==", followingId)
      .limit(1)
      .get();
    res.json({ isFollowing: !snapshot.empty });
  },

  // ─── Trending / Recommended ──────────────────────────
  "GET /projects/trending": async (req, res) => {
    const limitStr = req.query.limit;
    const limit = Math.min(parseInt(limitStr as string) || 12, 50);
    const snapshot = await db
      .collection("projects")
      .where("status", "==", "published")
      .orderBy("trendingScore", "desc")
      .limit(limit)
      .get();
    res.json({ projects: snapshot.docs.map((doc) => doc.data()) });
  },

  "GET /projects/recommended": async (req, res) => {
    // Simple recommendation: recently published + high rated
    const limitStr = req.query.limit;
    const limit = Math.min(parseInt(limitStr as string) || 12, 50);
    const snapshot = await db
      .collection("projects")
      .where("status", "==", "published")
      .orderBy("averageRating", "desc")
      .limit(limit)
      .get();
    res.json({ projects: snapshot.docs.map((doc) => doc.data()) });
  },

  // ─── Notification Preferences ────────────────────────
  "GET /users/notification-preferences": async (req, res) => {
    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const prefs = userDoc.data()?.notificationPreferences || {
      emailOnNewOrder: true,
      emailOnNewReview: true,
      emailOnNewFollower: true,
      emailMarketing: true,
    };
    res.json(prefs);
  },

  "PUT /users/notification-preferences": async (req, res) => {
    const parsed = UpdateNotificationPrefsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    // Merge with existing prefs (only update provided fields)
    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existing = userDoc.data()?.notificationPreferences || {
      emailOnNewOrder: true,
      emailOnNewReview: true,
      emailOnNewFollower: true,
      emailMarketing: true,
    };

    const updated = { ...existing, ...parsed.data };

    await db.collection("users").doc(req.user!.uid).update({
      notificationPreferences: updated,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json(updated);
  },

  // ─── Reports ──────────────────────────────────────────
  "POST /reports": async (req, res) => {
    const parsed = CreateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const { targetType, targetId, reason, description } = parsed.data;

    // Prevent duplicate reports from same user on same target
    const existing = await db
      .collection("reports")
      .where("reporterId", "==", req.user!.uid)
      .where("targetId", "==", targetId)
      .limit(1)
      .get();
    if (!existing.empty) {
      res.status(409).json({ error: "You have already reported this content" });
      return;
    }

    const reportRef = db.collection("reports").doc();
    await reportRef.set({
      reportId: reportRef.id,
      reporterId: req.user!.uid,
      targetType,
      targetId,
      reason,
      description: description ? stripHtml(description) : null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ reportId: reportRef.id });
  },

  // ─── Disputes ─────────────────────────────────────────
  "POST /orders/:orderId/dispute": async (req, res) => {
    const orderId = req.params!.orderId;
    const doc = await db.collection("orders").doc(orderId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const order = doc.data()!;
    if (order.buyerId !== req.user!.uid) {
      res.status(403).json({ error: "Only the buyer can open a dispute" });
      return;
    }
    if (order.status === "disputed" || order.status === "refunded") {
      res.status(400).json({ error: "Order already disputed or refunded" });
      return;
    }
    // Check dispute window (7 days for digital, 14 days for physical)
    const paidAt = order.paidAt?.toDate?.() || (order.paidAt?.seconds ? new Date(order.paidAt.seconds * 1000) : null);
    if (!paidAt) {
      res.status(400).json({ error: "Order has not been paid" });
      return;
    }
    const windowDays = order.shippingAddress ? 14 : 7;
    const deadline = new Date(paidAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      res.status(400).json({ error: `Dispute window has closed (${windowDays} days after purchase)` });
      return;
    }
    await db.collection("orders").doc(orderId).update({
      status: "disputed",
      disputeReason: req.body.reason ? stripHtml(String(req.body.reason)) : null,
      disputeOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
      disputeDeadline: admin.firestore.Timestamp.fromDate(deadline),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    auditLog({ action: "dispute.opened", uid: req.user!.uid, targetResource: orderId, ip: req.ip, userAgent: req.headers["user-agent"] });
    res.json({ success: true, disputeDeadline: deadline.toISOString() });
  },
};

import * as admin from "firebase-admin";
import cors from "cors";

const ALLOWED_ORIGINS = [
  "https://artistico-78f75.web.app",
  "https://artistico-78f75.firebaseapp.com",
  "https://artistico.love",
  "https://artistico--artistico-78f75.us-central1.hosted.app",
  ...(process.env.FUNCTIONS_EMULATOR === "true" ? ["http://localhost:3000"] : []),
];

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
  "GET /projects/trending",
  "GET /projects/recommended",
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
      if (!(await checkRateLimit(rateLimitKey, rateLimitConfig))) {
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
