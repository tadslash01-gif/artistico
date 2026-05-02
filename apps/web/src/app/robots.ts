import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/login",
          "/signup",
          "/forgot-password",
          "/orders/",
          // Stream pages are CSR-only with no crawlable content; de-index until SSR replays exist
          "/stream/",
        ],
      },
    ],
    sitemap: "https://artistico.love/sitemap.xml",
  };
}
