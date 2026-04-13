"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface ActivityEvent {
  eventId: string;
  type: "project_published" | "product_listed";
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  entityId: string;
  entityTitle: string;
  entitySlug: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

function timeAgoShort(ts: { seconds: number } | null): string {
  if (!ts) return "just now";
  const diffMs = Date.now() - ts.seconds * 1000;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function eventText(e: ActivityEvent): string {
  if (e.type === "project_published") return `just uploaded a project`;
  if (e.type === "product_listed") return `listed a new product`;
  return "was active";
}

export default function AliveFeeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, "activityEvents"),
      orderBy("createdAt", "desc"),
      limit(8)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => d.data() as ActivityEvent));
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li key={e.eventId} className="flex items-center gap-3 text-sm">
          {e.actorAvatar ? (
            <Image
              src={e.actorAvatar}
              alt={e.actorName}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(e.actorName || "?")[0].toUpperCase()}
            </span>
          )}
          <span className="text-foreground">
            <span className="font-medium">{e.actorName}</span>{" "}
            <span className="text-muted-foreground">{eventText(e)}</span>
            {e.entitySlug && (
              <>
                {": "}
                <Link
                  href={`/projects/${e.entitySlug}`}
                  className="font-medium text-primary hover:underline"
                >
                  {e.entityTitle}
                </Link>
              </>
            )}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {timeAgoShort(e.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
