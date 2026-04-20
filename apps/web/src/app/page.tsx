import Link from "next/link";
import { ArtisticoLogo } from "@/components/ui/ArtisticoLogo";
import { getAllArticles } from "@/lib/blog-data";

import TrendingProjects from "@/components/TrendingProjects";
import NewCreators from "@/components/NewCreators";
import FeaturedCreators from "@/components/FeaturedCreators";
import RecentlyAdded from "@/components/RecentlyAdded";
import RecentlyAddedProducts from "@/components/RecentlyAddedProducts";
import MomentumBar from "@/components/MomentumBar";
import AliveFeed from "@/components/AliveFeed";
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
  const articles = getAllArticles();

  // Organization JSON-LD
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Artistico",
    legalName: "RedPhantomOps LLC",
    url: "https://artistico.love",
    description:
      "A low-fee marketplace where hobby creators sell crafts, DIY projects, digital assets, and more.",
    foundingDate: "2026",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Florida",
        addressCountry: "US",
      },
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@redphantomops.com",
      contactType: "customer service",
    },
  };

  // WebSite JSON-LD (for sitelinks search box)
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Artistico",
    url: "https://artistico.love",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://artistico.love/browse?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="flex flex-col">
        {/* Hero */}
        <section className="relative px-4 py-24 text-center sm:py-36 overflow-hidden">
          {/* Warm glow blobs */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[100px]" />
            <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-accent/30 blur-[80px]" />
          </div>
          <div className="relative mx-auto flex flex-col items-center">
            <ArtisticoLogo size="large" animated showTagline={false} className="mb-2" />
            <h1 className="mt-8 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your art deserves an audience.
              <br />
              <span className="text-primary">Not an algorithm.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Artistico is a low-fee marketplace built for hobby creators who get
              ignored elsewhere. Share your handmade crafts, digital art, photography,
              and more — and keep 95% of every sale.
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

        {/* What is Artistico — SEO content section */}
        <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-white/80 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              What is Artistico?
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Artistico is an online marketplace built exclusively for hobby
                creators — independent artists, crafters, and makers who create because
                they love it, not because they run a factory. We designed Artistico as
                an alternative to high-fee platforms that prioritize ad spending and
                corporate sellers over genuine handmade work.
              </p>
              <p>
                On Artistico, creators share <strong className="text-foreground">projects</strong>{" "}
                — detailed portfolio showcases that include photos, descriptions,
                materials used, and the story behind each creation. Creators can also
                list <strong className="text-foreground">products</strong> for sale:
                physical items, digital downloads, templates, and custom commissions.
                Buyers browse by category — from{" "}
                <Link href="/browse?category=digital-art" className="text-primary font-medium hover:text-primary/80">
                  digital art
                </Link>{" "}
                and{" "}
                <Link href="/browse?category=ceramics" className="text-primary font-medium hover:text-primary/80">
                  ceramics
                </Link>{" "}
                to{" "}
                <Link href="/browse?category=woodworking" className="text-primary font-medium hover:text-primary/80">
                  woodworking
                </Link>{" "}
                and{" "}
                <Link href="/browse?category=jewelry" className="text-primary font-medium hover:text-primary/80">
                  jewelry
                </Link>
                {" "}— and can follow their favorite{" "}
                <Link href="/creators" className="text-primary font-medium hover:text-primary/80">
                  creators
                </Link>
                , leave reviews, and commission custom work directly through the platform.
              </p>
              <p>
                We charge a flat <strong className="text-foreground">5% marketplace fee</strong>{" "}
                on sales — roughly half of what major competitors charge. There are no
                listing fees, no monthly subscriptions, and no hidden costs. If you
                don&apos;t sell anything, you don&apos;t pay anything. Payment processing is
                handled securely by Stripe with direct deposit payouts to creators.
              </p>
              <p>
                Artistico is owned and operated by{" "}
                <strong className="text-foreground">RedPhantomOps LLC</strong>, a small
                company registered in Florida, USA. We&apos;re not backed by venture
                capital demanding infinite growth — we built Artistico because we
                needed it ourselves and believe other creators do too.{" "}
                <Link href="/about" className="text-primary font-medium hover:text-primary/80">
                  Learn more about us →
                </Link>
              </p>
            </div>
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
            <AliveFeed />
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

        {/* Learn & Grow — Blog Articles */}
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Learn &amp; Grow
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Guides and tips for artists, buyers, and creative entrepreneurs
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-2xl border border-border bg-white/80 p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {article.category}
                </span>
                <h3 className="mt-2 font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {article.description}
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-primary">
                  Read article →
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/blog"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all articles →
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
                  desc: "Share what you made — photos, materials, your process. Tell the story behind your creation and inspire other makers.",
                },
                {
                  step: "2",
                  title: "List Products",
                  desc: "Add physical items, digital downloads, templates, or commissions. Set your own prices and manage your own inventory.",
                },
                {
                  step: "3",
                  title: "Get Paid",
                  desc: "Buyers pay through Stripe. You keep 95% of every sale. Payouts go directly to your bank account — no long waits.",
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
            <div className="mt-10 text-center">
              <Link href="/become-creator" className="btn-gradient">
                Get Started Free →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
