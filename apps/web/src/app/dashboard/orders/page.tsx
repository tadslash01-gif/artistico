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
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>(
    {}
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function fetchOrders() {
      try {
        const { orders } = await apiFetch<{ orders: OrderItem[] }>(
          "/orders?role=creator"
        );
        setOrders(orders);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

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
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No orders yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Orders will appear here when buyers purchase your products.
            </p>
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
