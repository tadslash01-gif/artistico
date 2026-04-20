import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Artistico team. Questions about selling, buying, or using the platform? We're here to help.",
  openGraph: {
    title: "Contact Artistico",
    description: "Get in touch with the Artistico team.",
    url: "https://artistico.love/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
        Contact Us
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Have a question, feedback, or need help? We&apos;re here for you. Fill
        out the form below or reach us directly via email.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        {/* Contact Form */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">General Support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              For questions about your account, orders, or using the platform:
            </p>
            <a
              href="mailto:support@redphantomops.com"
              className="mt-2 block text-sm font-medium text-primary hover:text-primary/80"
            >
              support@redphantomops.com
            </a>
          </div>

          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">Seller Support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Questions about payouts, listings, or becoming a creator:
            </p>
            <a
              href="mailto:seller-support@redphantomops.com"
              className="mt-2 block text-sm font-medium text-primary hover:text-primary/80"
            >
              seller-support@redphantomops.com
            </a>
          </div>

          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">Legal Inquiries</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              DMCA takedowns, legal questions, or policy concerns:
            </p>
            <a
              href="mailto:legal@redphantomops.com"
              className="mt-2 block text-sm font-medium text-primary hover:text-primary/80"
            >
              legal@redphantomops.com
            </a>
          </div>

          <div className="rounded-xl border border-border bg-accent/20 p-6">
            <h2 className="font-semibold text-foreground">Response Time</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We aim to respond to all inquiries within{" "}
              <strong className="text-foreground">24–48 hours</strong> on
              business days. Urgent billing or payment issues are prioritized.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">RedPhantomOps LLC</strong>
            </p>
            <p className="mt-1">State of Florida, United States</p>
            <p className="mt-3">
              Before reaching out, you may find your answer in our{" "}
              <Link
                href="/legal"
                className="text-primary font-medium hover:text-primary/80"
              >
                Legal &amp; Policy pages
              </Link>{" "}
              or by browsing our{" "}
              <Link
                href="/blog"
                className="text-primary font-medium hover:text-primary/80"
              >
                Blog
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
