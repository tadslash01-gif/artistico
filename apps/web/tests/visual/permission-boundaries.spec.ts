import { test, expect } from "@playwright/test";

/**
 * Permission boundary smoke tests.
 * Verifies that protected routes redirect unauthenticated users to login,
 * and that the dashboard is inaccessible without auth.
 *
 * Full owner-vs-owner isolation requires authenticated test users (integration env).
 * These tests cover the unauthenticated boundary which is testable without credentials.
 */

test.describe("Unauthenticated access — permission boundaries", () => {
  const PROTECTED_ROUTES = [
    "/dashboard",
    "/dashboard/projects",
    "/dashboard/projects/new",
    "/dashboard/products/new",
    "/dashboard/messages",
    "/dashboard/orders",
    "/dashboard/payments",
    "/dashboard/profile",
  ];

  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
      const response = await page.goto(route);
      // Should redirect to /login — either the response URL changes or a redirect happened
      const finalUrl = page.url();
      const isRedirectedToLogin = finalUrl.includes("/login");
      const isOnProtectedRoute = finalUrl.includes(route);
      // Must not stay on the protected route without auth
      if (isOnProtectedRoute) {
        // If somehow on the route, the page should not expose private data (at least show a loading state)
        // This is a soft assertion — strict isolation requires authenticated tests
        console.warn(`Route ${route} did not redirect — check middleware`);
      }
      expect(isRedirectedToLogin || !isOnProtectedRoute).toBe(true);
    });
  }

  test("dashboard root redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Public routes remain accessible", () => {
  test("homepage loads without auth", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("browse page loads without auth", async ({ page }) => {
    const response = await page.goto("/browse");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toContainText("Browse");
  });

  test("product detail page loads without auth (shows not-found, not 500)", async ({ page }) => {
    const response = await page.goto("/products/nonexistent-product");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
