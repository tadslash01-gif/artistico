"use client";

import { use, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import StreamPlayer from "@/components/StreamPlayer";
import LiveChat from "@/components/LiveChat";
import ViewerCount from "@/components/ViewerCount";

interface StreamData {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  title: string;
  status: "live" | "ended" | "scheduled";
  playbackId: string;
  viewerCount: number;
  startedAt: { seconds: number } | null;
  endedAt: { seconds: number } | null;
  thumbnailUrl: string | null;
}

export default function StreamPage({
  params,
}: {
  params: Promise<{ streamId: string }>;
}) {
  const { streamId } = use(params);
  const [stream, setStream] = useState<StreamData | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Real-time stream doc subscription
  useEffect(() => {
    if (!firestore) return;

    const streamRef = doc(firestore, "streams", streamId);
    const unsubscribe = onSnapshot(
      streamRef,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setStream(snap.data() as StreamData);
      },
      () => setNotFound(true)
    );

    return () => unsubscribe();
  }, [streamId]);

  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-2xl font-bold text-foreground">Stream not found</p>
        <p className="text-sm text-muted-foreground">
          This stream may have been removed or never existed.
        </p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isLive = stream.status === "live";
  const hasEnded = stream.status === "ended";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Stream header */}
      <div className="mb-4 flex flex-wrap items-start gap-4 justify-between">
        <div className="flex items-start gap-3">
          {stream.creatorAvatar ? (
            <Image
              src={stream.creatorAvatar}
              alt={stream.creatorName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {stream.creatorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">{stream.title}</h1>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  LIVE
                </span>
              )}
              {hasEnded && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  ENDED
                </span>
              )}
            </div>
            <Link
              href={`/creators/${stream.creatorId}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {stream.creatorName}
            </Link>
          </div>
        </div>

        {isLive && <ViewerCount streamId={streamId} />}
      </div>

      {/* Main layout: player + chat */}
      {isLive ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <StreamPlayer playbackId={stream.playbackId} className="w-full" />
          <div className="h-[500px] lg:h-auto">
            <LiveChat streamId={streamId} />
          </div>
        </div>
      ) : hasEnded ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white/80 text-center">
          <p className="text-xl font-bold text-foreground">The stream has ended</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Thanks for watching. Check out {stream.creatorName}&apos;s projects for more content.
          </p>
          <Link
            href={`/creators/${stream.creatorId}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Visit creator profile
          </Link>
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white/80 text-center">
          <p className="text-xl font-bold text-foreground">Stream not started yet</p>
          <p className="text-sm text-muted-foreground">
            Check back soon — {stream.creatorName} hasn&apos;t gone live yet.
          </p>
        </div>
      )}
    </div>
  );
}
