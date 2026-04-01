"use client";

import Script from "next/script";

const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

export function AdScript() {
  if (!pubId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
