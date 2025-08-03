import { test, expect } from '@playwright/test';

test.describe('What Train Am I On App', () => {
  test('should display train lines information', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load and make API call
    await page.waitForSelector('text=MTA Train Lines', { timeout: 10000 });
    
    // Verify the train lines title is visible
    await expect(page.locator('text=MTA Train Lines')).toBeVisible();
    
    // Verify both train lines are displayed
    await expect(page.locator('text=6 Express')).toBeVisible();
    await expect(page.locator('text=4 Express')).toBeVisible();
  });
});