const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Go to the home page
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get all input elements
  const inputs = await page.$$('input');
  console.log('Found', inputs.length, 'input elements');
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');
    console.log(`Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`);
  }
  
  // Get all button elements
  const buttons = await page.$$('button');
  console.log('Found', buttons.length, 'button elements');
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const type = await button.getAttribute('type');
    console.log(`Button ${i}: text="${text.trim()}", type="${type}"`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'login-page.png' });
  console.log('Screenshot saved as login-page.png');
  
  // Close browser after a delay to see the page
  setTimeout(async () => {
    await browser.close();
  }, 5000);
})();