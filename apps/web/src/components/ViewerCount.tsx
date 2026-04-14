"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface ViewerPresence {
  userId: string;
  lastActiveAt: Timestamp;
}

const HEARTBEAT_INTERVAL_MS = 10_000; // ping every 10 seconds
const ACTIVE_THRESHOLD_MS = 30_000;   // active if pinged in last 30 seconds

interface ViewerCountProps {
  streamId: string;
}

export default function ViewerCount({ streamId }: ViewerCountProps) {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time viewer count from Firestore subcollection
  useEffect(() => {
    if (!firestore) return;

    const viewersRef = collection(firestore, "streams", streamId, "viewers");
    const unsubscribe = onSnapshot(viewersRef, (snap) => {
      const now = Date.now();
      const active = snap.docs.filter((doc) => {
        const data = doc.data() as ViewerPresence;
        if (!data.lastActiveAt) return false;
        const lastActive = data.lastActiveAt.toDate
          ? data.lastActiveAt.toDate().getTime()
          : (data.lastActiveAt as any).seconds * 1000;
        return now - lastActive < ACTIVE_THRESHOLD_MS;
      });
      setCount(active.length);
    });

    return () => unsubscribe();
  }, [streamId]);

  // Heartbeat: authenticated users signal presence every 10 seconds
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = () => {
      apiFetch(`/streams/${streamId}/heartbeat`, { method: "POST", authenticated: true }).catch(
        () => {}
      );
    };

    sendHeartbeat(); // immediate on mount
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user, streamId]);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path
          fillRule="evenodd"
          d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          clipRule="evenodd"
        />
      </svg>
      {count.toLocaleString()} watching
    </span>
  );
}
