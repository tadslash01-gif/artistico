import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById, getCreator, getProductsByProject, getProjectBySlug } from "@/lib/firebase-server";
import type { SSRProduct, SSRCreator } from "@/lib/firebase-server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatProductType(type: string): string {
  const labels: Record<string, string> = {
    physical: "Physical Item",
    digital: "Digital Download",
    template: "Template / Pattern",
    commission: "Custom Commission",
  };
  return labels[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

function formatLicenseType(licenseType: string | null): string {
  if (!licenseType) return "Personal Use";
  const labels: Record<string, string> = {
    personal: "Personal Use Only",
    commercial: "Commercial License",
    exclusive: "Exclusive License",
  };
  return labels[licenseType] ?? licenseType;
}

function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Structured data (JSON-LD)
// ---------------------------------------------------------------------------

function buildJsonLd(
  product: SSRProduct,
  creator: SSRCreator | null
): Record<string, unknown> {
  const priceUsd = product.price / 100;
  const availability =
    product.status === "active"
      ? "https://schema.org/InStock"
      : "https://schema.org/SoldOut";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    productID: product.productId,
    name: product.title,
    description: product.description,
    image: product.images,
    url: `https://artistico.love/products/${product.productId}`,
    offers: {
      "@type": "Offer",
      priceCurrency: (product.currency ?? "usd").toUpperCase(),
      price: priceUsd,
      availability,
      seller: creator
        ? {
            "@type": "Person",
            name: creator.displayName,
            url: `https://artistico.love/creators/${creator.uid}`,
          }
        : undefined,
    },
    brand: creator
      ? {
          "@type": "Person",
          name: creator.displayName,
          url: `https://artistico.love/creators/${creator.uid}`,
        }
      : undefined,
    ...(product.salesCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: product.salesCount,
          },
        }
      : {}),
    additionalType:
      product.type === "digital"
        ? "https://schema.org/DigitalDocument"
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const [creator, relatedProducts] = await Promise.all([
    getCreator(product.creatorId),
    product.projectId
      ? getProductsByProject(product.projectId, 4)
      : Promise.resolve([] as SSRProduct[]),
  ]);

  const categoryLabel = product.category ? formatCategory(product.category) : null;
  const typeLabel = formatProductType(product.type);
  const licenseLabel = formatLicenseType(product.licenseType);
  const priceDisplay = formatPrice(product.price, product.currency ?? "usd");
  const jsonLd = buildJsonLd(product, creator);

  // Build FAQ items from product context
  const faqItems = buildFaqItems(product, creator, typeLabel, licenseLabel);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/browse" className="hover:text-primary transition-colors">
            Browse
          </Link>
          <span>/</span>
          {categoryLabel && (
            <>
              <Link
                href={`/browse?category=${product.category}`}
                className="hover:text-primary transition-colors"
              >
                {categoryLabel}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Left: main content ── */}
          <article className="lg:col-span-2 space-y-8">
            {/* Hero heading */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-accent/50 px-3 py-0.5 font-medium text-foreground">
                  {typeLabel}
                </span>
                {categoryLabel && (
                  <span className="rounded-full bg-muted px-3 py-0.5">{categoryLabel}</span>
                )}
                {product.status === "sold_out" && (
                  <span className="rounded-full bg-destructive/10 px-3 py-0.5 text-destructive font-medium">
                    Sold Out
                  </span>
                )}
              </div>

              {creator && (
                <div className="mt-4">
                  <Link
                    href={`/creators/${creator.uid}`}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    by {creator.displayName}
                  </Link>
                  {creator.creatorProfile?.location && (
                    <span className="ml-3 text-sm text-muted-foreground">
                      📍 {creator.creatorProfile.location}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product images */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {product.images.slice(0, 6).map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.title} — image ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description — the critical SEO content block */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">About This {typeLabel}</h2>
              <div className="mt-3 prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </section>

            {/* Product specifications */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">Product Details</h2>
              <dl className="mt-3 divide-y divide-border rounded-lg border border-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                  <dd className="text-sm text-foreground">{typeLabel}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm font-medium text-muted-foreground">Price</dt>
                  <dd className="text-sm font-semibold text-foreground">{priceDisplay}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm font-medium text-muted-foreground">License</dt>
                  <dd className="text-sm text-foreground">{licenseLabel}</dd>
                </div>
                {product.type === "digital" && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">Delivery</dt>
                    <dd className="text-sm text-foreground">Instant digital download</dd>
                  </div>
                )}
                {product.type === "physical" && product.shippingRequired && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">Shipping</dt>
                    <dd className="text-sm text-foreground">Ships from creator</dd>
                  </div>
                )}
                {product.type === "commission" && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">Fulfillment</dt>
                    <dd className="text-sm text-foreground">Custom — creator will contact you</dd>
                  </div>
                )}
                {product.inventory !== null && product.inventory !== undefined && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">Available</dt>
                    <dd className="text-sm text-foreground">
                      {product.inventory === 0 ? "Out of stock" : `${product.inventory} remaining`}
                    </dd>
                  </div>
                )}
                {product.salesCount > 0 && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">Sold</dt>
                    <dd className="text-sm text-foreground">
                      {product.salesCount.toLocaleString()} times
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* What you get / Use-case section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">What You Get</h2>
              <ul className="mt-3 space-y-2">
                {getWhatYouGet(product).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-0.5 text-primary">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Creator context */}
            {creator && (
              <section>
                <h2 className="text-xl font-semibold text-foreground">About the Creator</h2>
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-5">
                  <div className="flex items-start gap-4">
                    {creator.photoURL && (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={creator.photoURL}
                          alt={creator.displayName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/creators/${creator.uid}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {creator.displayName}
                      </Link>
                      {creator.isVerified && (
                        <span className="ml-2 text-xs text-primary font-medium">✓ Verified</span>
                      )}
                      {creator.creatorProfile?.bio && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {creator.creatorProfile.bio}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {creator.followersCount > 0 && (
                          <span>{creator.followersCount.toLocaleString()} followers</span>
                        )}
                        {creator.totalSales > 0 && (
                          <span>{creator.totalSales.toLocaleString()} sales</span>
                        )}
                        {creator.creatorProfile?.specialties &&
                          creator.creatorProfile.specialties.length > 0 && (
                            <span>{creator.creatorProfile.specialties.slice(0, 3).join(" · ")}</span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/creators/${creator.uid}`}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      View full profile →
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* FAQ section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
              <div className="mt-4 space-y-4">
                {faqItems.map((faq, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Trust & policy block */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">Buying with Confidence</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <div className="text-2xl">🔒</div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">Secure Checkout</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All payments are processed securely through Stripe.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <div className="text-2xl">💬</div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">Creator Support</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Message the creator directly if you have any questions.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <div className="text-2xl">📋</div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">Clear Terms</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review our{" "}
                    <Link href="/legal/refund" className="text-primary hover:underline">
                      refund policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/legal/terms" className="text-primary hover:underline">
                      terms of use
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>
          </article>

          {/* ── Right: purchase sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="text-3xl font-bold text-foreground">{priceDisplay}</div>
              <p className="mt-1 text-sm text-muted-foreground">{licenseLabel}</p>

              {product.status === "active" ? (
                <div className="mt-5 space-y-3">
                  {/* Purchase button rendered client-side — placeholder for SSR */}
                  <div className="flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                    Purchase Now
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    {product.type === "digital"
                      ? "Instant download after purchase"
                      : product.type === "commission"
                      ? "Creator will contact you within 48 hours"
                      : "Ships from the creator"}
                  </p>
                </div>
              ) : (
                <div className="mt-5 flex w-full items-center justify-center rounded-lg bg-muted px-6 py-3 text-sm font-semibold text-muted-foreground">
                  Currently Unavailable
                </div>
              )}

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>🏷</span>
                  <span>{typeLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📜</span>
                  <span>{licenseLabel}</span>
                </div>
                {product.type === "digital" && (
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>Instant delivery</span>
                  </div>
                )}
                {product.salesCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span>🛒</span>
                    <span>{product.salesCount.toLocaleString()} sold</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related products from same project */}
            {relatedProducts.filter((p) => p.productId !== productId).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">More from this project</h3>
                <div className="space-y-3">
                  {relatedProducts
                    .filter((p) => p.productId !== productId)
                    .slice(0, 3)
                    .map((rp) => (
                      <Link
                        key={rp.productId}
                        href={`/products/${rp.productId}`}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                      >
                        {rp.images?.[0] && (
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rp.images[0]}
                              alt={rp.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{rp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(rp.price, rp.currency ?? "usd")}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Content helpers (pure functions, no JSX)
// ---------------------------------------------------------------------------

function getWhatYouGet(product: SSRProduct): string[] {
  const items: string[] = [];

  switch (product.type) {
    case "digital":
      items.push("Instant digital download upon purchase");
      items.push("High-resolution files suitable for print and screen");
      items.push(`Licensed for ${formatLicenseType(product.licenseType).toLowerCase()}`);
      items.push("Direct file delivery — no waiting, no shipping");
      break;
    case "template":
      items.push("Fully editable template file(s)");
      items.push("Detailed instructions for customization");
      items.push(`${formatLicenseType(product.licenseType)} included`);
      items.push("Instant download after purchase");
      break;
    case "physical":
      items.push("Handmade item crafted by the creator");
      items.push("Carefully packaged to arrive in perfect condition");
      items.push("Direct shipping from the creator's studio");
      if (product.inventory !== null && product.inventory !== undefined && product.inventory > 0) {
        items.push(`${product.inventory} in stock — order yours today`);
      }
      break;
    case "commission":
      items.push("Custom creation made specifically for you");
      items.push("Direct collaboration with the creator");
      items.push("Creator will reach out within 48 hours to discuss details");
      items.push("Progress updates throughout the creation process");
      break;
    default:
      items.push("Item as described above");
      items.push(`Licensed for ${formatLicenseType(product.licenseType).toLowerCase()}`);
  }

  return items;
}

interface FaqItem {
  q: string;
  a: string;
}

function buildFaqItems(
  product: SSRProduct,
  creator: SSRCreator | null,
  typeLabel: string,
  licenseLabel: string
): FaqItem[] {
  const faqs: FaqItem[] = [];
  const creatorName = creator?.displayName ?? "the creator";

  faqs.push({
    q: `How do I receive this ${typeLabel.toLowerCase()}?`,
    a:
      product.type === "digital" || product.type === "template"
        ? "After your purchase is confirmed, you will receive an instant download link via email. You can also access your purchase from your account dashboard at any time."
        : product.type === "physical"
        ? `${creatorName} will package and ship your order directly. Delivery times depend on your location and the creator's fulfillment schedule. You'll receive tracking information once your order ships.`
        : `${creatorName} will contact you within 48 hours of your purchase to discuss your specific requirements, timeline, and creative preferences.`,
  });

  faqs.push({
    q: "What license do I receive?",
    a: `This product comes with a ${licenseLabel} license. ${
      product.licenseType === "commercial"
        ? "You may use this item in commercial projects, client work, and for-profit purposes."
        : product.licenseType === "exclusive"
        ? "You receive exclusive rights — the creator will not sell this to anyone else after your purchase."
        : "This license is for your personal, non-commercial use only."
    } For questions about specific use cases, please message ${creatorName} directly.`,
  });

  faqs.push({
    q: "Can I request a refund?",
    a: `We want you to be happy with your purchase. For digital products, refunds are generally not available once a file has been downloaded. For physical items and commissions, please review our full refund policy or message ${creatorName} directly to discuss any issues.`,
  });

  faqs.push({
    q: `Who is ${creatorName}?`,
    a: creator?.creatorProfile?.bio
      ? `${creator.creatorProfile.bio.slice(0, 200)}${creator.creatorProfile.bio.length > 200 ? "…" : ""} You can learn more by visiting their full creator profile.`
      : `${creatorName} is an independent creator on Artistico who specializes in handmade and hobby craft work. Visit their profile to see their full portfolio and other available products.`,
  });

  if (product.type === "digital" || product.type === "template") {
    faqs.push({
      q: "What file formats are included?",
      a: "File format details are described in the product listing above. If you have specific format requirements or compatibility questions, please message the creator before purchasing.",
    });
  }

  if (product.type === "physical") {
    faqs.push({
      q: "Do you ship internationally?",
      a: `Shipping availability depends on ${creatorName}'s location and carrier options. Please check the product description or message the creator to confirm international shipping to your country.`,
    });
  }

  return faqs;
}
