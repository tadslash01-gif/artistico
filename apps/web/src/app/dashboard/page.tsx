"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { firestore } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({ totalSales: 0, activeProducts: 0, totalEarnings: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) return;

    async function fetchStats() {
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(
            query(
              collection(firestore!, "orders"),
              where("creatorId", "==", user!.uid)
            )
          ),
          getDocs(
            query(
              collection(firestore!, "products"),
              where("creatorId", "==", user!.uid),
              where("status", "==", "active")
            )
          ),
        ]);

        let totalEarnings = 0;
        ordersSnap.docs.forEach((doc) => {
          const data = doc.data();
          totalEarnings += data.creatorPayout || 0;
        });

        setStats({
          totalSales: ordersSnap.size,
          activeProducts: productsSnap.size,
          totalEarnings,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Welcome back, {userData?.displayName || "Creator"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Manage your projects, products, and orders.
      </p>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/projects/new"
          className="flex flex-col gap-2 rounded-xl border border-border bg-white p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
        >
          <span className="text-2xl">📁</span>
          <h3 className="font-semibold text-foreground">New Project</h3>
          <p className="text-sm text-muted-foreground">
            Share a new creation with the community.
          </p>
        </Link>

        <Link
          href="/dashboard/orders"
          className="flex flex-col gap-2 rounded-xl border border-border bg-white p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
        >
          <span className="text-2xl">📦</span>
          <h3 className="font-semibold text-foreground">Orders</h3>
          <p className="text-sm text-muted-foreground">
            View and manage your incoming orders.
          </p>
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex flex-col gap-2 rounded-xl border border-border bg-white p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
        >
          <span className="text-2xl">💰</span>
          <h3 className="font-semibold text-foreground">Payouts</h3>
          <p className="text-sm text-muted-foreground">
            Set up Stripe and manage your earnings.
          </p>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Sales", value: statsLoading ? "—" : String(stats.totalSales) },
          { label: "Active Products", value: statsLoading ? "—" : String(stats.activeProducts) },
          { label: "Total Earnings", value: statsLoading ? "—" : formatCurrency(stats.totalEarnings) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
