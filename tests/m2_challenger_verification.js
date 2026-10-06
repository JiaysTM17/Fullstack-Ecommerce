/**
 * tests/m2_challenger_verification.js
 * Empirical Challenger Verification & Stress Test Suite for Milestone 2 (Storefront & PDP Modernization)
 *
 * Verifies:
 * 1. Syntax, imports, and CSS brace balance across all 11 owned files.
 * 2. Unboxing: complete elimination of rigid/boxed border spans around icons.
 * 3. Token cascade, theme custom properties, and dark mode readability.
 * 4. Responsive layout constraints: tablet Buy Box and mobile hero horizontal scroll rail.
 * 5. Component edge-case resilience and boundary logic validation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
    results.details.push(`  [FAIL] ${testName}${extraInfo ? ' - ' + extraInfo : ''}`);
  }
}

console.log('================================================================');
console.log('   EMPIRICAL CHALLENGER VERIFICATION: MILESTONE 2 (STOREFRONT/PDP)');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: Syntax, Import Resolution & File Completeness
// -------------------------------------------------------------
console.log('--- SECTION 1: Syntax & Import Verification (11 Owned Files) ---');

const m2Files = [
  'client/src/styles/product.css',
  'client/src/styles/banner.css',
  'client/src/styles/deals.css',
  'client/src/styles/amazon-pdp.css',
  'client/src/components/ProductCard.jsx',
  'client/src/components/HeroBanner.jsx',
  'client/src/components/FlashDeals.jsx',
  'client/src/pages/ProductDetailPage.jsx',
  'client/src/components/ProductQASection.jsx',
  'client/src/components/RecentlyViewedSection.jsx',
  'client/src/components/ProductReviewModal.jsx'
];

m2Files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
});

// 1.1 CSS Brace Balance Check
function checkBraceBalance(cssContent) {
  let openCount = 0;
  for (let i = 0; i < cssContent.length; i++) {
    if (cssContent[i] === '{') openCount++;
    if (cssContent[i] === '}') openCount--;
    if (openCount < 0) return false;
  }
  return openCount === 0;
}

const productCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/product.css'), 'utf-8');
const bannerCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/banner.css'), 'utf-8');
const dealsCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/deals.css'), 'utf-8');
const amazonPdpCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/amazon-pdp.css'), 'utf-8');

assert(checkBraceBalance(productCss), 'product.css has perfectly balanced braces { }');
assert(checkBraceBalance(bannerCss), 'banner.css has perfectly balanced braces { }');
assert(checkBraceBalance(dealsCss), 'deals.css has perfectly balanced braces { }');
assert(checkBraceBalance(amazonPdpCss), 'amazon-pdp.css has perfectly balanced braces { }');

// 1.2 Icon Exports Validation in OrdersIcons.jsx
const ordersIconsContent = fs.readFileSync(path.join(rootDir, 'client/src/components/OrdersIcons.jsx'), 'utf-8');
const exportedIcons = new Set([...ordersIconsContent.matchAll(/export const ([A-Za-z0-9_]+)/g)].map(m => m[1]));

const jsxFiles = [
  'client/src/components/ProductCard.jsx',
  'client/src/components/HeroBanner.jsx',
  'client/src/components/FlashDeals.jsx',
  'client/src/pages/ProductDetailPage.jsx',
  'client/src/components/ProductQASection.jsx',
  'client/src/components/RecentlyViewedSection.jsx',
  'client/src/components/ProductReviewModal.jsx'
];

jsxFiles.forEach(f => {
  const content = fs.readFileSync(path.join(rootDir, f), 'utf-8');
  const importMatches = [...content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](?:\.\/|\.\.\/components\/)OrdersIcons['"]/g)];
  importMatches.forEach(m => {
    const iconNames = m[1].split(',').map(s => s.trim()).filter(Boolean);
    iconNames.forEach(iconName => {
      assert(exportedIcons.has(iconName), `${f} imports valid OrdersIcons: ${iconName}`);
    });
  });
});

// -------------------------------------------------------------
// SECTION 2: Icon Unboxing & Elimination of Rigid Enclosures
// -------------------------------------------------------------
console.log('\n--- SECTION 2: Icon Unboxing & Framing Elimination ---');

const productCardJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/ProductCard.jsx'), 'utf-8');
const heroBannerJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/HeroBanner.jsx'), 'utf-8');
const flashDealsJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/FlashDeals.jsx'), 'utf-8');
const pdpJsx = fs.readFileSync(path.join(rootDir, 'client/src/pages/ProductDetailPage.jsx'), 'utf-8');
const qaJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/ProductQASection.jsx'), 'utf-8');
const recentlyViewedJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/RecentlyViewedSection.jsx'), 'utf-8');
const reviewModalJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/ProductReviewModal.jsx'), 'utf-8');

// 2.1 ProductCard: unboxed actions and badges
assert(!productCardJsx.includes("width: '24px', height: '24px', borderRadius: '50%'"), 'ProductCard: wishlist/compare nested circular spans removed');
assert(productCardJsx.includes('className={`shopee-card-wishlist ${wishlisted ? \'active\' : \'\'}`}'), 'ProductCard: uses clean CSS class for wishlist button');
assert(productCardJsx.includes('className={`shopee-card-compare ${isCompared(productId) ? \'active\' : \'\'}`}'), 'ProductCard: uses clean CSS class for compare button');
assert(!productCardJsx.includes("width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)'"), 'ProductCard: quickview nested span removed');
assert(!productCardJsx.includes("width: '15px', height: '15px', borderRadius: '50%'"), 'ProductCard: badge nested spans removed');
assert(!productCardJsx.includes("width: '16px', height: '16px', borderRadius: '4px'"), 'ProductCard: rating star nested span removed');
assert(!productCardJsx.includes("width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255"), 'ProductCard: add-to-cart button nested spans removed');

// 2.2 HeroBanner: unboxed badges, navigation, and value propositions
assert(!heroBannerJsx.includes("width: '20px', height: '20px', borderRadius: '50%'"), 'HeroBanner: badge nested icon span removed');
assert(!heroBannerJsx.includes("width: '22px', height: '22px', borderRadius: '50%'"), 'HeroBanner: hero CTA button nested arrow span removed');
assert(!heroBannerJsx.includes("width: '28px', height: '28px', borderRadius: '50%'"), 'HeroBanner: carousel nav buttons nested arrow spans removed');
assert(!heroBannerJsx.includes("width: '38px', height: '38px', borderRadius: '10px'"), 'HeroBanner: value proposition 38x38 rigid boxed spans removed');
assert(heroBannerJsx.includes('className="banner-prop-icon"'), 'HeroBanner: value proposition uses .banner-prop-icon container');

// 2.3 FlashDeals: unboxed clock and chevron
assert(flashDealsJsx.includes('<ClockIcon size={14} color="var(--primary-color)" />'), 'FlashDeals: ClockIcon rendered with theme variable');
assert(flashDealsJsx.includes('<ChevronRightIcon size={13} color="var(--primary-color)" />'), 'FlashDeals: ChevronRightIcon rendered with theme variable');

// 2.4 ProductDetailPage: check remaining boxed spans
assert(!pdpJsx.includes("width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)'"), 'ProductDetailPage line 214: loading ShoppingBagIcon boxed span removed', 'Found rigid 30px bordered span around ShoppingBagIcon');
assert(!pdpJsx.includes("width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)'"), 'ProductDetailPage lines 290/294: breadcrumb ChevronRightIcon boxed spans removed', 'Found rigid 16px bordered spans around ChevronRightIcon');
assert(!pdpJsx.includes("width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)'"), 'ProductDetailPage line 434: low stock BoltIcon boxed span removed', 'Found rigid 18px bordered span around BoltIcon');
assert(!pdpJsx.includes("width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.14)'"), 'ProductDetailPage line 441: in-stock CheckIcon boxed span removed', 'Found rigid 18px bordered span around CheckIcon');
assert(!pdpJsx.includes("width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.14)'"), 'ProductDetailPage line 449: out-of-stock CloseIcon boxed span removed', 'Found rigid 18px bordered span around CloseIcon');
assert(!pdpJsx.includes("width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.15)'"), 'ProductDetailPage line 461: stock meter FlameIcon boxed span removed', 'Found rigid 20px bordered span around FlameIcon');
assert(!pdpJsx.includes("width: '22px', height: '22px', borderRadius: '6px', background: '#dbeafe'"), 'ProductDetailPage line 732: write review button PencilIcon boxed span removed', 'Found rigid 22px boxed span around PencilIcon');
assert(!pdpJsx.includes("width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.14)'"), 'ProductDetailPage line 980: verified buyer CheckIcon boxed span removed', 'Found rigid 16px bordered span around CheckIcon');
assert(!pdpJsx.includes("width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.1)'"), 'ProductDetailPage line 1032: related products PackageIcon boxed span removed', 'Found rigid 32px bordered span around PackageIcon');
assert(!pdpJsx.includes("width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)'"), 'ProductDetailPage line 1116: share modal GlobeIcon boxed span removed', 'Found rigid 28px bordered span around GlobeIcon');
assert(!pdpJsx.includes("width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)'"), 'ProductDetailPage line 1138: share modal CloseIcon boxed span removed', 'Found rigid 20px bordered span around CloseIcon');

// 2.5 ProductQASection: unboxed Q/A and action icons
assert(!qaJsx.includes("width: '22px', height: '22px', borderRadius: '4px'"), 'ProductQASection: rigid Q/A square boxed spans removed');
assert(qaJsx.includes('ThumbsUpIcon size={14} color="currentColor"'), 'ProductQASection: upvote button uses unboxed ThumbsUpIcon with currentColor');

// 2.6 RecentlyViewedSection: unboxed carousel buttons and quick add
assert(!recentlyViewedJsx.includes("width: '24px', height: '24px', borderRadius: '50%'"), 'RecentlyViewedSection: carousel nav buttons nested spans removed');
assert(!recentlyViewedJsx.includes("width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.15)'"), 'RecentlyViewedSection: quick-add button nested span removed');

// 2.7 ProductReviewModal: unboxed modal header, coin reward, and camera
assert(!reviewModalJsx.includes("width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(217, 119, 6"), 'ProductReviewModal: header star rigid wrapper removed');
assert(!reviewModalJsx.includes("width: '36px', height: '36px', borderRadius: '10px'"), 'ProductReviewModal: coin reward rigid wrapper removed');

// -------------------------------------------------------------
// SECTION 3: Dark Mode Token Synchronization & Contrast
// -------------------------------------------------------------
console.log('\n--- SECTION 3: Dark Mode Token Synchronization ---');

// 3.1 product.css floating actions dark mode support
assert(productCss.includes('[data-theme="dark"] .shopee-card-wishlist'), 'product.css defines dark mode style for wishlist action');
assert(productCss.includes('[data-theme="dark"] .shopee-card-compare'), 'product.css defines dark mode style for compare action');
assert(productCss.includes('.shopee-quickview-btn {\n  position: absolute;\n  bottom: 8px;\n  left: 50%;\n  transform: translateX(-50%);\n  background: var(--bg-card);'), 'product.css quickview button uses var(--bg-card)');

// 3.2 deals.css theme variables
assert(!dealsCss.includes('color: #ea580c;'), 'deals.css no longer uses hardcoded #ea580c text colors');
assert(dealsCss.includes('var(--primary-color)'), 'deals.css uses var(--primary-color)');

// 3.3 amazon-pdp.css dark mode variables and contrast
assert(amazonPdpCss.includes('[data-theme="dark"] .amazon-delivery-info'), 'amazon-pdp.css defines dark mode for delivery info');
assert(amazonPdpCss.includes('[data-theme="dark"] .amazon-btn-add-cart'), 'amazon-pdp.css defines dark mode for add-to-cart button');
assert(amazonPdpCss.includes('[data-theme="dark"] .amazon-mobile-sticky-bar .mobile-btn-cart'), 'amazon-pdp.css defines dark mode for mobile sticky cart button');
assert(amazonPdpCss.includes('color: var(--text-primary'), 'amazon-pdp.css uses var(--text-primary) for high contrast text');

// 3.4 ProductDetailPage Dark Mode Contrast Bug Check
const hasHardcodedWhiteFilterBg = pdpJsx.includes('background: isActive ? "var(--primary-color, #ea580c)" : "#fff"');
assert(!hasHardcodedWhiteFilterBg, 'ProductDetailPage line 933: review filter buttons must not use hardcoded #fff background', 'Review filter buttons use hardcoded #fff with var(--text-primary), causing white-on-white text in Dark Mode');

// 3.5 Components use theme variables
assert(qaJsx.includes('background: "var(--bg-card, #ffffff)"'), 'ProductQASection uses var(--bg-card) for card background');
assert(recentlyViewedJsx.includes('background: "var(--bg-card, #ffffff)"'), 'RecentlyViewedSection uses var(--bg-card) for section background');
assert(reviewModalJsx.includes("background: 'var(--bg-card, #ffffff)'"), 'ProductReviewModal uses var(--bg-card) for modal dialog');

// -------------------------------------------------------------
// SECTION 4: Responsive Constraints & Safe Areas
// -------------------------------------------------------------
console.log('\n--- SECTION 4: Responsive Constraints & Mobile/Tablet Layouts ---');

// 4.1 Tablet Buy Box constraint in amazon-pdp.css
assert(amazonPdpCss.includes('@media (max-width: 1200px)'), 'amazon-pdp.css defines @media (max-width: 1200px) for tablet/laptop');
assert(amazonPdpCss.includes('max-width: 540px;\n    width: 100%;\n    margin: 0 auto;'), 'amazon-pdp.css centers and constrains buy box on tablet viewports');

// 4.2 Mobile Hero Scroll Rail in banner.css
assert(bannerCss.includes('@media (max-width: 600px)'), 'banner.css defines @media (max-width: 600px)');
assert(bannerCss.includes('scroll-snap-type: x mandatory;'), 'banner.css implements horizontal scroll snap on mobile');
assert(bannerCss.includes('overflow-x: auto;'), 'banner.css enables overflow-x scrolling for value propositions');

// 4.3 iOS Safe Area in amazon-pdp.css
assert(amazonPdpCss.includes('env(safe-area-inset-bottom, 0px)'), 'amazon-pdp.css uses safe-area-inset-bottom for mobile sticky action bar');

// -------------------------------------------------------------
// SECTION 5: Adversarial Boundary & Component Stress Tests
// -------------------------------------------------------------
console.log('\n--- SECTION 5: Adversarial Boundary & Stress Tests ---');

// 5.1 Currency formatting robustness
function defaultFormatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
}

const currencyTestCases = [
  { input: NaN, expected: '0 ₫' },
  { input: null, expected: '0 ₫' },
  { input: undefined, expected: '0 ₫' },
  { input: '100000', expected: '0 ₫' },
  { input: 0, expected: '0\u00a0₫' },
  { input: 350000, expected: '350.000\u00a0₫' },
  { input: 1000000000, expected: '1.000.000.000\u00a0₫' }
];

currencyTestCases.forEach((tc, idx) => {
  const result = defaultFormatCurrency(tc.input);
  assert(
    result === tc.expected || result.replace(/\s/g, ' ') === tc.expected.replace(/\s/g, ' '),
    `Currency fallback for case ${idx}: ${JSON.stringify(tc.input)} -> ${result}`
  );
});

// 5.2 Discount calculation robustness
function computeDiscount(originalPrice, price) {
  const hasDiscount = originalPrice > price;
  return hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
}

assert(computeDiscount(100000, 50000) === 50, 'Standard discount: 100k -> 50k is 50%');
assert(computeDiscount(100000, 100000) === 0, 'No discount when equal: 100k -> 100k is 0%');
assert(computeDiscount(50000, 100000) === 0, 'Price increased: 50k -> 100k is 0% (no negative discount)');
assert(computeDiscount(0, 50000) === 0, 'Zero original price: handled safely as 0%');
assert(computeDiscount(333333, 111111) === 67, 'Fractional discount: rounds cleanly to integer percentage');

// 5.3 Review validation rules
function validateReview(rating, comment) {
  if (!rating || rating < 1) {
    return { valid: false, error: 'MISSING_RATING' };
  }
  const trimmed = (comment || '').trim();
  if (!trimmed || trimmed.length < 10) {
    return { valid: false, error: 'COMMENT_TOO_SHORT' };
  }
  return { valid: true };
}

assert(!validateReview(0, 'San pham rat tot').valid, 'Review with 0 rating is rejected');
assert(!validateReview(5, '').valid, 'Review with empty comment is rejected');
assert(!validateReview(5, 'Qua tot!').valid, 'Review with short comment (<10 chars) is rejected');
assert(validateReview(5, 'Sản phẩm tuyệt vời, giao hàng siêu nhanh!').valid, 'Valid review passes validation');

// 5.4 Slide modulo navigation bounds
const SLIDE_COUNT = 3;
function getNextSlide(current) { return (current + 1) % SLIDE_COUNT; }
function getPrevSlide(current) { return (current - 1 + SLIDE_COUNT) % SLIDE_COUNT; }

assert(getNextSlide(0) === 1 && getNextSlide(2) === 0, 'Next slide wraps cleanly 0 -> 1 -> 2 -> 0');
assert(getPrevSlide(0) === 2 && getPrevSlide(2) === 1, 'Prev slide wraps cleanly 0 -> 2 -> 1 -> 0');

// 5.5 Countdown timer wrap-around math
function tickCountdown(h, m, s) {
  if (s > 0) return { h, m, s: s - 1 };
  if (m > 0) return { h, m: m - 1, s: 59 };
  if (h > 0) return { h: h - 1, m: 59, s: 59 };
  return { h: 3, m: 0, s: 0 };
}

const t1 = tickCountdown(2, 45, 0);
assert(t1.h === 2 && t1.m === 44 && t1.s === 59, 'Countdown rolls second to 59 and decrements minute');
const t2 = tickCountdown(1, 0, 0);
assert(t2.h === 0 && t2.m === 59 && t2.s === 59, 'Countdown rolls minute to 59 and decrements hour');
const t3 = tickCountdown(0, 0, 0);
assert(t3.h === 3 && t3.m === 0 && t3.s === 0, 'Countdown expires and resets to 3h window');

// -------------------------------------------------------------
// SECTION 6: Client Build Artifacts Verification
// -------------------------------------------------------------
console.log('\n--- SECTION 6: Production Build Output Verification ---');

const distHtmlPath = path.join(rootDir, 'client/dist/index.html');
const distAssetsDir = path.join(rootDir, 'client/dist/assets');

assert(fs.existsSync(distHtmlPath), 'client/dist/index.html exists and was generated');
assert(fs.existsSync(distAssetsDir), 'client/dist/assets directory exists');

const assetFiles = fs.existsSync(distAssetsDir) ? fs.readdirSync(distAssetsDir) : [];
const hasJsBundle = assetFiles.some(f => f.endsWith('.js'));
const hasCssBundle = assetFiles.some(f => f.endsWith('.css'));

assert(hasJsBundle, `client/dist/assets contains JS production bundle (${assetFiles.filter(f => f.endsWith('.js')).join(', ')})`);
assert(hasCssBundle, `client/dist/assets contains CSS production bundle (${assetFiles.filter(f => f.endsWith('.css')).join(', ')})`);

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
  console.log('\nALL MILESTONE 2 EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
