import type { Metadata } from "next";
import Link from "next/link";
import { getCreators } from "@/lib/firebase-server";
import { CreatorsClient } from "./CreatorsClient";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Discover Creators — Artists, Makers & Crafters",
  description:
    "Meet the hobby creators behind Artistico. Browse profiles, discover new artists, and find makers specializing in digital art, ceramics, woodworking, jewelry, and more.",
  openGraph: {
    title: "Creators — Artistico",
    description: "Meet the hobby creators behind Artistico.",
    url: "https://artistico.love/creators",
  },
};

export default async function CreatorsPage() {
  const creators = await getCreators(12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* SSR header and description */}
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Discover Creators
        </h1>
        <p className="mt-3 mx-auto max-w-2xl text-lg text-muted-foreground">
          Meet the makers and artists behind Artistico. Every creator on our
          platform is a real person sharing work they&apos;re passionate about —
          from hand-thrown ceramics to custom character illustrations.
        </p>
      </section>

      {/* SSR creator listing for crawlers */}
      {creators.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Featured Creators
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creators.map((creator) => (
              <Link
                key={creator.uid}
                href={`/creators/${creator.uid}`}
                className="group rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {creator.displayName}
                </h3>
                {creator.creatorProfile?.location && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    📍 {creator.creatorProfile.location}
                  </p>
                )}
                {creator.creatorProfile?.bio && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {creator.creatorProfile.bio}
                  </p>
                )}
                {creator.creatorProfile?.specialties && creator.creatorProfile.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {creator.creatorProfile.specialties.slice(0, 3).map((s: string) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-accent/30 px-2 py-0.5 text-xs text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  <strong className="text-foreground">{creator.followersCount || 0}</strong> followers
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO content */}
      <section className="mb-10 rounded-2xl border border-border bg-accent/20 p-8">
        <h2 className="text-xl font-bold text-foreground">
          Join Our Creator Community
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Artistico is built for hobby creators who want a fair platform to
          showcase and sell their work. Whether you specialize in digital art,
          woodworking, ceramics, jewelry making, photography, or any other
          creative medium — you belong here. We charge only a 5% marketplace
          fee with no listing fees or monthly subscriptions.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Each creator gets a full profile page to share their bio, location,
          specialties, and portfolio of projects. Buyers can follow their
          favorite creators, leave reviews, and commission custom work directly
          through the platform.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/become-creator" className="btn-gradient">
            Start Selling →
          </Link>
          <Link
            href="/browse"
            className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
          >
            Browse Projects
          </Link>
          <Link
            href="/blog"
            className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
          >
            Read Our Blog
          </Link>
        </div>
      </section>

      {/* Client-side interactive creators list */}
      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-muted h-52" />
            ))}
          </div>
        }
      >
        <CreatorsClient />
      </Suspense>
    </div>
  );
}
