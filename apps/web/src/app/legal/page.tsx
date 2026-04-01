import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description: "Legal policies and terms for Artistico marketplace.",
  robots: { index: true, follow: true },
};

const POLICIES = [
  {
    title: "Terms of Service",
    href: "/legal/terms",
    description:
      "Our user agreement covering acceptable use, liability limitations, and dispute resolution.",
  },
  {
    title: "Privacy Policy",
    href: "/legal/privacy",
    description:
      "How we collect, use, and protect your personal information.",
  },
  {
    title: "Refund Policy",
    href: "/legal/refund",
    description:
      "Our policies on returns, refunds, and disputes for purchases made on Artistico.",
  },
  {
    title: "Seller Agreement",
    href: "/legal/seller",
    description:
      "Terms and obligations for creators listing and selling products on Artistico.",
  },
  {
    title: "Payment Terms",
    href: "/legal/payments",
    description:
      "Payment processing, Stripe disclosures, fees, and payout information.",
  },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Legal</h1>
      <p className="mt-3 text-muted-foreground">
        Artistico is operated by{" "}
        <strong>RedPhantomOps LLC</strong>, a Florida-registered limited
        liability company.
      </p>

      <div className="mt-8 space-y-4">
        {POLICIES.map((policy) => (
          <Link
            key={policy.href}
            href={policy.href}
            className="block rounded-xl border border-border bg-white p-6 hover:border-primary/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {policy.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {policy.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-accent/30 p-6 text-sm text-muted-foreground">
        <p>
          <strong>Contact us:</strong> For legal inquiries, please email{" "}
          <a
            href="mailto:legal@redphantomops.com"
            className="font-medium text-primary hover:text-primary/80"
          >
            legal@redphantomops.com
          </a>
        </p>
        <p className="mt-2">
          RedPhantomOps LLC &middot; Registered in Florida, USA
        </p>
      </div>
    </div>
  );
}
