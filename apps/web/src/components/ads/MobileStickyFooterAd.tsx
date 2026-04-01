"use client";

import { useState, useEffect } from "react";
import { AdUnit } from "./AdUnit";

interface MobileStickyFooterAdProps {
  slot: string;
}

const DISMISS_KEY = "artistico_footer_ad_dismissed";

export function MobileStickyFooterAd({ slot }: MobileStickyFooterAdProps) {
  const [dismissed, setDismissed] = useState(true); // hidden by default until mounted

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden">
      <div className="relative mx-auto flex max-w-md items-center justify-center px-2 py-1">
        <button
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem(DISMISS_KEY, "1");
          }}
          aria-label="Dismiss ad"
          className="absolute -top-3 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-xs text-muted-foreground shadow-sm hover:bg-muted transition-colors"
        >
          ✕
        </button>
        <AdUnit slot={slot} format="horizontal" responsive />
      </div>
    </div>
  );
}
