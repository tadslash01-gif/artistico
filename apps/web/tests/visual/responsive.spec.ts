import { test, expect } from "@playwright/test";

// Responsive tests are handled by Playwright projects (desktop/mobile/tablet),
// but this file adds explicit viewport-specific screenshots for key pages.

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

const PAGES = [
  { name: "home", path: "/" },
  { name: "browse", path: "/browse" },
  { name: "login", path: "/login" },
];

for (const viewport of VIEWPORTS) {
  for (const pg of PAGES) {
    test(`${pg.name} @ ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      await page.goto(pg.path);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: `test-results/screenshots/responsive/${pg.name}-${viewport.name}.png`,
        fullPage: true,
      });
      await context.close();
    });
  }
}
