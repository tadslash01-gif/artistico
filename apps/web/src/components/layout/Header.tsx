"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ArtisticoLogo } from "@/components/branding/ArtisticoLogo";
import { apiFetch } from "@/lib/api";

interface InAppNotification {
  notificationId: string;
  recipientId: string;
  type: "follow" | "bookmark";
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  read: boolean;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time listener for this user's notifications
  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, "notifications"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => d.data() as InAppNotification));
    });
    return unsub;
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
    } catch {
      // ignore — snapshot updates will reflect changes
    }
  }

  function notificationText(n: InAppNotification) {
    if (n.type === "follow") return `${n.actorName} started following you`;
    if (n.type === "bookmark") return `${n.actorName} bookmarked your project`;
    return "New notification";
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </li>
            )}
            {notifications.map((n) => (
              <li
                key={n.notificationId}
                className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}
              >
                {n.actorAvatar ? (
                  <Image
                    src={n.actorAvatar}
                    alt={n.actorName}
                    width={32}
                    height={32}
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(n.actorName || "?")[0].toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-foreground leading-snug">{notificationText(n)}</p>
                  {n.createdAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(n.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!n.read && (
                  <span className="mt-1.5 ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, userData, signOut, loading } = useAuth();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Tagline */}
        <Link href="/" className="flex items-center gap-2.5">
          <ArtisticoLogo size="sm" />
          <span
            className="hidden md:block text-[18px] font-bold leading-none text-foreground"
          >
            For the Love of Creating
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/browse"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/creators"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Creators
          </Link>
          {userData?.isCreator && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {!userData?.isCreator && (
                <Link
                  href="/become-creator"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Start Selling
                </Link>
              )}
              <NotificationBell userId={user.uid} />
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {userData?.displayName || "Account"}
              </Link>
              <button
                onClick={signOut}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

