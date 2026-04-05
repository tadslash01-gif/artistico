import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdScript } from "@/components/ads/AdScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://artistico.love"),
  title: {
    default: "Artistico — Marketplace for Hobby Creators",
    template: "%s | Artistico",
  },
  description:
    "A low-fee marketplace where hobby creators sell crafts, DIY projects, digital assets, and more.",
  keywords: [
    "handmade marketplace",
    "hobby creators",
    "crafts",
    "digital art",
    "DIY",
    "woodworking",
    "ceramics",
    "jewelry",
    "3d printing",
    "commissions",
  ],
  openGraph: {
    type: "website",
    siteName: "Artistico",
    title: "Artistico — Marketplace for Hobby Creators",
    description:
      "A low-fee marketplace where hobby creators sell crafts, DIY projects, digital assets, and more.",
    url: "https://artistico.love",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Artistico" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artistico — Marketplace for Hobby Creators",
    description:
      "A low-fee marketplace where hobby creators sell crafts, DIY projects, digital assets, and more.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <head>
        <AdScript />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
