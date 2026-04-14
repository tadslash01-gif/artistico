"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import InquiryForm from "@/components/InquiryForm";
import FollowButton from "@/components/FollowButton";
import ProjectCard from "@/components/ProjectCard";
import { PresenceIndicator } from "@/components/PresenceIndicator";

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

interface UserSummary {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  followersCount: number;
}

type ProfileTab = "projects" | "followers" | "following";

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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("projects");
  const [followers, setFollowers] = useState<UserSummary[]>([]);
  const [following, setFollowing] = useState<UserSummary[]>([]);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);

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

  async function handleTabChange(tab: ProfileTab) {
    setActiveTab(tab);
    if (tab === "followers" && !followersLoaded) {
      setListsLoading(true);
      try {
        const data: { followers: UserSummary[] } = await apiFetch(`/users/${uid}/followers`);
        setFollowers(data.followers);
        setFollowersLoaded(true);
      } catch {
        // silently fail — empty state shown
      } finally {
        setListsLoading(false);
      }
    }
    if (tab === "following" && !followingLoaded) {
      setListsLoading(true);
      try {
        const data: { following: UserSummary[] } = await apiFetch(`/users/${uid}/following`);
        setFollowing(data.following);
        setFollowingLoaded(true);
      } catch {
        // silently fail — empty state shown
      } finally {
        setListsLoading(false);
      }
    }
  }

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
            <div className="mt-1">
              <PresenceIndicator userId={uid} />
            </div>
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
              <button
                onClick={() => handleTabChange("followers")}
                className="hover:text-foreground transition-colors"
              >
                <strong className="text-foreground">{creator.followersCount || 0}</strong> followers
              </button>
              <button
                onClick={() => handleTabChange("following")}
                className="hover:text-foreground transition-colors"
              >
                <strong className="text-foreground">{creator.followingCount || 0}</strong> following
              </button>
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
                Contact Creator
              </button>
            )}
          </div>
        )}

        {/* Report Creator */}
        {user && user.uid !== uid && (
          <div className="mt-4">
            {!reportOpen ? (
              <button
                onClick={() => setReportOpen(true)}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Report this creator
              </button>
            ) : (
              <div className="rounded-lg border border-border bg-white p-4">
                <h3 className="text-sm font-semibold text-foreground">Report Creator</h3>
                <select
                  id="report-reason"
                  name="reason"
                  title="Report reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a reason…</option>
                  <option value="spam">Spam</option>
                  <option value="ip-violation">IP / Copyright violation</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fraud">Fraudulent activity</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  id="report-details"
                  name="details"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Additional details (optional)"
                  rows={3}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    disabled={!reportReason || reportSubmitting}
                    onClick={async () => {
                      setReportSubmitting(true);
                      try {
                        await apiFetch("/reports", {
                          method: "POST",
                          body: JSON.stringify({
                            targetType: "user",
                            targetId: uid,
                            reason: reportReason,
                            description: reportDescription || undefined,
                          }),
                        });
                        setReportOpen(false);
                        setReportReason("");
                        setReportDescription("");
                        alert("Report submitted. Thank you.");
                      } catch {
                        alert("Failed to submit report.");
                      } finally {
                        setReportSubmitting(false);
                      }
                    }}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {reportSubmitting ? "Submitting…" : "Submit Report"}
                  </button>
                  <button
                    onClick={() => {
                      setReportOpen(false);
                      setReportReason("");
                      setReportDescription("");
                    }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="mt-8 border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Profile sections">
          {(["projects", "followers", "following"] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`pb-3 text-sm font-medium transition-colors capitalize border-b-2 ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab === "projects"
                ? `Projects (${projects.length})`
                : tab === "followers"
                  ? `Followers (${creator.followersCount || 0})`
                  : `Following (${creator.followingCount || 0})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {/* Projects tab */}
        {activeTab === "projects" && (
          <>
            {projects.length === 0 ? (
              <p className="text-muted-foreground">
                This creator hasn&apos;t published any projects yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.projectId} project={project} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Followers tab */}
        {activeTab === "followers" && (
          <UserList
            users={followers}
            loading={listsLoading}
            emptyMessage="No followers yet."
          />
        )}

        {/* Following tab */}
        {activeTab === "following" && (
          <UserList
            users={following}
            loading={listsLoading}
            emptyMessage="Not following anyone yet."
          />
        )}
      </div>
    </div>
  );
}

function UserList({
  users,
  loading,
  emptyMessage,
}: {
  users: UserSummary[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {users.map((u) => (
        <li key={u.uid} className="py-3">
          <Link
            href={`/creators/${u.uid}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {u.photoURL ? (
              <Image
                src={u.photoURL}
                alt={u.displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(u.displayName || "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{u.displayName}</p>
              {u.isCreator && (
                <p className="text-xs text-muted-foreground">
                  Creator · {u.followersCount} followers
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
