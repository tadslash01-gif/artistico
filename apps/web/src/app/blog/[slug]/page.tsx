import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getAllArticles } from "@/lib/blog-data";

export async function generateStaticParams() {
  return getAllArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: "Article Not Found" };
  }
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: `${article.title} | Artistico`,
      description: article.description,
      type: "article",
      url: `https://artistico.love/blog/${slug}`,
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

/**
 * Minimal Markdown → HTML converter for blog content.
 * Supports: headings, bold, italic, links, tables, lists, paragraphs, inline code.
 */
function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inTable = false;
  let inList = false;
  let listType: "ul" | "ol" = "ul";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Close list if current line is not a list item
    if (inList && !line.match(/^(\d+\.\s|-\s|\*\s)/)) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
    }

    // Close table if line doesn't start with |
    if (inTable && !line.startsWith("|")) {
      html.push("</tbody></table></div>");
      inTable = false;
    }

    // Blank line
    if (line.trim() === "") {
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      html.push(
        `<h3 class="mt-8 mb-3 text-lg font-semibold text-foreground">${inlineFormat(line.slice(4))}</h3>`
      );
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(
        `<h2 class="mt-10 mb-4 text-xl font-bold text-foreground sm:text-2xl">${inlineFormat(line.slice(3))}</h2>`
      );
      continue;
    }

    // Table separator line (skip)
    if (line.match(/^\|[\s-:|]+\|$/)) {
      continue;
    }

    // Table row
    if (line.startsWith("|")) {
      const cells = line
        .split("|")
        .filter((c) => c.trim() !== "")
        .map((c) => c.trim());
      if (!inTable) {
        html.push(
          '<div class="my-4 overflow-x-auto"><table class="w-full text-sm border-collapse">'
        );
        html.push(
          "<thead><tr>" +
            cells
              .map(
                (c) =>
                  `<th class="text-left border-b border-border px-3 py-2 font-semibold text-foreground">${inlineFormat(c)}</th>`
              )
              .join("") +
            "</tr></thead><tbody>"
        );
        inTable = true;
      } else {
        html.push(
          "<tr>" +
            cells
              .map(
                (c) =>
                  `<td class="border-b border-border/50 px-3 py-2 text-muted-foreground">${inlineFormat(c)}</td>`
              )
              .join("") +
            "</tr>"
        );
      }
      continue;
    }

    // Unordered list
    if (line.match(/^-\s/) || line.match(/^\*\s/)) {
      if (!inList) {
        html.push('<ul class="my-3 list-disc pl-6 space-y-1.5">');
        inList = true;
        listType = "ul";
      }
      html.push(
        `<li class="text-muted-foreground leading-relaxed">${inlineFormat(line.replace(/^[-*]\s/, ""))}</li>`
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s/);
    if (olMatch) {
      if (!inList) {
        html.push('<ol class="my-3 list-decimal pl-6 space-y-1.5">');
        inList = true;
        listType = "ol";
      }
      html.push(
        `<li class="text-muted-foreground leading-relaxed">${inlineFormat(line.replace(/^\d+\.\s/, ""))}</li>`
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      html.push(
        `<blockquote class="my-4 border-l-4 border-primary/30 bg-accent/20 px-4 py-3 italic text-muted-foreground">${inlineFormat(line.slice(2))}</blockquote>`
      );
      continue;
    }

    // Regular paragraph
    html.push(
      `<p class="my-3 text-muted-foreground leading-relaxed">${inlineFormat(line)}</p>`
    );
  }

  // Close any open elements
  if (inList) html.push(listType === "ul" ? "</ul>" : "</ol>");
  if (inTable) html.push("</tbody></table></div>");

  return html.join("\n");
}

function inlineFormat(text: string): string {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
  // Italic
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">$1</code>');
  // Links — internal
  text = text.replace(
    /\[(.+?)\]\((\/[^)]+)\)/g,
    '<a href="$2" class="text-primary font-medium hover:text-primary/80 underline underline-offset-2 transition-colors">$1</a>'
  );
  // Links — external
  text = text.replace(
    /\[(.+?)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary font-medium hover:text-primary/80 underline underline-offset-2 transition-colors">$1</a>'
  );
  return text;
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = getAllArticles().filter((a) => a.slug !== slug);
  const contentHtml = renderMarkdown(article.content);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Organization",
      name: article.author,
      url: "https://artistico.love",
    },
    publisher: {
      "@type": "Organization",
      name: "Artistico",
      url: "https://artistico.love",
    },
    datePublished: article.publishedAt,
    url: `https://artistico.love/blog/${slug}`,
    mainEntityOfPage: `https://artistico.love/blog/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{article.title}</span>
        </nav>

        {/* Header */}
        <header>
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
          <h1 className="mt-4 text-3xl font-bold text-foreground leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {article.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Article Body */}
        <div
          className="mt-10 article-body"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA Section */}
        <section className="mt-12 rounded-2xl border border-border bg-accent/20 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">
            Ready to start creating?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Artistico is a low-fee marketplace where hobby creators sell crafts,
            digital art, and more. Only 5% commission. Free to join.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/become-creator" className="btn-gradient">
              Start Selling →
            </Link>
            <Link
              href="/browse"
              className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Browse Projects
            </Link>
          </div>
        </section>

        {/* Related Articles */}
        {allArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">
              More from the blog
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {allArticles.slice(0, 2).map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group rounded-xl border border-border bg-white p-5 hover:border-primary/50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground">
                    {related.category}
                  </span>
                  <h3 className="mt-1 font-semibold text-foreground group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {related.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
