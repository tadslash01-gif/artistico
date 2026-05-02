import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/blog-data";
import {
  getQualifiedProductsForSitemap,
  getQualifiedCreatorsForSitemap,
  getQualifiedProjectsForSitemap,
} from "@/lib/firebase-server";

const BASE_URL = "https://artistico.love";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = getAllArticles();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/creators`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/become-creator`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/legal`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/terms`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/privacy`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/refund`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/seller`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/payments`, changeFrequency: "monthly", priority: 0.2 },
  ];

  // Blog article routes
  const blogRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  try {
    const [qualifiedProjects, qualifiedCreators, qualifiedProducts] = await Promise.all([
      getQualifiedProjectsForSitemap(),
      getQualifiedCreatorsForSitemap(),
      getQualifiedProductsForSitemap(),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = qualifiedProjects.map((p) => ({
      url: `${BASE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const creatorRoutes: MetadataRoute.Sitemap = qualifiedCreators.map((c) => ({
      url: `${BASE_URL}/creators/${c.uid}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = qualifiedProducts.map((p) => ({
      url: `${BASE_URL}/products/${p.productId}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...blogRoutes, ...projectRoutes, ...creatorRoutes, ...productRoutes];
  } catch {
    return [...staticRoutes, ...blogRoutes];
  }
}
