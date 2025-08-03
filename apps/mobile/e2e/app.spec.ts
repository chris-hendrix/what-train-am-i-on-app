import { test, expect } from '@playwright/test';

test.describe('What Train Am I On App', () => {
  test('should load page and display routes from API', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load and make API call
    await page.waitForSelector('text=NYC Subway Routes', { timeout: 10000 });
    
    // Verify the title is visible
    await expect(page.locator('text=NYC Subway Routes')).toBeVisible();
    
    // Verify routes are displayed by checking for any route name (API is working)
    await expect(page.locator('text=Lexington Avenue Local')).toBeVisible();
  });
});