"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import InquiryForm from "@/components/InquiryForm";
import { InlineBannerAd } from "@/components/ads/InlineBannerAd";

interface CreatorData {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  creatorProfile?: {
    bio: string;
    location: string;
    specialties: string[];
    socialLinks?: { platform: string; url: string }[];
  };
  createdAt: { seconds: number; nanoseconds: number } | null;
}

interface ProjectData {
  projectId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  productCount: number;
  averageRating: number;
  reviewCount: number;
}

export default function CreatorProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);

  useEffect(() => {
    async function fetchCreator() {
      if (!firestore) return;
      try {
        const userSnap = await getDoc(doc(firestore, "users", uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }
        const data = userSnap.data() as CreatorData;
        setCreator(data);

        // Fetch published projects
        const q = query(
          collection(firestore, "projects"),
          where("creatorId", "==", uid),
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        );
        const projectsSnap = await getDocs(q);
        setProjects(projectsSnap.docs.map((d) => d.data() as ProjectData));
      } catch (err) {
        console.error("Failed to load creator:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCreator();
  }, [uid]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted" />
            <div>
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="mt-2 h-4 w-32 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-6 h-20 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-foreground">Creator Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This profile doesn&apos;t exist or has been removed.
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

  const profile = creator.creatorProfile;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {creator.photoURL ? (
            <img
              src={creator.photoURL}
              alt={creator.displayName}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
              {(creator.displayName || "?")[0].toUpperCase()}
            </div>
          )}

          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-foreground">
              {creator.displayName}
            </h1>
            {profile?.location && (
              <p className="mt-1 text-sm text-muted-foreground">
                📍 {profile.location}
              </p>
            )}
            {creator.isCreator && (
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                Creator
              </span>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-foreground">
            {profile.bio}
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

        {/* Contact Creator */}
        {user && user.uid !== uid && (
          <div className="mt-6">
            {showInquiry ? (
              <InquiryForm
                creatorId={uid}
                creatorName={creator.displayName}
                onClose={() => setShowInquiry(false)}
                onSent={() => {
                  setShowInquiry(false);
                  alert("Message sent!");
                }}
              />
            ) : (
              <button
                onClick={() => setShowInquiry(true)}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                \u2709\ufe0f Contact Creator
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ad */}
      <InlineBannerAd slot="INLINE_CREATOR" className="my-4" />

      {/* Projects */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground">
          Projects ({projects.length})
        </h2>

        {projects.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            This creator hasn&apos;t published any projects yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.projectId}
                href={`/projects/${project.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] bg-muted">
                  {project.images?.[0] ? (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      🎨
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-accent/50 px-2 py-0.5">
                      {project.category}
                    </span>
                    {project.productCount > 0 && (
                      <span>{project.productCount} products</span>
                    )}
                    {project.averageRating > 0 && (
                      <span>★ {project.averageRating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
