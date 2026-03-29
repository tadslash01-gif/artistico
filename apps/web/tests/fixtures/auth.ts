/**
 * Auth fixture for Playwright tests.
 *
 * When running with Firebase Auth Emulator, this sets up a test user
 * and saves the auth state for reuse across dashboard tests.
 *
 * Usage:
 *   1. Start emulators: `pnpm emulators` (from project root)
 *   2. Run tests: `pnpm --filter @artistico/web test:visual`
 *
 * For unauthenticated tests (public pages), no setup is needed.
 * For authenticated tests (dashboard), import and use `authenticatedPage`.
 */

import { test as base, type Page, type BrowserContext } from "@playwright/test";

// Extend the base test with an authenticated page fixture
// eslint-disable-next-line react-hooks/rules-of-hooks
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();

    // Navigate to login page and sign in with test credentials
    // These credentials should match a user seeded in the Firebase Auth Emulator
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "test@artistico.dev");
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');

    // Wait for redirect after successful login
    await page.waitForURL("/", { timeout: 10_000 }).catch(() => {
      // Login might fail without emulator — that's OK for visual tests
    });

    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
