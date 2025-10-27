// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the admin dashboard
    await page.goto('/admin');
  });

  test('should display admin dashboard title', async ({ page }) => {
    // Expect the page title to contain 'Admin'
    await expect(page).toHaveTitle(/Admin/);
  });

  test('should display navigation menu', async ({ page }) => {
    // Check if the main navigation is visible
    const navMenu = page.locator('nav');
    await expect(navMenu).toBeVisible();
  });

  test('should display notification bell icon', async ({ page }) => {
    // Check if notification bell icon is present
    const notificationBell = page.locator('[data-testid="NotificationsIcon"], [data-testid="NotificationsNoneIcon"]');
    await expect(notificationBell).toBeVisible();
  });

  test('should show user management section', async ({ page }) => {
    // Click on Users tab if it exists
    const usersTab = page.locator('text=Users');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      
      // Check if user table is visible
      const userTable = page.locator('table');
      await expect(userTable).toBeVisible();
    }
  });
});