import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Agreement",
  description:
    "Seller Agreement for creators listing and selling on the Artistico marketplace.",
};

export default function SellerAgreementPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/legal"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Legal
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-foreground">
        Seller Agreement
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: April 1, 2026 &middot; Last Updated: April 1, 2026
      </p>

      <div className="prose-sm mt-8 space-y-8 text-foreground">
        {/* ── 1. Agreement to Terms ── */}
        <section>
          <h2 className="text-lg font-semibold">1. Agreement to Terms</h2>
          <p className="mt-2 text-muted-foreground">
            This Seller Agreement (&quot;Agreement&quot;) is a legally binding
            contract between you (&quot;Seller,&quot; &quot;Creator,&quot;
            &quot;you&quot;) and RedPhantomOps LLC, a Florida limited liability
            company (&quot;Company,&quot; &quot;we,&quot; &quot;us&quot;),
            governing your use of the Artistico marketplace platform (the
            &quot;Platform&quot;) as a seller or creator.
          </p>
          <p className="mt-2 text-muted-foreground">
            By registering as a creator on Artistico, you acknowledge that you
            have read, understood, and agree to be bound by this Agreement, our{" "}
            <Link href="/legal/terms" className="font-medium text-primary">
              Terms of Service
            </Link>
            , our{" "}
            <Link href="/legal/privacy" className="font-medium text-primary">
              Privacy Policy
            </Link>
            , and our{" "}
            <Link href="/legal/payments" className="font-medium text-primary">
              Payment Terms
            </Link>
            . This Agreement supplements the Terms of Service; in the event of a
            conflict between this Agreement and the Terms of Service, this
            Agreement prevails with respect to seller-specific matters.
          </p>
        </section>

        {/* ── 2. Eligibility ── */}
        <section>
          <h2 className="text-lg font-semibold">2. Eligibility</h2>
          <p className="mt-2 text-muted-foreground">To sell on Artistico, you must:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Be at least eighteen (18) years of age, or the age of majority in
              your jurisdiction (whichever is greater).
            </li>
            <li>
              Have the legal authority to enter into binding contracts and to
              sell the items you list.
            </li>
            <li>
              Complete Stripe Connect onboarding and maintain an active, verified
              Stripe Express account for receiving payouts.
            </li>
            <li>
              Provide accurate and complete information during creator
              registration.
            </li>
          </ul>
        </section>

        {/* ── 3. Seller Responsibilities ── */}
        <section>
          <h2 className="text-lg font-semibold">3. Seller Responsibilities</h2>
          <p className="mt-2 text-muted-foreground">
            As a Seller on Artistico, you are responsible for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Accurate Listings:</strong> All product listings must
              accurately represent the item being sold, including descriptions,
              images, materials, dimensions, and pricing. Misleading or
              deceptive listings are prohibited.
            </li>
            <li>
              <strong>Quality:</strong> Products must be of the quality
              represented in the listing. Handcrafted and custom items should
              meet reasonable standards of craftsmanship.
            </li>
            <li>
              <strong>Inventory Management:</strong> Maintaining accurate
              inventory counts. You must not accept orders for items you cannot
              fulfill.
            </li>
            <li>
              <strong>Legal Compliance:</strong> Complying with all applicable
              federal, state, and local laws, including product safety
              regulations, labeling requirements, and intellectual property laws.
            </li>
            <li>
              <strong>Customer Communication:</strong> Responding to buyer
              inquiries in a timely manner (within 48 hours).
            </li>
          </ul>
        </section>

        {/* ── 4. Prohibited Items ── */}
        <section>
          <h2 className="text-lg font-semibold">4. Prohibited Items</h2>
          <p className="mt-2 text-muted-foreground">
            The following items may not be listed or sold on Artistico:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Illegal goods or items that violate federal, state, or local law.
            </li>
            <li>
              Weapons, ammunition, explosives, or items designed to cause harm.
            </li>
            <li>Controlled substances, drugs, drug paraphernalia, or tobacco products.</li>
            <li>Hazardous materials or recalled products.</li>
            <li>
              Counterfeit, replica, or unauthorized reproductions of branded
              items.
            </li>
            <li>
              Items that infringe upon third-party copyrights, trademarks, or
              other intellectual property rights.
            </li>
            <li>
              Items requiring special licenses or permits unless you hold valid
              documentation.
            </li>
            <li>Sexually explicit or adult content.</li>
            <li>
              Live animals or products derived from endangered species.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            We reserve the right to remove any listing and suspend any account
            that lists prohibited items, without prior notice.
          </p>
        </section>

        {/* ── 5. Shipping ── */}
        <section>
          <h2 className="text-lg font-semibold">
            5. Shipping Obligations (Physical Products)
          </h2>
          <p className="mt-2 text-muted-foreground">
            For physical products, you agree to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Ship items within the timeframe stated in your listing, or within
              five (5) business days of order confirmation if no timeframe is
              specified.
            </li>
            <li>
              Provide a valid tracking number to the buyer for all shipments.
            </li>
            <li>
              Accurately represent shipping costs in your listings. Overcharging
              for shipping is prohibited.
            </li>
            <li>
              Package items securely to prevent damage during transit.
            </li>
            <li>
              Comply with all applicable shipping carrier terms and conditions.
            </li>
            <li>
              For international orders (to the US, Canada, United Kingdom, or
              Australia): clearly disclose any customs duties or additional fees
              the buyer may incur.
            </li>
          </ul>
        </section>

        {/* ── 6. Digital Products ── */}
        <section>
          <h2 className="text-lg font-semibold">6. Digital Product Delivery</h2>
          <p className="mt-2 text-muted-foreground">
            For digital products and templates, you agree to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Ensure all files are functional, virus-free, and match the listing
              description.
            </li>
            <li>
              Maintain download availability for a minimum of twelve (12)
              months after purchase.
            </li>
            <li>
              Clearly disclose file formats, software requirements, and any
              limitations.
            </li>
          </ul>
        </section>

        {/* ── 7. Commissions ── */}
        <section>
          <h2 className="text-lg font-semibold">7. Commission Work</h2>
          <p className="mt-2 text-muted-foreground">
            If you offer commission work, you must:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Clearly state the turnaround time, number of included revisions,
              scope of work, and any conditions before accepting payment.
            </li>
            <li>
              Deliver commissioned work within the stated timeframe, or
              communicate delays promptly to the buyer.
            </li>
            <li>
              Maintain your own clear refund/cancellation policy for commission
              work.
            </li>
          </ul>
        </section>

        {/* ── 8. Pricing & Fees ── */}
        <section>
          <h2 className="text-lg font-semibold">8. Pricing &amp; Fees</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Pricing:</strong> You set your own product prices. The
              minimum listing price is $0.50 USD.
            </li>
            <li>
              <strong>Platform Fee:</strong> Artistico deducts a five percent
              (5%) marketplace commission on each completed sale. This fee is
              calculated on the total sale price and deducted before payout.
            </li>
            <li>
              <strong>Stripe Processing Fees:</strong> Stripe charges additional
              payment processing fees that are deducted from the transaction.
              These fees are set by Stripe and are not controlled by us.
            </li>
            <li>
              <strong>Seller Payout:</strong> You receive ninety-five percent
              (95%) of the sale price, minus Stripe processing fees, via your
              Stripe Connect Express account.
            </li>
            <li>
              <strong>Payout Timing:</strong> Payouts are processed per
              Stripe&apos;s default schedule (typically two (2) to seven (7)
              business days after payment). Payout timing is controlled by Stripe
              and not by Artistico.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            See our{" "}
            <Link href="/legal/payments" className="font-medium text-primary">
              Payment Terms
            </Link>{" "}
            for complete payment details.
          </p>
        </section>

        {/* ── 9. Refund Handling ── */}
        <section>
          <h2 className="text-lg font-semibold">9. Refund Handling</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              You must respond to all refund requests within{" "}
              <strong>forty-eight (48) hours</strong>.
            </li>
            <li>
              For physical product returns due to seller error (damage,
              misdescription): you must provide return instructions and bear the
              cost of return shipping.
            </li>
            <li>
              For digital product issues: you must attempt to resolve the issue
              (e.g., re-send file, provide corrected version) within 24 hours.
            </li>
            <li>
              If you fail to respond to or unreasonably deny a valid refund
              request, the Platform reserves the right to issue a refund on your
              behalf, deducting the refund amount from your pending payouts or
              future earnings.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            The 5% Platform Fee is not returned to the Seller in the event of a
            refund. See our{" "}
            <Link href="/legal/refund" className="font-medium text-primary">
              Refund Policy
            </Link>{" "}
            for buyer-facing refund procedures and timelines.
          </p>
        </section>

        {/* ── 10. Intellectual Property ── */}
        <section>
          <h2 className="text-lg font-semibold">10. Intellectual Property</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Ownership Warranty:</strong> You represent and warrant that
              you are the sole owner or hold valid license rights to all content,
              designs, images, and products you list on the Platform, and that
              such content does not infringe the intellectual property rights of
              any third party.
            </li>
            <li>
              <strong>Platform License:</strong> You grant RedPhantomOps LLC a
              non-exclusive, worldwide, royalty-free license to display,
              reproduce, and distribute your listing content solely for the
              purposes of operating, marketing, and promoting the Platform and
              your products.
            </li>
            <li>
              <strong>Indemnification:</strong> You agree to indemnify and hold
              harmless RedPhantomOps LLC from any claims, damages, or expenses
              (including attorneys&apos; fees) arising from intellectual property
              infringement related to your listings.
            </li>
            <li>
              <strong>DMCA Compliance:</strong> You must comply with the Digital
              Millennium Copyright Act. Repeat infringement will result in
              account termination.
            </li>
          </ul>
        </section>

        {/* ── 11. Taxes ── */}
        <section>
          <h2 className="text-lg font-semibold">11. Taxes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              You are solely responsible for determining, collecting, and
              remitting all applicable taxes on your income from sales through
              the Platform.
            </li>
            <li>
              Artistico may issue IRS Form 1099-K to sellers who meet the
              applicable IRS reporting thresholds.
            </li>
            <li>
              Where required by applicable marketplace facilitator laws,
              Artistico will collect and remit sales tax on behalf of Sellers.
            </li>
            <li>
              You are responsible for maintaining accurate financial records
              related to your sales.
            </li>
          </ul>
        </section>

        {/* ── 12. Suspension & Termination ── */}
        <section>
          <h2 className="text-lg font-semibold">
            12. Account Suspension &amp; Termination
          </h2>
          <p className="mt-2 text-muted-foreground">
            We may suspend or terminate your seller account for any of the
            following reasons:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Violation of this Agreement or the Terms of Service.</li>
            <li>Fraudulent activity or deceptive practices.</li>
            <li>Intellectual property infringement or repeat DMCA violations.</li>
            <li>
              Excessive chargebacks, disputes, or unresolved refund requests.
            </li>
            <li>Listing prohibited items.</li>
            <li>
              Extended inactivity (180+ days with no listings or sales).
            </li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">Enforcement Process</h3>
          <p className="mt-2 text-muted-foreground">
            For non-critical violations, our general enforcement process is:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Written warning with explanation of the violation.</li>
            <li>
              Temporary suspension (7–30 days) for repeated or serious
              violations.
            </li>
            <li>Permanent account termination for continued violations.</li>
          </ol>
          <p className="mt-2 text-muted-foreground">
            For severe violations (fraud, illegal activity, safety concerns), we
            may bypass the warning process and immediately suspend or terminate
            your account.
          </p>

          <h3 className="mt-4 text-base font-semibold">Appeal Process</h3>
          <p className="mt-2 text-muted-foreground">
            You may appeal a suspension or termination by contacting{" "}
            <a
              href="mailto:seller-support@redphantomops.com"
              className="font-medium text-primary"
            >
              seller-support@redphantomops.com
            </a>{" "}
            within fourteen (14) days of the action. Appeals will be reviewed
            within ten (10) business days.
          </p>

          <h3 className="mt-4 text-base font-semibold">
            Outstanding Payouts
          </h3>
          <p className="mt-2 text-muted-foreground">
            Upon termination, outstanding payouts for completed, undisputed
            orders will be disbursed per the normal Stripe payout schedule.
            Payouts may be held for orders that are subject to active disputes
            or chargebacks.
          </p>
        </section>

        {/* ── 13. Representations & Warranties ── */}
        <section>
          <h2 className="text-lg font-semibold">
            13. Representations &amp; Warranties
          </h2>
          <p className="mt-2 text-muted-foreground">
            By listing products on Artistico, you represent and warrant that:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              All products are safe for their intended use and comply with
              applicable product safety regulations.
            </li>
            <li>
              All listing information is accurate, truthful, and not misleading.
            </li>
            <li>
              You have the legal right to sell the products you list and to
              transfer title and possession to buyers.
            </li>
            <li>
              Your activities on the Platform comply with all applicable laws and
              regulations.
            </li>
          </ul>
        </section>

        {/* ── 14. Limitation of Liability ── */}
        <section>
          <h2 className="text-lg font-semibold">14. Limitation of Liability</h2>
          <p className="mt-2 text-muted-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, REDPHANTOMOPS LLC SHALL NOT
            BE LIABLE TO SELLERS FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
            LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, ARISING
            FROM: (A) BUYER DISPUTES OR CHARGEBACKS; (B) CHANGES TO THE
            PLATFORM, FEES, OR POLICIES; (C) STRIPE OUTAGES, PROCESSING ERRORS,
            OR PAYOUT DELAYS; (D) MARKET CONDITIONS OR CHANGES IN DEMAND; OR (E)
            ANY THIRD-PARTY ACTIONS OR CONDUCT.
          </p>
        </section>

        {/* ── 15. Governing Law ── */}
        <section>
          <h2 className="text-lg font-semibold">15. Governing Law</h2>
          <p className="mt-2 text-muted-foreground">
            This Agreement shall be governed by and construed in accordance with
            the laws of the State of Florida, without regard to conflict of law
            provisions. Disputes are subject to the dispute resolution
            procedures outlined in our{" "}
            <Link href="/legal/terms" className="font-medium text-primary">
              Terms of Service
            </Link>{" "}
            (Section 12), including binding arbitration and class action waiver.
          </p>
        </section>

        {/* ── 16. Contact ── */}
        <section>
          <h2 className="text-lg font-semibold">16. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            For questions about this Seller Agreement, contact:
          </p>
          <div className="mt-2 text-muted-foreground">
            <p>RedPhantomOps LLC</p>
            <p>State of Florida, United States</p>
            <p>
              Seller Support:{" "}
              <a
                href="mailto:seller-support@redphantomops.com"
                className="font-medium text-primary"
              >
                seller-support@redphantomops.com
              </a>
            </p>
            <p>
              Legal Inquiries:{" "}
              <a
                href="mailto:legal@redphantomops.com"
                className="font-medium text-primary"
              >
                legal@redphantomops.com
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-accent/30 p-6 text-sm text-muted-foreground">
        <p>
          <strong>Questions?</strong> Contact{" "}
          <a
            href="mailto:seller-support@redphantomops.com"
            className="font-medium text-primary"
          >
            seller-support@redphantomops.com
          </a>
        </p>
        <p className="mt-1">
          RedPhantomOps LLC &middot; Registered in Florida, USA
        </p>
      </div>
    </div>
  );
}
