"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";

interface SaveData {
  saveId: string;
  projectId: string;
  createdAt: { seconds: number };
}

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

export default function SavedProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ saves: SaveData[]; projects: ProjectData[] }>("/saves")
      .then((data) => setProjects(data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnsave = async (projectId: string) => {
    setRemovingId(projectId);
    // Optimistic removal
    setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
    try {
      await apiFetch(`/saves/${projectId}`, { method: "DELETE" });
    } catch {
      // Revert on failure — refetch
      apiFetch<{ saves: SaveData[]; projects: ProjectData[] }>("/saves")
        .then((data) => setProjects(data.projects))
        .catch(console.error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Saved Projects</h1>
      <p className="mt-2 text-muted-foreground">
        Projects you&apos;ve bookmarked for later.
      </p>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">No saved projects yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse projects and save the ones you love!
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <div key={project.projectId} className="relative">
              <ProjectCard project={project} />
              <button
                onClick={() => handleUnsave(project.projectId)}
                disabled={removingId === project.projectId}
                className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Remove from saved"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
