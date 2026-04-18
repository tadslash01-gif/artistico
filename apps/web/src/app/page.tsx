import Link from "next/link";
import { ArtisticoLogo } from "@/components/ui/ArtisticoLogo";
import TrendingProjects from "@/components/TrendingProjects";
import NewCreators from "@/components/NewCreators";
import FeaturedCreators from "@/components/FeaturedCreators";
import RecentlyAdded from "@/components/RecentlyAdded";
import RecentlyAddedProducts from "@/components/RecentlyAddedProducts";
import MomentumBar from "@/components/MomentumBar";
import AliveFeeed from "@/components/AliveFeeed";
import LiveNowRow from "@/components/LiveNowRow";

// Sorted A–Z
const CATEGORIES = [
  { name: "3D Printing", slug: "3d-printing", emoji: "🖨️" },
  { name: "Ceramics", slug: "ceramics", emoji: "🏺" },
  { name: "Crafts", slug: "crafts", emoji: "✂️" },
  { name: "Digital Art", slug: "digital-art", emoji: "🎨" },
  { name: "Electronics", slug: "electronics", emoji: "⚡" },
  { name: "Fiber Arts", slug: "fiber-arts", emoji: "🧵" },
  { name: "Jewelry", slug: "jewelry", emoji: "💍" },
  { name: "Other", slug: "other", emoji: "🎁" },
  { name: "Painting", slug: "painting", emoji: "🖌️" },
  { name: "Paper Crafts", slug: "paper-crafts", emoji: "📄" },
  { name: "Photography", slug: "photography", emoji: "📷" },
  { name: "Textiles", slug: "textiles", emoji: "🧶" },
  { name: "Woodworking", slug: "woodworking", emoji: "🪵" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative px-4 py-24 text-center sm:py-36 overflow-hidden">
        {/* Warm glow blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[100px]" />
          <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-accent/30 blur-[80px]" />
        </div>
        <div className="relative mx-auto flex flex-col items-center">
          <ArtisticoLogo size="large" animated className="mb-2" />
          <h1 className="mt-8 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your art deserves an audience.
            <br />
            <span className="text-primary">Not an algorithm.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Built for creators who get ignored elsewhere.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard/projects/new?mode=quick"
              className="btn-gradient"
            >
              Upload your first project in 60 seconds →
            </Link>
            <Link
              href="/browse"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Browse Projects
            </Link>
            <Link
              href="/browse?type=product"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Browse Products
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Only 5% marketplace fee &middot; No monthly costs &middot; Free to join
          </p>
        </div>
      </section>

      {/* Momentum Bar */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <MomentumBar />
      </div>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Explore by Category
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white/80 p-6 shadow-sm transition-all hover:shadow-md hover:bg-white hover:scale-[1.03]"
            >
              <span className="text-4xl transition-transform group-hover:scale-110">
                {cat.emoji}
              </span>
              <span className="text-sm font-medium text-foreground">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Now — only rendered when creators are streaming */}
      <LiveNowRow />

      {/* Trending Projects */}
      <section id="trending" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl" aria-hidden="true">🔥</span>
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Trending Projects
          </h2>
        </div>
        <p className="mt-2 text-center text-muted-foreground">
          See what creators are making right now
        </p>
        <div className="mt-10">
          <TrendingProjects />
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/browse?sort=trending"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See all trending →
          </Link>
        </div>
      </section>

      {/* Live Activity */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-white/80 px-6 py-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Live Activity</h2>
          </div>
          <AliveFeeed />
        </div>
      </section>

      {/* New Creators */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          New Creators
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Discover fresh talent joining the community
        </p>
        <div className="mt-10">
          <NewCreators />
        </div>
      </section>

      {/* Featured Creators */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl" aria-hidden="true">⭐</span>
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Featured Creators
          </h2>
        </div>
        <p className="mt-2 text-center text-muted-foreground">
          Top creators making waves in the community
        </p>
        <div className="mt-10">
          <FeaturedCreators />
        </div>
      </section>

      {/* Recently Added Projects */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Recently Added
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          The latest projects from our creators
        </p>
        <div className="mt-10">
          <RecentlyAdded />
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/browse"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse all projects →
          </Link>
        </div>
      </section>

      {/* Recently Added Products */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Recently Added Products
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Fresh listings from creators ready to purchase
        </p>
        <div className="mt-10">
          <RecentlyAddedProducts />
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/browse?type=product"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse all products →
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-14 flex flex-col gap-12 md:flex-row md:gap-8">
            {[
              {
                step: "1",
                title: "Create a Project",
                desc: "Share what you made — photos, materials, your process.",
              },
              {
                step: "2",
                title: "List Products",
                desc: "Add physical items, digital downloads, templates, or commissions.",
              },
              {
                step: "3",
                title: "Get Paid",
                desc: "Buyers pay through Stripe. You keep 95% of every sale.",
              },
            ].map((item) => (
              <div key={item.step} className="flex-1 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
