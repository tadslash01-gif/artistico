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
import Image from "next/image";
import Link from "next/link";
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

export default function RecentlyAdded() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      if (!firestore) return;
      try {
        const q = query(
          collection(firestore, "projects"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map((doc) => doc.data() as ProjectData));
      } catch (err) {
        console.error("Failed to fetch recent projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) return null;

  const [featured, ...rest] = projects;

  return (
    <div className="space-y-6">
      {/* Featured hero card */}
      <Link
        href={`/projects/${featured.slug}`}
        className="group relative block overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300"
      >
        <div className="grid md:grid-cols-2">
          <div className="aspect-[16/9] md:aspect-auto overflow-hidden bg-muted">
            {featured.images?.[0] ? (
              <Image
                src={featured.images[0]}
                alt={featured.title}
                width={800}
                height={450}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center text-6xl text-muted-foreground">
                🎨
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center p-8">
            <span className="inline-block w-fit rounded-full bg-accent/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              {featured.category}
            </span>
            <h3 className="mt-3 text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {featured.title}
            </h3>
            <p className="mt-2 text-muted-foreground line-clamp-3">
              {featured.description}
            </p>
            {featured.creatorName && (
              <div className="mt-4 flex items-center gap-2">
                {featured.creatorAvatar ? (
                  <Image
                    src={featured.creatorAvatar}
                    alt={featured.creatorName}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {featured.creatorName[0]?.toUpperCase()}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {featured.creatorName}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Remaining projects grid */}
      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
