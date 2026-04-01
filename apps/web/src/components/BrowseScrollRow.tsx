"use client";

import { useState, useEffect } from "react";
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
  trendingScore?: number;
}

interface BrowseScrollRowProps {
  title: string;
  emoji: string;
  variant: "trending" | "new";
}

export default function BrowseScrollRow({ title, emoji, variant }: BrowseScrollRowProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!firestore) return;
      try {
        let q;
        if (variant === "trending") {
          q = query(
            collection(firestore, "projects"),
            where("status", "==", "published"),
            orderBy("trendingScore", "desc"),
            limit(8)
          );
        } else {
          // New this week — projects created in the last 7 days
          const oneWeekAgo = Timestamp.fromDate(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          q = query(
            collection(firestore, "projects"),
            where("status", "==", "published"),
            where("createdAt", ">=", oneWeekAgo),
            orderBy("createdAt", "desc"),
            limit(8)
          );
        }

        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map((doc) => doc.data() as ProjectData));
      } catch (err) {
        console.error(`Failed to fetch ${variant} projects:`, err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [variant]);

  if (!loading && projects.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden="true">{emoji}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 w-64 shrink-0 animate-pulse rounded-2xl bg-muted sm:w-72" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {projects.map((project) => (
            <div key={project.projectId} className="w-64 shrink-0 snap-start sm:w-72">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
