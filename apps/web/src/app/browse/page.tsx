import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProjects } from "@/lib/firebase-server";
import { BrowseClient } from "./BrowseClient";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Browse Projects & Products — Handmade Crafts, Digital Art & More",
  description:
    "Discover handmade crafts, digital art, photography, woodworking, and more from hobby creators. Browse projects and products on Artistico — a low-fee marketplace for makers.",
  openGraph: {
    title: "Browse — Artistico",
    description: "Discover handmade crafts, digital art, and more from hobby creators.",
    url: "https://artistico.love/browse",
  },
};

// Sorted A–Z
const CATEGORIES = [
  { name: "3D Printing", slug: "3d-printing", emoji: "🖨️" },
  { name: "Ceramics", slug: "ceramics", emoji: "🏺" },
  { name: "Crafts", slug: "crafts", emoji: "✂️" },
  { name: "Digital Art", slug: "digital-art", emoji: "🎨" },
  { name: "Electronics", slug: "electronics", emoji: "⚡" },
  { name: "Fiber Arts", slug: "fiber-arts", emoji: "🧵" },
  { name: "Jewelry", slug: "jewelry", emoji: "💍" },
  { name: "Other", slug: "other", emoji: "🎁" },
  { name: "Painting", slug: "painting", emoji: "🖌️" },
  { name: "Paper Crafts", slug: "paper-crafts", emoji: "📄" },
  { name: "Photography", slug: "photography", emoji: "📷" },
  { name: "Textiles", slug: "textiles", emoji: "🧶" },
  { name: "Woodworking", slug: "woodworking", emoji: "🪵" },
];

function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function BrowsePage() {
  // Fetch initial projects server-side for SSR
  const projects = await getPublishedProjects(12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* SSR-rendered intro section for crawlers */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Browse Projects &amp; Products
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          Discover handmade crafts, digital art, photography, jewelry,
          woodworking, and more from hobby creators around the world. Every
          project on Artistico is made by an independent maker — not a factory.
        </p>
      </section>

      {/* SSR category links for internal linking */}
      <section className="mb-8">
        <h2 className="sr-only">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="rounded-full bg-white/80 border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/30 hover:border-primary/40 transition-all"
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* SSR project listing for crawlers */}
      {projects.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Latest Projects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.projectId}
                href={`/projects/${project.slug}`}
                className="group rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {project.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCategory(project.category)}
                  {project.tags?.length > 0 && ` · ${project.tags.slice(0, 3).join(", ")}`}
                </p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {project.description?.slice(0, 200)}
                  {(project.description?.length ?? 0) > 200 ? "…" : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SSR useful information section */}
      <section className="mb-10 rounded-2xl border border-border bg-accent/20 p-8">
        <h2 className="text-xl font-bold text-foreground">
          Why Browse on Artistico?
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Artistico is different from mass-market platforms. Every project here
          is shared by a real person — a hobbyist, maker, or independent artist
          who creates because they love it. When you buy on Artistico, your money
          goes directly to the creator with only a 5% marketplace fee.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Browse categories including handmade jewelry, ceramics, crochet and
          fiber arts, digital art and illustrations, landscape photography,
          3D printing projects, woodworking, and much more. Each project
          includes the creator&apos;s story, materials used, and detailed
          descriptions.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/creators" className="text-primary font-medium hover:text-primary/80">
            Meet Our Creators →
          </Link>
          <Link href="/blog" className="text-primary font-medium hover:text-primary/80">
            Read Our Blog →
          </Link>
          <Link href="/become-creator" className="text-primary font-medium hover:text-primary/80">
            Start Selling →
          </Link>
        </div>
      </section>

      {/* Client-side interactive browse with filters, search, pagination */}
      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#e8e2da]" />
            ))}
          </div>
        }
      >
        <BrowseClient />
      </Suspense>
    </div>
  );
}
