/**
 * Centralized AdSense ad-slot configuration.
 *
 * Naming convention in AdSense: "Artistico_<Location>_<Position>"
 *
 * Recommended ad units to create:
 *  1. Artistico_Sidebar_Left   — 160×600 skyscraper
 *  2. Artistico_Sidebar_Right  — 300×600 half-page / 300×250 rectangle
 *  3. Artistico_Inline_Home    — 728×90  leaderboard (responsive)
 *  4. Artistico_Inline_Browse  — 728×90  leaderboard (responsive)
 *  5. Artistico_Inline_Creator — 728×90  leaderboard (responsive)
 *  6. Artistico_Inline_Project — 728×90  leaderboard (responsive)
 *  7. Artistico_InFeed_Browse  — 336×280 large rectangle (in-feed)
 *  8. Artistico_Mobile_Footer  — 320×100 large mobile banner
 *  9. Artistico_Sidebar_Project— 300×250 medium rectangle
 */

export const AD_SLOTS = {
  /** Left sidebar — 160×600 skyscraper (desktop only) */
  SIDEBAR_LEFT: "5235388728",

  /** Right sidebar — 300×600 half-page (desktop only) */
  SIDEBAR_RIGHT: "1296143714",

  /** Home page — banner between categories and trending */
  INLINE_HOME: "5043817032",

  /** Browse page — leaderboard below grid (mobile) / in-content */
  INLINE_BROWSE: "7851212691",

  /** Creator profile — banner between bio and projects */
  INLINE_CREATOR: "5225049350",

  /** Project detail — banner below reviews */
  INLINE_PROJECT: "5482800737",

  /** Project detail — right sidebar 300×250 rectangle */
  SIDEBAR_PROJECT: "2856637394",

  /** Browse page — in-feed ad between project card rows */
  INFEED_BROWSE: "3874205592",

  /** Mobile sticky footer banner (320×100) */
  MOBILE_FOOTER: "8540208915",
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

/**
 * Minimum heights per ad format to prevent Cumulative Layout Shift (CLS).
 * Applied as inline styles on the ad container.
 */
export const AD_MIN_HEIGHTS: Record<string, number> = {
  horizontal: 90,
  vertical: 600,
  rectangle: 250,
  auto: 100,
};
