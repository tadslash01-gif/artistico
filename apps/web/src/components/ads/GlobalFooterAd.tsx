"use client";

import { usePathname } from "next/navigation";
import { MobileStickyFooterAd } from "@/components/ads/MobileStickyFooterAd";
import { AD_SLOTS } from "@/lib/adSlots";

/** Routes where ads should NOT appear. */
const NO_AD_PREFIXES = ["/dashboard", "/login", "/signup", "/forgot-password", "/legal"];

export function GlobalFooterAd() {
  const pathname = usePathname();

  const suppressed = NO_AD_PREFIXES.some((p) => pathname.startsWith(p));
  if (suppressed) return null;

  return <MobileStickyFooterAd slot={AD_SLOTS.MOBILE_FOOTER} />;
}
