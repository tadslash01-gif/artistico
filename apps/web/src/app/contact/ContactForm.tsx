"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API endpoint.
    // For now, open mailto as fallback.
    const mailtoLink = `mailto:support@redphantomops.com?subject=${encodeURIComponent(subject || "Contact Form Submission")}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="text-4xl">✉️</span>
        <h2 className="mt-3 text-lg font-semibold text-foreground">
          Message sent!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your email client should have opened with the message pre-filled.
          We&apos;ll respond within 24–48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-foreground"
        >
          Your Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all"
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-foreground"
        >
          Email Address
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-foreground"
        >
          Subject
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all"
        >
          <option value="">Select a topic…</option>
          <option value="General Question">General Question</option>
          <option value="Buying Help">Buying Help</option>
          <option value="Seller Support">Seller/Creator Support</option>
          <option value="Payment Issue">Payment or Billing Issue</option>
          <option value="Report a Problem">Report a Problem</option>
          <option value="Feature Request">Feature Request</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all resize-y"
          placeholder="Tell us how we can help..."
        />
      </div>

      <button
        type="submit"
        className="btn-gradient w-full"
      >
        Send Message
      </button>
    </form>
  );
}
