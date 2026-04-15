"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface LikeButtonProps {
  projectId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export default function LikeButton({
  projectId,
  initialLiked = false,
  initialCount = 0,
}: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, nextLiked ? c + 1 : c - 1));
    setLoading(true);
    try {
      if (nextLiked) {
        await apiFetch("/likes", {
          method: "POST",
          body: JSON.stringify({ projectId }),
        });
      } else {
        await apiFetch(`/likes/${projectId}`, { method: "DELETE" });
      }
    } catch {
      // Revert optimistic update on error
      setLiked(!nextLiked);
      setCount((c) => Math.max(0, nextLiked ? c - 1 : c + 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={liked ? "Unlike this project" : "Like this project"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        liked
          ? "bg-red-50 text-red-500 border border-red-200"
          : "bg-white border border-border text-muted-foreground hover:border-red-300 hover:text-red-400"
      } disabled:opacity-50`}
    >
      <svg
        className="h-4 w-4"
        fill={liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
