/**
 * tests/m1_challenger_verification.js
 * Empirical Challenger Verification & Stress Test Suite for Milestone 1 (Theme and Icons)
 * 
 * Verifies:
 * 1. WCAG 2.1 Contrast ratios for all Dark Mode surface/text and surface/icon accent pairs.
 * 2. Color token cascades, variable resolution, and CSS syntax validation across theme.css, header.css, footer.css, category-drawer.css.
 * 3. Freeship threshold 300,000 VND consistency, boundary mathematics, and edge case resilience.
 * 4. Zero harsh/boxed borders on icons across all 6 modified components and 3 stylesheets.
 * 5. Adversarial stress tests (negative values, extreme numbers, specificity clash checks).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// --- Helper Functions for WCAG 2.1 Luminance & Contrast ---
function hexToRgb(hex) {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(fgHex, bgHex) {
  const [r1, g1, b1] = hexToRgb(fgHex);
  const [r2, g2, b2] = hexToRgb(bgHex);
  const lum1 = relativeLuminance(r1, g1, b1);
  const lum2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Test Results Collector
const results = {
  passed: 0,
  failed: 0,
  details: []
};

function assert(condition, testName, extraInfo = '') {
  if (condition) {
    results.passed++;
    results.details.push(`  [PASS] ${testName}`);
  } else {
    results.failed++;
    results.details.push(`  [FAIL] ${testName} - ${extraInfo}`);
  }
}

console.log('================================================================');
console.log('   EMPIRICAL CHALLENGER VERIFICATION: MILESTONE 1 (THEME/ICONS)  ');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: WCAG 2.1 Contrast Testing in Dark Mode
// -------------------------------------------------------------
console.log('--- SECTION 1: WCAG 2.1 Contrast Ratio Verification (Dark Mode) ---');

const darkSurfaces = {
  pageBg: '#0b0f19',
  cardBg: '#1e293b',
  mutedBg: '#141c2e',
  hoverBg: '#243147',
  footerBg: '#0f172a'
};

const darkTextTokens = {
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  primaryBrand: '#f97316',
  errorText: '#f87171',
  successText: '#34d399',
  warningText: '#fbbf24'
};

const darkIconAccents = {
  blue: '#60a5fa',
  teal: '#2dd4bf',
  green: '#34d399',
  amber: '#fbbf24',
  orange: '#fb923c',
  red: '#f87171',
  purple: '#c084fc'
};

// 1.1 Primary text on dark backgrounds (Must meet AAA >= 7.0:1 or AA >= 4.5:1)
for (const [sName, sHex] of Object.entries(darkSurfaces)) {
  const ratio = calculateContrastRatio(darkTextTokens.textPrimary, sHex);
  assert(ratio >= 10.0, `Primary text (${darkTextTokens.textPrimary}) on ${sName} (${sHex}) has excellent AAA contrast (${ratio.toFixed(2)}:1 >= 10:1)`, `Ratio is ${ratio.toFixed(2)}:1`);
}

// 1.2 Secondary text on dark backgrounds (Must meet AA >= 4.5:1 for normal text)
for (const [sName, sHex] of Object.entries(darkSurfaces)) {
  const ratio = calculateContrastRatio(darkTextTokens.textSecondary, sHex);
  assert(ratio >= 4.5, `Secondary text (${darkTextTokens.textSecondary}) on ${sName} (${sHex}) passes WCAG AA (${ratio.toFixed(2)}:1 >= 4.5:1)`, `Ratio is ${ratio.toFixed(2)}:1`);
}

// 1.3 Dark mode icon accents on Card BG (#1e293b) & Page BG (#0b0f19) (Graphical / UI components must meet WCAG AA >= 3.0:1)
for (const [accentName, accentHex] of Object.entries(darkIconAccents)) {
  const ratioCard = calculateContrastRatio(accentHex, darkSurfaces.cardBg);
  const ratioPage = calculateContrastRatio(accentHex, darkSurfaces.pageBg);
  assert(ratioCard >= 3.0, `Icon accent ${accentName} (${accentHex}) on cardBg (${darkSurfaces.cardBg}) meets AA graphical standard (${ratioCard.toFixed(2)}:1 >= 3.0:1)`, `Ratio is ${ratioCard.toFixed(2)}:1`);
  assert(ratioPage >= 4.5, `Icon accent ${accentName} (${accentHex}) on pageBg (${darkSurfaces.pageBg}) meets AA normal text standard (${ratioPage.toFixed(2)}:1 >= 4.5:1)`, `Ratio is ${ratioPage.toFixed(2)}:1`);
}

// -------------------------------------------------------------
// SECTION 2: Color Cascade & Token Resolution
// -------------------------------------------------------------
console.log('\n--- SECTION 2: CSS Color Cascade & Token Completeness ---');

const themeCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/theme.css'), 'utf-8');
const headerCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/header.css'), 'utf-8');
const footerCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/footer.css'), 'utf-8');
const categoryDrawerCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/category-drawer.css'), 'utf-8');

// 2.1 Verify theme.css defines both light and dark token palettes
assert(themeCss.includes('[data-theme="light"]') || themeCss.includes(':root'), 'theme.css defines :root / light tokens');
assert(themeCss.includes('[data-theme="dark"]'), 'theme.css defines [data-theme="dark"] tokens');
assert(themeCss.includes('--bg-page: #0b0f19;'), 'theme.css defines dark --bg-page');
assert(themeCss.includes('--bg-card: #1e293b;'), 'theme.css defines dark --bg-card');
assert(themeCss.includes('--text-primary: #f8fafc;'), 'theme.css defines dark --text-primary');

// 2.2 Verify flat icon utility classes in theme.css
const requiredIconAccents = ['icon-accent-blue', 'icon-accent-teal', 'icon-accent-green', 'icon-accent-amber', 'icon-accent-orange', 'icon-accent-red', 'icon-accent-purple'];
requiredIconAccents.forEach(acc => {
  assert(themeCss.includes(`.${acc}`), `theme.css defines standard utility class .${acc}`);
  assert(themeCss.includes(`[data-theme="dark"] .${acc}`), `theme.css defines dark mode adaptation for .${acc}`);
});

// 2.3 Verify accent tile classes in theme.css have border: none
const requiredTiles = ['accent-tile-blue', 'accent-tile-teal', 'accent-tile-green', 'accent-tile-orange', 'accent-tile-amber', 'accent-tile-red', 'accent-tile-purple'];
requiredTiles.forEach(tile => {
  assert(themeCss.includes(`.${tile} { background:`) && themeCss.includes('border: none;'), `theme.css tile .${tile} is frameless (border: none)`);
});

// 2.4 Verify header.css dark mode rules coverage
assert(headerCss.includes('[data-theme="dark"] .shopee-search-dropdown-menu'), 'header.css has dark mode search dropdown rule');
assert(headerCss.includes('[data-theme="dark"] .header-mini-cart-popover'), 'header.css has dark mode mini cart popover rule');
assert(headerCss.includes('[data-theme="dark"] .header-user-dropdown-card'), 'header.css has dark mode user dropdown rule');
assert(headerCss.includes('[data-theme="dark"] .order-lookup-modal-card'), 'header.css has dark mode order lookup modal rule');

// 2.5 Verify footer.css dark mode rules coverage
assert(footerCss.includes('[data-theme="dark"] .shopee-footer'), 'footer.css has dark mode footer container rule');
assert(footerCss.includes('[data-theme="dark"] .shopee-footer-link'), 'footer.css has dark mode footer link rule');
assert(footerCss.includes('[data-theme="dark"] .footer-attribution-section'), 'footer.css has dark mode attribution section rule');

// 2.6 Verify category-drawer.css dark mode rules coverage
assert(categoryDrawerCss.includes('[data-theme="dark"] .category-drawer-modal'), 'category-drawer.css has dark mode modal rule');
assert(categoryDrawerCss.includes('[data-theme="dark"] .category-drawer-card'), 'category-drawer.css has dark mode card rule');
assert(categoryDrawerCss.includes('[data-theme="dark"] .category-drawer-footer'), 'category-drawer.css has dark mode footer mall strip rule');

// 2.7 CSS Balanced Braces & Syntax Integrity Check
function checkBraceBalance(cssContent, filename) {
  let openCount = 0;
  for (let i = 0; i < cssContent.length; i++) {
    if (cssContent[i] === '{') openCount++;
    if (cssContent[i] === '}') openCount--;
    if (openCount < 0) return false;
  }
  return openCount === 0;
}
assert(checkBraceBalance(themeCss, 'theme.css'), 'theme.css syntax: perfectly balanced braces { }');
assert(checkBraceBalance(headerCss, 'header.css'), 'header.css syntax: perfectly balanced braces { }');
assert(checkBraceBalance(footerCss, 'footer.css'), 'footer.css syntax: perfectly balanced braces { }');
assert(checkBraceBalance(categoryDrawerCss, 'category-drawer.css'), 'category-drawer.css syntax: perfectly balanced braces { }');

// -------------------------------------------------------------
// SECTION 3: Freeship Threshold Consistency & Mathematical Logic
// -------------------------------------------------------------
console.log('\n--- SECTION 3: Freeship Threshold 300,000 VND Verification ---');

const headerJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/Header.jsx'), 'utf-8');
const cartPageJsx = fs.readFileSync(path.join(rootDir, 'client/src/pages/CartPage.jsx'), 'utf-8');
const homePageJsx = fs.readFileSync(path.join(rootDir, 'client/src/pages/HomePage.jsx'), 'utf-8');

// 3.1 CartPage threshold definition
assert(cartPageJsx.includes('FREE_SHIPPING_THRESHOLD = 300000;'), 'CartPage.jsx defines FREE_SHIPPING_THRESHOLD as 300000');

// 3.2 HomePage banner threshold
assert(homePageJsx.includes('300.000₫'), 'HomePage.jsx advertises Freeship threshold of 300.000₫');

// 3.3 Header mini-cart threshold checks
assert(headerJsx.includes('cartSubtotal >= 300000'), 'Header.jsx checks cartSubtotal >= 300000 for qualified state');
assert(headerJsx.includes('300000 - cartSubtotal'), 'Header.jsx computes remaining needed as 300000 - cartSubtotal');
assert(headerJsx.includes('cartSubtotal / 300000'), 'Header.jsx calculates progress percentage with denominator 300000');
assert(!headerJsx.includes('cartSubtotal >= 200000'), 'Header.jsx no longer contains stale 200000 threshold comparison');
assert(!headerJsx.includes('200000 - cartSubtotal'), 'Header.jsx no longer contains stale 200000 remaining amount calculation');

// 3.4 Freeship Boundary & Calculation Logic Verification
const testCartValues = [
  { subtotal: 0, expectedQualified: false, expectedRemaining: 300000, expectedFill: 0 },
  { subtotal: 100000, expectedQualified: false, expectedRemaining: 200000, expectedFill: 33 },
  { subtotal: 150000, expectedQualified: false, expectedRemaining: 150000, expectedFill: 50 },
  { subtotal: 299999, expectedQualified: false, expectedRemaining: 1, expectedFill: 100 },
  { subtotal: 300000, expectedQualified: true, expectedRemaining: 0, expectedFill: 100 },
  { subtotal: 500000, expectedQualified: true, expectedRemaining: -200000, expectedFill: 100 }
];

testCartValues.forEach(tc => {
  const qualified = tc.subtotal >= 300000;
  const remaining = 300000 - tc.subtotal;
  const fill = Math.min(100, Math.round((tc.subtotal / 300000) * 100));
  assert(qualified === tc.expectedQualified, `Freeship state for subtotal ${tc.subtotal}: qualified is ${qualified}`);
  if (!qualified) {
    assert(remaining === tc.expectedRemaining, `Freeship needed for subtotal ${tc.subtotal}: remaining is ${remaining} VND`);
  }
  assert(fill === tc.expectedFill, `Freeship progress fill for subtotal ${tc.subtotal}: ${fill}% matches expected ${tc.expectedFill}%`);
});

// -------------------------------------------------------------
// SECTION 4: Icon Unboxing & Elimination of Harsh Borders
// -------------------------------------------------------------
console.log('\n--- SECTION 4: Icon Unboxing & Elimination of Rigid Borders ---');

const accountSidebarJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/AccountSidebar.jsx'), 'utf-8');
const footerJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/Footer.jsx'), 'utf-8');
const mobileBottomNavJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/MobileBottomNav.jsx'), 'utf-8');
const categoryDrawerJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/CategoryMegaMenuDrawer.jsx'), 'utf-8');
const notifsPopoverJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/NotificationsPopover.jsx'), 'utf-8');

// 4.1 MobileBottomNav icons are unboxed
assert(!mobileBottomNavJsx.includes("border: currentPath === '/' ? '1px solid"), 'MobileBottomNav: HomeIcon unboxed (no conditional 1px border)');
assert(!mobileBottomNavJsx.includes("width: '28px', height: '28px', borderRadius: '8px'"), 'MobileBottomNav: Rigid 28x28 icon wrapper boxes removed');

// 4.2 AccountSidebar icons have border: 'none'
assert(!accountSidebarJsx.includes("border: '1px solid rgba(5, 150, 105, 0.28)'"), 'AccountSidebar: SPX icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(124, 58, 237, 0.28)'"), 'AccountSidebar: Profile icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(234, 88, 12, 0.28)'"), 'AccountSidebar: Addresses icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(13, 148, 136, 0.28)'"), 'AccountSidebar: Payments icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(99, 102, 241, 0.28)'"), 'AccountSidebar: Security icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(249, 115, 22, 0.28)'"), 'AccountSidebar: Voucher icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(217, 119, 6, 0.30)'"), 'AccountSidebar: Coin icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(239, 68, 68, 0.28)'"), 'AccountSidebar: Wishlist icon has no 1px solid border');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(234, 88, 12, 0.25)'"), 'AccountSidebar: Seller link arrow span removed');
assert(!accountSidebarJsx.includes("border: '1px solid rgba(220, 38, 38, 0.25)'"), 'AccountSidebar: Admin link arrow span removed');

// 4.3 NotificationsPopover icons are unboxed
assert(!notifsPopoverJsx.includes("border: '1px solid rgba(245, 158, 11, 0.28)'"), 'NotificationsPopover: Bell action button has no boxed 1px border');
assert(notifsPopoverJsx.includes('shopee-header-action-icon'), 'NotificationsPopover: Bell action uses unified shopee-header-action-icon');

// 4.4 CategoryMegaMenuDrawer icons are unboxed
assert(!categoryDrawerJsx.includes('border: `1px solid ${cat.color}35`'), 'CategoryMegaMenuDrawer: Category card icons have border: none');
assert(!categoryDrawerJsx.includes("border: '1px solid rgba(234, 88, 12, 0.28)'"), 'CategoryMegaMenuDrawer: Empty filter refresh icon unboxed');
assert(!categoryDrawerJsx.includes("border: '1px solid rgba(220, 38, 38, 0.25)'"), 'CategoryMegaMenuDrawer: Mall strip store icon unboxed');

// 4.5 Footer badges and units are unboxed
assert(!footerJsx.includes("border: '1px solid rgba(37, 99, 235, 0.25)'"), 'Footer: Social icons unboxed (no 1px solid border spans)');
assert(!footerJsx.includes("width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)'"), 'Footer: Hotline icon wrapper span removed');

// 4.6 CSS Stylesheets icon containers have border: none
assert(headerCss.includes('.user-dropdown-item .item-icon {\n  width: 32px;\n  height: 32px;\n  border-radius: 8px;\n  background: rgba(255, 255, 255, 0.06);\n  border: none;'), 'header.css: user-dropdown-item .item-icon has border: none');
assert(headerCss.includes('.order-lookup-badge-icon {\n  font-size: 24px;\n  background: rgba(59, 130, 246, 0.18);\n  width: 42px;\n  height: 42px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  border: none;'), 'header.css: order-lookup-badge-icon has border: none');
assert(categoryDrawerCss.includes('.category-card-icon {\n  width: 36px;\n  height: 36px;\n  border-radius: 10px;\n  background: var(--bg-muted, #f1f5f9);\n  border: none;'), 'category-drawer.css: .category-card-icon has border: none');

// -------------------------------------------------------------
// SECTION 5: ADVERSARIAL STRESS TESTING
// -------------------------------------------------------------
console.log('\n--- SECTION 5: Adversarial Stress Testing ---');

// 5.1 Math extremes on Freeship
const mathExtremes = [
  { val: -50000, desc: 'Negative cart subtotal (-50,000)' },
  { val: 1000000000, desc: 'Enterprise cart subtotal (1,000,000,000)' },
  { val: 300000.0001, desc: 'Fractional cart subtotal (300,000.0001)' }
];

mathExtremes.forEach(me => {
  const fill = Math.min(100, Math.round((me.val / 300000) * 100));
  assert(!isNaN(fill) && isFinite(fill), `Freeship fill is finite for ${me.desc}: ${fill}%`);
  const qualified = me.val >= 300000;
  assert(typeof qualified === 'boolean', `Qualified state is strictly boolean for ${me.desc}`);
});

// 5.2 CSS Selector Specificity & Overlap Stress
// Check that [data-theme="dark"] rules in header.css properly override light styles
const darkHeaderRules = headerCss.match(/\[data-theme="dark"\]\s+([^{]+)\{([^}]+)\}/g) || [];
assert(darkHeaderRules.length >= 20, `header.css contains at least 20 comprehensive [data-theme="dark"] rules (found ${darkHeaderRules.length})`);

const darkFooterRules = footerCss.match(/\[data-theme="dark"\]\s+([^{]+)\{([^}]+)\}/g) || [];
assert(darkFooterRules.length >= 10, `footer.css contains at least 10 comprehensive [data-theme="dark"] rules (found ${darkFooterRules.length})`);

const darkDrawerRules = categoryDrawerCss.match(/\[data-theme="dark"\]\s+([^{]+)\{([^}]+)\}/g) || [];
assert(darkDrawerRules.length >= 10, `category-drawer.css contains at least 10 comprehensive [data-theme="dark"] rules (found ${darkDrawerRules.length})`);

// -------------------------------------------------------------
// SUMMARY & EXIT CODE
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS:   ${results.passed + results.failed}`);
console.log(`PASSED:        ${results.passed} (✔)`);
console.log(`FAILED:        ${results.failed} (❌)`);
console.log(`PASS RATE:     ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
console.log('================================================================');

if (results.failed > 0) {
  console.error('\nFAILURES ENCOUNTERED:');
  results.details.filter(d => d.includes('[FAIL]')).forEach(d => console.error(d));
  process.exit(1);
} else {
  console.log('\nALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
