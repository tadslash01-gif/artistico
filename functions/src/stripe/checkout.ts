import { getStripe } from "./client";
import { db } from "../admin";

const PLATFORM_FEE_PERCENT = 5;

export async function createCheckoutSession(
  req: { body: any; headers: Record<string, any>; user?: { uid: string } },
  res: { status(code: number): any; json(body: any): void }
): Promise<void> {
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  // Always fetch price from Firestore — never trust client-side values
  const productDoc = await db.collection("products").doc(productId).get();
  if (!productDoc.exists) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const product = productDoc.data()!;
  if (product.status !== "active") {
    res.status(400).json({ error: "Product is not available" });
    return;
  }

  // Prevent creators from purchasing their own products
  if (product.creatorId === req.user!.uid) {
    res.status(400).json({ error: "You cannot purchase your own product" });
    return;
  }

  // Check inventory for physical items
  if (product.inventory !== null && product.inventory <= 0) {
    res.status(400).json({ error: "Product is sold out" });
    return;
  }

  // Get the creator's Stripe Connect account
  const creatorDoc = await db.collection("users").doc(product.creatorId).get();
  const creatorStripeAccountId = creatorDoc.data()?.creatorProfile?.stripeAccountId;

  if (!creatorStripeAccountId) {
    res.status(400).json({ error: "Creator has not set up payouts" });
    return;
  }

  const stripe = getStripe();
  const platformFee = Math.round(product.price * (PLATFORM_FEE_PERCENT / 100));

  const sessionParams: any = {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: product.currency || "usd",
          product_data: {
            name: product.title,
            description: product.description,
            images: product.images?.length > 0 ? [product.images[0]] : undefined,
          },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: creatorStripeAccountId,
      },
    },
    metadata: {
      productId: product.productId,
      projectId: product.projectId,
      buyerId: req.user!.uid,
      creatorId: product.creatorId,
    },
    success_url: `${req.headers.origin}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/project/${product.projectId}`,
  };

  // Collect shipping address for physical items
  if (product.shippingRequired) {
    sessionParams.shipping_address_collection = {
      allowed_countries: ["US", "CA", "GB", "AU"],
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  res.json({ url: session.url });
}
