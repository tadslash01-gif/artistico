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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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
            Video could not be loaded.<br />
            <span className="break-all text-xs">
              {errorDetails ? errorDetails : "Unknown error."}
            </span>
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
          onError={e => {
            setHasError(true);
            // Try to extract error details
            const target = e.target as HTMLVideoElement;
            let msg = "";
            if (target && target.error) {
              switch (target.error.code) {
                case target.error.MEDIA_ERR_ABORTED:
                  msg = "Video playback aborted.";
                  break;
                case target.error.MEDIA_ERR_NETWORK:
                  msg = "Network error: Could not load video.";
                  break;
                case target.error.MEDIA_ERR_DECODE:
                  msg = "Decoding error: Video file is corrupt or unsupported.";
                  break;
                case target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  msg = `Source not supported: ${src}`;
                  break;
                default:
                  msg = `Unknown error code: ${target.error.code}`;
              }
            } else {
              msg = "Unknown video error.";
            }
            setErrorDetails(msg);
          }}
        />
      ) : (
        // Placeholder shown before intersection fires (preserves layout)
        <div className="aspect-video w-full bg-muted" />
      )}
    </div>
  );
}
