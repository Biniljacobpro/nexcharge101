# Playwright Tests for NexCharge

This directory contains end-to-end tests for the NexCharge application using Playwright.

## Prerequisites

Make sure you have the following installed:
- Node.js
- npm

## Installation

1. Install Playwright test dependencies:
   ```bash
   npm install -D @playwright/test
   ```

2. Install browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests for a specific file
```bash
npx playwright test tests/admin-dashboard.spec.js
```

### Run tests with UI mode (interactive)
```bash
npx playwright test --ui
```

## Generating Reports

### HTML Report
After running tests, an HTML report is automatically generated. To view it:
```bash
npx playwright show-report
```

### JSON Report
A JSON report is also generated at `test-results.json`.

## Test Structure

- `admin-dashboard.spec.js` - Tests for the admin dashboard functionality
- `corporate-dashboard.spec.js` - Tests for the corporate dashboard functionality
- `notification.spec.js` - Tests for the notification system
- `user-flows.spec.js` - Tests for general user flows

## Writing New Tests

1. Create a new file with `.spec.js` extension in the tests directory
2. Use the following template:

```javascript
const { test, expect } = require('@playwright/test');

test('should do something', async ({ page }) => {
  // Your test code here
});
```

## Environment Variables

The tests use the baseURL from the Playwright config (`http://localhost:3000`).

## CI/CD Integration

The tests can be integrated into your CI/CD pipeline. Make sure to:
1. Install dependencies
2. Install browsers
3. Run the tests
4. Archive the test results and reports

## Test Results

Test results are stored in:
- `test-results/` - Screenshots, videos, and traces
- `playwright-report/` - HTML report (generated after test run)
- `test-results.json` - JSON report