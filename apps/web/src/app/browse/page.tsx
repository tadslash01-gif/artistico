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
import ProjectCard from "@/components/ProjectCard";
import BrowseScrollRow from "@/components/BrowseScrollRow";

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

  const categoryFilter = searchParams.get("category") || "";
  const sortFilter = searchParams.get("sort") || "newest";
  const difficultyFilter = searchParams.get("difficulty") || "";
  const searchQuery = searchParams.get("q") || "";

  const [projects, setProjects] = useState<ProjectData[]>([]);
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
      else {
        setLoading(true);
        setFetchError(false);
      }

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
        if (!append) setFetchError(true);
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
    }, 600);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Browse Projects</h1>

      {/* Curated scroll rows */}
      <div className="mt-8">
        <BrowseScrollRow title="Trending This Week" emoji="🔥" variant="trending" />
        <BrowseScrollRow title="New This Week" emoji="✨" variant="new" />
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          id="browse-search"
          name="q"
          type="search"
          placeholder="Search projects..."
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

        {/* Sort + Difficulty */}
        <div className="flex items-center gap-3">
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

          <select
            aria-label="Sort projects"
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

      {/* Project Grid */}
      <div className="mt-8">
        {fetchError ? (
          <div className="py-20 text-center">
            <span className="text-5xl" aria-hidden="true">⚠️</span>
            <p className="mt-4 text-lg font-medium text-foreground">
              Something went wrong loading projects.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
            <button
              onClick={() => fetchProjects(false)}
              className="mt-4 rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-[#e8e2da]"
              />
            ))}
          </div>
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

          </>
        )}
      </div>
    </div>
  );
}
