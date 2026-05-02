"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import InquiryForm from "@/components/InquiryForm";

interface UserSummary {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  followersCount: number;
}

type SocialTab = "followers" | "following" | null;

/**
 * Client-only interactive overlay for the creator profile page.
 * Handles: contact/inquiry form, report form, followers/following tabs.
 * The SSR page renders all crawlable content; this component mounts on top.
 */
export default function CreatorProfileClient({
  uid,
  creatorName,
}: {
  uid: string;
  creatorName: string;
}) {
  const { user } = useAuth();
  const [showInquiry, setShowInquiry] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<SocialTab>(null);
  const [followers, setFollowers] = useState<UserSummary[]>([]);
  const [following, setFollowing] = useState<UserSummary[]>([]);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);

  async function handleTabChange(tab: SocialTab) {
    setActiveTab(tab);
    if (tab === "followers" && !followersLoaded) {
      setListsLoading(true);
      try {
        const data: { followers: UserSummary[] } = await apiFetch(`/users/${uid}/followers`);
        setFollowers(data.followers);
        setFollowersLoaded(true);
      } catch {
        // silently fail
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
        // silently fail
      } finally {
        setListsLoading(false);
      }
    }
  }

  const isOwnProfile = user?.uid === uid;

  return (
    <>
      {/* Contact & Report — only shown to other logged-in users */}
      {user && !isOwnProfile && (
        <div className="mt-6 space-y-4">
          {showInquiry ? (
            <InquiryForm
              creatorId={uid}
              creatorName={creatorName}
              onClose={() => setShowInquiry(false)}
              onSent={() => {
                setShowInquiry(false);
                alert("Message sent!");
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowInquiry(true)}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Contact Creator
            </button>
          )}

          {!reportOpen ? (
            <div>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Report this creator
              </button>
            </div>
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
                <option value="">Select a reason&hellip;</option>
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
                  type="button"
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
                  {reportSubmitting ? "Submitting\u2026" : "Submit Report"}
                </button>
                <button
                  type="button"
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

      {/* Followers / Following expandable tabs */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => handleTabChange(activeTab === "followers" ? null : "followers")}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "followers"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          View Followers
        </button>
        <button
          type="button"
          onClick={() => handleTabChange(activeTab === "following" ? null : "following")}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "following"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          View Following
        </button>
      </div>

      {activeTab && (
        <div className="mt-4">
          {listsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="h-4 w-40 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <UserList
              users={activeTab === "followers" ? followers : following}
              emptyMessage={
                activeTab === "followers" ? "No followers yet." : "Not following anyone yet."
              }
            />
          )}
        </div>
      )}
    </>
  );
}

function UserList({
  users,
  emptyMessage,
}: {
  users: UserSummary[];
  emptyMessage: string;
}) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
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
                  Creator &middot; {u.followersCount} followers
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
