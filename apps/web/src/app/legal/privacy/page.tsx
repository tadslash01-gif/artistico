import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Artistico — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/legal"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Legal
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-foreground">
        Privacy Policy
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Effective Date: April 1, 2026 &middot; Last Updated: April 1, 2026
      </p>

      <div className="prose-sm mt-8 space-y-8 text-foreground">
        {/* ── 1. Introduction ── */}
        <section>
          <h2 className="text-lg font-semibold">1. Introduction &amp; Scope</h2>
          <p className="mt-2 text-muted-foreground">
            RedPhantomOps LLC (&quot;Company,&quot; &quot;we,&quot;
            &quot;us,&quot; &quot;our&quot;), a Florida limited liability
            company, operates the Artistico marketplace platform (the
            &quot;Platform&quot;). This Privacy Policy describes how we collect,
            use, disclose, and protect your personal information when you access
            or use the Platform. This policy applies to all users, including
            Buyers, Sellers, and visitors.
          </p>
          <p className="mt-2 text-muted-foreground">
            By using the Platform, you consent to the practices described in this
            Privacy Policy. If you do not agree, please discontinue use
            immediately.
          </p>
        </section>

        {/* ── 2. Information We Collect ── */}
        <section>
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>

          <h3 className="mt-4 text-base font-semibold">
            2.1 Information You Provide
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Account Information:</strong> Display name, email address,
              and password (stored as a cryptographic hash by Firebase
              Authentication).
            </li>
            <li>
              <strong>Profile Information:</strong> Bio, location, specialties,
              social media links, and profile images.
            </li>
            <li>
              <strong>Transaction Information:</strong> Shipping addresses and
              order details. Payment card data is collected and processed
              directly by Stripe and is never stored on our servers.
            </li>
            <li>
              <strong>Content:</strong> Projects, product listings, images,
              descriptions, and messages you submit to the Platform.
            </li>
            <li>
              <strong>Communications:</strong> Emails, support requests, and
              feedback you send to us.
            </li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">
            2.2 Information Collected Automatically
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Device &amp; Usage Data:</strong> IP address, browser type
              and version, operating system, device identifiers, referring URLs,
              pages viewed, and actions taken on the Platform.
            </li>
            <li>
              <strong>Cookies &amp; Similar Technologies:</strong> We use cookies
              for authentication, session management, and analytics. See Section
              11 below.
            </li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">
            2.3 Information from Third Parties
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Google Sign-In:</strong> If you authenticate via Google, we
              receive your name, email address, and profile picture from your
              Google account.
            </li>
            <li>
              <strong>Stripe:</strong> We receive transaction confirmations,
              payout statuses, and dispute notifications from Stripe. We do not
              receive your full card number.
            </li>
          </ul>
        </section>

        {/* ── 3. How We Use Information ── */}
        <section>
          <h2 className="text-lg font-semibold">
            3. How We Use Your Information
          </h2>
          <p className="mt-2 text-muted-foreground">
            We use the information we collect for the following purposes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Provide &amp; Maintain the Platform:</strong> Operate your
              account, process transactions, fulfill orders, and enable
              communication between Buyers and Sellers.
            </li>
            <li>
              <strong>Process Payments:</strong> Facilitate transactions via
              Stripe, distribute seller payouts, and apply marketplace fees.
            </li>
            <li>
              <strong>Communications:</strong> Send transactional emails (order
              confirmations, shipping updates, account notifications). We do not
              send marketing communications without your explicit opt-in consent.
            </li>
            <li>
              <strong>Improve the Platform:</strong> Analyze usage patterns to
              improve features, fix bugs, and optimize performance.
            </li>
            <li>
              <strong>Safety &amp; Security:</strong> Detect and prevent fraud,
              abuse, security incidents, and policy violations.
            </li>
            <li>
              <strong>Legal Compliance:</strong> Comply with applicable laws,
              regulations, legal processes, and government requests.
            </li>
          </ul>
        </section>

        {/* ── 4. How We Share Information ── */}
        <section>
          <h2 className="text-lg font-semibold">
            4. How We Share Your Information
          </h2>
          <p className="mt-2 text-muted-foreground">
            <strong>We do not sell your personal information.</strong> We may
            share your information in the following circumstances:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>With Stripe:</strong> Payment and identity information
              necessary to process transactions. Subject to{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>With Firebase / Google Cloud:</strong> Account,
              authentication, and content data necessary to host and operate the
              Platform. Subject to{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>With Other Users:</strong> Your public profile information
              is visible to other users. When you purchase a physical product, your
              shipping address is shared with the Seller to fulfill the order.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information if
              required by law, court order, subpoena, or government request, or
              if we believe disclosure is necessary to protect our rights,
              safety, or property, or that of our users or the public.
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger,
              acquisition, reorganization, or sale of assets, your information
              may be transferred to the successor entity.
            </li>
          </ul>
        </section>

        {/* ── 5. Third-Party Services ── */}
        <section>
          <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
          <p className="mt-2 text-muted-foreground">
            The Platform relies on the following third-party services that may
            process your data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Firebase Authentication</strong> — User account creation
              and sign-in (including Google Sign-In).
            </li>
            <li>
              <strong>Cloud Firestore</strong> — Database storage for profiles,
              products, projects, orders, and messages.
            </li>
            <li>
              <strong>Firebase Cloud Storage</strong> — Image and file uploads.
            </li>
            <li>
              <strong>Firebase App Hosting / Google Cloud</strong> — Application
              hosting and infrastructure.
            </li>
            <li>
              <strong>Stripe Payments &amp; Stripe Connect</strong> — Payment
              processing, seller payouts, and financial compliance.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Each service processes data in accordance with its own privacy policy
            and terms. We encourage you to review their policies.
          </p>
        </section>

        {/* ── 6. Data Retention ── */}
        <section>
          <h2 className="text-lg font-semibold">6. Data Retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Account Data:</strong> Retained for as long as your account
              is active. Upon account deletion, personal data is removed within
              thirty (30) days, except as required by law.
            </li>
            <li>
              <strong>Transaction Records:</strong> Retained for seven (7) years
              to comply with tax and financial reporting obligations.
            </li>
            <li>
              <strong>User Content:</strong> Deleted upon account deletion,
              except where retention is required for legal compliance or ongoing
              dispute resolution.
            </li>
            <li>
              <strong>Backups:</strong> Automated backups are purged within
              ninety (90) days of data deletion.
            </li>
          </ul>
        </section>

        {/* ── 7. Data Security ── */}
        <section>
          <h2 className="text-lg font-semibold">7. Data Security</h2>
          <p className="mt-2 text-muted-foreground">
            We implement industry-standard administrative, technical, and
            physical safeguards to protect your information:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              All data transmitted between your browser and our servers is
              encrypted using TLS (Transport Layer Security).
            </li>
            <li>
              Firebase Security Rules restrict database and storage access to
              authorized users.
            </li>
            <li>
              Payment card data is processed exclusively by Stripe, which
              maintains PCI DSS Level 1 compliance. We never store, process, or
              have access to your full card number.
            </li>
            <li>
              Passwords are cryptographically hashed; we do not store plaintext
              passwords.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            No method of electronic transmission or storage is 100% secure. While
            we strive to protect your information, we cannot guarantee absolute
            security.
          </p>
        </section>

        {/* ── 8. Your Rights ── */}
        <section>
          <h2 className="text-lg font-semibold">8. Your Rights</h2>

          <h3 className="mt-4 text-base font-semibold">8.1 All Users</h3>
          <p className="mt-2 text-muted-foreground">
            Depending on your jurisdiction, you may have the following rights
            regarding your personal information:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Access:</strong> Request a copy of the personal information
              we hold about you.
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or
              incomplete data.
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal
              information, subject to legal retention requirements.
            </li>
            <li>
              <strong>Data Portability:</strong> Request a copy of your data in a
              structured, commonly used format.
            </li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">
            8.2 California Residents (CCPA)
          </h3>
          <p className="mt-2 text-muted-foreground">
            If you are a California resident, you have additional rights under
            the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Right to Know:</strong> Request details about the
              categories and specific pieces of personal information we have
              collected, the sources, the purposes, and the categories of third
              parties with whom we share it.
            </li>
            <li>
              <strong>Right to Delete:</strong> Request deletion of personal
              information, subject to exceptions.
            </li>
            <li>
              <strong>Right to Opt-Out of Sale:</strong> We do not sell personal
              information as defined by the CCPA.
            </li>
            <li>
              <strong>Non-Discrimination:</strong> We will not discriminate
              against you for exercising your CCPA rights.
            </li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">
            8.3 Florida Residents (FIPA)
          </h3>
          <p className="mt-2 text-muted-foreground">
            Under the Florida Information Protection Act (FIPA), we will notify
            affected Florida residents within thirty (30) days in the event of a
            data breach involving personal information.
          </p>

          <h3 className="mt-4 text-base font-semibold">
            8.4 How to Exercise Your Rights
          </h3>
          <p className="mt-2 text-muted-foreground">
            To exercise any of the above rights, contact us at{" "}
            <a
              href="mailto:privacy@redphantomops.com"
              className="font-medium text-primary"
            >
              privacy@redphantomops.com
            </a>
            . We will verify your identity before processing your request and
            respond within the timeframes required by applicable law.
          </p>
        </section>

        {/* ── 9. Children's Privacy ── */}
        <section>
          <h2 className="text-lg font-semibold">9. Children&apos;s Privacy</h2>
          <p className="mt-2 text-muted-foreground">
            The Platform is not directed to individuals under eighteen (18) years
            of age. We do not knowingly collect personal information from
            children under 18. If we become aware that we have inadvertently
            collected information from a child under 18, we will take steps to
            delete it promptly. If you believe we have collected information from
            a minor, please contact us at{" "}
            <a
              href="mailto:privacy@redphantomops.com"
              className="font-medium text-primary"
            >
              privacy@redphantomops.com
            </a>
            .
          </p>
        </section>

        {/* ── 10. International Users ── */}
        <section>
          <h2 className="text-lg font-semibold">10. International Users</h2>
          <p className="mt-2 text-muted-foreground">
            The Platform is operated from the United States. If you access the
            Platform from outside the United States, please be aware that your
            information will be transferred to, stored, and processed in the
            United States, where data protection laws may differ from those in
            your country. By using the Platform, you consent to such transfer.
          </p>
        </section>

        {/* ── 11. Cookies ── */}
        <section>
          <h2 className="text-lg font-semibold">11. Cookies &amp; Tracking</h2>
          <p className="mt-2 text-muted-foreground">
            We use the following categories of cookies:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Essential Cookies:</strong> Required for authentication and
              session management. These cannot be disabled without breaking core
              Platform functionality.
            </li>
            <li>
              <strong>Functional Cookies:</strong> Remember your preferences
              (e.g., display settings).
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Firebase and Google may use
              analytics cookies to help us understand Platform usage patterns.
              These are used solely to improve the Platform.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            You can control cookies through your browser settings. Disabling
            essential cookies may impair Platform functionality.
          </p>
        </section>

        {/* ── 12. Changes ── */}
        <section>
          <h2 className="text-lg font-semibold">
            12. Changes to This Privacy Policy
          </h2>
          <p className="mt-2 text-muted-foreground">
            We may update this Privacy Policy from time to time. For material
            changes, we will provide at least thirty (30) days&apos; advance
            notice by posting the revised policy on the Platform, updating the
            &quot;Last Updated&quot; date, and, for registered users, sending
            notice via email. Your continued use of the Platform after the
            effective date constitutes acceptance of the revised policy.
          </p>
        </section>

        {/* ── 13. Contact ── */}
        <section>
          <h2 className="text-lg font-semibold">13. Contact Information</h2>
          <p className="mt-2 text-muted-foreground">
            For privacy-related questions or to exercise your data rights,
            contact:
          </p>
          <div className="mt-2 text-muted-foreground">
            <p>RedPhantomOps LLC</p>
            <p>State of Florida, United States</p>
            <p>
              Privacy Inquiries:{" "}
              <a
                href="mailto:privacy@redphantomops.com"
                className="font-medium text-primary"
              >
                privacy@redphantomops.com
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
            href="mailto:privacy@redphantomops.com"
            className="font-medium text-primary"
          >
            privacy@redphantomops.com
          </a>
        </p>
        <p className="mt-1">
          RedPhantomOps LLC &middot; Registered in Florida, USA
        </p>
      </div>
    </div>
  );
}
