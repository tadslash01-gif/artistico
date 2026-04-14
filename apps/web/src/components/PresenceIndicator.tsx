"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { timeAgo } from "@/lib/utils";

interface PresenceData {
  status: "online" | "offline";
  lastActiveAt: { seconds: number; nanoseconds: number } | null;
}

const ACTIVE_THRESHOLD_SECONDS = 120; // 2 minutes

interface PresenceIndicatorProps {
  userId: string;
  /** When true, shows only the dot with a tooltip. Defaults to false (dot + text). */
  dotOnly?: boolean;
}

export default function PresenceIndicator({
  userId,
  dotOnly = false,
}: PresenceIndicatorProps) {
  const [presence, setPresence] = useState<PresenceData | null>(null);

  useEffect(() => {
    if (!firestore || !userId) return;
    const presenceRef = doc(firestore, "presence", userId);
    const unsub = onSnapshot(
      presenceRef,
      (snap) => {
        if (snap.exists()) {
          setPresence(snap.data() as PresenceData);
        } else {
          setPresence(null);
        }
      },
      () => setPresence(null)
    );
    return unsub;
  }, [userId]);

  if (!presence || !presence.lastActiveAt) return null;

  const lastActiveSecs = presence.lastActiveAt.seconds;
  const nowSecs = Math.floor(Date.now() / 1000);
  const isActive =
    presence.status === "online" &&
    nowSecs - lastActiveSecs < ACTIVE_THRESHOLD_SECONDS;

  const label = isActive
    ? "Active now"
    : `Active ${timeAgo(new Date(lastActiveSecs * 1000))}`;

  if (dotOnly) {
    return (
      <span
        title={label}
        aria-label={label}
        className={`inline-block h-2.5 w-2.5 rounded-full border-2 border-white ${
          isActive ? "bg-green-500" : "bg-muted-foreground/40"
        }`}
      />
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          isActive ? "bg-green-500" : "bg-muted-foreground/40"
        }`}
      />
      {label}
    </span>
  );
}
