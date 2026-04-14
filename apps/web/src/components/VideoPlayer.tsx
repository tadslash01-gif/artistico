"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoPlayer({ src, poster, className = "" }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Lazy-load: attach src only when the element scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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

  if (hasError) {
    return (
      <div
        className={`flex aspect-video items-center justify-center rounded-xl border border-border bg-muted ${className}`}
      >
        <div className="text-center">
          <span className="text-3xl">⚠️</span>
          <p className="mt-2 text-sm text-muted-foreground">
            Video could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`overflow-hidden rounded-xl bg-black ${className}`}>
      {isVisible ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          preload="metadata"
          playsInline
          className="w-full"
          onError={() => setHasError(true)}
        />
      ) : (
        // Placeholder shown before intersection fires (preserves layout)
        <div className="aspect-video w-full bg-muted" />
      )}
    </div>
  );
}
