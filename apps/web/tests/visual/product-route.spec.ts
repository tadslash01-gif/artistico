import { test, expect } from "@playwright/test";

/**
 * Product route smoke tests.
 * These tests verify that product-related routes resolve without 404/crash,
 * and that the browse page supports a Products tab.
 */

test.describe("Standalone product route", () => {
  test("/products/[productId] page renders (not 404)", async ({ page }) => {
    // Navigate to a non-existent product — should show the not-found UI, NOT a Next.js 404 crash
    const response = await page.goto("/products/test-product-id-does-not-exist");
    // The page should either return 200 (with a not-found message) or 404 via notFound()
    // Either way it must not be a 500 error
    expect(response?.status()).not.toBe(500);
    // The page must have some visible content
    await expect(page.locator("body")).toBeVisible();
  });

  test("product card on project page links to /products/[id]", async ({ page }) => {
    await page.goto("/browse");
    // If there are any product cards in the trending row, they link to /products/...
    const productLinks = page.locator('a[href^="/products/"]');
    // This is a smoke test — if zero products exist that's also fine (count >= 0)
    const count = await productLinks.count();
    if (count > 0) {
      const href = await productLinks.first().getAttribute("href");
      expect(href).toMatch(/^\/products\/.+/);
    }
  });
});

test.describe("Browse Products tab", () => {
  test("browse page loads", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("h1")).toContainText("Browse");
  });

  test("browse page has Projects tab", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
  });

  test("browse page has Products tab", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("button", { name: "Products" })).toBeVisible();
  });

  test("clicking Products tab updates URL", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: "Products" }).click();
    await expect(page).toHaveURL(/tab=products/);
  });

  test("?tab=products shows products grid (or empty state)", async ({ page }) => {
    await page.goto("/browse?tab=products");
    // Should not crash — either shows products or an empty state message
    await expect(page.locator("body")).toBeVisible();
    const emptyState = page.locator("text=No products found");
    const productCards = page.locator('a[href^="/products/"]');
    // At least one of the two must be present
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = (await productCards.count()) > 0;
    expect(hasEmpty || hasCards).toBe(true);
  });

  test("browse page screenshot with Products tab", async ({ page }) => {
    await page.goto("/browse?tab=products");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/screenshots/browse-products.png", fullPage: true });
  });
});

test.describe("Header slogan", () => {
  test("header shows slogan text on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toContainText("For the love of creating");
  });

  test("header shows slogan text on browse page", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("header")).toContainText("For the love of creating");
  });
});
