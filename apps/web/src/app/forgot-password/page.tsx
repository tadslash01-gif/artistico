"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 overflow-hidden">
      {/* Decorative warm blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/3 top-1/3 h-[350px] w-[350px] rounded-full bg-primary/[0.06] blur-[100px]" />
        <div className="absolute right-1/3 bottom-1/3 h-[250px] w-[250px] rounded-full bg-accent/25 blur-[80px]" />
      </div>
      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>

        {sent ? (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password
              reset link.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#d6cfc7] bg-[#f7f5f2] px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending..." : "Send Me a Link"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
