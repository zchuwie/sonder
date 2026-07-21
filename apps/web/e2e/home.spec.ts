import { test, expect } from '@playwright/test';

test('opens create post modal', async ({ page }) => {
  await page.goto('/');

  // Desktop 'Create a post' button
  const createButton = page.locator('button', { hasText: 'Create a post' }).first();
  if (await createButton.isVisible()) {
    await createButton.click();
    await expect(page.locator('text=Leave an anonymous thought')).toBeVisible();
  }
});
