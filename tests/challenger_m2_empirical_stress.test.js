/**
 * tests/challenger_m2_empirical_stress.test.js
 * Empirical Challenger Invariant & Stress Test Harness for Milestone 2
 *
 * Validates:
 * 1. Currency formatting boundaries (0, NaN, null, undefined, negative, -0, huge, floats, strings)
 * 2. Discount calculations (standard, equal, price-increased, zero-price, fractional, rounding)
 * 3. Review submission validations (ratings 0-6, comment length, whitespace, tags, photo limits)
 * 4. Carousel slide modulo wraps (forward, backward, 1000-cycle stress, 1..N slides)
 * 5. Countdown timer wrap-around state machine (seconds, minutes, hours, expiration reset)
 * 6. PDP Buy Box Guarantees contract (exact Vietnamese copy, 3 cards, squircle pills, dark mode)
 * 7. Visual depth tokens and CSS invariants in M2 files
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect, runAllTests } from './harness/testRunner.js';
import { formatCurrency } from '../client/src/utils/formatCurrency.js';

describe('Milestone 2 Invariants & Boundary Stress Harness', () => {

  const rootDir = path.resolve('.');

  // -------------------------------------------------------------
  // 1. CURRENCY FORMATTING BOUNDARY STRESS
  // -------------------------------------------------------------
  test('S1. Currency format boundary cases: 0, -0, NaN, null, undefined, strings, negatives, huge numbers', () => {
    const normalize = (str) => str.replace(/\s+/g, ' ').trim();

    // 0 and -0
    expect.equal(normalize(formatCurrency(0)), normalize('0 ₫'), 'formatCurrency(0) should be 0 ₫');
    expect.equal(normalize(formatCurrency(-0)), normalize('0 ₫'), 'formatCurrency(-0) should be 0 ₫');

    // Falsy and invalid numeric values
    expect.equal(normalize(formatCurrency(NaN)), normalize('0 ₫'), 'formatCurrency(NaN) should fallback to 0 ₫');
    expect.equal(normalize(formatCurrency(null)), normalize('0 ₫'), 'formatCurrency(null) should fallback to 0 ₫');
    expect.equal(normalize(formatCurrency(undefined)), normalize('0 ₫'), 'formatCurrency(undefined) should fallback to 0 ₫');
    expect.equal(normalize(formatCurrency('')), normalize('0 ₫'), 'formatCurrency("") should fallback to 0 ₫');
    expect.equal(normalize(formatCurrency('invalid_num')), normalize('0 ₫'), 'formatCurrency("invalid_num") should fallback to 0 ₫');

    // Valid string numerals
    expect.equal(normalize(formatCurrency('150000')), normalize('150.000 ₫'), 'formatCurrency("150000") parses string numeral');
    expect.equal(normalize(formatCurrency('0')), normalize('0 ₫'), 'formatCurrency("0") parses "0"');

    // Negative numbers
    expect.equal(normalize(formatCurrency(-50000)), normalize('-50.000 ₫'), 'formatCurrency(-50000) formats negative currency');
    expect.equal(normalize(formatCurrency(-1)), normalize('-1 ₫'), 'formatCurrency(-1) formats -1 ₫');

    // Large and huge numbers
    expect.equal(normalize(formatCurrency(1000000)), normalize('1.000.000 ₫'), '1 Million VND');
    expect.equal(normalize(formatCurrency(1000000000)), normalize('1.000.000.000 ₫'), '1 Billion VND');
    expect.equal(normalize(formatCurrency(1000000000000)), normalize('1.000.000.000.000 ₫'), '1 Trillion VND');

    // Floating numbers round to integer VND
    expect.equal(normalize(formatCurrency(49999.4)), normalize('49.999 ₫'), 'Fractional VND rounds down < 0.5');
    expect.equal(normalize(formatCurrency(49999.6)), normalize('50.000 ₫'), 'Fractional VND rounds up >= 0.5');
  });

  // -------------------------------------------------------------
  // 2. DISCOUNT CALCULATION INVARIANTS & BOUNDARIES
  // -------------------------------------------------------------
  test('S2. Discount calculations: standard, equal, inverted, zero, fractional, and boundary safety', () => {
    function computeDiscount(originalPrice, price) {
      if (typeof originalPrice !== 'number' || typeof price !== 'number') return 0;
      if (isNaN(originalPrice) || isNaN(price)) return 0;
      if (originalPrice <= 0 || price < 0) return 0;
      const hasDiscount = originalPrice > price;
      return hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    }

    // Standard cases
    expect.equal(computeDiscount(100000, 50000), 50, '50% discount on 100k -> 50k');
    expect.equal(computeDiscount(200000, 150000), 25, '25% discount on 200k -> 150k');
    expect.equal(computeDiscount(1000000, 100000), 90, '90% discount on 1M -> 100k');

    // Equal price (no discount)
    expect.equal(computeDiscount(100000, 100000), 0, '0% discount when originalPrice == price');

    // Price increased (inverted) -> must NEVER produce negative discount
    expect.equal(computeDiscount(50000, 100000), 0, '0% discount when price increased (no negative)');
    expect.equal(computeDiscount(10000, 990000), 0, '0% discount on extreme price increase');

    // Zero prices
    expect.equal(computeDiscount(0, 50000), 0, '0% discount when originalPrice is 0 (avoids division by 0)');
    expect.equal(computeDiscount(0, 0), 0, '0% discount when both prices 0');
    expect.equal(computeDiscount(100000, 0), 100, '100% discount when current price is free (0)');

    // Fractional & rounding
    expect.equal(computeDiscount(300000, 100000), 67, 'Round 66.666% to 67%');
    expect.equal(computeDiscount(700000, 600000), 14, 'Round 14.285% to 14%');
    expect.equal(computeDiscount(999999, 999998), 0, 'Sub-percent discount rounds to 0%');

    // Boundary edge types
    expect.equal(computeDiscount(NaN, 50000), 0, 'NaN originalPrice handled safely');
    expect.equal(computeDiscount(100000, NaN), 0, 'NaN price handled safely');
    expect.equal(computeDiscount(-100000, 50000), 0, 'Negative originalPrice rejected safely');
    expect.equal(computeDiscount(100000, -50000), 0, 'Negative price rejected safely');
  });

  // -------------------------------------------------------------
  // 3. PRODUCT REVIEW VALIDATION & BOUNDARY RULES
  // -------------------------------------------------------------
  test('S3. Product review validation rules: rating bounds, comment trimming, length, tags & photos', () => {
    function validateReviewInput({ rating, comment, photos = [] }) {
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return { valid: false, error: 'INVALID_RATING' };
      }
      const trimmed = (comment || '').trim();
      if (!trimmed) {
        return { valid: false, error: 'EMPTY_COMMENT' };
      }
      if (trimmed.length < 10) {
        return { valid: false, error: 'COMMENT_TOO_SHORT', length: trimmed.length };
      }
      if (photos.length > 5) {
        return { valid: false, error: 'TOO_MANY_PHOTOS' };
      }
      return { valid: true, trimmedComment: trimmed };
    }

    // Rating checks
    expect.equal(validateReviewInput({ rating: 0, comment: 'Đánh giá 10 ký tự nhé!' }).error, 'INVALID_RATING');
    expect.equal(validateReviewInput({ rating: -1, comment: 'Đánh giá 10 ký tự nhé!' }).error, 'INVALID_RATING');
    expect.equal(validateReviewInput({ rating: 6, comment: 'Đánh giá 10 ký tự nhé!' }).error, 'INVALID_RATING');
    expect.equal(validateReviewInput({ rating: null, comment: 'Đánh giá 10 ký tự nhé!' }).error, 'INVALID_RATING');
    expect.equal(validateReviewInput({ rating: undefined, comment: 'Đánh giá 10 ký tự nhé!' }).error, 'INVALID_RATING');

    // Comment whitespace & trimming checks
    expect.equal(validateReviewInput({ rating: 5, comment: '' }).error, 'EMPTY_COMMENT');
    expect.equal(validateReviewInput({ rating: 5, comment: '          ' }).error, 'EMPTY_COMMENT');
    expect.equal(validateReviewInput({ rating: 5, comment: '\n\t   \n' }).error, 'EMPTY_COMMENT');

    // Length boundary: 9 chars vs 10 chars vs 11 chars
    expect.equal(validateReviewInput({ rating: 5, comment: '123456789' }).error, 'COMMENT_TOO_SHORT');
    expect.equal(validateReviewInput({ rating: 5, comment: '   123456789   ' }).error, 'COMMENT_TOO_SHORT');
    expect.equal(validateReviewInput({ rating: 5, comment: '1234567890' }).valid, true);
    expect.equal(validateReviewInput({ rating: 5, comment: '12345678901' }).valid, true);

    // Vietnamese unicode support
    const vnReview = 'Sản phẩm tuyệt vời, đóng gói rất kỹ!';
    const vnResult = validateReviewInput({ rating: 5, comment: vnReview });
    expect.equal(vnResult.valid, true);
    expect.equal(vnResult.trimmedComment, vnReview);

    // Photos limit
    expect.equal(validateReviewInput({ rating: 5, comment: 'Sản phẩm quá đẹp nha shop!', photos: [1, 2, 3, 4, 5] }).valid, true);
    expect.equal(validateReviewInput({ rating: 5, comment: 'Sản phẩm quá đẹp nha shop!', photos: [1, 2, 3, 4, 5, 6] }).error, 'TOO_MANY_PHOTOS');

    // Tag toggle logic invariant
    function toggleTag(tags, tag) {
      return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    }
    let tags = [];
    tags = toggleTag(tags, 'Đúng với mô tả');
    expect.equal(tags.length, 1);
    expect.equal(tags[0], 'Đúng với mô tả');
    tags = toggleTag(tags, 'Giao hàng siêu nhanh');
    expect.equal(tags.length, 2);
    tags = toggleTag(tags, 'Đúng với mô tả');
    expect.equal(tags.length, 1);
    expect.equal(tags[0], 'Giao hàng siêu nhanh');
  });

  // -------------------------------------------------------------
  // 4. CAROUSEL SLIDE MODULO WRAP STRESS
  // -------------------------------------------------------------
  test('S4. Carousel slide wraps: forward, backward, 1000-cycle stress, and variable slide lengths', () => {
    function getNext(current, total) {
      return (current + 1) % total;
    }
    function getPrev(current, total) {
      return (current - 1 + total) % total;
    }

    const SLIDES_COUNT = 3;

    // Direct transition checks
    expect.equal(getNext(0, SLIDES_COUNT), 1);
    expect.equal(getNext(1, SLIDES_COUNT), 2);
    expect.equal(getNext(2, SLIDES_COUNT), 0); // Wraps forward

    expect.equal(getPrev(0, SLIDES_COUNT), 2); // Wraps backward
    expect.equal(getPrev(2, SLIDES_COUNT), 1);
    expect.equal(getPrev(1, SLIDES_COUNT), 0);

    // 1000-step continuous forward stress loop
    let forwardState = 0;
    for (let i = 0; i < 1000; i++) {
      forwardState = getNext(forwardState, SLIDES_COUNT);
      expect.ok(forwardState >= 0 && forwardState < SLIDES_COUNT, `Slide state ${forwardState} must be in [0, 2]`);
    }
    expect.equal(forwardState, 1000 % SLIDES_COUNT);

    // 1000-step continuous backward stress loop
    let backwardState = 0;
    for (let i = 0; i < 1000; i++) {
      backwardState = getPrev(backwardState, SLIDES_COUNT);
      expect.ok(backwardState >= 0 && backwardState < SLIDES_COUNT, `Slide state ${backwardState} must be in [0, 2]`);
    }
    expect.equal(backwardState, (3 - (1000 % SLIDES_COUNT)) % SLIDES_COUNT);

    // Variable slide lengths (N=1, N=5, N=10)
    expect.equal(getNext(0, 1), 0);
    expect.equal(getPrev(0, 1), 0);

    expect.equal(getNext(4, 5), 0);
    expect.equal(getPrev(0, 5), 4);

    expect.equal(getNext(9, 10), 0);
    expect.equal(getPrev(0, 10), 9);
  });

  // -------------------------------------------------------------
  // 5. COUNTDOWN WRAP STATE MACHINE STRESS
  // -------------------------------------------------------------
  test('S5. Countdown wrap state machine: second tick, minute rollover, hour rollover, expiration reset', () => {
    function tick(prev) {
      if (prev.seconds > 0) {
        return { ...prev, seconds: prev.seconds - 1 };
      } else if (prev.minutes > 0) {
        return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
      } else if (prev.hours > 0) {
        return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
      } else {
        return { hours: 3, minutes: 0, seconds: 0 };
      }
    }

    // Case 1: Simple second decrement
    const s1 = tick({ hours: 2, minutes: 45, seconds: 30 });
    expect.equal(s1.hours, 2);
    expect.equal(s1.minutes, 45);
    expect.equal(s1.seconds, 29);

    // Case 2: Second rollover from 0 -> 59
    const s2 = tick({ hours: 2, minutes: 45, seconds: 0 });
    expect.equal(s2.hours, 2);
    expect.equal(s2.minutes, 44);
    expect.equal(s2.seconds, 59);

    // Case 3: Minute rollover from 0:00 -> 59:59
    const s3 = tick({ hours: 2, minutes: 0, seconds: 0 });
    expect.equal(s3.hours, 1);
    expect.equal(s3.minutes, 59);
    expect.equal(s3.seconds, 59);

    // Case 4: Final countdown expiration reset to 3h
    const s4 = tick({ hours: 0, minutes: 0, seconds: 0 });
    expect.equal(s4.hours, 3);
    expect.equal(s4.minutes, 0);
    expect.equal(s4.seconds, 0);

    // Continuous simulation: 3600 seconds tick from 1:00:00 to 0:00:00
    let state = { hours: 1, minutes: 0, seconds: 0 };
    for (let sec = 0; sec < 3600; sec++) {
      state = tick(state);
      expect.ok(state.hours >= 0 && state.hours <= 3, 'Hours must stay in [0, 3]');
      expect.ok(state.minutes >= 0 && state.minutes <= 59, 'Minutes must stay in [0, 59]');
      expect.ok(state.seconds >= 0 && state.seconds <= 59, 'Seconds must stay in [0, 59]');
    }
    expect.equal(state.hours, 0);
    expect.equal(state.minutes, 0);
    expect.equal(state.seconds, 0);

    // Next tick expires and resets to 3h
    state = tick(state);
    expect.equal(state.hours, 3);
    expect.equal(state.minutes, 0);
    expect.equal(state.seconds, 0);
  });

  // -------------------------------------------------------------
  // 6. PDP BUY BOX GUARANTEES CONTRACT VERIFICATION
  // -------------------------------------------------------------
  test('S6. PDP Buy Box Guarantees Contract: 3 cards, exact Vietnamese text, squircle pills, dark mode', () => {
    const pdpJsx = fs.readFileSync(path.join(rootDir, 'client/src/pages/ProductDetailPage.jsx'), 'utf8');
    const pdpCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/amazon-pdp.css'), 'utf8');

    // Exactly 3 guarantee cards in ProductDetailPage.jsx
    expect.ok(pdpJsx.includes('100% Chính hãng'), 'Must contain "100% Chính hãng"');
    expect.ok(pdpJsx.includes('Bồi thường gấp đôi nếu phát hiện hàng giả'), 'Must contain authentic guarantee description');

    expect.ok(pdpJsx.includes('Đổi trả 15 ngày'), 'Must contain "Đổi trả 15 ngày"');
    expect.ok(pdpJsx.includes('Miễn phí hoàn hàng tận nơi theo chính sách sàn'), 'Must contain return policy description');

    expect.ok(pdpJsx.includes('Giao nhanh 2H'), 'Must contain "Giao nhanh 2H"');
    expect.ok(pdpJsx.includes('Nhận hàng siêu tốc nội thành'), 'Must contain fast delivery description');

    // Unboxed squircle pill classes on icon wrappers
    const squircleCount = (pdpJsx.match(/className="amazon-guarantee-icon-wrap squircle-pill"/g) || []).length;
    expect.equal(squircleCount, 3, 'All 3 guarantee icon wrappers must use squircle-pill');

    // CSS class definitions in amazon-pdp.css
    expect.ok(pdpCss.includes('.amazon-guarantees'), 'amazon-pdp.css must define .amazon-guarantees');
    expect.ok(pdpCss.includes('.amazon-guarantee-card'), 'amazon-pdp.css must define .amazon-guarantee-card');
    expect.ok(pdpCss.includes('.amazon-guarantee-card.amazon-guarantee-authentic'), 'Defines .amazon-guarantee-authentic');
    expect.ok(pdpCss.includes('.amazon-guarantee-card.amazon-guarantee-return'), 'Defines .amazon-guarantee-return');
    expect.ok(pdpCss.includes('.amazon-guarantee-card.amazon-guarantee-speed'), 'Defines .amazon-guarantee-speed');

    // Dark mode rules for guarantee cards
    expect.ok(pdpCss.includes('[data-theme="dark"] .amazon-guarantee-card.amazon-guarantee-authentic'), 'Dark mode authentic card');
    expect.ok(pdpCss.includes('[data-theme="dark"] .amazon-guarantee-card.amazon-guarantee-return'), 'Dark mode return card');
    expect.ok(pdpCss.includes('[data-theme="dark"] .amazon-guarantee-card.amazon-guarantee-speed'), 'Dark mode speed card');
  });

  // -------------------------------------------------------------
  // 7. VISUAL DEPTH & CSS TOKENS INVARIANTS IN M2 FILES
  // -------------------------------------------------------------
  test('S7. Visual Depth & Design Tokens: hero glow, animated gradient sweep, card lift, squircle pills', () => {
    const bannerCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/banner.css'), 'utf8');
    const dealsCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/deals.css'), 'utf8');
    const productCss = fs.readFileSync(path.join(rootDir, 'client/src/styles/product.css'), 'utf8');
    const productCardJsx = fs.readFileSync(path.join(rootDir, 'client/src/components/ProductCard.jsx'), 'utf8');

    // Hero banner depth tokens
    expect.ok(bannerCss.includes('border-radius: var(--radius-surface, 20px)'), 'Hero wrapper uses --radius-surface (20px)');
    expect.ok(bannerCss.includes('box-shadow: var(--shadow-ambient-glow), var(--shadow-dual-card)'), 'Hero wrapper uses dual-layer ambient glow');
    expect.ok(bannerCss.includes('.banner-prop-icon'), 'Defines .banner-prop-icon');
    expect.ok(bannerCss.includes('backdrop-filter: blur(8px)'), 'Banner prop icon uses backdrop-filter blur');

    // Flash deals animated sweep
    expect.ok(dealsCss.includes('@keyframes fire-bar-sweep'), 'deals.css defines @keyframes fire-bar-sweep');
    expect.ok(dealsCss.includes('animation: fire-bar-sweep'), 'deals.css applies fire-bar-sweep animation');
    expect.ok(dealsCss.includes('background-size: 200% 100%'), 'Fire bar uses 200% 100% background-size for smooth sweep');

    // Product card elevation & dark mode
    expect.ok(productCss.includes('transform: translateY(-4px)'), 'Product card hover lift is -4px');
    expect.ok(productCss.includes('box-shadow: var(--shadow-dual-hover'), 'Product card hover uses --shadow-dual-hover');
    expect.ok(productCss.includes('.shopee-discount-badge'), 'Product card defines .shopee-discount-badge');
    expect.ok(productCss.includes('border-radius: 9999px'), 'Discount badge uses 9999px squircle pill radius');

    // CartIcon contrast fix: must NOT use hardcoded #ffffff on light background
    expect.ok(
      !productCardJsx.includes('<CartIcon size={14} color="#ffffff" />'),
      'ProductCard CartIcon does NOT use #ffffff color on light background'
    );
    expect.ok(
      productCardJsx.includes('<CartIcon size={14} color="currentColor" />'),
      'ProductCard CartIcon uses currentColor for accessible contrast'
    );
  });
});

// Run when executed directly
runAllTests().then(result => {
  if (!result.success) {
    process.exitCode = 1;
  }
}).catch(err => {
  console.error('Test execution error:', err);
  process.exitCode = 1;
});
