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

      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span>Last updated: March 2026</span>
        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
          Draft — Under Legal Review
        </span>
      </div>

      <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
        <p className="font-medium">Notice</p>
        <p className="mt-1">
          This Privacy Policy is being finalized with legal counsel for full
          compliance with the Florida Information Protection Act (FIPA) and
          CCPA. The complete version will be published at{" "}
          <a
            href="https://legal.redphantomops.com/privacy"
            className="font-medium underline"
          >
            legal.redphantomops.com/privacy
          </a>
          .
        </p>
      </div>

      <div className="prose-sm mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Information We Collect</h2>
          <p className="mt-2 text-muted-foreground">
            We collect information you provide when creating an account (name,
            email address), making purchases (shipping address, payment
            information processed by Stripe), and using the Platform (project
            data, messages, uploaded images).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>To provide and maintain the Platform</li>
            <li>To process transactions via Stripe</li>
            <li>To communicate with you about your account and orders</li>
            <li>
              To improve the Platform and develop new features
            </li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Third-Party Services</h2>
          <p className="mt-2 text-muted-foreground">
            We use the following third-party services that may collect data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong>Firebase (Google)</strong> — Authentication, database,
              file storage, hosting
            </li>
            <li>
              <strong>Stripe</strong> — Payment processing; subject to{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                Stripe&apos;s Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Data Retention</h2>
          <p className="mt-2 text-muted-foreground">
            We retain your account data for as long as your account is active.
            Order and transaction records are retained as required by tax and
            legal obligations. You may request account deletion by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Your Rights</h2>
          <p className="mt-2 text-muted-foreground">
            Depending on your jurisdiction, you may have the right to access,
            correct, delete, or export your personal data. California residents
            have additional rights under the CCPA. To exercise these rights,
            contact us at the email below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Cookies</h2>
          <p className="mt-2 text-muted-foreground">
            We use essential cookies for authentication and session management.
            Firebase may use analytics cookies. You can control cookies through
            your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Security</h2>
          <p className="mt-2 text-muted-foreground">
            We implement industry-standard security measures. All data in
            transit is encrypted via TLS. Payment data is handled by Stripe and
            never stored on our servers.
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
