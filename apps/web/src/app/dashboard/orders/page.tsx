"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  orderId: string;
  buyerId: string;
  creatorId: string;
  productId: string;
  projectId: string;
  amount: number;
  platformFee: number;
  creatorPayout: number;
  status: string;
  productType?: "physical" | "digital" | "template" | "commission";
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  digitalDownloadUrl: string | null;
  trackingNumber: string | null;
  createdAt: { seconds: number; nanoseconds: number } | null;
  fulfilledAt: { seconds: number; nanoseconds: number } | null;
  disputeReason?: string | null;
  disputeOpenedAt?: { seconds: number; nanoseconds: number } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-800",
  refunded: "bg-red-100 text-red-700",
  disputed: "bg-yellow-100 text-yellow-700",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sales" | "purchases">("sales");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [disputing, setDisputing] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>(
    {}
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function fetchOrders() {
      try {
        const [creatorRes, buyerRes] = await Promise.all([
          apiFetch<{ orders: OrderItem[] }>("/orders?role=creator"),
          apiFetch<{ orders: OrderItem[] }>("/orders?role=buyer"),
        ]);
        setOrders(creatorRes.orders);
        setBuyerOrders(buyerRes.orders);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  const canDispute = (order: OrderItem) => {
    if (order.status === "disputed" || order.status === "refunded") return false;
    if (!order.createdAt) return false;
    const createdMs = order.createdAt.seconds * 1000;
    const isDigital = order.productType === "digital" || order.productType === "template";
    const windowDays = isDigital ? 7 : 14;
    return Date.now() - createdMs < windowDays * 24 * 60 * 60 * 1000;
  };

  const handleDispute = async (orderId: string) => {
    if (!disputeReason.trim()) return;
    setDisputing(orderId);
    setError("");
    try {
      await apiFetch(`/orders/${orderId}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason: disputeReason }),
      });
      setBuyerOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, status: "disputed", disputeReason } : o
        )
      );
      setDisputing(null);
      setDisputeReason("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to open dispute");
      setDisputing(null);
    }
  };

  const handleFulfill = async (orderId: string, hasShipping: boolean) => {
    setFulfilling(orderId);
    setError("");
    try {
      const body: Record<string, unknown> = {
        status: hasShipping ? "shipped" : "fulfilled",
      };
      if (hasShipping && trackingInput[orderId]) {
        body.trackingNumber = trackingInput[orderId];
      }

      await apiFetch(`/orders/${orderId}/fulfill`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                status: hasShipping ? "shipped" : "fulfilled",
                trackingNumber: hasShipping
                  ? trackingInput[orderId] || o.trackingNumber
                  : o.trackingNumber,
              }
            : o
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fulfill order"
      );
    } finally {
      setFulfilling(null);
    }
  };

  const formatDate = (
    ts: { seconds: number; nanoseconds: number } | null
  ) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage incoming orders and fulfillment.
      </p>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("sales")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "sales"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sales ({orders.length})
        </button>
        <button
          onClick={() => setTab("purchases")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "purchases"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Purchases ({buyerOrders.length})
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-lg border border-border bg-muted"
              />
            ))}
          </div>

        ) : tab === "sales" && orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <span className="text-5xl" aria-hidden="true">📦</span>
            <p className="mt-4 font-medium text-foreground">No orders yet — they're on their way!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once buyers discover your creations, orders will show up here.
            </p>
          </div>
        ) : tab === "purchases" && buyerOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <span className="text-5xl" aria-hidden="true">🛒</span>
            <p className="mt-4 font-medium text-foreground">No purchases yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse projects and find something you love.
            </p>
          </div>
        ) : tab === "purchases" ? (
          <div className="space-y-4">
            {buyerOrders.map((order) => (
              <div
                key={order.orderId}
                className="rounded-xl border border-border bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Order #{order.orderId.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(order.amount)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700"}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {order.digitalDownloadUrl && (
                  <div className="mt-3">
                    <a
                      href={order.digitalDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      ↓ Download file
                    </a>
                  </div>
                )}

                {order.trackingNumber && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Tracking</p>
                    <p className="text-sm font-mono text-foreground">{order.trackingNumber}</p>
                  </div>
                )}

                {canDispute(order) && order.status !== "disputed" && (
                  <div className="mt-4 border-t border-border pt-4">
                    {disputing === order.orderId ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Reason for dispute"
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          onClick={() => handleDispute(order.orderId)}
                          disabled={!disputeReason.trim()}
                          className="rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-50"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => { setDisputing(null); setDisputeReason(""); }}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDisputing(order.orderId)}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        Open dispute
                      </button>
                    )}
                  </div>
                )}

                {order.status === "disputed" && (
                  <p className="mt-3 text-xs text-yellow-700">
                    Dispute opened{order.disputeReason ? `: ${order.disputeReason}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const canFulfill =
                order.status === "paid" || order.status === "fulfilled";
              const hasShipping = !!order.shippingAddress;

              return (
                <div
                  key={order.orderId}
                  className="rounded-xl border border-border bg-white p-5"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Order #{order.orderId.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(order.creatorPayout)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Total / Fee / Your Payout
                      </p>
                      <p className="text-foreground">
                        {formatCurrency(order.amount)} /{" "}
                        {formatCurrency(order.platformFee)} /{" "}
                        {formatCurrency(order.creatorPayout)}
                      </p>
                    </div>

                    {hasShipping && order.shippingAddress && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Ship To
                        </p>
                        <p className="text-foreground">
                          {order.shippingAddress.line1}
                          {order.shippingAddress.line2 &&
                            `, ${order.shippingAddress.line2}`}
                          <br />
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}{" "}
                          {order.shippingAddress.postalCode}
                        </p>
                      </div>
                    )}

                    {order.trackingNumber && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Tracking
                        </p>
                        <p className="text-foreground font-mono text-xs">
                          {order.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fulfill Actions */}
                  {canFulfill && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                      {hasShipping && order.status === "paid" && (
                        <input
                          type="text"
                          placeholder="Tracking number (optional)"
                          value={trackingInput[order.orderId] || ""}
                          onChange={(e) =>
                            setTrackingInput((prev) => ({
                              ...prev,
                              [order.orderId]: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                      <button
                        onClick={() =>
                          handleFulfill(order.orderId, hasShipping)
                        }
                        disabled={fulfilling === order.orderId}
                        className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {fulfilling === order.orderId
                          ? "Processing..."
                          : hasShipping
                            ? "Mark Shipped"
                            : "Mark Fulfilled"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
