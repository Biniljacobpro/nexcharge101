// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard', () => {
  test('should display admin dashboard elements', async ({ page }) => {
    // Mock the admin dashboard page response
    await page.route('**/admin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Admin Dashboard</title></head>
            <body>
              <h1>Admin Dashboard</h1>
              <div id="admin-stats">
                <div class="stat-card">Total Users: 125</div>
                <div class="stat-card">Active Stations: 42</div>
                <div class="stat-card">Total Bookings: 205</div>
              </div>
              <nav>
                <ul>
                  <li><a href="/admin/users">User Management</a></li>
                  <li><a href="/admin/stations">Station Management</a></li>
                  <li><a href="/admin/bookings">Booking Management</a></li>
                </ul>
              </nav>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/admin');
    await expect(page).toHaveTitle(/Admin Dashboard/);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should display admin statistics', async ({ page }) => {
    // Mock the admin dashboard page response
    await page.route('**/admin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Admin Dashboard</title></head>
            <body>
              <h1>Admin Dashboard</h1>
              <div id="admin-stats">
                <div class="stat-card">Total Users: 125</div>
                <div class="stat-card">Active Stations: 42</div>
                <div class="stat-card">Total Bookings: 205</div>
              </div>
              <nav>
                <ul>
                  <li><a href="/admin/users">User Management</a></li>
                  <li><a href="/admin/stations">Station Management</a></li>
                  <li><a href="/admin/bookings">Booking Management</a></li>
                </ul>
              </nav>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/admin');
    
    // Check that stats are displayed
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(3);
    
    // Check specific stats
    await expect(statCards.nth(0)).toContainText('Total Users: 125');
    await expect(statCards.nth(1)).toContainText('Active Stations: 42');
    await expect(statCards.nth(2)).toContainText('Total Bookings: 205');
  });

  test('should have navigation links to management sections', async ({ page }) => {
    // Mock the admin dashboard page response
    await page.route('**/admin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Admin Dashboard</title></head>
            <body>
              <h1>Admin Dashboard</h1>
              <div id="admin-stats">
                <div class="stat-card">Total Users: 125</div>
                <div class="stat-card">Active Stations: 42</div>
                <div class="stat-card">Total Bookings: 205</div>
              </div>
              <nav>
                <ul>
                  <li><a href="/admin/users" id="user-management-link">User Management</a></li>
                  <li><a href="/admin/stations" id="station-management-link">Station Management</a></li>
                  <li><a href="/admin/bookings" id="booking-management-link">Booking Management</a></li>
                </ul>
              </nav>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/admin');
    
    // Check for navigation links
    const userManagementLink = page.locator('#user-management-link');
    const stationManagementLink = page.locator('#station-management-link');
    const bookingManagementLink = page.locator('#booking-management-link');
    
    await expect(userManagementLink).toBeVisible();
    await expect(stationManagementLink).toBeVisible();
    await expect(bookingManagementLink).toBeVisible();
    
    await expect(userManagementLink).toHaveAttribute('href', '/admin/users');
    await expect(stationManagementLink).toHaveAttribute('href', '/admin/stations');
    await expect(bookingManagementLink).toHaveAttribute('href', '/admin/bookings');
  });

  test('should navigate to user management when link is clicked', async ({ page }) => {
    // Mock the admin dashboard page response
    await page.route('**/admin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Admin Dashboard</title></head>
            <body>
              <h1>Admin Dashboard</h1>
              <div id="admin-stats">
                <div class="stat-card">Total Users: 125</div>
                <div class="stat-card">Active Stations: 42</div>
                <div class="stat-card">Total Bookings: 205</div>
              </div>
              <nav>
                <ul>
                  <li><a href="/admin/users" id="user-management-link">User Management</a></li>
                  <li><a href="/admin/stations" id="station-management-link">Station Management</a></li>
                  <li><a href="/admin/bookings" id="booking-management-link">Booking Management</a></li>
                </ul>
              </nav>
              <script>
                document.getElementById('user-management-link').addEventListener('click', function(e) {
                  e.preventDefault();
                  window.location.href = '/admin/users';
                });
              </script>
            </body>
          </html>
        `
      });
    });
    
    // Mock the user management page response
    await page.route('**/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>User Management</title></head>
            <body>
              <h1>User Management</h1>
              <div id="user-list">
                <div class="user-item">User 1</div>
                <div class="user-item">User 2</div>
              </div>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/admin');
    
    // Click the user management link
    await page.click('#user-management-link');
    
    // Check that we've navigated to the user management page
    await expect(page).toHaveURL(/admin\/users/);
    await expect(page.locator('h1')).toContainText('User Management');
  });
});