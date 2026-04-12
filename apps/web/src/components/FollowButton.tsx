"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface FollowButtonProps {
  creatorId: string;
  initialFollowing?: boolean;
}

export default function FollowButton({
  creatorId,
  initialFollowing = false,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);

  // Fetch real follow status on mount
  useEffect(() => {
    if (!user || user.uid === creatorId) return;
    let cancelled = false;
    setLoading(true);
    apiFetch(`/follows/status/${creatorId}`)
      .then((data) => {
        const d = data as { isFollowing: boolean };
        if (!cancelled) setFollowing(d.isFollowing);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setStatusChecked(true);
        }
      });
    return () => { cancelled = true; };
  }, [user, creatorId]);

  const handleToggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (following) {
        await apiFetch(`/follows/${creatorId}`, { method: "DELETE" });
        setFollowing(false);
      } else {
        await apiFetch("/follows", {
          method: "POST",
          body: JSON.stringify({ followingId: creatorId }),
        });
        setFollowing(true);
      }
    } catch {
      // Revert optimistic update on error — state unchanged
    } finally {
      setLoading(false);
    }
  };

  // Don't show follow button for your own profile or if not logged in
  if (!user || user.uid === creatorId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !statusChecked}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        following
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-white border border-border text-foreground hover:border-primary/50 hover:text-primary"
      } disabled:opacity-50`}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : following ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
}
