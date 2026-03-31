"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
import { SidebarAd } from "@/components/ads/SidebarAd";
import { InlineBannerAd } from "@/components/ads/InlineBannerAd";
import ProjectCard from "@/components/ProjectCard";

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

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-muted" />
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

  const categoryFilter = searchParams.get("category") || "";
  const sortFilter = searchParams.get("sort") || "newest";
  const difficultyFilter = searchParams.get("difficulty") || "";
  const searchQuery = searchParams.get("q") || "";

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const values = {
        category: categoryFilter,
        sort: sortFilter,
        difficulty: difficultyFilter,
        q: searchQuery,
        ...overrides,
      };
      for (const [k, v] of Object.entries(values)) {
        if (v && !(k === "sort" && v === "newest")) params.set(k, v);
      }
      const qs = params.toString();
      return `/browse${qs ? `?${qs}` : ""}`;
    },
    [categoryFilter, sortFilter, difficultyFilter, searchQuery]
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

        // Sort
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

        // Client-side search filtering (prefix match on title)
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

  useEffect(() => {
    lastDocRef.current = null;
    fetchProjects(false);
  }, [fetchProjects]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }));
    }, 400);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Browse Projects</h1>

      {/* Search */}
      <div className="mt-6">
        <input
          type="search"
          placeholder="Search projects..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* Filters Row */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={buildUrl({ category: cat.slug })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Sort + Difficulty */}
        <div className="flex items-center gap-3">
          <select
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

          <select
            value={sortFilter}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Grid + Sidebar Ad */}
      <div className="mt-8 flex gap-8">
        <div className="flex-1 min-w-0">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-xl border border-border bg-muted"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              No projects found{categoryFilter ? ` in "${categoryFilter}"` : ""}{searchQuery ? ` matching "${searchQuery}"` : ""}.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to{" "}
              <Link href="/become-creator" className="text-primary hover:text-primary/80">
                share a project
              </Link>
              !
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.projectId} project={project} />
              ))}
            </div>

            {/* Load More */}
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

            {/* Inline ad on mobile after project grid */}
            <div className="mt-8 lg:hidden">
              <InlineBannerAd slot="1890754677" />
            </div>
          </>
        )}
        </div>

        {/* Desktop sidebar ad */}
        <SidebarAd slot="1890754677" />
      </div>
    </div>
  );
}
