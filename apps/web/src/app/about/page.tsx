import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Artistico — Our Story & Mission",
  description:
    "Artistico is a low-fee marketplace for hobby creators built by RedPhantomOps LLC. Learn about our mission, values, and why we created an alternative to high-fee platforms.",
  openGraph: {
    title: "About Artistico",
    description:
      "Learn about our mission to build a fairer marketplace for hobby creators.",
    url: "https://artistico.love/about",
  },
};

export default function AboutPage() {
  // JSON-LD for Organization
  const jsonLd = {
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
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@redphantomops.com",
      contactType: "customer service",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          About Artistico
        </h1>

        <section className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg">
            Artistico is a creator-first marketplace where hobby artists,
            crafters, and makers sell handmade goods, digital downloads,
            templates, and commissions — without fighting algorithms or paying
            outrageous fees.
          </p>

          <h2 className="text-xl font-bold text-foreground">
            Why We Built Artistico
          </h2>
          <p>
            We built Artistico because we were frustrated. The dominant
            marketplaces have drifted away from the creators who made them
            successful. Fees keep rising. Algorithms reward ad spending over
            quality. Mass-produced products drown out genuine handmade work.
          </p>
          <p>
            We wanted a platform where a crocheter in Florida, a ceramicist
            in Oregon, and a digital artist in Michigan could all showcase
            their work on equal footing — without needing an MBA or a
            marketing budget to get noticed.
          </p>

          <h2 className="text-xl font-bold text-foreground">
            Our Mission
          </h2>
          <p>
            Artistico exists to connect hobby creators with people who
            appreciate handmade, one-of-a-kind work. We charge a flat{" "}
            <strong className="text-foreground">5% marketplace fee</strong>{" "}
            on sales — no listing fees, no monthly subscriptions, no hidden
            costs. We believe creators should keep the majority of what they
            earn.
          </p>
          <p>
            Our mission is simple: make it easy for anyone to share what they
            make and earn from their creativity. Whether you sell hand-poured
            candles, landscape photography, 3D-printed figurines, or digital
            brush packs — Artistico is designed for you.
          </p>

          <h2 className="text-xl font-bold text-foreground">
            Who Artistico Is For
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-white p-5">
              <span className="text-2xl">🎨</span>
              <h3 className="mt-2 font-semibold text-foreground">Artists &amp; Illustrators</h3>
              <p className="mt-1 text-sm">
                Sell prints, digital art, commissions, and original work.
                Build a portfolio that showcases your craft.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <span className="text-2xl">🧶</span>
              <h3 className="mt-2 font-semibold text-foreground">Crafters &amp; Makers</h3>
              <p className="mt-1 text-sm">
                Handmade jewelry, ceramics, crochet, woodworking, and more.
                Show the world what your hands can create.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <span className="text-2xl">📦</span>
              <h3 className="mt-2 font-semibold text-foreground">Digital Creators</h3>
              <p className="mt-1 text-sm">
                Templates, brushes, fonts, and design assets. Create once,
                sell infinitely with zero shipping costs.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <span className="text-2xl">📷</span>
              <h3 className="mt-2 font-semibold text-foreground">Photographers</h3>
              <p className="mt-1 text-sm">
                Sell prints and digital downloads. Share your perspective
                with buyers who value original photography.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground">
            How Artistico Works
          </h2>
          <p>
            Creators sign up for free and can immediately start sharing
            projects and listing products. When a sale happens, Artistico
            takes a 5% commission and payment processing fees are handled
            by Stripe. Creator payouts are deposited directly into their
            bank accounts.
          </p>
          <p>
            Unlike many platforms, we don&apos;t charge listing fees or monthly
            subscriptions. If you don&apos;t sell anything, you don&apos;t pay anything.
            That&apos;s the way it should be.
          </p>

          <h2 className="text-xl font-bold text-foreground">
            The Company Behind Artistico
          </h2>
          <p>
            Artistico is owned and operated by{" "}
            <strong className="text-foreground">RedPhantomOps LLC</strong>, a
            small company registered in the State of Florida, United States.
            We are not backed by venture capital demanding infinite growth at
            any cost. We built Artistico because we needed it ourselves — and
            we believe other creators do too.
          </p>
          <p>
            For legal inquiries:{" "}
            <a
              href="mailto:legal@redphantomops.com"
              className="text-primary font-medium hover:text-primary/80"
            >
              legal@redphantomops.com
            </a>
            <br />
            General support:{" "}
            <a
              href="mailto:support@redphantomops.com"
              className="text-primary font-medium hover:text-primary/80"
            >
              support@redphantomops.com
            </a>
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/browse" className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors">
            Browse Projects
          </Link>
          <Link href="/creators" className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors">
            Discover Creators
          </Link>
          <Link href="/become-creator" className="btn-gradient">
            Start Selling →
          </Link>
        </div>
      </div>
    </>
  );
}
