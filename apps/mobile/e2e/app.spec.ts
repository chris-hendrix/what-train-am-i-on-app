import { test, expect } from '@playwright/test';

test.describe('What Train Am I On App', () => {
  test('should display train line information', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load and make API call
    await page.waitForSelector('text=MTA Train Line', { timeout: 10000 });
    
    // Verify the train line title is visible
    await expect(page.locator('text=MTA Train Line')).toBeVisible();
    
    // Verify the train line name is displayed (most explicit text)
    await expect(page.locator('text=6 Express')).toBeVisible();
  });
});