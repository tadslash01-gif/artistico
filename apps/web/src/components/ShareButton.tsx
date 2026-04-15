"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface ShareButtonProps {
  projectTitle: string;
  projectSlug: string;
  projectId: string;
}

export default function ShareButton({ projectTitle, projectSlug, projectId }: ShareButtonProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const buildUrl = (ref?: string) => {
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}/projects/${encodeURIComponent(projectSlug)}`
        : `/projects/${encodeURIComponent(projectSlug)}`;
    return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
  };

  /** Fire-and-forget share tracking — never blocks the UI */
  const trackShare = useCallback(
    (platform: "native" | "copy_link" | "twitter") => {
      if (!user) return;
      // Include the current user's id as the referral source
      const ref = user.uid;
      apiFetch("/share", {
        method: "POST",
        body: JSON.stringify({ projectId, platform, ref }),
      }).catch(() => {});
    },
    [user, projectId]
  );

  const handleShare = useCallback(async () => {
    const ref = user?.uid;
    const projectUrl = buildUrl(ref);

    // Try native Web Share API first (mobile + supported browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: `Check out "${projectTitle}" on Artistico`,
          url: projectUrl,
        });
        trackShare("native");
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackShare("copy_link");
    } catch {
      // Last resort: prompt-based copy
      window.prompt("Copy this link:", projectUrl);
    }
  }, [projectTitle, projectId, user, trackShare]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      aria-label="Share this project"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

