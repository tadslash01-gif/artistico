import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ProjectMeta {
  title: string;
  description: string;
  images: string[];
  creatorName?: string;
  slug: string;
  contentQualityStatus?: "thin" | "borderline" | "adequate" | "rich" | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/projects/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const project: ProjectMeta = await res.json();

    const title = `${project.title}${project.creatorName ? ` by ${project.creatorName}` : ""} — Artistico`;
    const description = project.description
      ? project.description.slice(0, 160).replace(/\n/g, " ")
      : "A handmade project shared on Artistico — the marketplace for hobby creators.";
    const image = project.images?.[0];

    // Thin quality projects get noindex so low-value pages don't hurt AdSense
    const isThin = project.contentQualityStatus === "thin";

    return {
      title,
      description,
      alternates: {
        canonical: `https://artistico.love/projects/${slug}`,
      },
      ...(isThin ? { robots: { index: false, follow: true } } : {}),
      openGraph: {
        title,
        description,
        type: "article",
        url: `https://artistico.love/projects/${slug}`,
        ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: project.title }] } : {}),
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
      title: "Project — Artistico",
      description: "Discover handmade projects on Artistico — the marketplace for hobby creators.",
    };
  }
}

export default function ProjectSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
