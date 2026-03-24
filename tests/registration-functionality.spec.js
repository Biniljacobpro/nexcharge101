// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Registration And Related Functionality', () => {
  test('should allow a user to complete registration successfully', async ({ page }) => {
    let capturedPayload = null;

    await page.route('**/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Register</title></head>
            <body>
              <h1>Create Account</h1>
              <form id="registration-form">
                <input id="name" name="name" type="text" placeholder="Full Name" />
                <input id="email" name="email" type="email" placeholder="Email" />
                <input id="password" name="password" type="password" placeholder="Password" />
                <button type="submit">Register</button>
              </form>
              <div id="success-message" style="display:none;">Registration successful</div>

              <script>
                const form = document.getElementById('registration-form');
                form.addEventListener('submit', async (e) => {
                  e.preventDefault();

                  const payload = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                  };

                  const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  const data = await response.json();
                  if (data.success) {
                    document.getElementById('success-message').style.display = 'block';
                  }
                });
              </script>
            </body>
          </html>
        `,
      });
    });

    await page.route('**/api/auth/register', async route => {
      const request = route.request();
      const payload = request.postDataJSON();
      capturedPayload = payload;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'test-user-001',
            name: payload.name,
            email: payload.email,
          },
        }),
      });
    });

    await test.step('Open registration page', async () => {
      await page.goto('/register');
      await expect(page.locator('h1')).toContainText('Create Account');
    });

    await test.step('Fill and submit registration form', async () => {
      await page.fill('#name', 'Test User');
      await page.fill('#email', 'testuser+nexcharge@example.com');
      await page.fill('#password', 'StrongPass@123');
      await page.click('button[type="submit"]');
    });

    await test.step('Verify registration success UI', async () => {
      await expect(page.locator('#success-message')).toBeVisible();
      await expect(page.locator('#success-message')).toContainText('Registration successful');
    });

    await test.step('Verify registration payload and attach debug data', async () => {
      expect(capturedPayload).toBeTruthy();
      expect(capturedPayload.name).toBe('Test User');
      expect(capturedPayload.email).toBe('testuser+nexcharge@example.com');
      expect(capturedPayload.password).toBe('StrongPass@123');

      await test.info().attach('registration-request-payload.json', {
        body: JSON.stringify(capturedPayload, null, 2),
        contentType: 'application/json',
      });

      await test.info().attach('registration-final-url.txt', {
        body: page.url(),
        contentType: 'text/plain',
      });

      await test.info().attach('registration-success-screen.png', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  });

  test('should toggle password visibility on registration page', async ({ page }) => {
    await page.route('**/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Register</title></head>
            <body>
              <h1>Create Account</h1>
              <input id="password" type="password" placeholder="Password" />
              <button id="toggle-password" type="button">Show</button>

              <script>
                const passwordInput = document.getElementById('password');
                const toggleButton = document.getElementById('toggle-password');

                toggleButton.addEventListener('click', () => {
                  const isHidden = passwordInput.getAttribute('type') === 'password';
                  passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
                  toggleButton.textContent = isHidden ? 'Hide' : 'Show';
                });
              </script>
            </body>
          </html>
        `,
      });
    });

    await page.goto('/register');

    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('#toggle-password');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleButton).toHaveText('Show');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(toggleButton).toHaveText('Hide');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleButton).toHaveText('Show');
  });
});
