import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Artistico, a marketplace for hobby creators operated by RedPhantomOps LLC.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/legal"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Legal
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-foreground">
        Terms of Service
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
          These Terms of Service are currently being finalized with legal
          counsel. The complete, legally-reviewed terms will be published at{" "}
          <a
            href="https://legal.redphantomops.com/terms"
            className="font-medium underline"
          >
            legal.redphantomops.com/terms
          </a>
          . By using Artistico during this period, you agree to the key points
          outlined below.
        </p>
      </div>

      <div className="prose-sm mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Platform Overview</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico (&quot;the Platform&quot;) is a marketplace operated by
            RedPhantomOps LLC (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;),
            a limited liability company registered in the State of Florida, USA.
            The Platform connects hobby creators (&quot;Sellers&quot;) with
            buyers (&quot;Buyers&quot;) for the sale of handcrafted goods,
            digital assets, templates, and commission work.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Platform Role</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico acts solely as an intermediary marketplace. We are not the
            seller, manufacturer, or provider of any goods or services listed by
            Sellers. We do not inspect, guarantee, or warrant the quality,
            safety, or legality of listed items.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Acceptable Use</h2>
          <p className="mt-2 text-muted-foreground">
            Users must not use the Platform for illegal activities, fraudulent
            transactions, or the sale of prohibited goods. We reserve the right
            to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Fees</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico charges a 5% marketplace fee on each sale. Payment
            processing fees (Stripe) are additional and vary by transaction type.
            Sellers receive payouts via Stripe Connect.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Limitation of Liability</h2>
          <p className="mt-2 text-muted-foreground">
            To the fullest extent permitted by applicable law, RedPhantomOps LLC
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of the
            Platform or any transactions conducted through it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Governing Law</h2>
          <p className="mt-2 text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the
            laws of the State of Florida, without regard to conflict of law
            principles. Any disputes shall be resolved in the courts of Florida.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            7. Intellectual Property & DMCA
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sellers retain ownership of their content. If you believe content
            infringes your intellectual property, contact us at{" "}
            <a
              href="mailto:legal@redphantomops.com"
              className="font-medium text-primary"
            >
              legal@redphantomops.com
            </a>{" "}
            with a DMCA takedown notice.
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-accent/30 p-6 text-sm text-muted-foreground">
        <p>
          <strong>Questions?</strong> Contact{" "}
          <a
            href="mailto:legal@redphantomops.com"
            className="font-medium text-primary"
          >
            legal@redphantomops.com
          </a>
        </p>
        <p className="mt-1">
          RedPhantomOps LLC &middot; Registered in Florida, USA
        </p>
      </div>
    </div>
  );
}
