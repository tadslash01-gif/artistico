"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Link from "next/link";
import Image from "next/image";

interface LiveStream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  title: string;
  viewerCount: number;
}

export default function LiveNowRow() {
  const [streams, setStreams] = useState<LiveStream[]>([]);

  useEffect(() => {
    if (!firestore) return;

    const q = query(
      collection(firestore, "streams"),
      where("status", "==", "live"),
      orderBy("startedAt", "desc"),
      limit(8)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setStreams(
        snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            creatorId: d.creatorId,
            creatorName: d.creatorName,
            creatorAvatar: d.creatorAvatar ?? null,
            title: d.title,
            viewerCount: d.viewerCount ?? 0,
          };
        })
      );
    });

    return () => unsubscribe();
  }, []);

  if (streams.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <h2 className="text-2xl font-bold text-foreground">Live Now</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {streams.map((stream) => (
          <Link
            key={stream.id}
            href={`/stream/${stream.id}`}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-white/80 p-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              {stream.creatorAvatar ? (
                <Image
                  src={stream.creatorAvatar}
                  alt={stream.creatorName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {stream.creatorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {stream.creatorName}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  LIVE
                </span>
              </div>
            </div>
            <p className="truncate text-sm text-muted-foreground">{stream.title}</p>
            <p className="text-xs text-muted-foreground">
              {stream.viewerCount.toLocaleString()} watching
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
