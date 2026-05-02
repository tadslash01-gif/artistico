import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ProductMeta {
  title: string;
  description: string;
  images: string[];
  creatorName?: string;
  type?: string;
  price?: number;
  currency?: string;
  productId: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const product: ProductMeta = await res.json();

    const priceStr =
      product.price != null
        ? ` — ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: (product.currency ?? "usd").toUpperCase(),
            minimumFractionDigits: 0,
          }).format(product.price / 100)}`
        : "";

    const title = [
      product.title,
      product.creatorName ? `by ${product.creatorName}` : null,
      "Artistico",
    ]
      .filter(Boolean)
      .join(" — ");

    const description = product.description
      ? product.description.slice(0, 160).replace(/\n/g, " ")
      : `${product.type ? product.type.charAt(0).toUpperCase() + product.type.slice(1) : "Handmade"} item${priceStr} by an independent creator on Artistico — the marketplace for hobby creators.`;

    const image = product.images?.[0];

    return {
      title,
      description,
      alternates: {
        canonical: `https://artistico.love/products/${productId}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://artistico.love/products/${productId}`,
        siteName: "Artistico",
        ...(image
          ? {
              images: [
                {
                  url: image,
                  width: 1200,
                  height: 630,
                  alt: product.title,
                },
              ],
            }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {
      title: "Product — Artistico",
      description:
        "Discover handmade products from independent creators on Artistico — the marketplace for hobby craft.",
      alternates: {
        canonical: `https://artistico.love/products/${productId}`,
      },
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
