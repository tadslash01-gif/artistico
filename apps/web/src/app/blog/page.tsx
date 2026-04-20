import Link from "next/link";
import type { Metadata } from "next";
import { getAllArticles } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog — Articles for Artists, Buyers & Creators",
  description:
    "Guides, tips, and honest advice for hobby creators, artists, and buyers. Learn how to sell art, commission work, and grow your creative business.",
  openGraph: {
    title: "Blog — Artistico",
    description:
      "Guides, tips, and honest advice for hobby creators, artists, and buyers.",
    url: "https://artistico.love/blog",
  },
};

export default function BlogIndexPage() {
  const articles = getAllArticles();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Learn &amp; Grow
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Guides, tips, and honest advice for artists, buyers, and creative
          entrepreneurs.
        </p>
      </div>

      <div className="space-y-8">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="group rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-accent/50 px-3 py-0.5 font-medium text-foreground">
                {article.category}
              </span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>{article.readTime}</span>
            </div>

            <Link href={`/blog/${article.slug}`} className="block mt-3">
              <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors sm:text-2xl">
                {article.title}
              </h2>
            </Link>

            <p className="mt-2 text-muted-foreground leading-relaxed">
              {article.description}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <Link
                href={`/blog/${article.slug}`}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Read article →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* SEO-rich descriptive section */}
      <section className="mt-16 rounded-2xl border border-border bg-accent/20 p-8">
        <h2 className="text-xl font-bold text-foreground">
          Why We Write These Guides
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Artistico is more than a marketplace — it&apos;s a community of hobby
          creators helping each other grow. Our blog covers practical topics
          that artists, makers, and buyers actually search for: how to price
          handmade goods, where to sell art online, how commissioning works,
          and how to build sustainable income from creative work.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Every article is written by our team with input from real creators
          on the platform. No fluff, no generic advice — just actionable
          information you can use today.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/browse"
            className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
          >
            Browse Projects
          </Link>
          <Link
            href="/creators"
            className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
          >
            Discover Creators
          </Link>
          <Link
            href="/become-creator"
            className="btn-gradient"
          >
            Start Selling →
          </Link>
        </div>
      </section>
    </div>
  );
}
