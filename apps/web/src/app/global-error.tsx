"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <span className="text-6xl">⚠️</span>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Something Went Wrong
        </h1>
        <p className="mt-3 text-gray-600">
          A critical error occurred. Please try reloading the page.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
