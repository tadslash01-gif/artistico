"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface ProductData {
  productId: string;
  projectId: string | null;
  title: string;
  type: string;
  price: number;
  currency: string;
  status: string;
  salesCount: number;
  images: string[];
}

export default function DashboardProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ products: ProductData[] }>(`/products?creatorId=${user.uid}`)
      .then((data) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + New Product
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">No products yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a standalone product or add one to an existing project.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <Link
              key={product.productId}
              href={`/dashboard/products/${product.productId}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 hover:shadow-sm transition-all"
            >
              <div className="h-14 w-14 shrink-0 rounded-lg bg-muted overflow-hidden">
                {product.images?.[0] && (
                  <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{product.type}</span>
                  <span>{formatCurrency(product.price)}</span>
                  <span>{product.salesCount} sold</span>
                  {!product.projectId && (
                    <span className="rounded-full bg-accent/50 px-2 py-0.5">Standalone</span>
                  )}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  product.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {product.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
