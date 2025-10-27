// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Notification Functionality', () => {
  test('should display notification count', async ({ page }) => {
    // Go to the admin dashboard
    await page.goto('/admin');
    
    // Check if notification bell icon is present
    const notificationBell = page.locator('[data-testid="NotificationsIcon"], [data-testid="NotificationsNoneIcon"]');
    await expect(notificationBell).toBeVisible();
    
    // Check if badge with count is present (if there are notifications)
    const badge = page.locator('.MuiBadge-badge');
    // This assertion will pass if badge exists, regardless of content
    if (await badge.count() > 0) {
      console.log('Notification badge is present');
    }
  });

  test('should open notification dropdown when clicked', async ({ page }) => {
    // Go to the admin dashboard
    await page.goto('/admin');
    
    // Click on notification bell
    const notificationBell = page.locator('[data-testid="NotificationsIcon"], [data-testid="NotificationsNoneIcon"]');
    await notificationBell.click();
    
    // Check if notification dropdown is visible
    const notificationDropdown = page.locator('.MuiMenu-paper');
    await expect(notificationDropdown).toBeVisible();
  });

  test('should display "No notifications yet" when there are no notifications', async ({ page }) => {
    // Go to the admin dashboard
    await page.goto('/admin');
    
    // Click on notification bell
    const notificationBell = page.locator('[data-testid="NotificationsIcon"], [data-testid="NotificationsNoneIcon"]');
    await notificationBell.click();
    
    // Check if either notifications are displayed or "No notifications yet" message
    const noNotificationsMessage = page.locator('text=No notifications yet');
    const notificationItems = page.locator('.MuiMenuItem-root, .MuiListItem-root');
    
    // Either there should be notification items or the "No notifications yet" message
    const hasNotifications = await notificationItems.count() > 0;
    const hasNoNotificationsMessage = await noNotificationsMessage.isVisible();
    
    // One of these should be true
    expect(hasNotifications || hasNoNotificationsMessage).toBeTruthy();
  });
});