/**
 * Challenger 1 Test Suite — Milestone 1: Theme, Design Tokens & Natural SVG Icons
 * Empirical stress harness testing AST exports/imports, border elimination,
 * mathematical boundaries, CSS token integrity, and dark-mode contrast.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { describe, test, it, expect, runAllTests } from './harness/testRunner.js';

describe('Milestone 1 Empirical Stress Test: Design Tokens & Natural SVG Icons', () => {

  const rootDir = path.resolve('.');
  const componentsDir = path.join(rootDir, 'client/src/components');
  const stylesDir = path.join(rootDir, 'client/src/styles');

  const targetComponentFiles = [
    'Header.jsx',
    'AccountSidebar.jsx',
    'Footer.jsx',
    'MobileBottomNav.jsx',
    'CategoryMegaMenuDrawer.jsx',
    'NotificationsPopover.jsx'
  ];

  // 1. AST & Icon Export/Import Integrity
  test('E1. OrdersIcons.jsx exports all required vector icons with valid SVG signatures', () => {
    const ordersIconsPath = path.join(componentsDir, 'OrdersIcons.jsx');
    expect.ok(fs.existsSync(ordersIconsPath), 'OrdersIcons.jsx must exist');

    const content = fs.readFileSync(ordersIconsPath, 'utf8');
    const exportMatches = [...content.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\(/g)];
    const exportedNames = new Set(exportMatches.map(m => m[1]));

    expect.ok(exportedNames.size >= 25, `Expected at least 25 icons in OrdersIcons.jsx, found ${exportedNames.size}`);

    // Verify key icons
    const requiredIcons = [
      'PackageIcon', 'StoreIcon', 'ChatIcon', 'TruckIcon', 'MapPinIcon',
      'CreditCardIcon', 'ShieldCheckIcon', 'ChevronRightIcon', 'HeartIcon',
      'LockIcon', 'TicketIcon', 'CoinIcon', 'UserIcon', 'HomeIcon', 'CartIcon',
      'CloseIcon', 'SearchIcon', 'SparklesIcon', 'ClockIcon'
    ];

    for (const icon of requiredIcons) {
      expect.ok(exportedNames.has(icon), `OrdersIcons.jsx must export ${icon}`);
    }
  });

  test('E2. Zero broken or undefined icon imports across all 6 Milestone 1 components', () => {
    const ordersIconsPath = path.join(componentsDir, 'OrdersIcons.jsx');
    const ordersIconsContent = fs.readFileSync(ordersIconsPath, 'utf8');
    const exportedNames = new Set([...ordersIconsContent.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\(/g)].map(m => m[1]));

    for (const compFile of targetComponentFiles) {
      const compPath = path.join(componentsDir, compFile);
      expect.ok(fs.existsSync(compPath), `${compFile} must exist`);

      const fileContent = fs.readFileSync(compPath, 'utf8');

      // Match imports from OrdersIcons
      const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"](?:\.\/OrdersIcons|\.\.\/components\/OrdersIcons)['"]/gs;
      let match;
      while ((match = importRegex.exec(fileContent)) !== null) {
        const importedSymbols = match[1]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => s.split(/\s+as\s+/)[0].trim());

        for (const symbol of importedSymbols) {
          expect.ok(
            exportedNames.has(symbol),
            `Component ${compFile} imports '${symbol}' which is NOT exported by OrdersIcons.jsx`
          );
        }
      }
    }
  });

  // 2. Unboxing & Rigid Border Elimination
  test('E3. Verify elimination of legacy rigid boxed borders around icons', () => {
    // 3a. AccountSidebar.jsx: icon cells should not have 1px solid borders
    const accountSidebar = fs.readFileSync(path.join(componentsDir, 'AccountSidebar.jsx'), 'utf8');
    const legacySidebarBorders = accountSidebar.match(/sidebar-icon-cell['"][^>]*border:\s*['"]1px solid/g);
    expect.equal(legacySidebarBorders, null, 'AccountSidebar.jsx must NOT contain 1px solid borders on sidebar-icon-cell');

    // 3b. MobileBottomNav.jsx: navigation items must NOT have boxed border spans
    const mobileNav = fs.readFileSync(path.join(componentsDir, 'MobileBottomNav.jsx'), 'utf8');
    const legacyNavBorders = mobileNav.match(/border:\s*currentPath\s*===[^}]*1px solid/g);
    expect.equal(legacyNavBorders, null, 'MobileBottomNav.jsx must NOT wrap icons in conditional 1px solid border spans');

    // 3c. NotificationsPopover.jsx: bell button & item tiles must NOT have rigid borders
    const notifs = fs.readFileSync(path.join(componentsDir, 'NotificationsPopover.jsx'), 'utf8');
    const legacyBellBorder = notifs.match(/border:\s*['"]1px solid rgba\(245,\s*158,\s*11,\s*0\.28\)['"]/);
    expect.equal(legacyBellBorder, null, 'NotificationsPopover.jsx bell icon must not have rigid border span');

    // 3d. Header.jsx: search clear/submit button must NOT have rigid border spans
    const header = fs.readFileSync(path.join(componentsDir, 'Header.jsx'), 'utf8');
    expect.equal(
      header.includes("border: '1px solid rgba(255,255,255,0.3)'"),
      false,
      'Header.jsx search button must NOT wrap icon in 1px solid rgba(255,255,255,0.3)'
    );

    // 3e. CategoryMegaMenuDrawer.jsx: category card icons must be borderless
    const drawer = fs.readFileSync(path.join(componentsDir, 'CategoryMegaMenuDrawer.jsx'), 'utf8');
    const legacyCardBorder = drawer.match(/category-card-icon['"][^>]*border:\s*`1px solid/);
    expect.equal(legacyCardBorder, null, 'CategoryMegaMenuDrawer.jsx category cards must NOT have rigid border wrappers');
  });

  // 3. Freeship Max Math Boundaries & Threshold Consistency
  test('E4. Header.jsx Freeship threshold is aligned to 300,000 VND and math handles edge cases safely', () => {
    const headerContent = fs.readFileSync(path.join(componentsDir, 'Header.jsx'), 'utf8');

    // Verify 300000 threshold
    expect.ok(
      headerContent.includes('cartSubtotal >= 300000'),
      'Header.jsx must evaluate cartSubtotal >= 300000'
    );
    expect.ok(
      headerContent.includes('300000 - cartSubtotal'),
      'Header.jsx must compute remaining amount as 300000 - cartSubtotal'
    );
    expect.ok(
      headerContent.includes('cartSubtotal / 300000'),
      'Header.jsx progress percentage must be based on cartSubtotal / 300000'
    );
    expect.equal(
      headerContent.includes('200000'),
      false,
      'Header.jsx must not contain legacy 200,000 VND threshold'
    );

    // Mathematical Stress Test of Freeship logic
    const calcProgress = (subtotal) => {
      const val = Number(subtotal) || 0;
      return Math.min(100, Math.max(0, Math.round((val / 300000) * 100)));
    };

    const calcRemaining = (subtotal) => {
      const val = Number(subtotal) || 0;
      return Math.max(0, 300000 - val);
    };

    // Subtotal = 0 VND
    expect.equal(calcProgress(0), 0);
    expect.equal(calcRemaining(0), 300000);

    // Subtotal = 150,000 VND (50%)
    expect.equal(calcProgress(150000), 50);
    expect.equal(calcRemaining(150000), 150000);

    // Subtotal = 299,999 VND (99.999% -> 100%)
    expect.equal(calcProgress(299999), 100);
    expect.equal(calcRemaining(299999), 1);

    // Subtotal = 300,000 VND (Qualified)
    expect.equal(calcProgress(300000), 100);
    expect.equal(calcRemaining(300000), 0);

    // Subtotal = 1,000,000 VND (Clamped to 100%, remaining 0)
    expect.equal(calcProgress(1000000), 100);
    expect.equal(calcRemaining(1000000), 0);

    // Subtotal = negative or corrupted value
    expect.equal(calcProgress(-50000), 0);
    expect.equal(calcProgress(NaN), 0);
    expect.equal(calcProgress(undefined), 0);
  });

  // 4. Style Object Safety (No NaN, stringified undefined, or corrupted values)
  test('E5. All inline styles and icon attributes in 6 components have valid, non-corrupted values', () => {
    for (const compFile of targetComponentFiles) {
      const compPath = path.join(componentsDir, compFile);
      const content = fs.readFileSync(compPath, 'utf8');

      // Check for literal NaN or stringified "undefined" in style expressions
      const nanStyleMatch = content.match(/style\s*=\s*\{\{[^}]*(?::\s*NaN|:\s*['"]NaN['"]|:\s*['"]undefined['"])/g);
      expect.equal(
        nanStyleMatch,
        null,
        `Found literal NaN or stringified undefined style in ${compFile}: ${JSON.stringify(nanStyleMatch)}`
      );

      // Check for broken template literals like `${undefined}` or `${NaN}`
      const brokenTemplateMatch = content.match(/\$\{\s*(?:undefined|NaN|null)\s*\}/g);
      expect.equal(
        brokenTemplateMatch,
        null,
        `Found broken template interpolation in ${compFile}: ${JSON.stringify(brokenTemplateMatch)}`
      );

      // Check all icon usages have valid positive sizes
      const iconSizeMatches = [...content.matchAll(/<([A-Z][A-Za-z0-9]*Icon)\s+[^>]*size=\{?([0-9.]+)\}?/g)];
      for (const m of iconSizeMatches) {
        const iconName = m[1];
        const sizeVal = parseFloat(m[2]);
        expect.ok(!isNaN(sizeVal) && sizeVal > 0, `Icon ${iconName} in ${compFile} has invalid size: ${m[2]}`);
      }
    }
  });

  // 5. CSS Token Harmonization & Dark Mode Validation
  test('E6. theme.css contains complete set of natural flat accent tokens and dark mode overrides', () => {
    const themeCss = fs.readFileSync(path.join(stylesDir, 'theme.css'), 'utf8');

    const expectedColors = ['blue', 'teal', 'green', 'amber', 'orange', 'red', 'purple'];

    for (const c of expectedColors) {
      expect.ok(
        themeCss.includes(`.icon-accent-${c}`),
        `theme.css must declare .icon-accent-${c}`
      );
      expect.ok(
        themeCss.includes(`[data-theme="dark"] .icon-accent-${c}`),
        `theme.css must declare dark mode for .icon-accent-${c}`
      );
      expect.ok(
        themeCss.includes(`.accent-tile-${c}`),
        `theme.css must declare .accent-tile-${c}`
      );
      expect.ok(
        themeCss.includes(`[data-theme="dark"] .accent-tile-${c}`),
        `theme.css must declare dark mode for .accent-tile-${c}`
      );
    }
  });

  test('E7. Subsystem CSS files have comprehensive dark mode rules with safe text/background contrast', () => {
    const headerCss = fs.readFileSync(path.join(stylesDir, 'header.css'), 'utf8');
    const footerCss = fs.readFileSync(path.join(stylesDir, 'footer.css'), 'utf8');
    const drawerCss = fs.readFileSync(path.join(stylesDir, 'category-drawer.css'), 'utf8');

    // Header dark mode checks
    expect.ok(headerCss.includes('[data-theme="dark"] .shopee-search-dropdown-menu'), 'header.css dark mode search dropdown');
    expect.ok(headerCss.includes('[data-theme="dark"] .header-mini-cart-popover'), 'header.css dark mode mini-cart');
    expect.ok(headerCss.includes('[data-theme="dark"] .header-user-dropdown-card'), 'header.css dark mode user dropdown');
    expect.ok(headerCss.includes('[data-theme="dark"] .order-lookup-modal-card'), 'header.css dark mode order lookup');

    // Footer dark mode checks
    expect.ok(footerCss.includes('[data-theme="dark"] .shopee-footer'), 'footer.css dark mode root');
    expect.ok(footerCss.includes('[data-theme="dark"] .shopee-footer-badge'), 'footer.css dark mode badges');
    expect.ok(footerCss.includes('[data-theme="dark"] .footer-attribution-section'), 'footer.css dark mode attribution section');

    // Category drawer dark mode checks
    expect.ok(drawerCss.includes('[data-theme="dark"] .category-drawer-modal'), 'category-drawer.css dark mode modal');
    expect.ok(drawerCss.includes('[data-theme="dark"] .category-drawer-card'), 'category-drawer.css dark mode cards');
    expect.ok(drawerCss.includes('[data-theme="dark"] .category-drawer-chip'), 'category-drawer.css dark mode chips');
  });

  // 6. Production Bundle Output Integrity
  test('E8. Vite production dist assets are present, valid, and contain newly added styles', () => {
    const distDir = path.join(rootDir, 'client/dist');
    expect.ok(fs.existsSync(distDir), 'client/dist must exist from build');

    const indexHtml = path.join(distDir, 'index.html');
    expect.ok(fs.existsSync(indexHtml), 'dist/index.html must exist');

    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.readdirSync(assetsDir);
    const cssFile = assetFiles.find(f => f.endsWith('.css'));
    const jsFile = assetFiles.find(f => f.endsWith('.js'));

    expect.ok(cssFile, 'Production CSS bundle must exist');
    expect.ok(jsFile, 'Production JS bundle must exist');

    const bundledCss = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
    expect.ok(
      bundledCss.includes('icon-accent-blue') || bundledCss.includes('accent-tile-blue'),
      'Production CSS bundle must contain Milestone 1 design token classes'
    );
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
