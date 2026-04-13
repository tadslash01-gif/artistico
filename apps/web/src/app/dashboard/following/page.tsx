"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";

interface ProjectData {
  projectId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  savesCount?: number;
  minPrice?: number | null;
  creatorName?: string;
  creatorAvatar?: string | null;
}

interface FollowingUser {
  uid: string;
  displayName: string;
}

export default function FollowingFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        // Fetch following list
        const { following } = await apiFetch<{ following: FollowingUser[] }>(
          `/users/${user!.uid}/following`,
          { authenticated: false }
        );
        setFollowingCount(following.length);
        if (following.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }

        // Fetch their projects (up to 10 creators at a time)
        const ids = following.slice(0, 10).map((f) => f.uid).join(",");
        const { projects: fetched, hasMore: more } = await apiFetch<{
          projects: ProjectData[];
          hasMore: boolean;
        }>(`/projects?creatorIds=${ids}&sort=createdAt&limit=20`, { authenticated: false });

        setProjects(fetched || []);
        setHasMore(more);
        if (fetched?.length > 0) {
          setLastProjectId(fetched[fetched.length - 1].projectId);
        }
      } catch (err) {
        console.error("Failed to load following feed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function loadMore() {
    if (!user || !lastProjectId) return;
    try {
      const { following } = await apiFetch<{ following: FollowingUser[] }>(
        `/users/${user.uid}/following`,
        { authenticated: false }
      );
      const ids = following.slice(0, 10).map((f) => f.uid).join(",");
      const { projects: fetched, hasMore: more } = await apiFetch<{
        projects: ProjectData[];
        hasMore: boolean;
      }>(`/projects?creatorIds=${ids}&sort=createdAt&limit=20&startAfter=${lastProjectId}`, { authenticated: false });

      setProjects((prev) => [...prev, ...(fetched || [])]);
      setHasMore(more);
      if (fetched?.length > 0) {
        setLastProjectId(fetched[fetched.length - 1].projectId);
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    }
  }

  if (authLoading || loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Following</h1>
        <p className="mt-2 text-muted-foreground">Projects from creators you follow</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (followingCount === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Following</h1>
        <p className="mt-2 text-muted-foreground">Projects from creators you follow</p>
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">👥</span>
          <h2 className="text-lg font-semibold text-foreground">You&apos;re not following anyone yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Follow creators you love to see their latest projects here.
          </p>
          <a
            href="/creators"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Discover Creators
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Following</h1>
      <p className="mt-2 text-muted-foreground">
        Projects from {followingCount} creator{followingCount !== 1 ? "s" : ""} you follow
      </p>

      {projects.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">🎨</span>
          <h2 className="text-lg font-semibold text-foreground">Nothing new yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            The creators you follow haven&apos;t posted anything recently. Check back soon!
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
