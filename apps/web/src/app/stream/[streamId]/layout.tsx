import type { Metadata } from "next";

/**
 * Stream pages are 100% client-side (real-time) with no crawlable SSR content.
 * De-index until we have a server-rendered summary/replay page.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StreamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
