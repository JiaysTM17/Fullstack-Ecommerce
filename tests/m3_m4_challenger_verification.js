// tests/m3_m4_challenger_verification.js
// Verification suite for Milestones 3 & 4 (Cart, Checkout, SPX Tracking, Seller/Admin Dashboards)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests.push({ testName, details });
    console.log(`  [FAIL] ${testName} - ${details}`);
  }
}

console.log('================================================================');
console.log('   EMPIRICAL CHALLENGER VERIFICATION: MILESTONES 3 & 4          ');
console.log('================================================================');

// 1. Files existence & readability
console.log('\n--- SECTION 1: File Existence & Syntax Verification ---');
const filesToCheck = [
  'client/src/pages/CartPage.jsx',
  'client/src/pages/CheckoutPage.jsx',
  'client/src/pages/SellerDashboardPage.jsx',
  'client/src/pages/AdminDashboardPage.jsx',
  'client/src/styles/cart.css',
  'client/src/styles/checkout.css',
  'client/src/styles/checkout-multistep.css',
  'client/src/styles/dashboard.css',
];

const fileContents = {};
filesToCheck.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  const exists = fs.existsSync(fullPath);
  assert(exists, `File exists: ${relPath}`);
  if (exists) {
    fileContents[relPath] = fs.readFileSync(fullPath, 'utf-8');
  }
});

// 2. Icon Unboxing in Checkout & Cart
console.log('\n--- SECTION 2: Icon Unboxing & Elimination of Rigid Borders ---');
const checkoutJsx = fileContents['client/src/pages/CheckoutPage.jsx'] || '';
const dashboardCss = fileContents['client/src/styles/dashboard.css'] || '';

// Checkout shipping option icons should not have rigid borders
assert(!checkoutJsx.includes('1px solid rgba(37, 99, 235, 0.22)'), 'CheckoutPage.jsx has eliminated rigid border from shipping option icons');
assert(!checkoutJsx.includes('1px solid rgba(234, 88, 12, 0.22)'), 'CheckoutPage.jsx has eliminated rigid border from express shipping option icon');
assert(!checkoutJsx.includes('1px solid rgba(22, 163, 74, 0.22)'), 'CheckoutPage.jsx has eliminated rigid border from economy shipping option icon');

// Dashboard sidebar-icon-cell should be borderless (unboxed)
assert(!dashboardCss.includes('.sidebar-icon-cell {\n  width: 24px;\n  height: 24px;\n  border-radius: 6px;\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;'), 'dashboard.css: .sidebar-icon-cell has unboxed borderless icon container');

// 3. Freeship Max 300.000₫ threshold in CartPage
console.log('\n--- SECTION 3: Freeship Max Threshold in Cart & Checkout ---');
const cartJsx = fileContents['client/src/pages/CartPage.jsx'] || '';
assert(cartJsx.includes('FREE_SHIPPING_THRESHOLD = 300000;'), 'CartPage.jsx maintains standard 300000 VND Freeship threshold');

// 4. Dark Mode coverage in Dashboards
console.log('\n--- SECTION 4: Dark Mode Token Synchronization in Dashboards ---');
assert(dashboardCss.includes('[data-theme="dark"] .shopee-sidebar'), 'dashboard.css defines dark sidebar styling');
assert(dashboardCss.includes('[data-theme="dark"] .shopee-metric-card'), 'dashboard.css defines dark metric card styling');
assert(dashboardCss.includes('[data-theme="dark"] .shopee-data-table th'), 'dashboard.css defines dark table header styling');
assert(dashboardCss.includes('[data-theme="dark"] .shopee-data-table td'), 'dashboard.css defines dark table cell styling');
assert(dashboardCss.includes('[data-theme="dark"] .shopee-account-sidebar-container'), 'dashboard.css defines dark account sidebar styling');

// 5. CSS Brace Balance
console.log('\n--- SECTION 5: CSS Syntax Integrity Check ---');
['client/src/styles/cart.css', 'client/src/styles/checkout.css', 'client/src/styles/checkout-multistep.css', 'client/src/styles/dashboard.css'].forEach(file => {
  const content = fileContents[file] || '';
  let count = 0;
  for (let ch of content) {
    if (ch === '{') count++;
    if (ch === '}') count--;
  }
  assert(count === 0, `${file} syntax: balanced curly braces { }`);
});

// Summary
console.log('\n================================================================');
console.log(`TOTAL TESTS:   ${totalTests}`);
console.log(`PASSED:        ${passedTests} (✔)`);
console.log(`FAILED:        ${failedTests.length} (${failedTests.length === 0 ? '✔' : '❌'})`);
console.log(`PASS RATE:     ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('================================================================\n');

if (failedTests.length > 0) {
  process.exit(1);
} else {
  console.log('ALL MILESTONE 3 & 4 CHALLENGER TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
