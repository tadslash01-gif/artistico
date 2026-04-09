"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ArtisticoLogo } from "@/components/branding/ArtisticoLogo";

export function Header() {
  const { user, userData, signOut, loading } = useAuth();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Tagline */}
        <Link href="/" className="flex items-center gap-2.5">
          <ArtisticoLogo size="sm" />
          <span
            className="hidden md:block text-[13px] leading-none text-muted-foreground"
            style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontWeight: 400 }}
          >
            ...For the Love of Creating!
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
