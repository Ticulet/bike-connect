/**
 * Axe-core accessibility sweep — PUBLIC routes only.
 *
 * Auth-blocked routes (/me/*, /feed) are NOT included here because the agent
 * cannot authenticate via Google OAuth. Those routes must be swept manually
 * or with a real authenticated session (see QA report).
 *
 * Tags: wcag2a, wcag2aa, wcag21a, wcag21aa
 *
 * NOTE on dynamic routes (/posts/:slug, /users/:id, /bikes/:id):
 *   These require live data from the API+DB server. They are implemented as
 *   test.skip() with a clear reason — see the skip strings below. To enable
 *   them: start the full stack (npm run dev) and replace the test.skip with
 *   test, then confirm the slug/id exists in seed data.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Helper: run axe on the current page and assert zero violations.
 * Filters out 'color-contrast' for pages that rely on a running API to
 * populate real content — the SPA loading skeleton is white-on-white and
 * would produce false positives against an offline API.
 *
 * When the full stack is running remove the `disableRules` argument so
 * contrast is checked against real content.
 */
async function assertNoViolations(
  page: import('@playwright/test').Page,
  { disableRules = [] }: { disableRules?: string[] } = {},
): Promise<void> {
  const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  if (disableRules.length > 0) {
    builder.disableRules(disableRules);
  }
  const results = await builder.analyze();
  expect(
    results.violations,
    `axe violations on ${page.url()}:\n${results.violations
      .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
      .join('\n')}`,
  ).toHaveLength(0);
}

// ---------------------------------------------------------------------------
// Static / always-public routes (no API data required for meaningful DOM)
// ---------------------------------------------------------------------------

test('/ — HomePage has no axe violations', async ({ page }) => {
  await page.goto('/');
  // Wait for the hero section to be visible (static content renders without API)
  await page.waitForSelector('main', { state: 'visible' });
  // The homepage uses staggered CSS entry animations (max delay 540ms + 250ms duration).
  // Wait until all animations have completed so axe does not see opacity:0 interim
  // states as contrast failures (known false positive with CSS keyframe animations).
  await page.waitForTimeout(900);
  await assertNoViolations(page);
});

test('/posts — PostListPage has no axe violations', async ({ page }) => {
  await page.goto('/posts');
  await page.waitForSelector('main', { state: 'visible' });
  // Posts are loaded from API; allow brief loading state to settle
  await page.waitForTimeout(500);
  await assertNoViolations(page);
});

test('/explore/bikes — ExploreBikesPage has no axe violations', async ({ page }) => {
  await page.goto('/explore/bikes');
  await page.waitForSelector('main', { state: 'visible' });
  await page.waitForTimeout(500);
  await assertNoViolations(page);
});

test('/login — LoginPage has no axe violations', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('main', { state: 'visible' });
  await assertNoViolations(page);
});

test('/non-existent — NotFoundPage has no axe violations', async ({ page }) => {
  await page.goto('/non-existent-route-that-triggers-404');
  await page.waitForSelector('main', { state: 'visible' });
  await assertNoViolations(page);
});

// ---------------------------------------------------------------------------
// Dynamic routes — skipped unless a running API + seeded DB is available.
//
// To enable: start the full stack with `npm run dev` from the repo root,
// then change test.skip to test and verify the slug/id exists in seed data.
// ---------------------------------------------------------------------------

test.skip(
  'SKIP (requires live API+DB): /posts/:slug — PostDetailPage has no axe violations',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {
    // Seed slug: 'first-500km-gravel-tires-review'
    // To run: test('/posts/first-500km-gravel-tires-review', ...)
    // and start the full stack so the API returns post data.
  },
);

test.skip(
  'SKIP (requires live API+DB): /users/:id — UserProfilePage has no axe violations',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {
    // Seed user id: '11111111-1111-1111-1111-111111111111' (Elena Rossi)
    // To run: test('/users/11111111-1111-1111-1111-111111111111', ...)
    // and start the full stack.
  },
);

test.skip(
  'SKIP (requires live API+DB + seed bike): /bikes/:id — PublicBikePage has no axe violations',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {
    // No bike seed data exists in server/src/db/seed.ts.
    // Create a bike via the UI (requires auth) then use its UUID here.
  },
);

// ---------------------------------------------------------------------------
// Auth-blocked routes — documented here for traceability, not attempted.
// ---------------------------------------------------------------------------

test.skip(
  'SKIP (auth-blocked): /me — MeHubPage requires Google OAuth login',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {},
);

test.skip(
  'SKIP (auth-blocked): /me/posts — MyPostsPage requires Google OAuth login',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {},
);

test.skip(
  'SKIP (auth-blocked): /me/bikes — MyBikesPage requires Google OAuth login',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {},
);

test.skip(
  'SKIP (auth-blocked): /me/bookmarks — BookmarksPage requires Google OAuth login',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {},
);

test.skip(
  'SKIP (auth-blocked): /me/settings — SettingsPage requires Google OAuth login',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {},
);

test.skip(
  'SKIP (auth-blocked): /feed — FeedPage requires Google OAuth login',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async () => {},
);
