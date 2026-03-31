"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar */}
        <nav className="w-full md:w-56 shrink-0">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Become a Creator CTA for non-creators */}
          {userData && !userData.isCreator && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm font-semibold text-foreground">
                Ready to sell?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Set up your creator profile and start sharing your craft.
              </p>
              <Link
                href="/dashboard/profile"
                className="mt-3 block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Become a Creator
              </Link>
            </div>
          )}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
