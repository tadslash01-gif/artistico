"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  type DocumentSnapshot,
} from "firebase/firestore";
import { scoreProject, fetchFeedBatch, FEED_PAGE_SIZE } from "@/lib/feed";
import type { Project } from "@artistico/shared";

interface ScoredProject extends Project {
  _score: number;
}

interface FollowingUser {
  uid: string;
  displayName: string;
}

export default function SmartFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<ScoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  // Persistent sets for scoring
  const followedIdsRef = useRef<Set<string>>(new Set());
  const liveCreatorIdsRef = useRef<Set<string>>(new Set());

  // Firestore cursor for pagination
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  // All accumulated raw projects across batches
  const allProjectsRef = useRef<Project[]>([]);
  // Page cursor into the sorted list
  const pageRef = useRef(0);

  // In-session view tracking — prevent duplicate increments per page load
  const viewedRef = useRef<Set<string>>(new Set());

  const rescore = useCallback(() => {
    const scored: ScoredProject[] = allProjectsRef.current.map((p) => ({
      ...p,
      _score: scoreProject(p, followedIdsRef.current, liveCreatorIdsRef.current),
    }));
    scored.sort((a, b) => b._score - a._score);
    const page = pageRef.current;
    setProjects(scored.slice(0, (page + 1) * FEED_PAGE_SIZE));
    setHasMore(
      scored.length > (page + 1) * FEED_PAGE_SIZE || lastDocRef.current !== null
    );
  }, []);

  // Initial load: 3 parallel fetches
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [followingRes, streamsRes, batchRes] = await Promise.all([
          apiFetch<{ following: FollowingUser[] }>(`/users/${user!.uid}/following`, {
            authenticated: false,
          }),
          apiFetch<{ streams: Array<{ creatorId: string }> }>("/streams/live", {
            authenticated: false,
          }),
          firestore
            ? fetchFeedBatch(firestore)
            : Promise.resolve({ projects: [] as Project[], lastDoc: null }),
        ]);

        if (cancelled) return;

        const followed = new Set<string>(
          (followingRes.following ?? []).map((f) => f.uid)
        );
        const live = new Set<string>(
          (streamsRes.streams ?? []).map((s) => s.creatorId)
        );

        followedIdsRef.current = followed;
        liveCreatorIdsRef.current = live;
        setFollowingCount(followed.size);

        allProjectsRef.current = batchRes.projects;
        lastDocRef.current = batchRes.lastDoc;
        pageRef.current = 0;

        const scored: ScoredProject[] = batchRes.projects.map((p) => ({
          ...p,
          _score: scoreProject(p, followed, live),
        }));
        scored.sort((a, b) => b._score - a._score);
        setProjects(scored.slice(0, FEED_PAGE_SIZE));
        setHasMore(scored.length > FEED_PAGE_SIZE || batchRes.lastDoc !== null);
      } catch (err) {
        console.error("[feed] initial load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  // Real-time listener: update live creator set and re-score on stream changes
  useEffect(() => {
    if (!firestore || !user) return;

    const q = query(
      collection(firestore, "streams"),
      where("status", "==", "live")
    );

    const unsub = onSnapshot(q, (snap) => {
      const live = new Set<string>(
        snap.docs.map((d) => d.data().creatorId as string)
      );
      liveCreatorIdsRef.current = live;
      rescore();
    });

    return unsub;
  }, [user, rescore]);

  // IntersectionObserver for viewport-based view tracking
  const cardObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    cardObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const projectId = (entry.target as HTMLElement).dataset.projectId;
          if (!projectId || viewedRef.current.has(projectId)) return;

          // Only count as a view after 2 full seconds in the viewport
          const timeout = setTimeout(() => {
            viewedRef.current.add(projectId);
            apiFetch(`/projects/${projectId}/view`, {
              method: "POST",
              authenticated: false,
            }).catch(() => {});
          }, 2000);

          // Cancel if card scrolls out before 2s
          const leaveWatcher = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) {
              clearTimeout(timeout);
              leaveWatcher.disconnect();
            }
          });
          leaveWatcher.observe(entry.target);
          void timeout;
        });
      },
      { threshold: 0.5 }
    );

    return () => cardObserverRef.current?.disconnect();
  }, []);

  const observeCard = useCallback(
    (el: HTMLDivElement | null, projectId: string) => {
      if (!el || !cardObserverRef.current) return;
      el.dataset.projectId = projectId;
      cardObserverRef.current.observe(el);
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const nextPage = pageRef.current + 1;
    const currentSorted: ScoredProject[] = allProjectsRef.current
      .map((p) => ({
        ...p,
        _score: scoreProject(p, followedIdsRef.current, liveCreatorIdsRef.current),
      }))
      .sort((a, b) => b._score - a._score);

    const nextSlice = currentSorted.slice(0, (nextPage + 1) * FEED_PAGE_SIZE);

    if (nextSlice.length > projects.length) {
      // Already have enough in-memory, just advance page
      pageRef.current = nextPage;
      setProjects(nextSlice);
      setHasMore(
        currentSorted.length > (nextPage + 1) * FEED_PAGE_SIZE ||
          lastDocRef.current !== null
      );
      return;
    }

    // Fetch next batch from Firestore
    if (!lastDocRef.current || !firestore) {
      setHasMore(false);
      return;
    }

    setLoadingMore(true);
    try {
      const { projects: morePjs, lastDoc } = await fetchFeedBatch(
        firestore,
        lastDocRef.current
      );
      lastDocRef.current = lastDoc;
      allProjectsRef.current = [...allProjectsRef.current, ...morePjs];
      pageRef.current = nextPage;
      rescore();
    } catch (err) {
      console.error("[feed] loadMore failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, projects.length, rescore]);

  // ─── Render ───────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">For You</h1>
        <p className="mt-1 text-muted-foreground">Your personalised feed</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (followingCount === 0 && projects.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">For You</h1>
        <p className="mt-1 text-muted-foreground">Your personalised feed</p>
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">👥</span>
          <h2 className="text-lg font-semibold text-foreground">
            Discover creators to personalise your feed
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Follow creators you love — their posts will appear here ranked by
            engagement, with live streams surfaced first.
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

  const liveCount = projects.filter((p) =>
    liveCreatorIdsRef.current.has(p.creatorId)
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">For You</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {followingCount > 0
              ? `Following ${followingCount} creator${followingCount !== 1 ? "s" : ""} · ranked by engagement`
              : "Trending content · ranked by engagement"}
            {liveCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {liveCount} LIVE
              </span>
            )}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">🎨</span>
          <h2 className="text-lg font-semibold text-foreground">Nothing to show yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            The creators you follow haven&apos;t posted anything recently. Check back soon!
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.projectId}
                ref={(el) => observeCard(el, project.projectId)}
              >
                <ProjectCard
                  project={project}
                  isLive={liveCreatorIdsRef.current.has(project.creatorId)}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                  </span>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
