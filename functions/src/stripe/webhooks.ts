import { onRequest } from "firebase-functions/v2/https";
import { getStripe, stripeSecretKey, stripeWebhookSecret } from "./client";
import { db, auth, storage } from "../admin";
import { auditLog } from "../middleware/auditLog";
import { getResend, resendApiKey, FROM_ADDRESS } from "../email/client";
import {
  buildBuyerConfirmationEmail,
  buildCreatorSaleEmail,
} from "../email/templates";
import * as admin from "firebase-admin";

export const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret, resendApiKey],
    cors: false,
    invoker: "public",
  },
  async (req, res) => {
    const stripe = getStripe();

    // Verify webhook signature — uses raw body for security
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value().trim()
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        await handleAccountUpdated(account);
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object;
        await handleDisputeCreated(dispute);
        break;
      }
      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

async function handleCheckoutComplete(session: any): Promise<void> {
  const { productId, projectId, buyerId } = session.metadata;

  // Idempotency: check if order already exists for this session
  const existing = await db
    .collection("orders")
    .where("stripeCheckoutSessionId", "==", session.id)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`Order already exists for session ${session.id}`);
    return;
  }

  const productDoc = await db.collection("products").doc(productId).get();
  const product = productDoc.data();
  // Defense-in-depth: derive creatorId from the product record, never from metadata
  const creatorId = product?.creatorId;
  if (!product || !creatorId) {
    console.error(`Product ${productId} not found or missing creatorId`);
    return;
  }
  const platformFee = Math.round(session.amount_total * 0.05);

  const orderRef = db.collection("orders").doc();
  const order = {
    orderId: orderRef.id,
    buyerId,
    creatorId,
    productId,
    projectId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: session.payment_intent,
    amount: session.amount_total,
    platformFee,
    creatorPayout: session.amount_total - platformFee,
    status: "paid",
    shippingAddress: session.shipping_details?.address || null,
    digitalDownloadUrl: product?.digitalFileUrl || null,
    trackingNumber: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    fulfilledAt: null,
  };

  await orderRef.set(order);
  auditLog({ action: "order.create", uid: buyerId, targetResource: orderRef.id, metadata: { productId, sessionId: session.id } });

  // Send confirmation emails — wrapped in try/catch so email failure never
  // prevents the webhook from returning 200 (which would cause Stripe to retry).
  await sendOrderEmails({
    order: { ...order, orderId: orderRef.id },
    product,
    buyerId,
    creatorId,
  }).catch((err) =>
    console.error("Email delivery failed (non-fatal):", err)
  );

  // Atomically update product sales count and inventory inside a transaction
  const productRef = db.collection("products").doc(productId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists) return;
    const data = snap.data()!;

    const updates: Record<string, any> = {
      salesCount: (data.salesCount || 0) + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (data.inventory !== null && data.inventory !== undefined) {
      const newInventory = Math.max(0, data.inventory - 1);
      updates.inventory = newInventory;
      if (newInventory === 0) updates.status = "sold_out";
    }

    tx.update(productRef, updates);
  });

  // Increment creator totalSales and recompute isVerified
  const creatorRef = db.collection("users").doc(creatorId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(creatorRef);
    if (!snap.exists) return;
    const data = snap.data()!;
    const newSales = (data.totalSales || 0) + 1;
    const updates: Record<string, any> = {
      totalSales: newSales,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Auto-verify creators who have sold 10+ items
    if (newSales >= 10 && !data.isVerified) {
      updates.isVerified = true;
    }
    tx.update(creatorRef, updates);
  });
}

async function sendOrderEmails(params: {
  order: Record<string, any>;
  product: Record<string, any>;
  buyerId: string;
  creatorId: string;
}): Promise<void> {
  const { order, product, buyerId, creatorId } = params;
  const resend = getResend();

  // Fetch buyer and creator auth records for email addresses
  const [buyerRecord, creatorRecord] = await Promise.all([
    auth.getUser(buyerId).catch(() => null),
    auth.getUser(creatorId).catch(() => null),
  ]);

  const buyerEmail = buyerRecord?.email;
  const buyerName = buyerRecord?.displayName || "there";
  const creatorEmail = creatorRecord?.email;
  const creatorName = creatorRecord?.displayName || "Creator";

  // For digital products, generate a 24-hour signed download URL for the email.
  // On-demand API endpoint keeps its own 1-hour expiry; this longer window is for email latency.
  let downloadUrl: string | undefined;
  if (product.type === "digital" && product.digitalFileUrl) {
    try {
      const bucket = storage.bucket();
      const [signed] = await bucket.file(product.digitalFileUrl).getSignedUrl({
        action: "read",
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });
      downloadUrl = signed;
    } catch (err) {
      console.warn("Could not generate download URL for email:", err);
    }
  }

  // Check creator notification preferences
  const creatorDoc = await db.collection("users").doc(creatorId).get();
  const notifPrefs = creatorDoc.data()?.notificationPreferences;
  const creatorWantsEmail = notifPrefs?.emailOnNewOrder !== false; // default to true

  const emailPromises: Promise<any>[] = [];

  // Buyer confirmation email
  if (buyerEmail) {
    const { subject, html } = buildBuyerConfirmationEmail({
      buyerName,
      orderId: order.orderId,
      productTitle: product.title,
      amount: order.amount,
      productType: product.type,
      downloadUrl,
    });
    emailPromises.push(
      resend.emails.send({ from: FROM_ADDRESS, to: buyerEmail, subject, html })
    );
  } else {
    console.warn(`No email address for buyer ${buyerId} — skipping buyer email`);
  }

  // Creator sale notification
  if (creatorEmail && creatorWantsEmail) {
    const { subject, html } = buildCreatorSaleEmail({
      creatorName,
      orderId: order.orderId,
      productTitle: product.title,
      amount: order.amount,
      creatorPayout: order.creatorPayout,
      productType: product.type,
    });
    emailPromises.push(
      resend.emails.send({ from: FROM_ADDRESS, to: creatorEmail, subject, html })
    );
  }

  await Promise.all(emailPromises);
}

async function handleAccountUpdated(account: any): Promise<void> {
  if (!account.metadata?.firebaseUid) return;

  const uid = account.metadata.firebaseUid;
  const isComplete = account.charges_enabled && account.payouts_enabled;

  await db.collection("users").doc(uid).update({
    "creatorProfile.stripeOnboardingComplete": isComplete,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleDisputeCreated(dispute: any): Promise<void> {
  const paymentIntentId = dispute.payment_intent;
  if (!paymentIntentId) return;

  const orders = await db
    .collection("orders")
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();

  if (!orders.empty) {
    await orders.docs[0].ref.update({
      status: "disputed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
