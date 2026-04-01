"use client";

import { useEffect, useRef, useState } from "react";
import { AD_MIN_HEIGHTS } from "@/lib/adSlots";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  responsive?: boolean;
  className?: string;
}

const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
const testMode = process.env.NEXT_PUBLIC_AD_TEST_MODE === "true";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy-load: only push ad when the container enters the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pubId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Push the ad once visible
  useEffect(() => {
    if (!isVisible || !pubId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blocked or failed to load — fail silently
    }
  }, [isVisible]);

  if (!pubId) return null;

  const minHeight = AD_MIN_HEIGHTS[format] ?? AD_MIN_HEIGHTS.auto;

  return (
    // eslint-disable-next-line react/forbid-dom-props -- Fixed min-height prevents CLS
    <div ref={containerRef} className={className} style={{ minHeight }}>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground/50">
        Ad
      </p>
      {isVisible && (
        /* eslint-disable-next-line react/forbid-dom-props -- AdSense requires inline display:block */
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={pubId}
          data-ad-slot={slot}
          data-ad-format={format}
          {...(responsive && { "data-full-width-responsive": "true" })}
          {...(testMode && { "data-adtest": "on" })}
        />
      )}
    </div>
  );
}
