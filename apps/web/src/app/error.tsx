"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl">⚠️</span>
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        Something Went Wrong
      </h1>
      <p className="mt-3 text-muted-foreground">
        An unexpected error occurred. Please try again, or return to the home
        page.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <a
          href="/"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
