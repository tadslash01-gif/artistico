import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface CreatorMeta {
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  creatorProfile?: { bio?: string; specialties?: string[]; location?: string };
  contentQuality?: { status: string; score: number } | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata> {
  const { uid } = await params;
  try {
    const res = await fetch(`${API_BASE}/users/${uid}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const creator: CreatorMeta = await res.json();

    // Non-creators should not be indexed
    if (!creator.isCreator) {
      return {
        title: "Profile — Artistico",
        robots: { index: false, follow: false },
      };
    }

    const name = creator.displayName || "Creator";
    const specialtiesSuffix =
      creator.creatorProfile?.specialties?.length
        ? ` — ${creator.creatorProfile.specialties.slice(0, 2).join(", ")}`
        : "";
    const title = `${name}${specialtiesSuffix} | Creator on Artistico`;

    const description =
      creator.creatorProfile?.bio?.slice(0, 160) ||
      `${name}${creator.creatorProfile?.location ? ` from ${creator.creatorProfile.location}` : ""} shares handmade projects and sells creations on Artistico.`;

    const image = creator.photoURL;

    // Thin profiles: deprioritize for indexing (noindex) so Google doesn't penalise low-value pages
    const isThin = creator.contentQuality?.status === "thin";

    return {
      title,
      description,
      alternates: {
        canonical: `https://artistico.love/creators/${uid}`,
      },
      ...(isThin
        ? { robots: { index: false, follow: true } }
        : {}),
      openGraph: {
        title,
        description,
        type: "profile",
        url: `https://artistico.love/creators/${uid}`,
        siteName: "Artistico",
        ...(image ? { images: [{ url: image, width: 400, height: 400, alt: name }] } : {}),
      },
      twitter: {
        card: "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {
      title: "Creator — Artistico",
      description: "Discover creators selling handmade work on Artistico.",
    };
  }
}

export default function CreatorUidLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
