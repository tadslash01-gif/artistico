"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import ReviewForm from "@/components/ReviewForm";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface OrderData {
  orderId: string;
  productId: string;
  projectId: string;
  amount: number;
  platformFee: number;
  status: string;
  digitalDownloadUrl: string | null;
  shippingAddress: Record<string, string> | null;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

interface ProductData {
  title: string;
  type: string;
  images: string[];
}

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = use(searchParams);
  const sessionId = typeof resolvedParams.session_id === "string" ? resolvedParams.session_id : "";
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const MAX_POLL_ATTEMPTS = 15;
  const POLL_INTERVAL_MS = 2000;

  useEffect(() => {
    if (!firestore || !user || !sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function tryFetchOrder(): Promise<boolean> {
      try {
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const q = query(
          collection(firestore!, "orders"),
          where("stripeCheckoutSessionId", "==", sessionId),
          where("buyerId", "==", user!.uid)
        );
        const snap = await getDocs(q);
        if (snap.empty) return false;

        const orderData = snap.docs[0].data() as OrderData;
        if (!cancelled) setOrder(orderData);

        // Fetch product info in parallel with download URL
        const productSnap = await getDoc(
          doc(firestore!, "products", orderData.productId)
        );
        if (!cancelled && productSnap.exists()) {
          setProduct(productSnap.data() as ProductData);
        }

        // If digital, fetch download URL
        if (
          !cancelled &&
          productSnap.exists() &&
          (productSnap.data() as ProductData).type === "digital"
        ) {
          try {
            const { url } = await apiFetch<{ url: string }>(
              `/users/${user!.uid}/download/${orderData.productId}`
            );
            if (!cancelled) setDownloadUrl(url);
          } catch {
            // Download endpoint will be available once the webhook has fully processed
          }
        }

        return true;
      } catch (err) {
        console.error("Failed to load order:", err);
        return false;
      }
    }

    async function poll() {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        const found = await tryFetchOrder();
        if (found) break;
        // After the first failed attempt, flip to "polling" UI
        if (attempt === 0) setIsPolling(true);
        if (attempt < MAX_POLL_ATTEMPTS - 1) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, POLL_INTERVAL_MS)
          );
        }
      }
      if (!cancelled) setLoading(false);
    }

    poll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, sessionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        {isPolling ? (
          <>
            <p className="mt-4 font-medium text-foreground">
              Confirming your payment…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually takes just a few seconds.
            </p>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">Loading your order…</p>
        )}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="text-5xl">📦</div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Payment Received
        </h1>
        <p className="mt-2 text-muted-foreground">
          {sessionId
            ? "Your payment was processed successfully. Your order confirmation will appear in your dashboard shortly."
            : "No order session found."}
        </p>
        <Link
          href="/dashboard/orders"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl">🎉</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          You just made a creator’s day!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your purchase supports an independent hobby creator. Thank you!
        </p>
      </div>

      {/* Order Details */}
      <div className="mt-8 rounded-xl border border-border bg-white p-6">
        <h2 className="font-semibold text-foreground">Order Details</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-foreground">
              #{order.orderId.slice(0, 8)}
            </span>
          </div>
          {product && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item</span>
              <span className="text-foreground">{product.title}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(order.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Digital Download */}
      {product?.type === "digital" && (
        <div className="mt-4 rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold text-foreground">Your Download</h2>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              ⬇ Download Now
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Your download link will be available shortly. Check{" "}
              <Link
                href="/dashboard/orders"
                className="text-primary hover:text-primary/80"
              >
                My Orders
              </Link>{" "}
              to access it later.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Download links expire after 1 hour. You can request a new one from
            your orders page.
          </p>
        </div>
      )}

      {/* Physical Item */}
      {product?.type === "physical" && (
        <div className="mt-4 rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold text-foreground">Shipping</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The creator will ship your item and provide tracking information.
            You&apos;ll be able to track your order from your dashboard.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard/orders"
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View My Orders
        </Link>
        <Link
          href="/browse"
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Continue Browsing
        </Link>
      </div>

      {/* Leave a Review */}
      {order && !reviewSubmitted && (
        <div className="mt-8">
          {showReview ? (
            <ReviewForm
              projectId={order.projectId}
              productId={order.productId}
              orderId={order.orderId}
              onSuccess={() => setReviewSubmitted(true)}
            />
          ) : (
            <button
              onClick={() => setShowReview(true)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              ⭐ Leave a Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
