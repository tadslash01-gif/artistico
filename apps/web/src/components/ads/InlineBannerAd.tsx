"use client";

import { AdUnit } from "./AdUnit";

interface InlineBannerAdProps {
  slot: string;
  className?: string;
}

export function InlineBannerAd({ slot, className }: InlineBannerAdProps) {
  return (
    <div
      className={`mx-auto max-w-4xl border-y border-border/40 py-4 ${className ?? ""}`}
    >
      <AdUnit slot={slot} format="horizontal" responsive />
    </div>
  );
}
