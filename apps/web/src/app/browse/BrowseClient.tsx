"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
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
import BrowseScrollRow from "@/components/BrowseScrollRow";

const CATEGORIES = [
  { name: "All", slug: "" },
  { name: "3D Printing", slug: "3d-printing" },
  { name: "Ceramics", slug: "ceramics" },
  { name: "Crafts", slug: "crafts" },
  { name: "Digital Art", slug: "digital-art" },
  { name: "Electronics", slug: "electronics" },
  { name: "Fiber Arts", slug: "fiber-arts" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Other", slug: "other" },
  { name: "Painting", slug: "painting" },
  { name: "Paper Crafts", slug: "paper-crafts" },
  { name: "Photography", slug: "photography" },
  { name: "Textiles", slug: "textiles" },
  { name: "Woodworking", slug: "woodworking" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Trending", value: "trending" },
  { label: "Top Rated", value: "rating" },
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
  projectId: string | null;
  creatorId: string;
  title: string;
  description: string;
  type: "physical" | "digital" | "template" | "commission";
  price: number;
  images: string[];
  category: string | null;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  physical: "Physical",
  digital: "Digital",
  template: "Template",
  commission: "Commission",
};

export function BrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const typeFilter = searchParams.get("type") || "project";
  const categoryFilter = searchParams.get("category") || "";
  const sortFilter = searchParams.get("sort") || "newest";
  const difficultyFilter = searchParams.get("difficulty") || "";
  const searchQuery = searchParams.get("q") || "";

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const values = {
        type: typeFilter,
        category: categoryFilter,
        sort: sortFilter,
        difficulty: difficultyFilter,
        q: searchQuery,
        ...overrides,
      };
      for (const [k, v] of Object.entries(values)) {
        if (!v) continue;
        if (k === "sort" && v === "newest") continue;
        if (k === "type" && v === "project") continue;
        params.set(k, v);
      }
      const qs = params.toString();
      return `/browse${qs ? `?${qs}` : ""}`;
    },
    [typeFilter, categoryFilter, sortFilter, difficultyFilter, searchQuery]
  );

  const fetchProjects = useCallback(
    async (append = false) => {
      if (!firestore) return;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setFetchError(false);
      }

      try {
        let q = query(
          collection(firestore!, "projects"),
          where("status", "==", "published")
        );

        if (categoryFilter) q = query(q, where("category", "==", categoryFilter));
        if (difficultyFilter) q = query(q, where("difficulty", "==", difficultyFilter));

        if (sortFilter === "trending") q = query(q, orderBy("trendingScore", "desc"));
        else if (sortFilter === "rating") q = query(q, orderBy("averageRating", "desc"));
        else q = query(q, orderBy("createdAt", "desc"));

        q = query(q, limit(PAGE_SIZE));

        if (append && lastDocRef.current) q = query(q, startAfter(lastDocRef.current));

        const snapshot = await getDocs(q);
        const newProjects = snapshot.docs.map((doc) => doc.data() as ProjectData);

        const filtered = searchQuery
          ? newProjects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
          : newProjects;

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);

        if (append) setProjects((prev) => [...prev, ...filtered]);
        else setProjects(filtered);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        if (!append) setFetchError(true);
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
      else {
        setLoading(true);
        setFetchError(false);
      }

      try {
        let q = query(
          collection(firestore!, "products"),
          where("status", "==", "active")
        );
        if (categoryFilter) q = query(q, where("category", "==", categoryFilter));
        q = query(q, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
        if (append && lastDocRef.current) q = query(q, startAfter(lastDocRef.current));

        const snapshot = await getDocs(q);
        const newProducts = snapshot.docs.map((doc) => doc.data() as ProductData);

        const filtered = searchQuery
          ? newProducts.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
          : newProducts;

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);

        if (append) setProducts((prev) => [...prev, ...filtered]);
        else setProducts(filtered);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (!append) setFetchError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryFilter, searchQuery]
  );

  useEffect(() => {
    lastDocRef.current = null;
    if (typeFilter === "product") fetchProducts(false);
    else fetchProjects(false);
  }, [typeFilter, fetchProjects, fetchProducts]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }));
    }, 600);
  };

  const isProductMode = typeFilter === "product";

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        {isProductMode ? "Shop Products" : "All Projects"}
      </h2>

      {/* Type toggle */}
      <div className="flex items-center gap-2">
        <Link
          href={buildUrl({ type: "project" })}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            !isProductMode
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Projects
        </Link>
        <Link
          href={buildUrl({ type: "product" })}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            isProductMode
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Products
        </Link>
      </div>

      {/* Curated scroll rows (projects only) */}
      {!isProductMode && (
        <div className="mt-8">
          <BrowseScrollRow title="Trending This Week" emoji="🔥" variant="trending" />
          <BrowseScrollRow title="New This Week" emoji="✨" variant="new" />
        </div>
      )}

      {/* Search */}
      <div className={isProductMode ? "mt-8" : "mt-6"}>
        <input
          id="browse-search"
          name="q"
          type="search"
          placeholder={isProductMode ? "Search products..." : "Search projects..."}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-xl border border-[#d6cfc7] bg-[#f7f5f2] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all"
        />
      </div>

      {/* Filters Row */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={buildUrl({ category: cat.slug })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                categoryFilter === cat.slug
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white/80 border border-border text-muted-foreground hover:bg-accent/30 hover:border-primary/40"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {!isProductMode && (
          <div className="flex items-center gap-3">
            <select
              aria-label="Filter by difficulty"
              value={difficultyFilter}
              onChange={(e) => router.push(buildUrl({ difficulty: e.target.value }))}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">All Levels</option>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              aria-label="Sort projects"
              value={sortFilter}
              onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="mt-8">
        {fetchError ? (
          <div className="py-20 text-center">
            <span className="text-5xl" aria-hidden="true">⚠️</span>
            <p className="mt-4 text-lg font-medium text-foreground">
              Something went wrong loading {isProductMode ? "products" : "projects"}.
            </p>
            <button
              onClick={() => isProductMode ? fetchProducts(false) : fetchProjects(false)}
              className="mt-4 rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#e8e2da]" />
            ))}
          </div>
        ) : isProductMode ? (
          products.length === 0 ? (
            <div className="py-20 text-center">
              <span className="text-5xl" aria-hidden="true">🛍️</span>
              <p className="mt-4 text-lg font-medium text-foreground">
                No products found{categoryFilter ? ` in "${categoryFilter}"` : ""}
                {searchQuery ? ` matching "${searchQuery}"` : ""}.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to{" "}
                <Link href="/become-creator" className="text-primary font-medium hover:text-primary/80">
                  list something for sale
                </Link>!
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.productId} product={product} />
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
        ) : projects.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-5xl" aria-hidden="true">🔍</span>
            <p className="mt-4 text-lg font-medium text-foreground">
              No projects found{categoryFilter ? ` in "${categoryFilter}"` : ""}{searchQuery ? ` matching "${searchQuery}"` : ""}.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to{" "}
              <Link href="/become-creator" className="text-primary font-medium hover:text-primary/80">
                share something you made
              </Link>
              {" "}— your hobby could inspire someone!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.projectId} project={project} />
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
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductData }) {
  const href = product.projectId
    ? `/projects/${product.projectId}`
    : "/browse?type=product";

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">🛍️</div>
        )}
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {product.title}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-primary">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price / 100)}
          </span>
          <span className="rounded-full bg-accent/50 px-2 py-0.5 text-xs text-muted-foreground">
            {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
          </span>
        </div>
      </div>
    </Link>
  );
}
