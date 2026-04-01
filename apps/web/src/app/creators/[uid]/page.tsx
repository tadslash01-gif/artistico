"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import InquiryForm from "@/components/InquiryForm";
import FollowButton from "@/components/FollowButton";
import ProjectCard from "@/components/ProjectCard";
import { InlineBannerAd } from "@/components/ads/InlineBannerAd";
import { AD_SLOTS } from "@/lib/adSlots";

interface CreatorData {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  followersCount: number;
  followingCount: number;
  totalSales: number;
  isVerified: boolean;
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
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  savesCount?: number;
  minPrice?: number | null;
  creatorName?: string;
  creatorAvatar?: string | null;
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
            <Image
              src={creator.photoURL}
              alt={creator.displayName}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
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

            {/* Stats bar */}
            <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              <span>
                <strong className="text-foreground">{creator.followersCount || 0}</strong> followers
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

          {/* Follow button */}
          <div className="shrink-0">
            <FollowButton creatorId={uid} />
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
      <InlineBannerAd slot={AD_SLOTS.INLINE_CREATOR} className="my-4" />

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
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
