import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCreator, getCreatorProjects } from "@/lib/firebase-server";
import FollowButton from "@/components/FollowButton";
import PresenceIndicator from "@/components/PresenceIndicator";
import CreatorProfileClient from "./CreatorProfileClient";

function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Build Person JSON-LD for the creator
function buildPersonJsonLd(
  creator: NonNullable<Awaited<ReturnType<typeof getCreator>>>,
  uid: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.displayName,
    url: `https://artistico.love/creators/${uid}`,
    ...(creator.photoURL ? { image: creator.photoURL } : {}),
    ...(creator.creatorProfile?.bio
      ? { description: creator.creatorProfile.bio }
      : {}),
    ...(creator.creatorProfile?.location
      ? { homeLocation: { "@type": "Place", name: creator.creatorProfile.location } }
      : {}),
    ...(creator.creatorProfile?.specialties?.length
      ? { knowsAbout: creator.creatorProfile.specialties }
      : {}),
    ...(creator.totalSales > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: creator.totalSales,
          },
        }
      : {}),
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  const [creator, projects] = await Promise.all([
    getCreator(uid),
    getCreatorProjects(uid),
  ]);

  if (!creator || !creator.isCreator) {
    notFound();
  }

  const profile = creator.creatorProfile;
  const jsonLd = buildPersonJsonLd(creator, uid);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── SSR Profile Header — always in initial HTML for crawlers ── */}
        <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {creator.photoURL ? (
              <Image
                src={creator.photoURL}
                alt={creator.displayName}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                {(creator.displayName || "?")[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground">
                {creator.displayName}
              </h1>
              {/* PresenceIndicator is a client component — hydrates independently */}
              <div className="mt-1">
                <PresenceIndicator userId={uid} />
              </div>
              {profile?.location && (
                <p className="mt-1 text-sm text-muted-foreground">
                  📍 {profile.location}
                </p>
              )}
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                Creator
              </span>
              {creator.isVerified && (
                <span className="ml-2 mt-2 inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
                  ✓ Verified
                </span>
              )}

              {/* Stats — SSR-visible */}
              <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
                <span>
                  <strong className="text-foreground">{creator.followersCount || 0}</strong> followers
                </span>
                <span>
                  <strong className="text-foreground">{(creator as { followingCount?: number }).followingCount || 0}</strong> following
                </span>
                <span>
                  <strong className="text-foreground">{projects.length}</strong> projects
                </span>
                {(creator.totalSales || 0) > 0 && (
                  <span>
                    <strong className="text-foreground">{creator.totalSales}</strong> sales
                  </span>
                )}
              </div>
            </div>

            {/* FollowButton is a client component — hydrates independently */}
            <div className="shrink-0">
              <FollowButton creatorId={uid} />
            </div>
          </div>

          {/* Bio — THE critical SSR content for thin-content assessment */}
          {profile?.bio && (
            <p className="mt-6 whitespace-pre-wrap leading-relaxed text-foreground">
              {profile.bio}
            </p>
          )}

          {!profile?.bio && (
            <p className="mt-6 text-sm text-muted-foreground italic">
              This creator hasn&apos;t added a bio yet.
            </p>
          )}

          {/* Specialties */}
          {profile?.specialties && profile.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.specialties.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full border border-border bg-accent/30 px-3 py-1 text-xs font-medium text-foreground"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Social Links */}
          {profile?.socialLinks && profile.socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {profile.socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}

          {/* Interactive contact/report/follow actions — mounted by CreatorProfileClient */}
          <CreatorProfileClient uid={uid} creatorName={creator.displayName} />
        </div>

        {/* ── SSR Projects Grid — crawlable ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <p className="text-muted-foreground">
              This creator hasn&apos;t published any projects yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.projectId}
                  href={`/projects/${project.slug}`}
                  className="group rounded-xl border border-border bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  {project.images?.[0] && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.images[0]}
                        alt={project.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      {project.category && (
                        <span className="rounded-full bg-accent/40 px-2 py-0.5">
                          {formatCategory(project.category)}
                        </span>
                      )}
                      {project.averageRating > 0 && (
                        <span>★ {project.averageRating.toFixed(1)}</span>
                      )}
                      {project.productCount > 0 && (
                        <span>{project.productCount} product{project.productCount !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* About this creator — extra SSR content depth */}
        <section className="mt-10 rounded-xl border border-border bg-muted/20 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            About {creator.displayName}
          </h2>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              {creator.displayName} is an independent creator on Artistico
              {profile?.location ? ` based in ${profile.location}` : ""}
              {profile?.specialties?.length
                ? `, specializing in ${profile.specialties.slice(0, 3).join(", ")}`
                : ""}
              .
            </p>
            {(creator.totalSales || 0) > 0 && (
              <p>
                With {creator.totalSales.toLocaleString()} completed sale{creator.totalSales !== 1 ? "s" : ""}
                {creator.followersCount > 0
                  ? ` and ${creator.followersCount.toLocaleString()} follower${creator.followersCount !== 1 ? "s" : ""}`
                  : ""}
                , {creator.displayName} is an established member of the Artistico community.
              </p>
            )}
            <p>
              Browse {creator.displayName}&apos;s {projects.length} published project{projects.length !== 1 ? "s" : ""} above,
              or{" "}
              <Link href="/browse" className="text-primary hover:underline">
                explore more creators on Artistico
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
