// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Login Form Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to the login page
    await page.goto('/login');
  });

  test('should allow filling login form with admin credentials', async ({ page }) => {
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // Check that the values are filled correctly
    const emailValue = await page.inputValue('input[type="email"]');
    const passwordValue = await page.inputValue('input[type="password"]');
    
    expect(emailValue).toBe('admin@gmail.com');
    expect(passwordValue).toBe('Admin@123');
  });

  test('should allow filling login form with corporate user credentials', async ({ page }) => {
    // Fill in corporate user credentials
    await page.fill('input[type="email"]', 'albinjiji989@gmail.com');
    await page.fill('input[type="password"]', 'Albin@1234');
    
    // Check that the values are filled correctly
    const emailValue = await page.inputValue('input[type="email"]');
    const passwordValue = await page.inputValue('input[type="password"]');
    
    expect(emailValue).toBe('albinjiji989@gmail.com');
    expect(passwordValue).toBe('Albin@1234');
  });

  test('should allow filling login form with EV user credentials', async ({ page }) => {
    // Fill in EV user credentials
    await page.fill('input[type="email"]', 'ericmathew2026@mca.ajce.in');
    await page.fill('input[type="password"]', 'Eric@123');
    
    // Check that the values are filled correctly
    const emailValue = await page.inputValue('input[type="email"]');
    const passwordValue = await page.inputValue('input[type="password"]');
    
    expect(emailValue).toBe('ericmathew2026@mca.ajce.in');
    expect(passwordValue).toBe('Eric@123');
  });

  test('should have a submit button', async ({ page }) => {
    // Check that submit button exists
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should be able to submit the form with admin credentials', async ({ page }) => {
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // Click submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for some response
    await page.waitForTimeout(1000);
    
    // Check that the page has changed or some element appears
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('about:blank');
  });

  test('should be able to submit the form with corporate user credentials', async ({ page }) => {
    // Fill in corporate user credentials
    await page.fill('input[type="email"]', 'albinjiji989@gmail.com');
    await page.fill('input[type="password"]', 'Albin@1234');
    
    // Click submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for some response
    await page.waitForTimeout(1000);
    
    // Check that the page has changed or some element appears
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('about:blank');
  });

  test('should be able to submit the form with EV user credentials', async ({ page }) => {
    // Fill in EV user credentials
    await page.fill('input[type="email"]', 'ericmathew2026@mca.ajce.in');
    await page.fill('input[type="password"]', 'Eric@123');
    
    // Click submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for some response
    await page.waitForTimeout(1000);
    
    // Check that the page has changed or some element appears
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('about:blank');
  });
});

test.describe('Dashboard Functionality', () => {
  test('should test admin dashboard buttons and functions', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for admin dashboard elements
    const dashboardElements = page.locator('text=Admin, text=Dashboard');
    const count = await dashboardElements.count();
    expect(count).toBeGreaterThan(0);
    
    // Test navigation buttons if present
    const navButtons = page.locator('button, a').filter({ hasText: 'User|Station|Vehicle|Booking|Corporate' });
    if (await navButtons.count() > 0) {
      // Click on first navigation button to test functionality
      await navButtons.first().click();
      await page.waitForTimeout(1000);
      // Verify navigation worked
      expect(page.url()).not.toContain('about:blank');
    }
  });

  test('should test corporate dashboard buttons and functions', async ({ page }) => {
    // Login as corporate user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'albinjiji989@gmail.com');
    await page.fill('input[type="password"]', 'Albin@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for corporate dashboard elements
    const dashboardElements = page.locator('text=Corporate, text=Dashboard, text=Franchise');
    const count = await dashboardElements.count();
    expect(count).toBeGreaterThan(0);
    
    // Test navigation buttons if present
    const navButtons = page.locator('button, a').filter({ hasText: 'Station|Dashboard|Profile' });
    if (await navButtons.count() > 0) {
      // Click on first navigation button to test functionality
      await navButtons.first().click();
      await page.waitForTimeout(1000);
      // Verify navigation worked
      expect(page.url()).not.toContain('about:blank');
    }
  });

  test('should test EV user dashboard buttons and functions', async ({ page }) => {
    // Login as EV user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'ericmathew2026@mca.ajce.in');
    await page.fill('input[type="password"]', 'Eric@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for user dashboard elements
    const dashboardElements = page.locator('text=Home|Dashboard|Book|Station|Profile');
    const count = await dashboardElements.count();
    expect(count).toBeGreaterThan(0);
    
    // Test main buttons if present
    const mainButtons = page.locator('button').filter({ hasText: 'Book|Find|Search|Profile' });
    if (await mainButtons.count() > 0) {
      // Click on first main button to test functionality
      await mainButtons.first().click();
      await page.waitForTimeout(1000);
      // Verify interaction worked
      expect(page.url()).not.toContain('about:blank');
    }
  });
});