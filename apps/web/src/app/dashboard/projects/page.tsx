"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface ProjectItem {
  projectId: string;
  title: string;
  slug: string;
  status: string;
  productCount: number;
  createdAt: any;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) return;

    async function fetchProjects() {
      const q = query(
        collection(firestore!, "projects"),
        where("creatorId", "==", user!.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map((doc) => doc.data() as ProjectItem));
      setLoading(false);
    }

    fetchProjects();
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          New Project
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border border-border bg-muted"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <span className="text-5xl" aria-hidden="true">✨</span>
            <p className="mt-4 font-medium text-foreground">Your creative journey starts here!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Share what you’ve been making — a project is just photos, a description, and your story.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="btn-gradient mt-6 inline-block"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.projectId}
                href={`/dashboard/projects/${project.projectId}`}
                className="flex items-center justify-between rounded-lg border border-border bg-white p-4 hover:border-primary/50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-foreground">{project.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {project.productCount} products
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    project.status === "published"
                      ? "bg-green-100 text-green-700"
                      : project.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {project.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
