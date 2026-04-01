"use client";

import { AdUnit } from "./AdUnit";

interface InFeedAdProps {
  slot: string;
  className?: string;
}

export function InFeedAd({ slot, className }: InFeedAdProps) {
  return (
    <div
      className={`col-span-full border-y border-border/40 py-4 ${className ?? ""}`}
    >
      <div className="mx-auto max-w-3xl">
        <AdUnit slot={slot} format="horizontal" responsive />
      </div>
    </div>
  );
}
