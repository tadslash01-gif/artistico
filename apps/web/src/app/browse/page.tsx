"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import ProjectCard from "@/components/ProjectCard";
import TrendingProducts from "@/components/TrendingProducts";
import NewProducts from "@/components/NewProducts";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  { name: "All", slug: "" },
  { name: "Woodworking", slug: "woodworking" },
  { name: "Digital Art", slug: "digital-art" },
  { name: "Crafts", slug: "crafts" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Ceramics", slug: "ceramics" },
  { name: "Textiles", slug: "textiles" },
  { name: "Paper Crafts", slug: "paper-crafts" },
  { name: "3D Printing", slug: "3d-printing" },
  { name: "Electronics", slug: "electronics" },
  { name: "Painting", slug: "painting" },
  { name: "Photography", slug: "photography" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Trending", value: "trending" },
  { label: "Top Rated", value: "rating" },
];

const PRODUCT_SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Trending", value: "trending" },
];

const DIFFICULTY_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const PAGE_SIZE = 20;

interface ProjectData {
  projectId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  tags: string[];
  productCount: number;
  averageRating: number;
  reviewCount: number;
  savesCount?: number;
  minPrice?: number | null;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorId: string;
  trendingScore?: number;
}

interface ProductData {
  productId: string;
  title: string;
  description: string;
  type: "physical" | "digital" | "template" | "commission";
  price: number;
  images: string[];
  category: string | null;
  salesCount: number;
  trendingScore?: number;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorId: string;
  status: string;
}

const TYPE_EMOJIS: Record<string, string> = {
  physical: "📦",
  digital: "💾",
  template: "📄",
  commission: "🎨",
};

const TYPE_LABELS: Record<string, string> = {
  physical: "Physical",
  digital: "Digital",
  template: "Template",
  commission: "Commission",
};

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#e8e2da]" />
            ))}
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") || "projects") as "projects" | "products";
  const categoryFilter = searchParams.get("category") || "";
  const sortFilter = searchParams.get("sort") || "newest";
  const difficultyFilter = searchParams.get("difficulty") || "";
  const searchQuery = searchParams.get("q") || "";

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const values = {
        tab: activeTab,
        category: categoryFilter,
        sort: sortFilter,
        difficulty: difficultyFilter,
        q: searchQuery,
        ...overrides,
      };
      for (const [k, v] of Object.entries(values)) {
        if (!v) continue;
        if (k === "sort" && v === "newest") continue;
        if (k === "tab" && v === "projects") continue;
        params.set(k, v);
      }
      const qs = params.toString();
      return `/browse${qs ? `?${qs}` : ""}`;
    },
    [activeTab, categoryFilter, sortFilter, difficultyFilter, searchQuery]
  );

  const fetchProjects = useCallback(
    async (append = false) => {
      if (!firestore) return;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        let q = query(
          collection(firestore!, "projects"),
          where("status", "==", "published")
        );

        if (categoryFilter) {
          q = query(q, where("category", "==", categoryFilter));
        }
        if (difficultyFilter) {
          q = query(q, where("difficulty", "==", difficultyFilter));
        }

        if (sortFilter === "trending") {
          q = query(q, orderBy("trendingScore", "desc"));
        } else if (sortFilter === "rating") {
          q = query(q, orderBy("averageRating", "desc"));
        } else {
          q = query(q, orderBy("createdAt", "desc"));
        }

        q = query(q, limit(PAGE_SIZE));

        if (append && lastDocRef.current) {
          q = query(q, startAfter(lastDocRef.current));
        }

        const snapshot = await getDocs(q);
        const newProjects = snapshot.docs.map((doc) => doc.data() as ProjectData);

        const filtered = searchQuery
          ? newProjects.filter((p) =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : newProjects;

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);

        if (append) {
          setProjects((prev) => [...prev, ...filtered]);
        } else {
          setProjects(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryFilter, sortFilter, difficultyFilter, searchQuery]
  );

  const fetchProducts = useCallback(
    async (append = false) => {
      if (!firestore) return;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        let q = query(
          collection(firestore!, "products"),
          where("status", "==", "active")
        );

        if (categoryFilter) {
          q = query(q, where("category", "==", categoryFilter));
        }

        if (sortFilter === "trending") {
          q = query(q, orderBy("trendingScore", "desc"));
        } else {
          q = query(q, orderBy("createdAt", "desc"));
        }

        q = query(q, limit(PAGE_SIZE));

        if (append && lastDocRef.current) {
          q = query(q, startAfter(lastDocRef.current));
        }

        const snapshot = await getDocs(q);
        const newProducts = snapshot.docs.map((doc) => doc.data() as ProductData);

        const filtered = searchQuery
          ? newProducts.filter((p) =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : newProducts;

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);

        if (append) {
          setProducts((prev) => [...prev, ...filtered]);
        } else {
          setProducts(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryFilter, sortFilter, searchQuery]
  );

  useEffect(() => {
    lastDocRef.current = null;
    if (activeTab === "products") {
      fetchProducts(false);
    } else {
      fetchProjects(false);
    }
  }, [activeTab, fetchProjects, fetchProducts]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }));
    }, 400);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Browse</h1>

      {/* Curated product scroll rows (always visible at top) */}
      <div className="mt-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl" aria-hidden="true">🔥</span>
            <h2 className="text-lg font-bold text-foreground">Trending Products This Week</h2>
          </div>
          <TrendingProducts />
        </div>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl" aria-hidden="true">✨</span>
            <h2 className="text-lg font-bold text-foreground">New Products This Week</h2>
          </div>
          <NewProducts />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border mt-6 mb-6">
        <button
          onClick={() => router.push(buildUrl({ tab: "projects", sort: sortFilter }))}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "projects"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => router.push(buildUrl({ tab: "products", sort: sortFilter === "rating" ? "newest" : sortFilter }))}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Products
        </button>
      </div>

      {/* Search */}
      <div className="mt-2">
        <input
          type="search"
          placeholder={activeTab === "products" ? "Search products..." : "Search projects..."}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-xl border border-[#d6cfc7] bg-[#f7f5f2] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all"
        />
      </div>

      {/* Filters Row */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => router.push(buildUrl({ category: cat.slug }))}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                categoryFilter === cat.slug
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white/80 border border-border text-muted-foreground hover:bg-accent/30 hover:border-primary/40"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort + Difficulty (difficulty only for projects tab) */}
        <div className="flex items-center gap-3">
          {activeTab === "projects" && (
            <select
              aria-label="Filter by difficulty"
              value={difficultyFilter}
              onChange={(e) => router.push(buildUrl({ difficulty: e.target.value }))}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">All Levels</option>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label={activeTab === "products" ? "Sort products" : "Sort projects"}
            value={sortFilter}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
          >
            {(activeTab === "products" ? PRODUCT_SORT_OPTIONS : SORT_OPTIONS).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content grid */}
      <div className="mt-8">
        <div className="min-w-0">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#e8e2da]" />
              ))}
            </div>
          ) : activeTab === "projects" ? (
            projects.length === 0 ? (
              <div className="py-20 text-center">
                <span className="text-5xl" aria-hidden="true">🔍</span>
                <p className="mt-4 text-lg font-medium text-foreground">
                  No projects found{categoryFilter ? ` in "${categoryFilter}"` : ""}{searchQuery ? ` matching "${searchQuery}"` : ""}.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <React.Fragment key={project.projectId}>
                      <ProjectCard project={project} />
                    </React.Fragment>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => fetchProjects(true)}
                      disabled={loadingMore}
                      className="rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? "Loading..." : "Load More Projects"}
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            // Products tab
            products.length === 0 ? (
              <div className="py-20 text-center">
                <span className="text-5xl" aria-hidden="true">🛍️</span>
                <p className="mt-4 text-lg font-medium text-foreground">
                  No products found{categoryFilter ? ` in "${categoryFilter}"` : ""}{searchQuery ? ` matching "${searchQuery}"` : ""}.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <a
                      key={product.productId}
                      href={`/products/${product.productId}`}
                      className="group block overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="aspect-[3/2] overflow-hidden bg-muted rounded-t-2xl">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                            {TYPE_EMOJIS[product.type] || "🛍️"}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {product.title}
                          </h3>
                          <span className="shrink-0 rounded-full bg-accent/50 px-2 py-0.5 text-xs text-muted-foreground">
                            {TYPE_EMOJIS[product.type]} {TYPE_LABELS[product.type] || product.type}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        {product.creatorName && (
                          <p className="mt-1.5 text-xs text-muted-foreground truncate">
                            by {product.creatorName}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-base font-bold text-foreground">
                            {formatCurrency(product.price)}
                          </span>
                          {product.salesCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              🔥 {product.salesCount} sold
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => fetchProducts(true)}
                      disabled={loadingMore}
                      className="rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? "Loading..." : "Load More Products"}
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
