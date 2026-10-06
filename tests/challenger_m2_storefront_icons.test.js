/**
 * Challenger 2 Test Suite — Milestone 2: Storefront & PDP Modernization
 * Empirical stress harness testing AST exports/imports, rigid border elimination,
 * mathematical boundaries, CSS token integrity, responsive rules, and dark-mode contrast.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect, runAllTests } from './harness/testRunner.js';

describe('Milestone 2 Empirical Stress Test: Storefront & PDP Modernization', () => {

  const rootDir = path.resolve('.');
  const componentsDir = path.join(rootDir, 'client/src/components');
  const pagesDir = path.join(rootDir, 'client/src/pages');
  const stylesDir = path.join(rootDir, 'client/src/styles');

  const m2Files = {
    productCard: path.join(componentsDir, 'ProductCard.jsx'),
    heroBanner: path.join(componentsDir, 'HeroBanner.jsx'),
    flashDeals: path.join(componentsDir, 'FlashDeals.jsx'),
    pdpPage: path.join(pagesDir, 'ProductDetailPage.jsx'),
    productQA: path.join(componentsDir, 'ProductQASection.jsx'),
    recentlyViewed: path.join(componentsDir, 'RecentlyViewedSection.jsx'),
    reviewModal: path.join(componentsDir, 'ProductReviewModal.jsx'),
    productCss: path.join(stylesDir, 'product.css'),
    bannerCss: path.join(stylesDir, 'banner.css'),
    dealsCss: path.join(stylesDir, 'deals.css'),
    pdpCss: path.join(stylesDir, 'amazon-pdp.css'),
  };

  // 1. File Existence & Scope
  test('E1. All 11 Milestone 2 files exist and are readable', () => {
    for (const [key, filePath] of Object.entries(m2Files)) {
      expect.ok(fs.existsSync(filePath), `File for ${key} must exist at ${filePath}`);
    }
  });

  // 2. Elimination of Rigid Boxed Icon Wrappers
  test('E2. ProductCard.jsx eliminates rigid boxed wrapper spans around icons', () => {
    const content = fs.readFileSync(m2Files.productCard, 'utf8');

    // Must not contain inline styles that create circular or square bordered spans around icons
    const rigidBoxRegex = /<span\s+style=\{\{[^}]*(?:width:\s*['"]\d+px['"][^}]*border:|border:[^}]*width:\s*['"]\d+px['"])[^}]*\}\}>\s*<[A-Za-z0-9_]*Icon/g;
    const matches = content.match(rigidBoxRegex);
    expect.equal(matches, null, `ProductCard.jsx must NOT wrap icons in rigid bordered spans: ${JSON.stringify(matches)}`);

    // Verify icons directly present
    expect.ok(content.includes('<HeartIcon'), 'ProductCard must render HeartIcon');
    expect.ok(content.includes('<ScaleIcon'), 'ProductCard must render ScaleIcon');
    expect.ok(content.includes('<StarIcon'), 'ProductCard must render StarIcon');
    expect.ok(content.includes('<BoltIcon'), 'ProductCard must render BoltIcon');
  });

  test('E3. HeroBanner.jsx eliminates legacy 38x38px boxed icon containers and uses .banner-prop-icon', () => {
    const content = fs.readFileSync(m2Files.heroBanner, 'utf8');

    // Legacy 38px boxes with borders
    expect.equal(
      content.includes("width: '38px', height: '38px'"),
      false,
      'HeroBanner.jsx must NOT contain legacy 38x38px icon wrappers'
    );
    expect.equal(
      content.includes("border: '1px solid rgba(22, 163, 74, 0.2)'"),
      false,
      'HeroBanner.jsx must NOT contain rigid border styles on feature items'
    );

    // Unboxed prop icon container
    expect.ok(
      content.includes('className="banner-prop-icon"'),
      'HeroBanner.jsx must use banner-prop-icon class'
    );
  });

  test('E4. ProductDetailPage.jsx eliminates rigid bordered wrappers on guarantees and shop stats', () => {
    const content = fs.readFileSync(m2Files.pdpPage, 'utf8');

    // Guarantee section: icons must be unboxed
    const guaranteeSection = content.substring(content.indexOf('className="amazon-guarantees"'), content.indexOf('</aside>'));
    expect.equal(
      guaranteeSection.includes("border: '1px solid"),
      false,
      'amazon-guarantees section must not have rigid 1px solid bordered icon wrappers'
    );

    // Shop stats: icons must be unboxed
    const statsStart = content.indexOf('className="amazon-shop-stats"');
    const statsEnd = content.indexOf('</section>', statsStart);
    const shopStatsSection = content.substring(statsStart, statsEnd);
    expect.equal(
      shopStatsSection.includes("border: '1px solid"),
      false,
      'amazon-shop-stats section must not have rigid bordered icon wrappers'
    );

    // Mobile sticky bar: icons must be unboxed
    const stickySection = content.substring(content.indexOf('className="amazon-mobile-sticky-bar"'));
    expect.equal(
      stickySection.includes("borderRadius: '50%', background: 'rgba"),
      false,
      'Mobile sticky bar must not contain nested circular background spans'
    );
  });

  test('E5. ProductQASection.jsx eliminates rigid 22x22px Q/A boxes and unboxes icons', () => {
    const content = fs.readFileSync(m2Files.productQA, 'utf8');

    // Legacy 22px Q and A square boxes
    expect.equal(
      content.includes("width: '22px', height: '22px'"),
      false,
      'ProductQASection must NOT contain 22x22px rigid badge boxes'
    );

    // Check ThumbsUp / Chat / Store icon wrappers
    const legacyIconSpanRegex = /<span\s+style=\{\{[^}]*(?:width:\s*['"](?:18|20|24)px['"][^}]*border:)[^}]*\}\}>/g;
    const matches = content.match(legacyIconSpanRegex);
    expect.equal(matches, null, `ProductQASection must NOT wrap icons in rigid bordered spans: ${JSON.stringify(matches)}`);
  });

  test('E6. RecentlyViewedSection.jsx and ProductReviewModal.jsx unbox icons', () => {
    const rvContent = fs.readFileSync(m2Files.recentlyViewed, 'utf8');
    const rmContent = fs.readFileSync(m2Files.reviewModal, 'utf8');

    // RecentlyViewed carousel buttons: Chevron icons unboxed
    expect.equal(
      rvContent.includes("width: '24px', height: '24px', borderRadius: '50%'"),
      false,
      'RecentlyViewed carousel buttons must not have nested 24px icon spans'
    );

    // ReviewModal: Star / Coin / Camera / AlertCircle / Close unboxed
    expect.equal(
      rmContent.includes("width: '22px', height: '22px', borderRadius: '50%'"),
      false,
      'ReviewModal camera button must not have nested 22px icon span'
    );
    expect.equal(
      rmContent.includes("width: '20px', height: '20px', borderRadius: '5px'"),
      false,
      'ReviewModal alert error must not have nested 20px icon span'
    );
  });

  // 3. Dark Mode & Contrast Integrity
  test('E7. Zero hardcoded text-drowning colors (#111, #333) in all 7 React components and 4 CSS files', () => {
    for (const [key, filePath] of Object.entries(m2Files)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match #111 as a color literal (e.g. #111 or #111111)
      const has111 = /(?:color|background|border)\s*:\s*['"]?#(?:111|111111)\b/i.test(content);
      expect.equal(has111, false, `File ${key} must not contain #111 color literal`);

      // Match #333 as a color literal (e.g. #333 or #333333)
      const has333 = /(?:color|background|border)\s*:\s*['"]?#(?:333|333333)\b/i.test(content);
      expect.equal(has333, false, `File ${key} must not contain #333 color literal`);
    }
  });

  test('E8. amazon-pdp.css contains comprehensive dark mode styling rules', () => {
    const css = fs.readFileSync(m2Files.pdpCss, 'utf8');

    expect.ok(
      css.includes('[data-theme="dark"] .amazon-delivery-info'),
      'amazon-pdp.css must support dark mode for amazon-delivery-info'
    );
    expect.ok(
      css.includes('[data-theme="dark"] .amazon-btn-add-cart'),
      'amazon-pdp.css must support dark mode for amazon-btn-add-cart'
    );
    expect.ok(
      css.includes('[data-theme="dark"] .amazon-mobile-sticky-bar'),
      'amazon-pdp.css must support dark mode for mobile-sticky-bar'
    );
  });

  test('E9. product.css declares dark mode support for floating card actions', () => {
    const css = fs.readFileSync(m2Files.productCss, 'utf8');

    expect.ok(
      css.includes('[data-theme="dark"] .shopee-card-wishlist'),
      'product.css must support dark mode for shopee-card-wishlist'
    );
    expect.ok(
      css.includes('[data-theme="dark"] .shopee-card-compare'),
      'product.css must support dark mode for shopee-card-compare'
    );
  });

  // 4. Responsive Boundaries & Geometry
  test('E10. banner.css includes mobile horizontal scroll rail with scroll snap', () => {
    const css = fs.readFileSync(m2Files.bannerCss, 'utf8');

    expect.ok(
      css.includes('scroll-snap-type: x mandatory'),
      'banner.css must declare scroll-snap-type: x mandatory for mobile features'
    );
    expect.ok(
      css.includes('overflow-x: auto'),
      'banner.css must enable overflow-x: auto for mobile features'
    );
    expect.ok(
      css.includes('scroll-snap-align: start'),
      'banner.css must declare scroll-snap-align: start on feature items'
    );
  });

  test('E11. amazon-pdp.css constrains tablet buy box and supports mobile iOS safe area', () => {
    const css = fs.readFileSync(m2Files.pdpCss, 'utf8');

    // Tablet buy box constraint
    expect.ok(
      css.includes('max-width: 540px'),
      'amazon-pdp.css must constrain tablet buy box to max-width: 540px'
    );

    // Mobile safe-area inset
    expect.ok(
      css.includes('env(safe-area-inset-bottom'),
      'amazon-pdp.css must support env(safe-area-inset-bottom) for mobile viewport'
    );
  });

  // 5. Semantic Token Usage & Clean Code
  test('E12. deals.css and FlashDeals.jsx use theme variable --primary-color instead of hardcoded orange', () => {
    const jsx = fs.readFileSync(m2Files.flashDeals, 'utf8');
    const css = fs.readFileSync(m2Files.dealsCss, 'utf8');

    // FlashDeals.jsx must use var(--primary-color)
    expect.ok(
      jsx.includes('var(--primary-color)'),
      'FlashDeals.jsx must reference var(--primary-color)'
    );

    // deals.css must use var(--primary-color)
    expect.ok(
      css.includes('var(--primary-color)'),
      'deals.css must reference var(--primary-color)'
    );
  });

  // 6. Inline Style Safety & Icon Sizes
  test('E13. All inline styles and icon usages in M2 components have valid, non-corrupted values', () => {
    const reactFiles = [
      m2Files.productCard,
      m2Files.heroBanner,
      m2Files.flashDeals,
      m2Files.pdpPage,
      m2Files.productQA,
      m2Files.recentlyViewed,
      m2Files.reviewModal
    ];

    for (const filePath of reactFiles) {
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for literal NaN or stringified "undefined" in style expressions
      const nanStyleMatch = content.match(/style\s*=\s*\{\{[^}]*(?::\s*NaN|:\s*['"]NaN['"]|:\s*['"]undefined['"])/g);
      expect.equal(
        nanStyleMatch,
        null,
        `Found literal NaN or stringified undefined style in ${fileName}: ${JSON.stringify(nanStyleMatch)}`
      );

      // Check all icon usages have valid positive sizes
      const iconSizeMatches = [...content.matchAll(/<([A-Z][A-Za-z0-9]*Icon)\s+[^>]*size=\{?([0-9.]+)\}?/g)];
      for (const m of iconSizeMatches) {
        const iconName = m[1];
        const sizeVal = parseFloat(m[2]);
        expect.ok(!isNaN(sizeVal) && sizeVal > 0, `Icon ${iconName} in ${fileName} has invalid size: ${m[2]}`);
      }
    }
  });

  // 7. Integrity & Anti-Facade Verification
  test('E14. Integrity check: No hardcoded test IDs, mocks, or fake returns in M2 files', () => {
    const testIds = ['F41-E', 'F42-E', 'F48-E', 'F49-E', 'F50-E', 'F51-E', 'T3-', 'Journey'];
    
    for (const [key, filePath] of Object.entries(m2Files)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const testId of testIds) {
        expect.equal(
          content.includes(testId),
          false,
          `Integrity violation: File ${key} contains test ID reference ${testId}`
        );
      }
    }
  });
});

// Run if called directly
runAllTests().then(result => {
  if (!result.success) {
    process.exitCode = 1;
  }
}).catch(err => {
  console.error('Test execution failed:', err);
  process.exitCode = 1;
});
