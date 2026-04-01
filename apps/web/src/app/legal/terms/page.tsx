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

      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: April 1, 2026 &middot; Last Updated: April 1, 2026
      </p>

      <div className="prose-sm mt-8 space-y-8 text-foreground">
        {/* ── 1. Acceptance ── */}
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-2 text-muted-foreground">
            These Terms of Service (&quot;Terms&quot;) constitute a legally
            binding agreement between you (&quot;User,&quot; &quot;you,&quot;
            &quot;your&quot;) and RedPhantomOps LLC, a Florida limited liability
            company (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot;
            &quot;our&quot;), governing your access to and use of the Artistico
            platform, website, and related services (collectively, the
            &quot;Platform&quot;).
          </p>
          <p className="mt-2 text-muted-foreground">
            By creating an account, accessing, or using the Platform, you
            acknowledge that you have read, understood, and agree to be bound by
            these Terms and our{" "}
            <Link href="/legal/privacy" className="font-medium text-primary">
              Privacy Policy
            </Link>
            , which is incorporated herein by reference. If you do not agree, you
            must not access or use the Platform.
          </p>
        </section>

        {/* ── 2. Company Identity ── */}
        <section>
          <h2 className="text-lg font-semibold">2. Company Identity</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico is owned and operated by RedPhantomOps LLC, a limited
            liability company organized under the laws of the State of Florida,
            United States of America. For legal inquiries, contact{" "}
            <a
              href="mailto:legal@redphantomops.com"
              className="font-medium text-primary"
            >
              legal@redphantomops.com
            </a>
            .
          </p>
        </section>

        {/* ── 3. Eligibility ── */}
        <section>
          <h2 className="text-lg font-semibold">3. Eligibility</h2>
          <p className="mt-2 text-muted-foreground">
            You must be at least eighteen (18) years of age, or the age of
            majority in your jurisdiction (whichever is greater), to use the
            Platform. By using the Platform, you represent and warrant that you
            meet this requirement and have the legal capacity to enter into these
            Terms. We do not knowingly collect information from or direct the
            Platform to individuals under 18.
          </p>
        </section>

        {/* ── 4. Account Registration ── */}
        <section>
          <h2 className="text-lg font-semibold">
            4. Account Registration &amp; Responsibility
          </h2>
          <p className="mt-2 text-muted-foreground">
            To access certain features, you must create an account. You agree to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Provide accurate, current, and complete information during
              registration and keep it up to date.
            </li>
            <li>
              Maintain the confidentiality of your password and account
              credentials.
            </li>
            <li>
              Not share, transfer, or permit others to use your account.
            </li>
            <li>
              Immediately notify us of any unauthorized use of your account.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            You are solely responsible for all activity under your account. We
            are not liable for any loss arising from unauthorized use of your
            account.
          </p>
        </section>

        {/* ── 5. Platform Role ── */}
        <section>
          <h2 className="text-lg font-semibold">
            5. Platform Role &amp; Marketplace Disclaimer
          </h2>
          <p className="mt-2 text-muted-foreground">
            <strong>
              Artistico is a marketplace platform — we are not the seller,
              manufacturer, supplier, or provider of any goods or services listed
              on the Platform.
            </strong>{" "}
            We provide the technology infrastructure that connects hobby creators
            (&quot;Sellers&quot;) with buyers (&quot;Buyers&quot;). All
            transactions are directly between Sellers and Buyers.
          </p>
          <p className="mt-2 text-muted-foreground">
            We do not inspect, verify, endorse, guarantee, or warrant the
            quality, safety, legality, accuracy, or authenticity of any listed
            items, seller representations, or user content. We are not
            responsible for the performance or conduct of any Seller or Buyer.
          </p>
        </section>

        {/* ── 6. User-Generated Content ── */}
        <section>
          <h2 className="text-lg font-semibold">6. User-Generated Content</h2>
          <p className="mt-2 text-muted-foreground">
            You retain ownership of all content you submit to the Platform
            (&quot;User Content&quot;), including product listings, project
            descriptions, images, and messages. By submitting User Content, you
            grant RedPhantomOps LLC a non-exclusive, worldwide, royalty-free,
            sublicensable license to use, display, reproduce, modify, and
            distribute your User Content solely for the purposes of operating,
            promoting, and improving the Platform.
          </p>
          <p className="mt-2 text-muted-foreground">
            You represent and warrant that you own or have the necessary rights
            to all User Content you submit and that such content does not
            infringe upon the intellectual property, privacy, or other rights of
            any third party.
          </p>
        </section>

        {/* ── 7. Acceptable Use ── */}
        <section>
          <h2 className="text-lg font-semibold">7. Acceptable Use Policy</h2>
          <p className="mt-2 text-muted-foreground">
            You agree not to use the Platform to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Violate any applicable federal, state, local, or international law
              or regulation.
            </li>
            <li>
              List, sell, or facilitate the sale of prohibited items, including
              but not limited to: weapons, ammunition, explosives, controlled
              substances, tobacco products, hazardous materials, stolen property,
              counterfeit goods, or items that infringe third-party intellectual
              property.
            </li>
            <li>
              Engage in fraud, misrepresentation, identity theft, or deceptive
              practices.
            </li>
            <li>
              Harass, threaten, abuse, or discriminate against other users.
            </li>
            <li>
              Distribute spam, malware, or engage in phishing activities.
            </li>
            <li>
              Scrape, crawl, or use automated means to access the Platform
              without our prior written consent.
            </li>
            <li>
              Manipulate prices, reviews, search results, or platform features.
            </li>
            <li>
              Circumvent or interfere with platform security or access controls.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            We reserve the right to remove any content and to suspend or
            permanently terminate any account that violates this policy, at our
            sole discretion and without prior notice.
          </p>
        </section>

        {/* ── 8. Marketplace Fees ── */}
        <section>
          <h2 className="text-lg font-semibold">8. Marketplace Fees</h2>
          <p className="mt-2 text-muted-foreground">
            Artistico charges a marketplace commission of five percent (5%) on
            each completed transaction (&quot;Platform Fee&quot;). The Platform
            Fee is deducted from the sale amount before the Seller receives their
            payout. Payment processing fees charged by Stripe, Inc. are
            additional and are not set or controlled by us.
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong>
              The Platform Fee is non-refundable, even in the event of a product
              refund.
            </strong>{" "}
            Sellers receive payouts via Stripe Connect. See our{" "}
            <Link href="/legal/payments" className="font-medium text-primary">
              Payment Terms
            </Link>{" "}
            for detailed payment information.
          </p>
        </section>

        {/* ── 9. IP & DMCA ── */}
        <section>
          <h2 className="text-lg font-semibold">
            9. Intellectual Property &amp; DMCA
          </h2>
          <p className="mt-2 text-muted-foreground">
            We respect intellectual property rights and expect all users to do
            the same. Sellers warrant that they hold sole ownership or valid
            license rights to all content they list on the Platform.
          </p>
          <h3 className="mt-4 text-base font-semibold">
            DMCA Takedown Procedure
          </h3>
          <p className="mt-2 text-muted-foreground">
            If you believe content on Artistico infringes your copyright, you may
            submit a notice pursuant to the Digital Millennium Copyright Act
            (&quot;DMCA&quot;) to our designated agent at{" "}
            <a
              href="mailto:legal@redphantomops.com"
              className="font-medium text-primary"
            >
              legal@redphantomops.com
            </a>
            . Your notice must include:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Identification of the copyrighted work claimed to be infringed.
            </li>
            <li>
              Identification of the infringing material and its location on the
              Platform.
            </li>
            <li>
              Your contact information (name, address, telephone, email).
            </li>
            <li>
              A statement that you have a good faith belief that the use is not
              authorized.
            </li>
            <li>
              A statement, under penalty of perjury, that the information is
              accurate and that you are the copyright owner or authorized to act
              on behalf of the owner.
            </li>
            <li>Your physical or electronic signature.</li>
          </ul>
          <h3 className="mt-4 text-base font-semibold">
            Counter-Notification
          </h3>
          <p className="mt-2 text-muted-foreground">
            If you believe your content was removed in error, you may file a
            counter-notification with the same designated agent. Counter-notices
            must include the information required by 17 U.S.C. § 512(g).
          </p>
          <h3 className="mt-4 text-base font-semibold">
            Repeat Infringer Policy
          </h3>
          <p className="mt-2 text-muted-foreground">
            We will terminate the accounts of users who are repeat infringers of
            intellectual property rights in appropriate circumstances.
          </p>
        </section>

        {/* ── 10. Limitation of Liability ── */}
        <section>
          <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
          <p className="mt-2 text-muted-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE PLATFORM IS
            PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS
            WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
            STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </p>
          <p className="mt-2 text-muted-foreground">
            IN NO EVENT SHALL REDPHANTOMOPS LLC, ITS MEMBERS, MANAGERS,
            OFFICERS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL,
            OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF
            OR INABILITY TO USE THE PLATFORM, ANY TRANSACTION CONDUCTED THROUGH
            THE PLATFORM, OR ANY CONDUCT OF ANY THIRD PARTY ON THE PLATFORM.
          </p>
          <p className="mt-2 text-muted-foreground">
            OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF
            OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE
            GREATER OF (A) THE TOTAL FEES PAID BY YOU TO US IN THE TWELVE (12)
            MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED UNITED STATES
            DOLLARS ($100.00).
          </p>
        </section>

        {/* ── 11. Indemnification ── */}
        <section>
          <h2 className="text-lg font-semibold">11. Indemnification</h2>
          <p className="mt-2 text-muted-foreground">
            You agree to indemnify, defend, and hold harmless RedPhantomOps LLC,
            its members, managers, officers, employees, agents, and affiliates
            from and against any and all claims, damages, losses, liabilities,
            costs, and expenses (including reasonable attorneys&apos; fees)
            arising out of or related to: (a) your use of or access to the
            Platform; (b) your User Content; (c) any transaction you enter into
            through the Platform; (d) your violation of these Terms; or (e) your
            violation of any rights of any third party.
          </p>
        </section>

        {/* ── 12. Dispute Resolution ── */}
        <section>
          <h2 className="text-lg font-semibold">12. Dispute Resolution</h2>

          <h3 className="mt-4 text-base font-semibold">
            12.1 Governing Law
          </h3>
          <p className="mt-2 text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the
            laws of the State of Florida, without regard to its conflict of law
            provisions.
          </p>

          <h3 className="mt-4 text-base font-semibold">
            12.2 Informal Resolution
          </h3>
          <p className="mt-2 text-muted-foreground">
            Before initiating any formal dispute proceedings, you agree to first
            attempt to resolve any dispute informally by contacting us at{" "}
            <a
              href="mailto:legal@redphantomops.com"
              className="font-medium text-primary"
            >
              legal@redphantomops.com
            </a>
            . We will attempt to resolve the dispute within thirty (30) days. If
            the dispute is not resolved within this period, either party may
            proceed as outlined below.
          </p>

          <h3 className="mt-4 text-base font-semibold">
            12.3 Binding Arbitration
          </h3>
          <p className="mt-2 text-muted-foreground">
            <strong>
              PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS.
            </strong>{" "}
            Any dispute, claim, or controversy arising out of or relating to
            these Terms or the Platform that is not resolved informally shall be
            resolved by binding individual arbitration administered by the
            American Arbitration Association (&quot;AAA&quot;) under its
            Commercial Arbitration Rules. The arbitration shall be conducted in
            the State of Florida. The arbitrator&apos;s decision shall be final
            and binding and may be entered as a judgment in any court of
            competent jurisdiction.
          </p>

          <h3 className="mt-4 text-base font-semibold">
            12.4 Class Action Waiver
          </h3>
          <p className="mt-2 text-muted-foreground">
            <strong>
              YOU AND REDPHANTOMOPS LLC AGREE THAT EACH MAY BRING CLAIMS AGAINST
              THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A
              PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR
              REPRESENTATIVE ACTION.
            </strong>{" "}
            The arbitrator may not consolidate more than one person&apos;s claims
            and may not preside over any form of class or representative
            proceeding.
          </p>

          <h3 className="mt-4 text-base font-semibold">
            12.5 Small Claims Exception
          </h3>
          <p className="mt-2 text-muted-foreground">
            Notwithstanding the above, either party may bring an individual
            action in small claims court for disputes or claims within the
            court&apos;s jurisdictional limit (generally up to $10,000).
          </p>

          <h3 className="mt-4 text-base font-semibold">
            12.6 Venue
          </h3>
          <p className="mt-2 text-muted-foreground">
            For any claims not subject to arbitration, you consent to the
            exclusive jurisdiction of the state and federal courts located in
            the State of Florida.
          </p>
        </section>

        {/* ── 13. Payment Processing ── */}
        <section>
          <h2 className="text-lg font-semibold">
            13. Payment Processing Disclaimer
          </h2>
          <p className="mt-2 text-muted-foreground">
            All payment processing on the Platform is handled by Stripe, Inc.
            (&quot;Stripe&quot;), a third-party payment processor. By using the
            Platform, you agree to be bound by Stripe&apos;s{" "}
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
          <p className="mt-2 text-muted-foreground">
            We are not responsible for any errors, outages, delays, or failures
            in payment processing by Stripe. We do not store your credit card or
            bank account information on our servers. See our{" "}
            <Link href="/legal/payments" className="font-medium text-primary">
              Payment Terms
            </Link>{" "}
            for full details.
          </p>
        </section>

        {/* ── 14. Termination ── */}
        <section>
          <h2 className="text-lg font-semibold">14. Termination</h2>
          <p className="mt-2 text-muted-foreground">
            We may suspend or terminate your account and access to the Platform
            at our sole discretion, with or without cause and with or without
            notice, including for violation of these Terms. Upon termination:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Your right to access and use the Platform will immediately cease.
            </li>
            <li>
              We may retain data as required by law or legitimate business
              interests.
            </li>
            <li>
              Pending transactions will be completed or canceled at our
              discretion.
            </li>
            <li>
              Outstanding seller payouts for completed, undisputed orders will
              be disbursed per our{" "}
              <Link
                href="/legal/seller"
                className="font-medium text-primary"
              >
                Seller Agreement
              </Link>
              .
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            You may delete your account at any time by contacting{" "}
            <a
              href="mailto:support@redphantomops.com"
              className="font-medium text-primary"
            >
              support@redphantomops.com
            </a>
            . Sections that by their nature should survive termination
            (including, without limitation, Sections 6, 10, 11, 12, and 16) will
            survive.
          </p>
        </section>

        {/* ── 15. Modifications ── */}
        <section>
          <h2 className="text-lg font-semibold">15. Modification of Terms</h2>
          <p className="mt-2 text-muted-foreground">
            We reserve the right to modify these Terms at any time. For material
            changes, we will provide at least thirty (30) days&apos; advance
            notice by posting the updated Terms on the Platform and updating the
            &quot;Last Updated&quot; date. For registered users, we may also send
            notice via email. Your continued use of the Platform after the
            effective date of the revised Terms constitutes acceptance.
          </p>
        </section>

        {/* ── 16. General Provisions ── */}
        <section>
          <h2 className="text-lg font-semibold">16. General Provisions</h2>

          <h3 className="mt-4 text-base font-semibold">Severability</h3>
          <p className="mt-2 text-muted-foreground">
            If any provision of these Terms is found to be unenforceable or
            invalid, that provision shall be modified to the minimum extent
            necessary to make it enforceable, or if modification is not possible,
            severed. The remaining provisions shall remain in full force and
            effect.
          </p>

          <h3 className="mt-4 text-base font-semibold">Entire Agreement</h3>
          <p className="mt-2 text-muted-foreground">
            These Terms, together with the Privacy Policy, Refund Policy, Seller
            Agreement (if applicable), and Payment Terms, constitute the entire
            agreement between you and RedPhantomOps LLC with respect to the
            Platform and supersede all prior or contemporaneous agreements.
          </p>

          <h3 className="mt-4 text-base font-semibold">Waiver</h3>
          <p className="mt-2 text-muted-foreground">
            The failure of RedPhantomOps LLC to enforce any right or provision of
            these Terms shall not constitute a waiver of such right or provision.
          </p>

          <h3 className="mt-4 text-base font-semibold">Assignment</h3>
          <p className="mt-2 text-muted-foreground">
            You may not assign or transfer these Terms without our prior written
            consent. We may assign these Terms without restriction, including in
            connection with a merger, acquisition, or sale of assets.
          </p>

          <h3 className="mt-4 text-base font-semibold">Force Majeure</h3>
          <p className="mt-2 text-muted-foreground">
            We shall not be liable for any failure or delay in performance
            resulting from causes beyond our reasonable control, including but
            not limited to natural disasters, pandemics, government actions,
            internet or telecommunications failures, or third-party service
            outages.
          </p>
        </section>

        {/* ── 17. Contact ── */}
        <section>
          <h2 className="text-lg font-semibold">17. Contact Information</h2>
          <p className="mt-2 text-muted-foreground">
            For questions about these Terms, contact:
          </p>
          <div className="mt-2 text-muted-foreground">
            <p>RedPhantomOps LLC</p>
            <p>State of Florida, United States</p>
            <p>
              Email:{" "}
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
