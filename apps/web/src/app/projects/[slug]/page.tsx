"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import RelatedProjects from "@/components/RelatedProjects";
import { apiFetch } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import InquiryForm from "@/components/InquiryForm";
import ReviewForm from "@/components/ReviewForm";
import SaveButton from "@/components/SaveButton";
import FollowButton from "@/components/FollowButton";
import DifficultyBadge from "@/components/DifficultyBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { SidebarAd } from "@/components/ads/SidebarAd";
import { SidebarAdLeft } from "@/components/ads/SidebarAdLeft";
import { InlineBannerAd } from "@/components/ads/InlineBannerAd";
import { AD_SLOTS } from "@/lib/adSlots";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  limit as firestoreLimit,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface ProjectData {
  projectId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  materialsUsed: string[];
  tags: string[];
  category: string;
  status: string;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  savesCount: number;
  creatorStory: string | null;
  useCase: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  timeToBuild: string | null;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

interface ProductData {
  productId: string;
  projectId: string;
  creatorId: string;
  title: string;
  description: string;
  type: "physical" | "digital" | "template" | "commission";
  price: number;
  currency: string;
  images: string[];
  inventory: number | null;
  shippingRequired: boolean;
  status: string;
  salesCount: number;
}

interface ReviewData {
  reviewId: string;
  buyerId: string;
  rating: number;
  title: string;
  body: string;
  createdAt: { toDate: () => Date } | null;
}

interface CreatorData {
  uid: string;
  displayName: string;
  photoURL: string | null;
  creatorProfile?: {
    bio: string;
    location: string;
    specialties: string[];
  };
}

const TYPE_LABELS: Record<string, string> = {
  physical: "Physical Item",
  digital: "Digital Download",
  template: "Template",
  commission: "Commission",
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [buyingProduct, setBuyingProduct] = useState<string | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [userOrder, setUserOrder] = useState<{ orderId: string; productId: string } | null>(null);

  useEffect(() => {
    async function fetchProject() {
      if (!firestore) return;
      try {
        const q = query(
          collection(firestore, "projects"),
          where("slug", "==", slug),
          where("status", "==", "published")
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setLoading(false);
          return;
        }

        const proj = snapshot.docs[0].data() as ProjectData;
        setProject(proj);

        // Fetch products, reviews, and creator in parallel
        const [productsSnap, reviewsSnap, creatorSnap] = await Promise.all([
          getDocs(
            query(
              collection(firestore, "products"),
              where("projectId", "==", proj.projectId),
              where("status", "==", "active")
            )
          ),
          getDocs(
            query(
              collection(firestore, "reviews"),
              where("projectId", "==", proj.projectId),
              orderBy("createdAt", "desc")
            )
          ),
          getDoc(doc(firestore, "users", proj.creatorId)),
        ]);

        setProducts(productsSnap.docs.map((d) => d.data() as ProductData));
        setReviews(reviewsSnap.docs.map((d) => d.data() as ReviewData));
        if (creatorSnap.exists()) {
          setCreator(creatorSnap.data() as CreatorData);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [slug]);

  // Check if user has a completed order for this project (for review eligibility)
  useEffect(() => {
    async function checkUserOrder() {
      if (!firestore || !user || !project) return;
      try {
        const q = query(
          collection(firestore, "orders"),
          where("buyerId", "==", user.uid),
          where("projectId", "==", project.projectId),
          firestoreLimit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const orderData = snap.docs[0].data();
          setUserOrder({ orderId: orderData.orderId, productId: orderData.productId });
        }
      } catch {
        // Non-critical — don't block page
      }
    }
    checkUserOrder();
  }, [user, project]);

  const handleBuy = async (productId: string) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBuyingProduct(productId);
    try {
      const { url } = await apiFetch<{ url: string }>(
        "/checkout/create-session",
        {
          method: "POST",
          body: JSON.stringify({ productId }),
        }
      );
      window.location.href = url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setBuyingProduct(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="mt-4 h-96 rounded-xl bg-muted" />
          <div className="mt-6 h-4 w-full rounded bg-muted" />
          <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-foreground">Project Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This project may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/browse" className="hover:text-primary transition-colors">
          Browse
        </Link>
        <span>/</span>
        <Link
          href={`/browse?category=${project.category}`}
          className="hover:text-primary transition-colors"
        >
          {project.category
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{project.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3 xl:grid-cols-[160px_1fr_1fr_300px]">
        {/* Left sidebar ad (xl desktop) */}
        <SidebarAdLeft slot={AD_SLOTS.SIDEBAR_LEFT} className="hidden xl:block lg:hidden" />

        {/* Left Column: Images + Description */}
        <div className="lg:col-span-2 xl:col-span-2">
          {/* Image Gallery */}
          {project.images.length > 0 ? (
            <div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={project.images[selectedImage]}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
              {project.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {project.images.map((img, i) => (
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
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-muted">
              <span className="text-4xl">🎨</span>
            </div>
          )}

          {/* Title & Description */}
          <div className="mt-6 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">
              {project.title}
            </h1>
            <SaveButton
              projectId={project.projectId}
              initialCount={project.savesCount || 0}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-accent/50 px-3 py-0.5 font-medium">
              {project.category
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </span>
            <DifficultyBadge difficulty={project.difficulty} />
            {project.timeToBuild && (
              <span>⏱ {project.timeToBuild}</span>
            )}
            {project.averageRating > 0 && (
              <span>
                ★ {project.averageRating.toFixed(1)} ({project.reviewCount}{" "}
                {project.reviewCount === 1 ? "review" : "reviews"})
              </span>
            )}
            {project.viewCount > 0 && (
              <span>{project.viewCount} views</span>
            )}
          </div>

          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground">
            {project.description}
          </p>

          {/* Creator Story */}
          {project.creatorStory && (
            <div className="mt-6 rounded-xl border border-border bg-amber-50/50 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                The Story Behind This Project
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {project.creatorStory}
              </p>
            </div>
          )}

          {/* Use Case */}
          {project.useCase && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-foreground">
                Perfect For
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.useCase}
              </p>
            </div>
          )}

          {/* Materials */}
          {project.materialsUsed.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground">
                Materials Used
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.materialsUsed.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-foreground">
              Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No reviews yet. Be the first to purchase and leave a review!
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.reviewId}
                    className="rounded-lg border border-border bg-white p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      {review.createdAt?.toDate && (
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(review.createdAt.toDate())}
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <h4 className="mt-1 font-medium text-foreground">
                        {review.title}
                      </h4>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {review.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Review Form — show if user has a completed order */}
            {userOrder && project && (
              <div className="mt-6">
                <ReviewForm
                  projectId={project.projectId}
                  productId={userOrder.productId}
                  orderId={userOrder.orderId}
                  onSuccess={() => {
                    // Refresh reviews
                    if (!firestore) return;
                    getDocs(
                      query(
                        collection(firestore, "reviews"),
                        where("projectId", "==", project.projectId),
                        orderBy("createdAt", "desc")
                      )
                    ).then((snap) => {
                      setReviews(snap.docs.map((d) => d.data() as ReviewData));
                    });
                  }}
                />
              </div>
            )}
          </div>
          {/* Ad below reviews */}
          <InlineBannerAd slot={AD_SLOTS.INLINE_PROJECT} className="mt-8" />

          {/* Related Projects */}
          <RelatedProjects category={project.category} excludeProjectId={project.projectId} />
        </div>

        {/* Right Column: Products + Creator */}
        <div className="space-y-6">
          {/* Creator Card */}
          {creator && (
            <div className="rounded-xl border border-border bg-white p-5">
              <Link
                href={`/creators/${project.creatorId}`}
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
                    {(creator as any).isVerified && <VerifiedBadge />}
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
                <FollowButton creatorId={project.creatorId} />
              </div>
            </div>
          )}

          {/* Contact Creator */}
          {creator && user?.uid !== project.creatorId && (
            <div>
              {showInquiry ? (
                <InquiryForm
                  creatorId={project.creatorId}
                  creatorName={creator.displayName}
                  relatedProjectId={project.projectId}
                  onClose={() => setShowInquiry(false)}
                  onSent={() => {
                    setShowInquiry(false);
                    alert("Message sent!");
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowInquiry(true)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  ✉️ Contact Creator
                </button>
              )}
            </div>
          )}

          {/* Products */}
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Available Products ({products.length})
            </h2>
            {products.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No products listed yet.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {products.map((product) => (
                  <div
                    key={product.productId}
                    className="rounded-xl border border-border bg-white p-4"
                  >
                    {product.images?.[0] && (
                      <div className="relative mb-3 aspect-[3/2] overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-foreground">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {TYPE_LABELS[product.type] || product.type}
                      </span>
                    </div>

                    {/* Inventory */}
                    {product.inventory !== null && product.inventory !== undefined && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.inventory > 0
                          ? `${product.inventory} in stock`
                          : "Sold out"}
                      </p>
                    )}

                    {product.salesCount > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.salesCount} sold
                      </p>
                    )}

                    <button
                      onClick={() => handleBuy(product.productId)}
                      disabled={
                        buyingProduct === product.productId ||
                        (product.inventory !== null && product.inventory <= 0)
                      }
                      className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {buyingProduct === product.productId
                        ? "Redirecting..."
                        : product.inventory !== null && product.inventory <= 0
                          ? "Sold Out"
                          : "Buy Now"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar ad below products */}
          <SidebarAd slot={AD_SLOTS.SIDEBAR_PROJECT} />
        </div>
      </div>
    </div>
  );
}
