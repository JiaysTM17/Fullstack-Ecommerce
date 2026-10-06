# Project: Fullstack E-Commerce Frontend UI/UX Modernization & Unification

## Architecture
- **Framework & Build**: React 18 SPA + Vite 5.2 bundler.
- **Styling Architecture**: Semantic Vanilla CSS design tokens via `:root` and `[data-theme="dark"]` in `client/src/styles/theme.css`, modular domain stylesheets in `client/src/styles/` (`header.css`, `footer.css`, `product.css`, `cart.css`, `checkout.css`, `dashboard.css`, `amazon-pdp.css`, `deals.css`, `banner.css`, `filters.css`, `voucher-modal.css`, `category-drawer.css`, `profile.css`, `feedback.css`).
- **Icon System**: Vector SVG icons in `client/src/components/OrdersIcons.jsx` rendered naturally with vibrant accent colors (`var(--primary-color)`, `#0284c7`, `#10b981`, `#f59e0b`, `#ea580c`, `#ef4444`, `#8b5cf6`), eliminating rigid border boxes and nested spans.
- **Theme Engine**: `client/src/context/ThemeContext.jsx` toggling `data-theme="light"` / `data-theme="dark"` on `document.documentElement`.
- **Backend & Tests**: Node.js/Express REST API with 636 comprehensive automated tests (`node tests/run-all.js`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Global Icon Modernization | Eliminate >450 boxed/bordered icon wrapper spans; adopt natural flat SVG icons with vibrant accents across Header, Sidebar, Footer, Nav | M1 | Survey 1, DISPATCH R1 |
| 2 | Unified Color Tokens & Theme System | Harmonize brand tokens (`--primary-color`, `--bg-card`, `--text-primary`), fix missing dark mode rules in CSS files | M1 | Survey 1, DISPATCH R1 |
| 3 | Storefront Visual Polish | Enhance HeroBanner, CategoryShowcase, FlashDeals, ProductCard grids with borderless icons, balanced cards, responsive mobile rail | M2 | Survey 2, DISPATCH R2 |
| 4 | PDP Gallery, Variants & Interactions | Optimize image gallery, variant selectors (color/size), instant price & inventory updates, unbox guarantee badges & action buttons | M2 | Survey 2, DISPATCH R2 |
| 5 | Community Q&A & Product Reviews | Modernize Q&A badges, verified buyer badge, review modal, and dark mode contrast | M2 | Survey 2, DISPATCH R2 |
| 6 | Unified Freeship Max Threshold | Align threshold to 300.000₫ consistently between CartPage and Header progress banner | M3 | Survey 3, DISPATCH R3 |
| 7 | Cart & Quantity Controls Polish | De-clutter QuantityControl by removing inner nested border box, unbox Cart trust badges | M3 | Survey 3, DISPATCH R3 |
| 8 | Checkout & VietQR Experience | Modernize VietQR modal layout, Dark Mode support for voucher modal and checkout summary | M3 | Survey 3, DISPATCH R3 |
| 9 | SPX Logistics Stepper & Tracking | Add connected progress bar behind the 5 milestone stepper nodes, polish DeliveryLiveMapModal for Dark Mode | M3 | Survey 3, DISPATCH R3 |
| 10 | Seller & Admin KPI Metric Cards | Modernize stat tiles with frameless translucent pills, vibrant accents, and clean typography | M4 | Survey 3, DISPATCH R4 |
| 11 | Dashboard Tables & Reusable Pagination | Add `<Pagination />` component and wire to Seller & Admin tables with fast filtering | M4 | Survey 3, DISPATCH R4 |
| 12 | Dashboard Dark Mode Compliance | Implement complete `[data-theme="dark"]` rules in `dashboard.css` and dashboard page components | M4 | Survey 3, DISPATCH R4 |
| 13 | Final Integration & Compliance Verification | Ensure 636/636 backend tests pass, `npm --prefix client run build` 0 errors, no console regressions | M5 | DISPATCH Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Global Icon System & Theme Tokens | `theme.css`, `header.css`, `footer.css`, `category-drawer.css`, `Header.jsx`, `AccountSidebar.jsx`, `Footer.jsx`, `MobileBottomNav.jsx`, `CategoryMegaMenuDrawer.jsx`, `NotificationsPopover.jsx` | Survey Complete | DONE (10 files modernized, build 0 errors, 636/636 tests pass) |
| M2 | Storefront & PDP Modernization | `ProductCard.jsx`, `HeroBanner.jsx`, `FlashDeals.jsx`, `ProductDetailPage.jsx`, `ProductQASection.jsx`, `RecentlyViewedSection.jsx`, `ProductReviewModal.jsx`, `product.css`, `banner.css`, `deals.css`, `amazon-pdp.css` | M1 | IN_PROGRESS |
| M3 | Cart, Checkout & SPX Order Tracking | `CartPage.jsx`, `QuantityControl.jsx`, `CheckoutPage.jsx`, `VietQRPaymentModal.jsx`, `OrderHistoryPage.jsx`, `DeliveryLiveMapModal.jsx`, `cart.css`, `checkout.css`, `voucher-modal.css` | M1 | PLANNED |
| M4 | Seller & Admin Dashboards Modernization | `SellerDashboardPage.jsx`, `AdminDashboardPage.jsx`, `Pagination.jsx`, `dashboard.css` | M1 | PLANNED |
| M5 | Final E2E Integration & Verification | Full backend test suite (636/636), client build (`npm run build`), responsive & theme verification, forensic audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Theme Tokens Contract (`theme.css` ↔ All Components & Stylesheets)
- Light theme variables:
  - `--primary-color: #2563eb;`
  - `--bg-page: #f8fafc;`
  - `--bg-card: #ffffff;`
  - `--text-primary: #0f172a;`
  - `--text-secondary: #64748b;`
  - `--border-color: #e2e8f0;`
- Dark theme variables (`[data-theme="dark"]`):
  - `--primary-color: #f97316;`
  - `--bg-page: #0b0f19;`
  - `--bg-card: #1e293b;`
  - `--text-primary: #f8fafc;`
  - `--text-secondary: #94a3b8;`
  - `--border-color: #334155;`
- Rule: No hardcoded `#ffffff` or `#000000` backgrounds on cards or modals; all components must consume `var(--bg-card)` and `var(--text-primary)`.

### Icon Contract (`OrdersIcons.jsx` ↔ All Components)
- Props: `<IconName size={16-24} color="var(--primary-color)" className="..." />`.
- Rule: Icons must be rendered inline or in flex containers directly without enclosing in rigid bordered spans (`border: '1px solid ...'`).

### Shipping Constants Contract (`shipping.js` ↔ `Header.jsx`, `CartPage.jsx`, `CheckoutPage.jsx`)
- `FREE_SHIPPING_THRESHOLD = 300000;` (300.000₫)
- `FREE_SHIPPING_DISCOUNT = 15000;` (15.000₫)

## Code Layout
- `client/src/styles/`:
  - `theme.css`: Core design tokens & global variables.
  - `header.css`: Header & navigation styles.
  - `footer.css`: Footer and attribution links styles.
  - `category-drawer.css`: Category mega menu drawer.
  - `product.css`, `banner.css`, `deals.css`, `amazon-pdp.css`: Storefront & PDP styles.
  - `cart.css`, `checkout.css`, `voucher-modal.css`: Cart & checkout styles.
  - `dashboard.css`: Seller & admin dashboard styles.
- `client/src/components/`:
  - Common: `Header.jsx`, `AccountSidebar.jsx`, `Footer.jsx`, `MobileBottomNav.jsx`, `HeroBanner.jsx`, `ProductCard.jsx`, `ProductQASection.jsx`, `RecentlyViewedSection.jsx`, `Pagination.jsx`.
  - Cart: `QuantityControl.jsx`.
  - Payment & Tracking: `VietQRPaymentModal.jsx`, `DeliveryLiveMapModal.jsx`, `OrderDetailModal.jsx`.
- `client/src/pages/`:
  - `HomePage.jsx`, `ProductDetailPage.jsx`, `CartPage.jsx`, `CheckoutPage.jsx`, `OrderHistoryPage.jsx`, `SellerDashboardPage.jsx`, `AdminDashboardPage.jsx`.
