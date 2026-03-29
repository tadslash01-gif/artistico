import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl">🎨</span>
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        Page Not Found
      </h1>
      <p className="mt-3 text-muted-foreground">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
        have been moved or no longer exists.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/browse"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Browse Projects
        </Link>
      </div>
    </div>
  );
}
