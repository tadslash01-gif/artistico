"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

const HEARTBEAT_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Manages the authenticated user's presence in Firestore.
 * - Sets status = "online" on mount and when tab becomes visible.
 * - Sends a heartbeat (lastActiveAt) every 60 seconds.
 * - Sets status = "offline" on tab hide, unmount, and beforeunload.
 *
 * Call this hook once in a top-level authenticated shell (e.g. Header).
 */
export function usePresence(userId: string | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId || !firestore) return;

    const presenceRef = doc(firestore, "presence", userId);

    function setOnline() {
      setDoc(presenceRef, {
        userId,
        status: "online",
        lastActiveAt: serverTimestamp(),
      }).catch(() => {});
    }

    function setOffline() {
      // updateDoc so we don't accidentally recreate a stale doc
      updateDoc(presenceRef, {
        status: "offline",
        lastActiveAt: serverTimestamp(),
      }).catch(() => {});
    }

    function startHeartbeat() {
      stopHeartbeat();
      intervalRef.current = setInterval(() => {
        updateDoc(presenceRef, {
          lastActiveAt: serverTimestamp(),
        }).catch(() => {});
      }, HEARTBEAT_INTERVAL_MS);
    }

    function stopHeartbeat() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopHeartbeat();
        setOffline();
      } else {
        setOnline();
        startHeartbeat();
      }
    }

    function handleBeforeUnload() {
      // Best-effort synchronous write; may not always complete
      setOffline();
    }

    // Initialise
    setOnline();
    startHeartbeat();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      stopHeartbeat();
      setOffline();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId]);
}
