import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface CreatorMeta {
  displayName: string;
  photoURL: string | null;
  creatorProfile?: { bio?: string };
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

    const name = creator.displayName || "Creator";
    const title = `${name} — Creator on Artistico`;
    const description =
      creator.creatorProfile?.bio?.slice(0, 160) ||
      `${name} shares handmade projects and sells creations on Artistico.`;
    const image = creator.photoURL;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        url: `https://artistico.app/creators/${uid}`,
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
