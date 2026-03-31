"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
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
}

interface RelatedProjectsProps {
  category: string;
  excludeProjectId: string;
}

export default function RelatedProjects({
  category,
  excludeProjectId,
}: RelatedProjectsProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      if (!firestore) return;
      try {
        const q = query(
          collection(firestore, "projects"),
          where("status", "==", "published"),
          where("category", "==", category),
          orderBy("trendingScore", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs
          .map((doc) => doc.data() as ProjectData)
          .filter((p) => p.projectId !== excludeProjectId)
          .slice(0, 4);
        setProjects(results);
      } catch (err) {
        console.error("Failed to fetch related projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRelated();
  }, [category, excludeProjectId]);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">More Like This</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Explore similar projects in {category}
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {projects.map((project) => (
          <ProjectCard key={project.projectId} project={project} />
        ))}
      </div>
    </div>
  );
}
