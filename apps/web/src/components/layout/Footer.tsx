import Link from "next/link";
import { ArtisticoLogo } from "@/components/ui/ArtisticoLogo";

async function getPlatformStats(): Promise<{ totalCreators: number; totalProjects: number } | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(`${apiBase}/stats/platform`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function Footer() {
  const stats = await getPlatformStats();

  return (
    <footer className="border-t border-border bg-white">
      {stats && (
        <div className="border-b border-border/50 bg-muted/30">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.totalCreators.toLocaleString()}</span> creators
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.totalProjects.toLocaleString()}</span> projects shared
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">Only 5% fee</span>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <ArtisticoLogo size="small" animated className="!pl-0 !ml-0" />
            <span className="text-sm text-muted-foreground">
              — Marketplace for Hobby Creators
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/browse" className="hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/legal/refund" className="hover:text-foreground transition-colors">
              Refunds
            </Link>
            <Link href="/legal/seller" className="hover:text-foreground transition-colors">
              Seller Terms
            </Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} RedPhantomOps LLC &middot; 5% marketplace fee — built for hobby creators, not businesses.
        </p>
      </div>
    </footer>
  );
}
