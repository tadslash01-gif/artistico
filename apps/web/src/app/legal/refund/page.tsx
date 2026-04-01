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
        Refund &amp; Return Policy
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: April 1, 2026 &middot; Last Updated: April 1, 2026
      </p>

      <div className="prose-sm mt-8 space-y-8 text-foreground">
        {/* ── 1. Marketplace Role ── */}
        <section>
          <h2 className="text-lg font-semibold">1. Marketplace Role</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico is a marketplace platform operated by RedPhantomOps LLC.
            Individual Sellers are the merchants of record for their products.{" "}
            <strong>
              We facilitate transactions but are not the seller of any goods or
              services listed on the Platform.
            </strong>{" "}
            Refund eligibility and procedures may vary by Seller and product
            type, subject to the minimum standards described below.
          </p>
        </section>

        {/* ── 2. Physical Products ── */}
        <section>
          <h2 className="text-lg font-semibold">2. Physical Products</h2>
          <p className="mt-2 text-muted-foreground">
            Buyers may request a refund for physical items within{" "}
            <strong>fourteen (14) days</strong> of confirmed delivery under the
            following conditions:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Damaged in Transit:</strong> The item arrived damaged or
              broken. Photographic evidence is required.
            </li>
            <li>
              <strong>Significantly Not as Described:</strong> The item
              materially differs from the listing description, images, or
              specifications.
            </li>
            <li>
              <strong>Non-Delivery:</strong> The item was not received within a
              reasonable period after the estimated delivery date (generally 30
              days for domestic, 60 days for international).
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Items must be returned in unused, original condition unless they
            arrived damaged. Return shipping costs are the Seller&apos;s
            responsibility for seller-error refunds (damage, misdescription).
            Sellers are not required to accept returns for buyer&apos;s remorse,
            though they may choose to do so under their own policies.
          </p>
        </section>

        {/* ── 3. Digital Products ── */}
        <section>
          <h2 className="text-lg font-semibold">3. Digital Products</h2>
          <p className="mt-2 text-muted-foreground">
            Digital downloads are generally{" "}
            <strong>non-refundable once accessed or downloaded</strong>, as they
            cannot be &quot;returned.&quot; Exceptions are made in the following
            cases:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Corrupt or Non-Functional File:</strong> The downloaded
              file is corrupt, damaged, or does not function as described.
            </li>
            <li>
              <strong>Substantially Different from Description:</strong> The
              delivered product materially differs from the listing.
            </li>
            <li>
              <strong>Non-Delivery:</strong> If the download link is
              unavailable or non-functional and the Seller does not resolve the
              issue within twenty-four (24) hours of notification, a refund may
              be issued.
            </li>
          </ul>
        </section>

        {/* ── 4. Templates ── */}
        <section>
          <h2 className="text-lg font-semibold">4. Templates</h2>
          <p className="mt-2 text-muted-foreground">
            Purchased templates are{" "}
            <strong>non-refundable once accessed</strong>. Exceptions may be
            granted if the template is materially different from its listing
            description or is non-functional. Contact the Seller first, then
            Platform support if unresolved.
          </p>
        </section>

        {/* ── 5. Commissions ── */}
        <section>
          <h2 className="text-lg font-semibold">5. Commission Work</h2>
          <p className="mt-2 text-muted-foreground">
            Custom commission work is governed by the{" "}
            <strong>Seller&apos;s individual terms and policies</strong>, which
            should be communicated before work begins. Refund eligibility
            depends on the stage of completion. The Platform encourages Buyers
            and Sellers to resolve commission disputes directly. The Platform
            may facilitate communication but does not mediate commission
            disputes beyond this.
          </p>
          <p className="mt-2 text-muted-foreground">
            Sellers offering commission work are required to clearly state their
            turnaround time, revision policy, and scope before accepting
            payment, per our{" "}
            <Link href="/legal/seller" className="font-medium text-primary">
              Seller Agreement
            </Link>
            .
          </p>
        </section>

        {/* ── 6. Platform Fee ── */}
        <section>
          <h2 className="text-lg font-semibold">6. Platform Fee</h2>
          <p className="mt-2 text-muted-foreground">
            <strong>
              The 5% marketplace commission fee is non-refundable.
            </strong>{" "}
            RedPhantomOps LLC retains the Platform Fee even in the event of a
            product refund. Stripe payment processing fees are subject to{" "}
            <a
              href="https://stripe.com/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
            >
              Stripe&apos;s own refund policies
            </a>
            .
          </p>
        </section>

        {/* ── 7. How to Request a Refund ── */}
        <section>
          <h2 className="text-lg font-semibold">7. How to Request a Refund</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Contact the Seller Directly:</strong> Reach out to the
              Seller through the Platform to discuss the issue. Most issues can
              be resolved at this stage.
            </li>
            <li>
              <strong>Platform Escalation:</strong> If you cannot resolve the
              issue with the Seller within seven (7) days, email{" "}
              <a
                href="mailto:support@redphantomops.com"
                className="font-medium text-primary"
              >
                support@redphantomops.com
              </a>{" "}
              with your order details, a description of the issue, and any
              supporting evidence (photos, screenshots, correspondence).
            </li>
            <li>
              <strong>Platform Review:</strong> Our team will review the dispute
              and may mediate a resolution. We may, at our sole discretion,
              issue a refund or partial refund.
            </li>
            <li>
              <strong>Stripe Dispute Process:</strong> If the matter remains
              unresolved, Buyers may initiate a dispute through their payment
              provider. Note that filing a Stripe dispute (chargeback) is a
              last resort — see Section 8 below.
            </li>
          </ol>
        </section>

        {/* ── 8. Chargebacks ── */}
        <section>
          <h2 className="text-lg font-semibold">8. Chargebacks</h2>
          <p className="mt-2 text-muted-foreground">
            We strongly encourage Buyers to use our dispute resolution process
            before initiating a payment dispute (chargeback) with their bank or
            credit card issuer. Chargebacks incur fees and disrupt the Platform
            for all parties.
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong>
              Fraudulent or abusive chargebacks — where a Buyer initiates a
              chargeback without first attempting resolution through the Platform,
              or where the chargeback claim is demonstrably false — may result in
              immediate account suspension or permanent termination.
            </strong>
          </p>
        </section>

        {/* ── 9. Seller Obligations ── */}
        <section>
          <h2 className="text-lg font-semibold">
            9. Seller Refund Obligations
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sellers are required to respond to refund requests within
            forty-eight (48) hours. Sellers who fail to respond to or
            unreasonably deny valid refund requests may be subject to
            Platform-initiated refunds charged to their account, account
            suspension, or termination. Full seller obligations are described
            in our{" "}
            <Link href="/legal/seller" className="font-medium text-primary">
              Seller Agreement
            </Link>
            .
          </p>
        </section>

        {/* ── 10. Florida Compliance ── */}
        <section>
          <h2 className="text-lg font-semibold">
            10. Consumer Protection Compliance
          </h2>
          <p className="mt-2 text-muted-foreground">
            This Refund Policy is designed to comply with the Florida Deceptive
            and Unfair Trade Practices Act (FDUTPA, Fla. Stat. §501.201 et
            seq.) and applicable Federal Trade Commission (FTC) guidelines.
            Nothing in this policy is intended to limit any consumer rights
            provided by applicable law. If any provision of this policy
            conflicts with mandatory consumer protection laws in your
            jurisdiction, the applicable law prevails.
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
