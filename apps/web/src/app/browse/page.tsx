"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { SidebarAd } from "@/components/ads/SidebarAd";
import { InlineBannerAd } from "@/components/ads/InlineBannerAd";

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

interface ProjectData {
  projectId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  tags: string[];
  productCount: number;
  averageRating: number;
  reviewCount: number;
  creatorId: string;
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
  const categoryFilter = searchParams.get("category") || "";
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!firestore) return;
      setLoading(true);
      try {
        let q = query(
          collection(firestore!, "projects"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
          limit(20)
        );

        if (categoryFilter) {
          q = query(
            collection(firestore!, "projects"),
            where("status", "==", "published"),
            where("category", "==", categoryFilter),
            orderBy("createdAt", "desc"),
            limit(20)
          );
        }

        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map((doc) => doc.data() as ProjectData));
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [categoryFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Browse Projects</h1>

      {/* Category Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.slug ? `/browse?category=${cat.slug}` : "/browse"}
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
              No projects found{categoryFilter ? ` in "${categoryFilter}"` : ""}.
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
                <Link
                  key={project.projectId}
                  href={`/projects/${project.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-muted">
                    {project.images?.[0] && (
                      <img
                        src={project.images[0]}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-accent/50 px-2 py-0.5">
                        {project.category}
                      </span>
                      {project.productCount > 0 && (
                        <span>{project.productCount} products</span>
                      )}
                      {project.averageRating > 0 && (
                        <span>★ {project.averageRating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Inline ad on mobile after project grid */}
            <div className="mt-8 lg:hidden">
              <InlineBannerAd slot="INLINE_BROWSE" />
            </div>
          </>
        )}
        </div>

        {/* Desktop sidebar ad */}
        <SidebarAd slot="SIDEBAR_BROWSE" />
      </div>
    </div>
  );
}
