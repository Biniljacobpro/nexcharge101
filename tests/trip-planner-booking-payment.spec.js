// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Trip Planner To Booking To Payment Flow', () => {
  test('should complete trip planning, booking, and payment confirmation', async ({ page }) => {
    let capturedSearchPayload = null;
    let capturedBookingPayload = null;
    let capturedPaymentPayload = null;

    await page.route('**/trip-planner', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head>
              <title>Trip Planner</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .section { margin-top: 20px; }
                #route-results, #booking-panel, #payment-panel, #success-panel { display: none; }
                .route-card { border: 1px solid #ccc; padding: 10px; margin-top: 10px; }
              </style>
            </head>
            <body>
              <h1>Smart Trip Planner</h1>

              <section id="planner-panel" class="section">
                <label>From</label>
                <input id="from" type="text" placeholder="From" />
                <label>To</label>
                <input id="to" type="text" placeholder="To" />
                <label>Date</label>
                <input id="travel-date" type="date" />
                <button id="search-routes" type="button">Search Routes</button>
              </section>

              <section id="route-results" class="section">
                <h2>Available Routes</h2>
                <div id="route-list"></div>
              </section>

              <section id="booking-panel" class="section">
                <h2>Booking Details</h2>
                <p id="selected-route"></p>
                <select id="time-slot">
                  <option value="09:00-10:00">09:00-10:00</option>
                  <option value="10:00-11:00">10:00-11:00</option>
                </select>
                <button id="confirm-booking" type="button">Confirm Booking</button>
              </section>

              <section id="payment-panel" class="section">
                <h2>Payment Checkout</h2>
                <p id="amount-label">Amount: Rs.650</p>
                <select id="payment-method">
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
                <button id="pay-now" type="button">Pay Now</button>
              </section>

              <section id="success-panel" class="section">
                <h2>Booking Confirmed</h2>
                <p id="receipt"></p>
              </section>

              <script>
                const state = { selectedRoute: null, bookingId: null };

                document.getElementById('search-routes').addEventListener('click', async () => {
                  const payload = {
                    from: document.getElementById('from').value,
                    to: document.getElementById('to').value,
                    date: document.getElementById('travel-date').value,
                  };

                  const res = await fetch('/api/routes/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  const data = await res.json();
                  const routeList = document.getElementById('route-list');
                  routeList.innerHTML = '';

                  data.routes.forEach((route) => {
                    const card = document.createElement('div');
                    card.className = 'route-card';
                    card.innerHTML = '<strong>' + route.name + '</strong> - ' + route.duration + ' mins - Rs.' + route.price + ' <button type="button" class="select-route" data-route-id="' + route.id + '">Select</button>';
                    routeList.appendChild(card);
                  });

                  document.getElementById('route-results').style.display = 'block';

                  document.querySelectorAll('.select-route').forEach((btn) => {
                    btn.addEventListener('click', () => {
                      const id = btn.getAttribute('data-route-id');
                      const route = data.routes.find((r) => r.id === id);
                      state.selectedRoute = route;
                      document.getElementById('selected-route').textContent = 'Selected: ' + route.name;
                      document.getElementById('booking-panel').style.display = 'block';
                    });
                  });
                });

                document.getElementById('confirm-booking').addEventListener('click', async () => {
                  const payload = {
                    routeId: state.selectedRoute.id,
                    timeSlot: document.getElementById('time-slot').value,
                  };

                  const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  const data = await res.json();
                  state.bookingId = data.booking.id;
                  document.getElementById('payment-panel').style.display = 'block';
                });

                document.getElementById('pay-now').addEventListener('click', async () => {
                  const payload = {
                    bookingId: state.bookingId,
                    amount: 650,
                    method: document.getElementById('payment-method').value,
                  };

                  const res = await fetch('/api/payments/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  const data = await res.json();
                  document.getElementById('receipt').textContent = 'Receipt: ' + data.receiptId;
                  document.getElementById('success-panel').style.display = 'block';
                });
              </script>
            </body>
          </html>
        `,
      });
    });

    await page.route('**/api/routes/search', async route => {
      capturedSearchPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          routes: [
            { id: 'r1', name: 'Fast Route A', duration: 35, price: 650 },
            { id: 'r2', name: 'Eco Route B', duration: 42, price: 590 },
          ],
        }),
      });
    });

    await page.route('**/api/bookings', async route => {
      capturedBookingPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          booking: {
            id: 'booking-9001',
            status: 'confirmed',
          },
        }),
      });
    });

    await page.route('**/api/payments/confirm', async route => {
      capturedPaymentPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          receiptId: 'rcpt-445566',
        }),
      });
    });

    await test.step('Open trip planner page', async () => {
      await page.goto('/trip-planner');
      await expect(page).toHaveTitle(/Trip Planner/);
      await expect(page.locator('h1')).toContainText('Smart Trip Planner');
    });

    await test.step('Search available routes', async () => {
      await page.fill('#from', 'Kottayam');
      await page.fill('#to', 'Kochi');
      await page.fill('#travel-date', '2026-03-28');
      await page.click('#search-routes');

      await expect(page.locator('#route-results')).toBeVisible();
      await expect(page.locator('.route-card')).toHaveCount(2);
      await expect(page.locator('.route-card').first()).toContainText('Fast Route A');
    });

    await test.step('Select route and confirm booking', async () => {
      await page.locator('.select-route').first().click();
      await expect(page.locator('#booking-panel')).toBeVisible();
      await expect(page.locator('#selected-route')).toContainText('Fast Route A');

      await page.selectOption('#time-slot', '10:00-11:00');
      await page.click('#confirm-booking');
      await expect(page.locator('#payment-panel')).toBeVisible();
    });

    await test.step('Complete payment and verify confirmation', async () => {
      await page.selectOption('#payment-method', 'upi');
      await page.click('#pay-now');

      await expect(page.locator('#success-panel')).toBeVisible();
      await expect(page.locator('#receipt')).toContainText('rcpt-445566');
    });

    await test.step('Verify request payloads and attach debug output', async () => {
      expect(capturedSearchPayload).toEqual({
        from: 'Kottayam',
        to: 'Kochi',
        date: '2026-03-28',
      });

      expect(capturedBookingPayload).toEqual({
        routeId: 'r1',
        timeSlot: '10:00-11:00',
      });

      expect(capturedPaymentPayload).toEqual({
        bookingId: 'booking-9001',
        amount: 650,
        method: 'upi',
      });

      await test.info().attach('trip-flow-payloads.json', {
        body: JSON.stringify(
          {
            search: capturedSearchPayload,
            booking: capturedBookingPayload,
            payment: capturedPaymentPayload,
          },
          null,
          2
        ),
        contentType: 'application/json',
      });

      await test.info().attach('trip-flow-success.png', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  });
});
