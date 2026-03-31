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
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}
