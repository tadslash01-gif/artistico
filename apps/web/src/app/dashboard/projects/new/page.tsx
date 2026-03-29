"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

const CATEGORIES = [
  "woodworking",
  "digital-art",
  "crafts",
  "jewelry",
  "ceramics",
  "textiles",
  "paper-crafts",
  "3d-printing",
  "electronics",
  "painting",
  "photography",
  "other",
];

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);
    try {
      const result = await apiFetch<{ projectId: string; slug: string }>("/projects", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          materialsUsed: materialsUsed
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          images: [], // Images will be added via upload in next iteration
        }),
      });
      router.push(`/dashboard/projects/${result.projectId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Create New Project</h1>
      <p className="mt-2 text-muted-foreground">
        Share a project you&apos;ve been working on. You can add products to it after
        creating.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Project Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you make?"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="description"
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project, your process, what inspired you..."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-foreground">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="handmade, beginner-friendly, custom (comma separated)"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="materials" className="block text-sm font-medium text-foreground">
            Materials Used
          </label>
          <input
            id="materials"
            type="text"
            value={materialsUsed}
            onChange={(e) => setMaterialsUsed(e.target.value)}
            placeholder="oak wood, epoxy resin, brass hardware (comma separated)"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
