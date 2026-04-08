"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import InquiryForm from "@/components/InquiryForm";
import VerifiedBadge from "@/components/VerifiedBadge";
import FollowButton from "@/components/FollowButton";

interface ProductData {
  productId: string;
  projectId: string | null;
  creatorId: string;
  title: string;
  description: string;
  type: "physical" | "digital" | "template" | "commission";
  licenseType?: "personal" | "commercial" | "extended-commercial";
  price: number;
  currency: string;
  images: string[];
  digitalFileUrl: string | null;
  inventory: number | null;
  shippingRequired: boolean;
  status: string;
  salesCount: number;
  viewCount?: number;
  category: string | null;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

interface CreatorData {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isVerified?: boolean;
  creatorProfile?: {
    bio: string;
    location: string;
    specialties: string[];
  };
}

interface ProjectData {
  projectId: string;
  title: string;
  slug: string;
}

const TYPE_LABELS: Record<string, string> = {
  physical: "Physical Item",
  digital: "Digital Download",
  template: "Template",
  commission: "Commission",
};

const TYPE_EMOJIS: Record<string, string> = {
  physical: "📦",
  digital: "💾",
  template: "📄",
  commission: "🎨",
};

const LICENSE_LABELS: Record<string, string> = {
  personal: "Personal Use",
  commercial: "Commercial Use",
  "extended-commercial": "Extended Commercial",
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!firestore) return;
      try {
        const productSnap = await getDoc(doc(firestore, "products", productId));
        if (!productSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const prod = productSnap.data() as ProductData;

        // Only active products are public; owner can see any status
        if (prod.status !== "active" && prod.creatorId !== user?.uid) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProduct(prod);

        // Fetch creator and parent project in parallel
        const [creatorSnap, projectSnap] = await Promise.all([
          getDoc(doc(firestore, "users", prod.creatorId)),
          prod.projectId
            ? getDoc(doc(firestore, "projects", prod.projectId))
            : Promise.resolve(null),
        ]);

        if (creatorSnap.exists()) {
          setCreator(creatorSnap.data() as CreatorData);
        }
        if (projectSnap?.exists()) {
          const p = projectSnap.data();
          setProject({ projectId: p.projectId, title: p.title, slug: p.slug });
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId, user?.uid]);

  const handleBuy = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBuying(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/checkout/create-session", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith("stripe.com")) throw new Error();
      } catch {
        throw new Error("Invalid checkout URL");
      }
      window.location.href = url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="aspect-square rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-20 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This product may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const isSoldOut = product.inventory !== null && product.inventory <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/browse" className="hover:text-primary transition-colors">
          Browse
        </Link>
        <span>/</span>
        <Link
          href="/browse?tab=products"
          className="hover:text-primary transition-colors"
        >
          Products
        </Link>
        {project && (
          <>
            <span>/</span>
            <Link
              href={`/projects/${project.slug}`}
              className="hover:text-primary transition-colors"
            >
              {project.title}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: Images */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl">
                {TYPE_EMOJIS[product.type] || "🛍️"}
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === selectedImage
                      ? "border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col gap-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/60 px-3 py-0.5 text-xs font-medium text-foreground">
              {TYPE_EMOJIS[product.type]} {TYPE_LABELS[product.type] || product.type}
            </span>
            {product.licenseType && product.type !== "physical" && product.type !== "commission" && (
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700">
                {LICENSE_LABELS[product.licenseType] || product.licenseType}
              </span>
            )}
            {product.category && (
              <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                {product.category
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </span>
            {product.salesCount > 0 && (
              <span className="text-sm text-muted-foreground">
                🔥 {product.salesCount} sold
              </span>
            )}
          </div>

          {/* Inventory status */}
          {product.inventory !== null && (
            <p
              className={`text-sm font-medium ${
                isSoldOut ? "text-destructive" : "text-green-600"
              }`}
            >
              {isSoldOut ? "Sold Out" : `${product.inventory} in stock`}
            </p>
          )}

          {/* Description */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {/* Shipping info */}
          {product.type === "physical" && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              📦 Physical item — shipping required
            </div>
          )}
          {product.type === "digital" && (
            <div className="rounded-lg border border-border bg-blue-50/50 px-4 py-3 text-sm text-blue-700">
              💾 Digital download — instant delivery after purchase
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {product.type === "commission" ? (
              <button
                onClick={() => setShowInquiry(true)}
                className="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                🎨 Request Commission
              </button>
            ) : (
              <button
                onClick={handleBuy}
                disabled={buying || isSoldOut}
                className="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {buying ? "Redirecting to checkout…" : isSoldOut ? "Sold Out" : "Buy Now"}
              </button>
            )}
            {creator && user?.uid !== product.creatorId && product.type !== "commission" && (
              <button
                onClick={() => setShowInquiry((v) => !v)}
                className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                ✉️ Ask a Question
              </button>
            )}
          </div>

          {/* Inquiry form inline */}
          {showInquiry && creator && (
            <div className="mt-2">
              <InquiryForm
                creatorId={product.creatorId}
                creatorName={creator.displayName}
                relatedProjectId={product.projectId ?? undefined}
                onClose={() => setShowInquiry(false)}
                onSent={() => {
                  setShowInquiry(false);
                  alert("Message sent!");
                }}
              />
            </div>
          )}

          {/* Parent project link */}
          {project && (
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Part of project
              </p>
              <Link
                href={`/projects/${project.slug}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {project.title} →
              </Link>
            </div>
          )}

          {/* Creator card */}
          {creator && (
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Sold by
              </p>
              <Link
                href={`/creators/${product.creatorId}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {creator.photoURL ? (
                  <Image
                    src={creator.photoURL}
                    alt={creator.displayName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {(creator.displayName || "?")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="flex items-center gap-1 font-semibold text-foreground">
                    {creator.displayName}
                    {creator.isVerified && <VerifiedBadge />}
                  </p>
                  {creator.creatorProfile?.location && (
                    <p className="text-xs text-muted-foreground">
                      📍 {creator.creatorProfile.location}
                    </p>
                  )}
                </div>
              </Link>
              {creator.creatorProfile?.bio && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                  {creator.creatorProfile.bio}
                </p>
              )}
              <div className="mt-3">
                <FollowButton creatorId={product.creatorId} />
              </div>
            </div>
          )}

          {/* Metadata */}
          {product.createdAt && (
            <p className="text-xs text-muted-foreground">
              Listed {timeAgo(new Date(product.createdAt.seconds * 1000))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
