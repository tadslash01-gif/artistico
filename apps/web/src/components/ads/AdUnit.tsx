"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  responsive?: boolean;
  className?: string;
}

const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!pubId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blocked or failed to load — fail silently
    }
  }, []);

  if (!pubId) return null;

  return (
    <div className={className}>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground/50">
        Ad
      </p>
      {/* eslint-disable-next-line react/forbid-dom-props -- AdSense requires inline display:block */}
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive && { "data-full-width-responsive": "true" })}
      />
    </div>
  );
}
