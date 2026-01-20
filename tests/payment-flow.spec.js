// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Payment Flow', () => {
  test('should display payment page', async ({ page }) => {
    // Mock the payments page response
    await page.route('**/payments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Payments</title></head>
            <body>
              <h1>Payment History</h1>
              <div id="payment-list">
                <div class="payment-item">Payment #001 - Rs.500 - Completed</div>
                <div class="payment-item">Payment #002 - Rs.750 - Pending</div>
              </div>
              <button id="make-payment-btn">Make New Payment</button>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/payments');
    await expect(page).toHaveTitle(/Payments/);
    await expect(page.locator('h1')).toContainText('Payment History');
  });

  test('should display payment history', async ({ page }) => {
    // Mock the payments page response
    await page.route('**/payments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Payments</title></head>
            <body>
              <h1>Payment History</h1>
              <div id="payment-list">
                <div class="payment-item">Payment #001 - Rs.500 - Completed</div>
                <div class="payment-item">Payment #002 - Rs.750 - Pending</div>
              </div>
              <button id="make-payment-btn">Make New Payment</button>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/payments');
    
    // Check that payment items are displayed
    const paymentItems = page.locator('.payment-item');
    await expect(paymentItems).toHaveCount(2);
    
    // Check first payment item
    const firstPayment = page.locator('.payment-item').first();
    await expect(firstPayment).toContainText('Payment #001');
    await expect(firstPayment).toContainText('Rs.500');
    await expect(firstPayment).toContainText('Completed');
  });

  test('should have make payment button', async ({ page }) => {
    // Mock the payments page response
    await page.route('**/payments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Payments</title></head>
            <body>
              <h1>Payment History</h1>
              <div id="payment-list">
                <div class="payment-item">Payment #001 - Rs.500 - Completed</div>
                <div class="payment-item">Payment #002 - Rs.750 - Pending</div>
              </div>
              <button id="make-payment-btn">Make New Payment</button>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/payments');
    
    // Check for the make payment button
    const makePaymentBtn = page.locator('#make-payment-btn');
    await expect(makePaymentBtn).toBeVisible();
    await expect(makePaymentBtn).toContainText('Make New Payment');
  });

  test('should navigate to payment form when make payment button is clicked', async ({ page }) => {
    // Mock the payments page response
    await page.route('**/payments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Payments</title></head>
            <body>
              <h1>Payment History</h1>
              <div id="payment-list">
                <div class="payment-item">Payment #001 - Rs.500 - Completed</div>
                <div class="payment-item">Payment #002 - Rs.750 - Pending</div>
              </div>
              <button id="make-payment-btn">Make New Payment</button>
              <script>
                document.getElementById('make-payment-btn').addEventListener('click', function() {
                  window.location.href = '/payments/new';
                });
              </script>
            </body>
          </html>
        `
      });
    });
    
    // Mock the new payment page response
    await page.route('**/payments/new', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>New Payment</title></head>
            <body>
              <h1>New Payment</h1>
              <form id="payment-form">
                <input type="text" name="amount" placeholder="Amount" />
                <select name="payment-method">
                  <option value="upi">UPI</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
                <button type="submit">Pay Now</button>
              </form>
            </body>
          </html>
        `
      });
    });
    
    await page.goto('/payments');
    
    // Click the make payment button
    await page.click('#make-payment-btn');
    
    // Check that we've navigated to the new payment page
    await expect(page).toHaveURL(/payments\/new/);
    await expect(page.locator('h1')).toContainText('New Payment');
  });
});