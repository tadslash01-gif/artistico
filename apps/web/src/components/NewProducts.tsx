"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";

interface ProductData {
  productId: string;
  title: string;
  description: string;
  type: "physical" | "digital" | "template" | "commission";
  price: number;
  images: string[];
  salesCount: number;
  creatorName?: string;
  creatorAvatar?: string | null;
  category?: string | null;
}

const TYPE_EMOJIS: Record<string, string> = {
  physical: "📦",
  digital: "💾",
  template: "📄",
  commission: "🎨",
};

export default function NewProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNew() {
      if (!firestore) return;
      try {
        const oneWeekAgo = Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const q = query(
          collection(firestore, "products"),
          where("status", "==", "active"),
          where("createdAt", ">=", oneWeekAgo),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map((doc) => doc.data() as ProductData));
      } catch (err) {
        console.error("Failed to fetch new products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNew();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-64 w-56 shrink-0 animate-pulse rounded-2xl bg-muted sm:w-64" />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      {products.map((product) => (
        <div key={product.productId} className="w-56 shrink-0 snap-start sm:w-64">
          <Link
            href={`/products/${product.productId}`}
            className="group block overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="aspect-[3/2] overflow-hidden bg-muted rounded-t-2xl">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  width={256}
                  height={170}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                  {TYPE_EMOJIS[product.type] || "🛍️"}
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-1">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {TYPE_EMOJIS[product.type]}
                </span>
              </div>
              {product.creatorName && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {product.creatorName}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(product.price)}
                </span>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  New
                </span>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
