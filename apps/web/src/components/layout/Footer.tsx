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
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <ArtisticoLogo size="small" animated className="!pl-0 !ml-0" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A low-fee marketplace where hobby creators sell crafts, digital
              art, and more. Only 5% commission — built for makers, not
              businesses.
            </p>
          </div>

          {/* Explore column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Explore</h3>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/browse" className="hover:text-foreground transition-colors">
                Browse Projects
              </Link>
              <Link href="/browse?type=product" className="hover:text-foreground transition-colors">
                Browse Products
              </Link>
              <Link href="/creators" className="hover:text-foreground transition-colors">
                Discover Creators
              </Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
            </nav>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/become-creator" className="hover:text-foreground transition-colors">
                Start Selling
              </Link>
            </nav>
          </div>

          {/* Legal column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/refund" className="hover:text-foreground transition-colors">
                Refund Policy
              </Link>
              <Link href="/legal/seller" className="hover:text-foreground transition-colors">
                Seller Agreement
              </Link>
              <Link href="/legal/payments" className="hover:text-foreground transition-colors">
                Payment Terms
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} RedPhantomOps LLC &middot; 5% marketplace fee — built for hobby creators, not businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}
