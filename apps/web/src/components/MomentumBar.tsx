"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PlatformStats {
  totalCreators: number;
  totalProjects: number;
  newCreatorsThisWeek: number;
  projectsToday: number;
}

export default function MomentumBar() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(`${apiBase}/stats/platform`)
      .then((r) => r.json())
      .then((data: PlatformStats) => setStats(data))
      .catch(() => {
        // Fallback values if fetch fails
        setStats({ totalCreators: 0, totalProjects: 0, newCreatorsThisWeek: 3, projectsToday: 1 });
      });
  }, []);

  // Show skeleton while loading
  if (!stats) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-44 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
        🔥 {stats.newCreatorsThisWeek} new creators this week
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
        🎨 {stats.projectsToday} project{stats.projectsToday !== 1 ? "s" : ""} uploaded today
      </span>
      <Link
        href="#trending"
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        ⚡ Trending right now →
      </Link>
    </div>
  );
}
