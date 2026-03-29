import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund and return policy for purchases made on Artistico marketplace.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/legal"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Legal
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-foreground">
        Refund Policy
      </h1>

      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span>Last updated: March 2026</span>
        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
          Draft — Under Legal Review
        </span>
      </div>

      <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
        <p className="font-medium">Notice</p>
        <p className="mt-1">
          This Refund Policy is being finalized. The complete version will be
          published at{" "}
          <a
            href="https://legal.redphantomops.com/refund"
            className="font-medium underline"
          >
            legal.redphantomops.com/refund
          </a>
          .
        </p>
      </div>

      <div className="prose-sm mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Marketplace Role</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico is a marketplace platform. Individual Sellers are
            responsible for their products. Refund eligibility and procedures
            may vary by Seller and product type.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Physical Products</h2>
          <p className="mt-2 text-muted-foreground">
            For physical items, buyers may request a refund within 14 days of
            delivery if the item is significantly not as described, damaged in
            transit, or not received. The Seller is responsible for return
            shipping costs in cases of seller error.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Digital Products</h2>
          <p className="mt-2 text-muted-foreground">
            Digital downloads and templates are generally non-refundable once
            accessed or downloaded, as they cannot be &quot;returned.&quot;
            Exceptions may be made if the file is corrupt, substantially
            different from the listing, or not delivered.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Commissions</h2>
          <p className="mt-2 text-muted-foreground">
            Custom commission work is handled between Buyer and Seller. Refunds
            for commissions depend on the stage of completion and the
            Seller&apos;s individual policy. Contact the Seller directly before
            opening a dispute.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Dispute Resolution</h2>
          <p className="mt-2 text-muted-foreground">
            If you cannot resolve a refund issue directly with the Seller,
            contact us at{" "}
            <a
              href="mailto:support@redphantomops.com"
              className="font-medium text-primary"
            >
              support@redphantomops.com
            </a>
            . We will review the dispute and may mediate. Stripe&apos;s dispute
            process may also apply.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Platform Fees</h2>
          <p className="mt-2 text-muted-foreground">
            The 5% marketplace fee is non-refundable. Stripe processing fees
            are subject to Stripe&apos;s own refund policies.
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-accent/30 p-6 text-sm text-muted-foreground">
        <p>
          <strong>Need help?</strong> Contact{" "}
          <a
            href="mailto:support@redphantomops.com"
            className="font-medium text-primary"
          >
            support@redphantomops.com
          </a>
        </p>
        <p className="mt-1">
          RedPhantomOps LLC &middot; Registered in Florida, USA
        </p>
      </div>
    </div>
  );
}
