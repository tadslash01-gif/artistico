"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface ChecklistItem {
  key: string;
  label: string;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist() {
  const { user, userData } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userData || !firestore) return;

    async function check() {
      const checks: ChecklistItem[] = [];

      // 1. Has creator profile
      const hasProfile = !!userData!.creatorProfile;
      checks.push({
        key: "profile",
        label: "Set up your creator profile",
        href: "/dashboard/profile",
        done: hasProfile,
      });

      // 2. Has at least one project
      const projectsSnap = await getDocs(
        query(
          collection(firestore!, "projects"),
          where("creatorId", "==", user!.uid),
          limit(1)
        )
      );
      checks.push({
        key: "project",
        label: "Create your first project",
        href: "/dashboard/projects/new",
        done: !projectsSnap.empty,
      });

      // 3. Has at least one product
      const productsSnap = await getDocs(
        query(
          collection(firestore!, "products"),
          where("creatorId", "==", user!.uid),
          limit(1)
        )
      );
      checks.push({
        key: "product",
        label: "Add a product to sell",
        href: "/dashboard/products/new",
        done: !productsSnap.empty,
      });

      // 4. Has Stripe connected
      const hasStripe = !!userData!.creatorProfile?.stripeAccountId;
      checks.push({
        key: "stripe",
        label: "Connect Stripe for payouts",
        href: "/dashboard/settings",
        done: hasStripe,
      });

      setItems(checks);
      setLoading(false);
    }

    check();
  }, [user, userData]);

  if (loading) return null;

  const completedCount = items.filter((i) => i.done).length;
  if (completedCount === items.length) return null; // All done, hide checklist

  // Tailwind classes for progress bar widths (4 items = 5 possible states)
  const widthClass = ["w-0", "w-1/4", "w-1/2", "w-3/4", "w-full"][completedCount] || "w-0";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Getting Started</h2>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{items.length} complete
        </span>
      </div>
      <div
          className={`mt-3 h-2 overflow-hidden rounded-full bg-amber-100`}
      >
        <div
          className={`h-full rounded-full bg-primary transition-all duration-500 ${widthClass}`}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.done
                  ? "text-muted-foreground line-through"
                  : "text-foreground hover:bg-amber-100/50"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                  item.done
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white"
                }`}
              >
                {item.done ? "✓" : ""}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
