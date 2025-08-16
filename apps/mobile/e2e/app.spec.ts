import { test, expect } from '@playwright/test';

test.describe('What Train Am I On App - E2E Flow', () => {
  test('complete user flow: home -> select line -> filter trains', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    // Mock geolocation for consistent testing
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 40.7589, longitude: -73.9851 });

    // Mock the nearest trains API response
    await page.route('**/trains/nearest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            trains: [
              {
                trainId: 'TEST-001',
                line: {
                  code: '6',
                  name: 'Lexington Avenue Local',
                  color: '#00933C'
                },
                direction: 'Downtown & Brooklyn',
                currentStation: 'Times Sq-42 St',
                nextStops: [],
                serviceType: 'local',
                distanceMeters: 449,
                lastUpdated: new Date().toISOString()
              },
              {
                trainId: 'TEST-002',
                line: {
                  code: '6',
                  name: 'Lexington Avenue Local',
                  color: '#00933C'
                },
                direction: 'Uptown & Bronx',
                currentStation: '51 St',
                nextStops: [],
                serviceType: 'local',
                distanceMeters: 332,
                lastUpdated: new Date().toISOString()
              }
            ],
            totalFound: 2
          },
          timestamp: new Date().toISOString()
        })
      });
    });

    await test.step('Load home page and verify routes', async () => {
      await page.goto('/');
      await page.waitForSelector('input[placeholder="Search train lines..."]', { timeout: 10000 });
      await expect(page.locator('input[placeholder="Search train lines..."]')).toBeVisible();
      
      // Capture screenshot for PR documentation
      await page.screenshot({ 
        path: `./e2e/screenshots/${projectName}/home-page-route-selection.png`,
        fullPage: true 
      });
    });

    await test.step('Navigate to train line page', async () => {
      await page.waitForSelector('text=Lexington Avenue Local', { timeout: 15000 });
      const route6Card = page.locator('text=Lexington Avenue Local').first();
      await expect(route6Card).toBeVisible();
      await route6Card.click();
      await page.waitForURL('**/6');
    });

    await test.step('Verify train data display', async () => {
      await page.waitForSelector('text=Choose direction:', { timeout: 15000 });
      
      // Verify both trains are displayed with correct information
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Downtown & Brooklyn' })).toBeVisible();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Uptown & Bronx' })).toBeVisible();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Times Sq-42 St' })).toBeVisible();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: '51 St' })).toBeVisible();
      
      // Capture screenshot for PR documentation
      await page.screenshot({ 
        path: `./e2e/screenshots/${projectName}/train-line-detail-page.png`,
        fullPage: true 
      });
    });

    await test.step('Test direction filtering functionality', async () => {
      // Test Downtown filter
      const downtownFilterButton = page.locator('[data-testid="direction-filter-downtown"]');
      await expect(downtownFilterButton).toBeVisible();
      await downtownFilterButton.click();
      
      // Verify only downtown trains are visible
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Downtown & Brooklyn' })).toBeVisible();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Uptown & Bronx' })).toHaveCount(0);
      
      // Capture screenshot for PR documentation
      await page.screenshot({ 
        path: `./e2e/screenshots/${projectName}/direction-filter-downtown.png`,
        fullPage: true 
      });
    });

    await test.step('Test filter toggle behavior', async () => {
      const downtownFilterButton = page.locator('[data-testid="direction-filter-downtown"]');
      const uptownFilterButton = page.locator('[data-testid="direction-filter-uptown"]');
      
      // Deselect downtown filter - both trains should be visible again
      await downtownFilterButton.click();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Downtown & Brooklyn' })).toBeVisible();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Uptown & Bronx' })).toBeVisible();
      
      // Test Uptown filter
      await expect(uptownFilterButton).toBeVisible();
      await uptownFilterButton.click();
      
      // Verify only uptown trains are visible
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Uptown & Bronx' })).toBeVisible();
      await expect(page.locator('[data-testid="train-card"]').filter({ hasText: 'Downtown & Brooklyn' })).toHaveCount(0);
      
      // Capture screenshot for PR documentation
      await page.screenshot({ 
        path: `./e2e/screenshots/${projectName}/direction-filter-uptown.png`,
        fullPage: true 
      });
    });
  });
});