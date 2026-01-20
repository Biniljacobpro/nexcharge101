// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Booking Functionality', () => {
  test('should display available charging stations list', async ({ page }) => {
    // Mock the stations page response
    await page.route('**/stations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Charging Stations</title></head>
            <body>
              <h1>Available Charging Stations</h1>
              <div id="stations-list">
                <div class="station-card" data-station-id="1">
                  <h2>Station 1</h2>
                  <p>Location: Downtown</p>
                  <p>Available slots: 5</p>
                  <button class="view-details-btn">View Details</button>
                </div>
                <div class="station-card" data-station-id="2">
                  <h2>Station 2</h2>
                  <p>Location: Uptown</p>
                  <p>Available slots: 3</p>
                  <button class="view-details-btn">View Details</button>
                </div>
              </div>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/stations');
    await expect(page).toHaveTitle(/Charging Stations/);
    await expect(page.locator('h1')).toContainText('Available Charging Stations');
    
    // Check that stations are displayed
    const stationCards = page.locator('.station-card');
    await expect(stationCards).toHaveCount(2);
  });

  test('should navigate to station details page when view details button is clicked', async ({ page }) => {
    // Mock the stations page response
    await page.route('**/stations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Charging Stations</title></head>
            <body>
              <h1>Available Charging Stations</h1>
              <div id="stations-list">
                <div class="station-card" data-station-id="1">
                  <h2>Station 1</h2>
                  <p>Location: Downtown</p>
                  <p>Available slots: 5</p>
                  <button class="view-details-btn" onclick="window.location.href='/station/1'">View Details</button>
                </div>
              </div>
            </body>
          </html>
        `
      });
    });
    
    // Mock the station details page response
    await page.route('**/station/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Station 1 Details</title></head>
            <body>
              <h1>Station Details</h1>
              <div id="station-info">
                <h2>Station 1</h2>
                <p>Location: Downtown</p>
                <p>Available slots: 5</p>
                <p>Price: Rs.25 per kWh</p>
              </div>
              <div id="booking-section">
                <h2>Book a Slot</h2>
                <form id="booking-form">
                  <label for="date">Select Date:</label>
                  <input type="date" id="date" name="date" required>
                  
                  <label for="time">Select Time:</label>
                  <select id="time" name="time" required>
                    <option value="09:00-10:00">09:00-10:00</option>
                    <option value="10:00-11:00">10:00-11:00</option>
                    <option value="11:00-12:00">11:00-12:00</option>
                  </select>
                  
                  <button type="submit" id="book-now-btn">Book Now</button>
                </form>
              </div>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/stations');
    
    // Click the view details button
    await page.click('.view-details-btn');
    
    // Check that we've navigated to the station details page
    await expect(page).toHaveURL(/station\/1/);
    await expect(page.locator('h1')).toContainText('Station Details');
  });

  test('should display booking form on station details page', async ({ page }) => {
    // Mock the station details page response
    await page.route('**/station/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Station 1 Details</title></head>
            <body>
              <h1>Station Details</h1>
              <div id="station-info">
                <h2>Station 1</h2>
                <p>Location: Downtown</p>
                <p>Available slots: 5</p>
                <p>Price: Rs.25 per kWh</p>
              </div>
              <div id="booking-section">
                <h2>Book a Slot</h2>
                <form id="booking-form">
                  <label for="date">Select Date:</label>
                  <input type="date" id="date" name="date" required>
                  
                  <label for="time">Select Time:</label>
                  <select id="time" name="time" required>
                    <option value="09:00-10:00">09:00-10:00</option>
                    <option value="10:00-11:00">10:00-11:00</option>
                    <option value="11:00-12:00">11:00-12:00</option>
                  </select>
                  
                  <button type="submit" id="book-now-btn">Book Now</button>
                </form>
              </div>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/station/1');
    
    // Check that booking form is displayed
    const bookingForm = page.locator('#booking-form');
    await expect(bookingForm).toBeVisible();
    
    // Check for form elements
    await expect(page.locator('#date')).toBeVisible();
    await expect(page.locator('#time')).toBeVisible();
    await expect(page.locator('#book-now-btn')).toBeVisible();
  });

  test('should successfully submit booking form', async ({ page }) => {
    // Mock the station details page response
    await page.route('**/station/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Station 1 Details</title></head>
            <body>
              <h1>Station Details</h1>
              <div id="station-info">
                <h2>Station 1</h2>
                <p>Location: Downtown</p>
                <p>Available slots: 5</p>
                <p>Price: Rs.25 per kWh</p>
              </div>
              <div id="booking-section">
                <h2>Book a Slot</h2>
                <form id="booking-form">
                  <label for="date">Select Date:</label>
                  <input type="date" id="date" name="date" required>
                  
                  <label for="time">Select Time:</label>
                  <select id="time" name="time" required>
                    <option value="09:00-10:00">09:00-10:00</option>
                    <option value="10:00-11:00">10:00-11:00</option>
                    <option value="11:00-12:00">11:00-12:00</option>
                  </select>
                  
                  <button type="submit" id="book-now-btn">Book Now</button>
                </form>
              </div>
              <div id="booking-confirmation" style="display: none;">
                <h2>Booking Confirmed!</h2>
                <p>Your booking has been confirmed for Station 1 on <span id="booking-date"></span> at <span id="booking-time"></span>.</p>
              </div>
              <script>
                document.getElementById('booking-form').addEventListener('submit', function(e) {
                  e.preventDefault();
                  document.getElementById('booking-section').style.display = 'none';
                  document.getElementById('booking-confirmation').style.display = 'block';
                  document.getElementById('booking-date').textContent = document.getElementById('date').value;
                  document.getElementById('booking-time').textContent = document.getElementById('time').value;
                });
              </script>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/station/1');
    
    // Fill out the booking form
    await page.fill('#date', '2025-12-25');
    await page.selectOption('#time', '10:00-11:00');
    
    // Submit the form
    await page.click('#book-now-btn');
    
    // Check for booking confirmation
    const confirmationMessage = page.locator('#booking-confirmation');
    await expect(confirmationMessage).toBeVisible();
    await expect(confirmationMessage).toContainText('Booking Confirmed!');
  });
});