"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface SaveButtonProps {
  projectId: string;
  initialSaved?: boolean;
  initialCount?: number;
}

export default function SaveButton({
  projectId,
  initialSaved = false,
  initialCount = 0,
}: SaveButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (saved) {
        await apiFetch(`/saves/${projectId}`, { method: "DELETE" });
        setSaved(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        await apiFetch("/saves", {
          method: "POST",
          body: JSON.stringify({ projectId }),
        });
        setSaved(true);
        setCount((c) => c + 1);
      }
    } catch {
      // Revert optimistic update on error
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        saved
          ? "bg-primary/10 text-primary"
          : "bg-white border border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
      } disabled:opacity-50`}
    >
      <svg
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
