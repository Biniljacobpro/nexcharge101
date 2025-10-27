// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Corporate Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the corporate dashboard
    await page.goto('/corporate/dashboard');
  });

  test('should display corporate dashboard title', async ({ page }) => {
    // Expect the page title to contain 'Corporate'
    await expect(page).toHaveTitle(/Corporate/);
  });

  test('should display notification bell icon', async ({ page }) => {
    // Check if notification bell icon is present
    const notificationBell = page.locator('[data-testid="NotificationsIcon"], [data-testid="NotificationsNoneIcon"]');
    await expect(notificationBell).toBeVisible();
  });

  test('should show station management section', async ({ page }) => {
    // Check if station management elements are present
    const stationSection = page.locator('text=Stations');
    if (await stationSection.isVisible()) {
      await stationSection.click();
      
      // Check if station table or list is visible
      const stationList = page.locator('table, [data-testid="station-list"]');
      await expect(stationList).toBeVisible();
    }
  });
});