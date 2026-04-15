"use client";

import dynamic from "next/dynamic";

// Lazy-load the Mux player — it pulls in hls.js (~300 KB), so we want it
// out of the main bundle and skipped entirely during SSR.
const MuxPlayer = dynamic(
  () => import("@mux/mux-player-react").then((m) => m.default),
  { ssr: false }
);

interface StreamPlayerProps {
  playbackId: string;
  className?: string;
}

export default function StreamPlayer({ playbackId, className }: StreamPlayerProps) {
  return (
    <div className={className}>
      <MuxPlayer
        playbackId={playbackId}
        streamType="live"
        autoPlay
        muted={false}
        envKey={process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY}
        style={{ width: "100%", aspectRatio: "16/9" }}
      />
    </div>
  );
}
