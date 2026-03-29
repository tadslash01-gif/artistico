import type { MetadataRoute } from "next";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const BASE_URL = "https://artistico.redphantomops.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/become-creator`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/legal`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/terms`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/privacy`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/refund`, changeFrequency: "monthly", priority: 0.2 },
  ];

  // Dynamic routes from Firestore (server-side only)
  try {
    if (getApps().length === 0) {
      // In build/server context, use default credentials or service account
      initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    }
    const db = getFirestore();

    // Published projects
    const projectsSnap = await db
      .collection("projects")
      .where("status", "==", "published")
      .select("slug", "updatedAt")
      .get();

    const projectRoutes: MetadataRoute.Sitemap = projectsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${BASE_URL}/projects/${data.slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    // Creator profiles
    const creatorsSnap = await db
      .collection("users")
      .where("isCreator", "==", true)
      .select("uid", "updatedAt")
      .get();

    const creatorRoutes: MetadataRoute.Sitemap = creatorsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${BASE_URL}/creators/${data.uid}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    });

    return [...staticRoutes, ...projectRoutes, ...creatorRoutes];
  } catch {
    // If Firestore is unavailable at build time, return static routes only
    return staticRoutes;
  }
}
