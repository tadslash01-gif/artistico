import { test, expect } from "@playwright/test";

test.describe("Public Pages — Visual Snapshots", () => {
  test("Home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "test-results/screenshots/home.png", fullPage: true });
  });

  test("Browse page", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("h1")).toContainText("Browse");
    await page.screenshot({ path: "test-results/screenshots/browse.png", fullPage: true });
  });

  test("Login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Log in to Artistico");
    await page.screenshot({ path: "test-results/screenshots/login.png", fullPage: true });
  });

  test("Signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toContainText("Create your account");
    await page.screenshot({ path: "test-results/screenshots/signup.png", fullPage: true });
  });

  test("Forgot Password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1")).toContainText("Reset");
    await page.screenshot({
      path: "test-results/screenshots/forgot-password.png",
      fullPage: true,
    });
  });

  test("Become a Creator page", async ({ page }) => {
    await page.goto("/become-creator");
    // This page redirects to /login if not authenticated, which is expected
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/become-creator.png",
      fullPage: true,
    });
  });
});
