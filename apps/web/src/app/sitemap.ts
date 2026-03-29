import type { MetadataRoute } from "next";

const BASE_URL = "https://artistico.redphantomops.com";
const PROJECT_ID = "artistico-78f75";

interface FirestoreDoc {
  document: {
    fields: Record<string, { stringValue?: string; timestampValue?: string }>;
  };
}

async function queryFirestore(
  collection: string,
  field: string,
  value: string,
  selectFields: string[]
): Promise<FirestoreDoc[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: "EQUAL",
            value: { stringValue: value },
          },
        },
        select: {
          fields: selectFields.map((f) => ({ fieldPath: f })),
        },
      },
    }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data as FirestoreDoc[]).filter((d) => d.document);
}

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

  try {
    const [projectDocs, creatorDocs] = await Promise.all([
      queryFirestore("projects", "status", "published", ["slug", "updatedAt"]),
      queryFirestore("users", "isCreator", "true", ["uid", "updatedAt"]),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = projectDocs.map((d) => ({
      url: `${BASE_URL}/projects/${d.document.fields.slug?.stringValue ?? ""}`,
      lastModified: d.document.fields.updatedAt?.timestampValue
        ? new Date(d.document.fields.updatedAt.timestampValue)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const creatorRoutes: MetadataRoute.Sitemap = creatorDocs.map((d) => ({
      url: `${BASE_URL}/creators/${d.document.fields.uid?.stringValue ?? ""}`,
      lastModified: d.document.fields.updatedAt?.timestampValue
        ? new Date(d.document.fields.updatedAt.timestampValue)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...projectRoutes, ...creatorRoutes];
  } catch {
    return staticRoutes;
  }
}
