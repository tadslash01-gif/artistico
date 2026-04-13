"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
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
  trendingScore?: number;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

function hoursAgo(ts: { seconds: number } | null | undefined): string | null {
  if (!ts) return null;
  const diffMs = Date.now() - ts.seconds * 1000;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function isGainingTraction(project: ProjectData): boolean {
  if (!project.createdAt || !project.trendingScore) return false;
  const ageWeeks = (Date.now() - project.createdAt.seconds * 1000) / (7 * 24 * 60 * 60 * 1000);
  return project.trendingScore > 50 && ageWeeks < 1;
}

export default function TrendingProjects() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      if (!firestore) return;
      try {
        const q = query(
          collection(firestore, "projects"),
          where("status", "==", "published"),
          orderBy("trendingScore", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map((doc) => doc.data() as ProjectData));
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 w-72 shrink-0 animate-pulse rounded-2xl bg-muted sm:w-80" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {projects.map((project) => (
        <div key={project.projectId} className="w-72 shrink-0 snap-start sm:w-80">
          <div className="relative">
            {isGainingTraction(project) && (
              <div className="absolute -top-2 left-2 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  🔥 Gaining traction
                </span>
              </div>
            )}
            <ProjectCard project={project} />
            {project.createdAt && (
              <p className="mt-1.5 px-1 text-xs text-muted-foreground">
                Posted {hoursAgo(project.createdAt)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
