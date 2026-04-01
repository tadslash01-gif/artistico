"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SettingsPage() {
  const { userData, signOut } = useAuth();
  const router = useRouter();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    emailOnNewOrder: true,
    emailOnNewReview: true,
    emailOnNewFollower: true,
    emailMarketing: true,
  });
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const prefs = await apiFetch<typeof notifPrefs>("/users/notification-preferences");
        setNotifPrefs(prefs);
      } catch {
        // Use defaults on error
      } finally {
        setNotifLoading(false);
      }
    }
    if (userData) loadPrefs();
  }, [userData]);

  const handleTogglePref = useCallback(async (key: keyof typeof notifPrefs) => {
    const newValue = !notifPrefs[key];
    // Optimistic update
    setNotifPrefs((prev) => ({ ...prev, [key]: newValue }));
    try {
      await apiFetch("/users/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ [key]: newValue }),
      });
    } catch {
      // Revert on error
      setNotifPrefs((prev) => ({ ...prev, [key]: !newValue }));
    }
  }, [notifPrefs]);

  const handleStripeOnboarding = async () => {
    setStripeLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/users/stripe-onboarding", {
        method: "POST",
      });
      // Validate redirect URL points to Stripe (defense-in-depth)
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith("stripe.com")) throw new Error();
      } catch { throw new Error("Invalid onboarding URL"); }
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
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith("stripe.com")) throw new Error();
      } catch { throw new Error("Invalid dashboard URL"); }
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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch("/users/me", { method: "DELETE" });
      await signOut();
      router.push("/");
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Link
          href="/browse"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          &larr; Browse
        </Link>
      </div>

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

      {/* Notification Preferences */}
      <div className="mt-8 rounded-xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which email notifications you&apos;d like to receive.
        </p>

        {notifLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-64 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {([
              { key: "emailOnNewOrder" as const, label: "New orders", desc: "Get notified when someone purchases your product" },
              { key: "emailOnNewReview" as const, label: "New reviews", desc: "Get notified when someone reviews your project" },
              { key: "emailOnNewFollower" as const, label: "New followers", desc: "Get notified when someone follows you" },
              { key: "emailMarketing" as const, label: "Tips & updates", desc: "Occasional tips for growing your shop and platform news" },
            ]).map((item) => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs[item.key] ? "true" : "false"}
                  onClick={() => handleTogglePref(item.key)}
                  className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    notifPrefs[item.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      notifPrefs[item.key] ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="mt-8 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <div className="mt-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
          <ConfirmModal
            open={showDeleteConfirm}
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
            title="Delete your account?"
            message="This will permanently erase your projects, products, and all associated data. This action cannot be undone."
            confirmLabel="Yes, Delete My Account"
            cancelLabel="Keep My Account"
            variant="danger"
            loading={deleteLoading}
          />
        </div>
      </div>
    </div>
  );
}
