"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const { userData } = useAuth();
  const [stripeLoading, setStripeLoading] = useState(false);

  const handleStripeOnboarding = async () => {
    setStripeLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/users/stripe-onboarding", {
        method: "POST",
      });
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || "Failed to start Stripe onboarding");
    } finally {
      setStripeLoading(false);
    }
  };

  const handleStripeDashboard = async () => {
    try {
      const { url } = await apiFetch<{ url: string }>("/users/stripe-dashboard");
      window.open(url, "_blank");
    } catch (err: any) {
      if (err.message?.includes("onboarding incomplete")) {
        // Stripe account exists but onboarding wasn't finished — restart it
        handleStripeOnboarding();
      } else {
        alert(err.message || "Failed to open Stripe dashboard");
      }
    }
  };

  const stripeComplete = userData?.creatorProfile?.stripeOnboardingComplete === true;
  const stripeStarted = userData?.isCreator && userData?.creatorProfile?.stripeAccountId;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Stripe Payouts */}
      <div className="mt-8 rounded-xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold text-foreground">Payouts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Stripe account to receive payments from sales.
        </p>

        <div className="mt-4">
          {stripeComplete ? (
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Payouts enabled
              </span>
              <button
                onClick={handleStripeDashboard}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Open Stripe Dashboard
              </button>
            </div>
          ) : stripeStarted ? (
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Setup incomplete
              </span>
              <button
                onClick={handleStripeOnboarding}
                disabled={stripeLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {stripeLoading ? "Setting up..." : "Continue Stripe Setup"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleStripeOnboarding}
              disabled={stripeLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {stripeLoading ? "Setting up..." : "Set Up Stripe Payouts"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
