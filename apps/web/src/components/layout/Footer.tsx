import Link from "next/link";
import { ArtisticoLogo } from "@/components/branding/ArtisticoLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <ArtisticoLogo size="sm" />
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
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} RedPhantomOps LLC &middot; 5% marketplace fee — built for hobby creators, not businesses.
        </p>
      </div>
    </footer>
  );
}
