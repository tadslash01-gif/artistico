import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Terms",
  description:
    "Payment processing terms and Stripe disclosures for the Artistico marketplace.",
};

export default function PaymentTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/legal"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Legal
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-foreground">
        Payment Terms
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: April 1, 2026 &middot; Last Updated: April 1, 2026
      </p>

      <div className="prose-sm mt-8 space-y-8 text-foreground">
        {/* ── 1. Payment Processing ── */}
        <section>
          <h2 className="text-lg font-semibold">1. Payment Processing</h2>
          <p className="mt-2 text-muted-foreground">
            All payment processing on the Artistico marketplace is handled by{" "}
            <strong>Stripe, Inc.</strong> (&quot;Stripe&quot;), a third-party
            payment processor. RedPhantomOps LLC does not directly process,
            store, or have access to your payment card data. By making a
            purchase or receiving payouts on the Platform, you agree to
            Stripe&apos;s{" "}
            <a
              href="https://stripe.com/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* ── 2. Buyer Payments ── */}
        <section>
          <h2 className="text-lg font-semibold">2. Buyer Payments</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Accepted Methods:</strong> Credit cards, debit cards, and
              other payment methods supported by Stripe.
            </li>
            <li>
              <strong>Currency:</strong> All prices are displayed and processed
              in United States Dollars (USD).
            </li>
            <li>
              <strong>Pricing:</strong> Product prices are set by individual
              Sellers. Shipping costs (for physical products) are calculated at
              checkout. The displayed price is the product price; applicable
              shipping is added separately.
            </li>
            <li>
              <strong>Sales Tax:</strong> Where required by applicable
              marketplace facilitator laws, Artistico will calculate and collect
              sales tax at checkout. Tax amounts are displayed before payment
              confirmation.
            </li>
            <li>
              <strong>Authorization:</strong> When you initiate a purchase, your
              payment method is authorized by Stripe. You are charged upon
              successful completion of the checkout session.
            </li>
          </ul>
        </section>

        {/* ── 3. Seller Payouts ── */}
        <section>
          <h2 className="text-lg font-semibold">3. Seller Payouts</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Payout Method:</strong> Seller payouts are disbursed via
              Stripe Connect Express accounts. Sellers must complete Stripe
              onboarding and maintain an active, verified Stripe account to
              receive payouts.
            </li>
            <li>
              <strong>Payout Schedule:</strong> Payouts are processed per
              Stripe&apos;s default schedule, typically within two (2) to seven
              (7) business days after the payment is captured. Actual timing may
              vary based on Stripe&apos;s policies, the seller&apos;s country,
              and the seller&apos;s bank.
            </li>
            <li>
              <strong>Payout Failures:</strong> If a payout fails due to issues
              with your Stripe account (expired bank details, verification
              issues, etc.), it is your responsibility to resolve the issue with
              Stripe. RedPhantomOps LLC is not responsible for payout delays or
              failures caused by Stripe account issues.
            </li>
            <li>
              <strong>Minimum Payout:</strong> Subject to Stripe&apos;s minimum
              payout thresholds.
            </li>
          </ul>
        </section>

        {/* ── 4. Platform Fees ── */}
        <section>
          <h2 className="text-lg font-semibold">4. Platform Fees</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Marketplace Commission:</strong> Artistico charges a five
              percent (5%) commission on each completed sale. This fee is
              calculated on the total product sale price (excluding shipping).
            </li>
            <li>
              <strong>Deduction Method:</strong> The Platform Fee is deducted
              automatically from each transaction before the seller payout is
              disbursed, using Stripe&apos;s{" "}
              <code className="rounded bg-accent px-1 text-xs">
                application_fee_amount
              </code>{" "}
              mechanism.
            </li>
            <li>
              <strong>Non-Refundable:</strong> The Platform Fee is
              non-refundable, even if the buyer subsequently receives a product
              refund. This applies to all refund types (seller-initiated,
              buyer-initiated, or Platform-initiated).
            </li>
            <li>
              <strong>Stripe Processing Fees:</strong> In addition to the
              Platform Fee, Stripe charges its own payment processing fees (e.g.,
              2.9% + $0.30 per transaction for US cards — rates are set by Stripe
              and may vary). These fees are deducted from the transaction and are
              not set or controlled by Artistico.
            </li>
          </ul>
        </section>

        {/* ── 5. Stripe Relationship ── */}
        <section>
          <h2 className="text-lg font-semibold">
            5. Stripe Relationship &amp; Disclaimer
          </h2>
          <p className="mt-2 text-muted-foreground">
            Stripe is an independent third-party service provider. RedPhantomOps
            LLC is not an agent, partner, or affiliate of Stripe.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              We are not responsible for Stripe service outages, downtime,
              processing errors, or changes to Stripe&apos;s fees or terms.
            </li>
            <li>
              Stripe handles PCI DSS compliance for all payment card data. We
              do not process or store card numbers, CVVs, or other sensitive
              payment data on our servers.
            </li>
            <li>
              Users are subject to Stripe&apos;s terms and should review
              Stripe&apos;s policies for information about how Stripe handles
              their data.
            </li>
          </ul>
        </section>

        {/* ── 6. Fraud & Disputes ── */}
        <section>
          <h2 className="text-lg font-semibold">6. Fraud &amp; Disputes</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Fraud Monitoring:</strong> We and Stripe monitor
              transactions for potentially fraudulent activity. Suspicious
              transactions may be delayed, declined, or flagged for review.
            </li>
            <li>
              <strong>Chargebacks:</strong> Payment disputes (chargebacks)
              initiated by buyers with their payment provider are handled
              through Stripe&apos;s dispute process. When a chargeback is filed,
              the disputed funds are held by Stripe pending resolution. The order
              is marked as &quot;disputed&quot; on the Platform.
            </li>
            <li>
              <strong>Seller Dispute Response:</strong> Sellers may be required
              to provide evidence (tracking information, order details,
              communication records) to contest a chargeback through
              Stripe&apos;s dispute resolution process.
            </li>
            <li>
              <strong>Fraudulent Activity:</strong> Any user found engaging in
              fraudulent payment activity (including fraudulent chargebacks,
              card testing, or identity fraud) may have their account
              immediately terminated and may be reported to law enforcement.
            </li>
          </ul>
        </section>

        {/* ── 7. Payment Security ── */}
        <section>
          <h2 className="text-lg font-semibold">7. Payment Security</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>No Card Storage:</strong> Credit card numbers and
              sensitive payment data are never stored on Artistico servers. All
              payment data is handled directly by Stripe.
            </li>
            <li>
              <strong>Encryption:</strong> All payment transactions are
              encrypted using TLS (Transport Layer Security).
            </li>
            <li>
              <strong>Tokenization:</strong> Stripe uses tokenization to secure
              card information — your actual card details are replaced with a
              secure token during processing.
            </li>
            <li>
              <strong>PCI Compliance:</strong> Stripe maintains PCI DSS Level 1
              certification, the highest level of payment security compliance.
            </li>
          </ul>
        </section>

        {/* ── 8. Refund Processing ── */}
        <section>
          <h2 className="text-lg font-semibold">8. Refund Processing</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Refunds are processed through the original payment method via
              Stripe.
            </li>
            <li>
              Refund timing: five (5) to ten (10) business days after the
              refund is initiated, depending on your card issuer and bank.
            </li>
            <li>
              The 5% Platform Fee is not included in the refund (see our{" "}
              <Link href="/legal/refund" className="font-medium text-primary">
                Refund Policy
              </Link>
              ).
            </li>
            <li>
              Partial refunds may be issued at the discretion of the Seller or
              the Platform.
            </li>
          </ul>
        </section>

        {/* ── 9. Tax Reporting ── */}
        <section>
          <h2 className="text-lg font-semibold">9. Tax Reporting</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Artistico, through Stripe, may issue IRS Form 1099-K to Sellers
              who meet the applicable IRS reporting thresholds for payment card
              and third-party network transactions.
            </li>
            <li>
              Sellers are solely responsible for determining and fulfilling their
              own income tax obligations. Artistico does not provide tax advice.
            </li>
            <li>
              Sellers should consult a qualified tax professional regarding
              their reporting obligations.
            </li>
          </ul>
        </section>

        {/* ── 10. Contact ── */}
        <section>
          <h2 className="text-lg font-semibold">10. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            For payment-related questions or billing inquiries, contact:
          </p>
          <div className="mt-2 text-muted-foreground">
            <p>RedPhantomOps LLC</p>
            <p>State of Florida, United States</p>
            <p>
              Billing Inquiries:{" "}
              <a
                href="mailto:billing@redphantomops.com"
                className="font-medium text-primary"
              >
                billing@redphantomops.com
              </a>
            </p>
            <p>
              General Support:{" "}
              <a
                href="mailto:support@redphantomops.com"
                className="font-medium text-primary"
              >
                support@redphantomops.com
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-accent/30 p-6 text-sm text-muted-foreground">
        <p>
          <strong>Questions?</strong> Contact{" "}
          <a
            href="mailto:billing@redphantomops.com"
            className="font-medium text-primary"
          >
            billing@redphantomops.com
          </a>
        </p>
        <p className="mt-1">
          RedPhantomOps LLC &middot; Registered in Florida, USA
        </p>
      </div>
    </div>
  );
}
