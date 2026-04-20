import { Suspense } from "react";
import { getProjectBySlug, getCreator, getRelatedProjects } from "@/lib/firebase-server";
import Link from "next/link";
import { ProjectDetailClient } from "./ProjectDetailClient";

// This is the SSR wrapper. It fetches project data server-side and renders
// it in the initial HTML for SEO/crawlability, then hydrates the interactive
// client component on top.

function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-foreground">Project Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This project may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Projects
        </Link>
      </div>
    );
  }

  // Fetch creator and related projects in parallel
  const [creator, relatedProjects] = await Promise.all([
    getCreator(project.creatorId),
    getRelatedProjects(project.category, project.projectId, 4),
  ]);

  const categoryLabel = formatCategory(project.category);

  // Build structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    creator: creator ? {
      "@type": "Person",
      name: creator.displayName,
      url: `https://artistico.love/creators/${creator.uid}`,
    } : undefined,
    url: `https://artistico.love/projects/${slug}`,
    image: project.images?.[0],
    dateCreated: project.createdAt,
    genre: categoryLabel,
    keywords: project.tags?.join(", "),
    aggregateRating: project.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: project.averageRating,
      reviewCount: project.reviewCount,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SSR-rendered content visible to crawlers */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb — crawlable */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/browse" className="hover:text-primary transition-colors">
            Browse
          </Link>
          <span>/</span>
          <Link
            href={`/browse?category=${project.category}`}
            className="hover:text-primary transition-colors"
          >
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-foreground">{project.title}</span>
        </nav>

        {/* SSR content block — always in initial HTML */}
        <article>
          <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-accent/50 px-3 py-0.5 font-medium">
              {categoryLabel}
            </span>
            {project.difficulty && (
              <span className="rounded-full bg-muted px-3 py-0.5">
                {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
              </span>
            )}
            {project.timeToBuild && <span>⏱ {project.timeToBuild}</span>}
            {project.averageRating > 0 && (
              <span>
                ★ {project.averageRating.toFixed(1)} ({project.reviewCount}{" "}
                {project.reviewCount === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>

          {creator && (
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/creators/${project.creatorId}`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                by {creator.displayName}
              </Link>
              {creator.creatorProfile?.location && (
                <span className="text-sm text-muted-foreground">
                  📍 {creator.creatorProfile.location}
                </span>
              )}
            </div>
          )}

          {/* Description — THE critical SSR content */}
          <div className="mt-6 prose-equivalent">
            <h2 className="text-lg font-semibold text-foreground">About This Project</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">
              {project.description}
            </p>
          </div>

          {/* Creator Story */}
          {project.creatorStory && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground">
                The Story Behind This Project
              </h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {project.creatorStory}
              </p>
            </div>
          )}

          {/* Use Case */}
          {project.useCase && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-foreground">Perfect For</h3>
              <p className="mt-1 text-sm text-muted-foreground">{project.useCase}</p>
            </div>
          )}

          {/* Materials */}
          {project.materialsUsed && project.materialsUsed.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground">Materials Used</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.materialsUsed.map((m: string) => (
                  <span
                    key={m}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related Projects — SSR crawlable links */}
        {relatedProjects.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">Related Projects</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProjects.map((related) => (
                <Link
                  key={related.projectId}
                  href={`/projects/${related.slug}`}
                  className="group rounded-xl border border-border bg-white p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCategory(related.category)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {related.description?.slice(0, 120)}
                    {related.description?.length > 120 ? "…" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Internal links for SEO */}
        <nav className="mt-10 rounded-xl border border-border bg-accent/20 p-6">
          <h2 className="font-semibold text-foreground">Explore More on Artistico</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/browse" className="text-primary font-medium hover:text-primary/80">
              Browse All Projects →
            </Link>
            <Link href="/creators" className="text-primary font-medium hover:text-primary/80">
              Discover Creators →
            </Link>
            <Link href={`/browse?category=${project.category}`} className="text-primary font-medium hover:text-primary/80">
              More {categoryLabel} →
            </Link>
            <Link href="/blog" className="text-primary font-medium hover:text-primary/80">
              Read Our Blog →
            </Link>
          </div>
        </nav>
      </div>

      {/* Client-side interactive layer — loads on top of SSR content */}
      <Suspense fallback={null}>
        <ProjectDetailClient slug={slug} />
      </Suspense>
    </>
  );
}
