import { test } from "@playwright/test";

// Dashboard pages require authentication.
// Without Firebase Auth Emulator seeded with a test user,
// these tests capture the redirect-to-login or loading state.
// When running with emulators, set up auth in tests/fixtures/auth.ts.

test.describe("Dashboard Pages — Visual Snapshots", () => {
  test("Dashboard overview (unauthenticated → redirect)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/dashboard-overview.png",
      fullPage: true,
    });
  });

  test("Dashboard projects list", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/dashboard-projects.png",
      fullPage: true,
    });
  });

  test("Dashboard new project form", async ({ page }) => {
    await page.goto("/dashboard/projects/new");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/dashboard-new-project.png",
      fullPage: true,
    });
  });

  test("Dashboard orders", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/dashboard-orders.png",
      fullPage: true,
    });
  });

  test("Dashboard settings", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/dashboard-settings.png",
      fullPage: true,
    });
  });
});
