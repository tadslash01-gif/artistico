import { test, expect } from "@playwright/test";

test.describe("Project & Creator Pages — Visual Snapshots", () => {
  test("Project detail page (non-existent slug shows 404)", async ({ page }) => {
    await page.goto("/projects/sample-project");
    await page.waitForLoadState("networkidle");
    // Without seeded data, this shows the "Project Not Found" state
    await page.screenshot({
      path: "test-results/screenshots/project-detail.png",
      fullPage: true,
    });
  });

  test("Creator profile page (non-existent uid shows 404)", async ({ page }) => {
    await page.goto("/creators/sample-creator-uid");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/creator-profile.png",
      fullPage: true,
    });
  });

  test("Order success page (no session)", async ({ page }) => {
    await page.goto("/orders/success");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/order-success.png",
      fullPage: true,
    });
  });
});
