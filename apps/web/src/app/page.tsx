import Link from "next/link";
import { InlineBannerAd } from "@/components/ads/InlineBannerAd";
import { ArtisticoLogo } from "@/components/branding/ArtisticoLogo";

const CATEGORIES = [
  { name: "Woodworking", slug: "woodworking", emoji: "🪵" },
  { name: "Digital Art", slug: "digital-art", emoji: "🎨" },
  { name: "Crafts", slug: "crafts", emoji: "✂️" },
  { name: "Jewelry", slug: "jewelry", emoji: "💍" },
  { name: "Ceramics", slug: "ceramics", emoji: "🏺" },
  { name: "Textiles", slug: "textiles", emoji: "🧶" },
  { name: "Paper Crafts", slug: "paper-crafts", emoji: "📄" },
  { name: "3D Printing", slug: "3d-printing", emoji: "🖨️" },
  { name: "Electronics", slug: "electronics", emoji: "⚡" },
  { name: "Painting", slug: "painting", emoji: "🖌️" },
  { name: "Photography", slug: "photography", emoji: "📷" },
  { name: "Fiber Arts", slug: "fiber-arts", emoji: "🧵" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-4 py-24 text-center sm:py-36">
        <div className="mx-auto flex flex-col items-center">
          <ArtisticoLogo size="lg" />
          <h1 className="mt-8 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Sell what you make.
            <br />
            <span className="text-primary">Fund your hobby.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
            A low-fee marketplace for hobby creators. Share your projects,
            sell your creations, and earn back money to keep making things you love.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Start Selling — It&apos;s Free
            </Link>
            <Link
              href="/browse"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Browse Projects
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Only 5% marketplace fee. No monthly costs.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Explore by Category
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-6 transition-all hover:bg-muted/40 hover:scale-[1.03]"
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

      {/* Ad */}
      <InlineBannerAd slot="INLINE_HOME" className="my-4" />

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
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
