"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";

interface ProductData {
  productId: string;
  projectId: string | null;
  creatorId: string;
  title: string;
  description: string;
  type: "physical" | "digital" | "template" | "commission";
  price: number; // cents
  images: string[];
  category: string | null;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

const TYPE_LABELS: Record<string, string> = {
  physical: "Physical",
  digital: "Digital",
  template: "Template",
  commission: "Commission",
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function RecentlyAddedProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentProducts() {
      if (!firestore) return;
      try {
        const q = query(
          collection(firestore, "products"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(8)
        );
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map((d) => d.data() as ProductData));
      } catch (err) {
        console.error("Failed to fetch recent products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 w-56 shrink-0 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory">
      {products.map((product) => {
        // Products link to their project page or browse?type=product
        const href = product.projectId
          ? `/projects/${product.projectId}`
          : `/browse?type=product`;

        return (
          <Link
            key={product.productId}
            href={href}
            className="group w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="aspect-square overflow-hidden bg-muted">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  width={224}
                  height={224}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                  🛍️
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {product.title}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                <span className="rounded-full bg-accent/50 px-2 py-0.5 text-xs text-muted-foreground">
                  {TYPE_LABELS[product.type] ?? product.type}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
