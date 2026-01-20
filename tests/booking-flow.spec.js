// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Booking Flow', () => {
  test('should allow user to view available stations', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to stations page
    await page.click('text=Stations');
    
    // Check that stations are displayed
    const stationCards = page.locator('.station-card');
    await expect(stationCards.first()).toBeVisible();
  });

  test('should allow user to view station details', async ({ page }) => {
    await page.goto('/stations');
    
    // Click on the first station to view details
    const firstStation = page.locator('.station-card').first();
    await firstStation.click();
    
    // Check that station details page loads
    await expect(page).toHaveURL(/station-details/);
    await expect(page.locator('h1')).toContainText('Station Details');
  });

  test('should display booking form on station details page', async ({ page }) => {
    // Go to a station details page
    await page.goto('/stations');
    const firstStation = page.locator('.station-card').first();
    await firstStation.click();
    
    // Look for booking form elements
    const bookingForm = page.locator('#booking-form');
    await expect(bookingForm).toBeVisible();
    
    // Check for essential form fields
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('select[name="timeSlot"]')).toBeVisible();
  });

  test('should allow user to submit a booking', async ({ page }) => {
    // Mock the booking submission to avoid actual bookings during testing
    await page.route('**/api/bookings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          booking: { id: 'test-booking-id', date: '2025-11-15', timeSlot: '10:00-11:00' } 
        })
      });
    });
    
    // Go to station details page
    await page.goto('/stations');
    const firstStation = page.locator('.station-card').first();
    await firstStation.click();
    
    // Fill out booking form
    await page.fill('input[name="date"]', '2025-11-15');
    await page.selectOption('select[name="timeSlot"]', '10:00-11:00');
    
    // Submit booking
    await page.click('button[type="submit"]');
    
    // Check for booking confirmation
    await expect(page.locator('.booking-confirmation')).toBeVisible();
  });
});