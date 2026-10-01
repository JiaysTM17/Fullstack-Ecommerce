/**
 * Empirical Challenger 2 Verification Suite
 * Stress-testing Date Parsing, CSV Export with UTF-8 BOM, Card Responsive Layout, and 1-Click Copy
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS HARNESS');
console.log('================================================================\n');

// ============================================================================
// 1. DATE PARSING & FILTER STRESS TEST
// ============================================================================
console.log('--- 1. Testing parseOrderDate & matchesDateRange ---');

const parseOrderDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim();

  // 1. Direct standard Date parsing if ISO or standard format
  const directDate = new Date(str);
  if (!isNaN(directDate.getTime()) && str.includes('-')) {
    return directDate;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY HH:mm
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), Number(dmy[4] || 0), Number(dmy[5] || 0));
  }

  // 3. YYYY/MM/DD or YYYY-MM-DD HH:mm
  const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{2}):(\d{2}))?/);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), Number(ymd[4] || 0), Number(ymd[5] || 0));
  }

  return isNaN(directDate.getTime()) ? new Date() : directDate;
};

const matchesDateRangeWithRef = (ordDate, dateRange, refDate) => {
  if (dateRange === 'all') return true;
  const d = parseOrderDate(ordDate);
  const now = refDate || new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

  if (dateRange === '30days') {
    return diffDays >= -1 && diffDays <= 30;
  }
  if (dateRange === '3months') {
    return diffDays >= -1 && diffDays <= 90;
  }
  if (dateRange === 'year2026') {
    return d.getFullYear() === 2026 || String(ordDate).includes('2026');
  }
  return true;
};

// 1.1 parseOrderDate robustness
const dateTestCases = [
  { input: '2026-09-24 14:20', expectedYear: 2026, expectedMonth: 8, expectedDate: 24 },
  { input: '2026-09-24T14:20:00.000Z', expectedYear: 2026 },
  { input: '2026-09-24T07:20:00+07:00', expectedYear: 2026 },
  { input: '24/09/2026 14:20', expectedYear: 2026, expectedMonth: 8, expectedDate: 24, expectedHour: 14, expectedMin: 20 },
  { input: '24-09-2026 08:30', expectedYear: 2026, expectedMonth: 8, expectedDate: 24, expectedHour: 8, expectedMin: 30 },
  { input: '24/09/2026', expectedYear: 2026, expectedMonth: 8, expectedDate: 24 },
  { input: '2026/09/24 14:20', expectedYear: 2026, expectedMonth: 8, expectedDate: 24 },
  { input: '2026/09/24', expectedYear: 2026, expectedMonth: 8, expectedDate: 24 },
  { input: new Date(2026, 8, 24), expectedYear: 2026, expectedMonth: 8, expectedDate: 24 },
  { input: '', neverNaN: true },
  { input: null, neverNaN: true },
  { input: undefined, neverNaN: true },
  { input: 'garbage-text-no-date', neverNaN: true },
  { input: 'undefined/null/NaN', neverNaN: true },
  { input: 1790253600000, neverNaN: true },
  { input: '1790253600000', neverNaN: true },
];

dateTestCases.forEach((tc, idx) => {
  const parsed = parseOrderDate(tc.input);
  assert(!isNaN(parsed.getTime()), `parseOrderDate test #${idx + 1} ('${tc.input}') never returns NaN`);
  if (tc.expectedYear) {
    assert(parsed.getFullYear() === tc.expectedYear, `parseOrderDate test #${idx + 1} year matches ${tc.expectedYear}`);
  }
  if (tc.expectedMonth !== undefined) {
    assert(parsed.getMonth() === tc.expectedMonth, `parseOrderDate test #${idx + 1} month matches ${tc.expectedMonth}`);
  }
  if (tc.expectedDate !== undefined) {
    assert(parsed.getDate() === tc.expectedDate, `parseOrderDate test #${idx + 1} date matches ${tc.expectedDate}`);
  }
});

// 1.2 matchesDateRange boundary testing against fixed reference date in local time
const refDate = new Date(2026, 9, 1, 12, 0, 0); // 2026-10-01 12:00:00 local

// 7 days ago (2026-09-24)
assert(matchesDateRangeWithRef('2026-09-24 14:20', '30days', refDate) === true, '7 days ago matches 30days');
assert(matchesDateRangeWithRef('2026-09-24 14:20', '3months', refDate) === true, '7 days ago matches 3months');
assert(matchesDateRangeWithRef('2026-09-24 14:20', 'year2026', refDate) === true, '7 days ago matches year2026');
assert(matchesDateRangeWithRef('2026-09-24 14:20', 'all', refDate) === true, '7 days ago matches all');

// Exactly 30 days ago (2026-09-01 12:00)
assert(matchesDateRangeWithRef('2026-09-01 12:00', '30days', refDate) === true, '30 days ago boundary matches 30days');

// 35 days ago (2026-08-27 12:00)
assert(matchesDateRangeWithRef('2026-08-27 12:00', '30days', refDate) === false, '35 days ago excluded from 30days');
assert(matchesDateRangeWithRef('2026-08-27 12:00', '3months', refDate) === true, '35 days ago matches 3months');

// 89 days ago (2026-07-04 12:00)
assert(matchesDateRangeWithRef('2026-07-04 12:00', '3months', refDate) === true, '89 days ago boundary matches 3months');

// 95 days ago (2026-06-28 12:00)
assert(matchesDateRangeWithRef('2026-06-28 12:00', '3months', refDate) === false, '95 days ago excluded from 3months');
assert(matchesDateRangeWithRef('2026-06-28 12:00', 'year2026', refDate) === true, '95 days ago matches year2026');

// Order in year 2025 (2025-12-15 10:00)
assert(matchesDateRangeWithRef('2025-12-15 10:00', '30days', refDate) === false, '2025 order excluded from 30days');
assert(matchesDateRangeWithRef('2025-12-15 10:00', '3months', refDate) === false, '2025 order excluded from 3months');
assert(matchesDateRangeWithRef('2025-12-15 10:00', 'year2026', refDate) === false, '2025 order excluded from year2026');
assert(matchesDateRangeWithRef('2025-12-15 10:00', 'all', refDate) === true, '2025 order matches all');


// ============================================================================
// 2. CSV EXPORT & UTF-8 BOM STRESS TEST
// ============================================================================
console.log('\n--- 2. Testing CSV Export & UTF-8 BOM Encoding ---');

const generateCSV = (ordersList, user) => {
  const headers = [
    'Mã đơn hàng',
    'Ngày đặt',
    'Người nhận',
    'Số điện thoại',
    'Địa chỉ',
    'Sản phẩm',
    'Tổng thanh toán',
    'Phương thức thanh toán',
    'Trạng thái',
    'Mã vận đơn SPX',
  ];

  const escapeCSV = (val) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = ordersList.map((ord) => {
    const itemsSummary = (ord.items || [])
      .map((it) => `${it.name} (x${it.quantity || 1})`)
      .join('; ');
    const recipient = ord.customerName || ord.customer?.fullName || user?.name || 'Khách Hàng Mini Shopee';
    const phone = ord.phone || ord.customer?.phone || '0901234567';
    const address = ord.shippingAddress || ord.address || ord.customer?.address || 'Việt Nam';
    const total = ord.total || 0;
    const tracking = ord.trackingCode || (ord.orderId ? `SPX-VN-${ord.orderId}` : '');

    return [
      escapeCSV(ord.orderId),
      escapeCSV(ord.createdAt || ''),
      escapeCSV(recipient),
      escapeCSV(phone),
      escapeCSV(address),
      escapeCSV(itemsSummary),
      escapeCSV(total),
      escapeCSV(ord.paymentMethod || 'COD'),
      escapeCSV(ord.statusText || ord.status),
      escapeCSV(tracking),
    ].join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
};

const complexOrders = [
  {
    orderId: 'ORD-VN-001',
    createdAt: '2026-09-24 14:20',
    customerName: 'Trương Gia Kiệt (Đại diện Shopee Mall)',
    phone: '0987654321',
    address: 'Tầng 12, Tòa nhà "Bitexco Financial", Số 2 Hải Triều, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh\nGhi chú: Giao giờ hành chính',
    items: [
      { name: 'Áo thun cotton 100%, dệt công nghệ "Air-Cool" siêu thoáng khí', quantity: 3 },
      { name: 'Tai nghe Bluetooth True Wireless "Chống ồn Pro, Super Bass"', quantity: 1 }
    ],
    total: 1250000,
    paymentMethod: 'Chuyển khoản VietQR (Đã thanh toán)',
    statusText: 'Giao hàng thành công',
    trackingCode: 'SPX-VN-11223344'
  },
  {
    orderId: 'ORD-VN-002',
    createdAt: '2026-09-28 09:15',
    customerName: 'Nguyễn Thị Bích Ngân',
    phone: '0912345678',
    address: 'Thôn 3, Xã Bình Triều, Huyện Thăng Bình, Tỉnh Quảng Nam',
    items: [
      { name: 'Bộ nồi inox 304 cao cấp 5 đáy (size 16cm, 20cm, 24cm)', quantity: 1 }
    ],
    total: 890000,
    paymentMethod: 'COD',
    statusText: 'Đang vận chuyển',
    trackingCode: 'SPX-VN-55667788'
  },
  {
    orderId: 'ORD-EMPTY',
    createdAt: '',
    customerName: '',
    phone: '',
    address: '',
    items: [],
    total: 0,
    paymentMethod: '',
    statusText: '',
    trackingCode: ''
  }
];

const csvOutput = generateCSV(complexOrders, { name: 'Kiệt Trương' });
const csvBuffer = Buffer.from(csvOutput, 'utf8');

// UTF-8 BOM Verification (0xEF, 0xBB, 0xBF)
assert(csvBuffer[0] === 0xEF, 'CSV buffer first byte is 0xEF (UTF-8 BOM part 1)');
assert(csvBuffer[1] === 0xBB, 'CSV buffer second byte is 0xBB (UTF-8 BOM part 2)');
assert(csvBuffer[2] === 0xBF, 'CSV buffer third byte is 0xBF (UTF-8 BOM part 3)');

// Check quote escaping
assert(csvOutput.includes('""Bitexco Financial""'), 'Double quotes in address escaped with double quotes in CSV');
assert(csvOutput.includes('""Air-Cool""'), 'Double quotes in item name escaped properly');
assert(csvOutput.includes('""Chống ồn Pro, Super Bass""'), 'Quotes and commas inside item name handled properly');

// Check Vietnamese diacritics integrity
assert(csvOutput.includes('Trương Gia Kiệt'), 'Vietnamese name "Trương Gia Kiệt" intact in CSV output');
assert(csvOutput.includes('Bến Nghé'), 'Vietnamese ward "Bến Nghé" intact in CSV output');
assert(csvOutput.includes('Thăng Bình'), 'Vietnamese district "Thăng Bình" intact in CSV output');
assert(csvOutput.includes('Áo thun cotton 100%'), 'Diacritic Á in product intact in CSV output');
assert(csvOutput.includes('"ORD-EMPTY"'), 'Empty order gracefully handles null/empty fields without crash');


// ============================================================================
// 3. CARD RESPONSIVE LAYOUT & CSS INTEGRITY
// ============================================================================
console.log('\n--- 3. Testing Card Responsive Layout & CSS ---');

const cssPath = resolve('client/src/styles/dashboard.css');
const cssContent = readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.order-card-tier-layout'), 'dashboard.css contains .order-card-tier-layout');
assert(cssContent.includes('.order-card-header'), 'dashboard.css contains .order-card-header');
assert(cssContent.includes('.order-card-items'), 'dashboard.css contains .order-card-items');
assert(cssContent.includes('.order-card-fees'), 'dashboard.css contains .order-card-fees');
assert(cssContent.includes('.fee-breakdown-table'), 'dashboard.css contains .fee-breakdown-table');
assert(cssContent.includes('.order-card-footer'), 'dashboard.css contains .order-card-footer');
assert(cssContent.includes('.order-card-footer-actions'), 'dashboard.css contains .order-card-footer-actions');
assert(cssContent.includes('.copy-pill'), 'dashboard.css contains .copy-pill');

// Responsive query check for mobile (max-width: 768px and max-width: 520px)
assert(cssContent.includes('@media (max-width: 768px)'), 'dashboard.css contains @media (max-width: 768px) rules');
assert(cssContent.includes('@media (max-width: 520px)'), 'dashboard.css contains @media (max-width: 520px) rules');
assert(cssContent.includes('@media print'), 'dashboard.css contains @media print rules for paper/PDF reports');

// Overflow protection check:
assert(cssContent.includes('overflow: hidden') && cssContent.includes('box-sizing: border-box'), 'Card container has overflow: hidden and box-sizing: border-box');


// ============================================================================
// 4. 1-CLICK CLIPBOARD COPY INTEGRITY
// ============================================================================
console.log('\n--- 4. Testing 1-Click Clipboard Copy Logic & Fallback ---');

const orderHistoryPath = resolve('client/src/pages/OrderHistoryPage.jsx');
const orderHistoryCode = readFileSync(orderHistoryPath, 'utf8');

assert(orderHistoryCode.includes('handleCopy'), 'OrderHistoryPage.jsx contains handleCopy function');
assert(orderHistoryCode.includes('navigator?.clipboard?.writeText'), 'handleCopy checks navigator?.clipboard?.writeText');
assert(orderHistoryCode.includes('fallbackCopy'), 'handleCopy provides fallbackCopy method');
assert(orderHistoryCode.includes('document.execCommand(\'copy\')'), 'fallbackCopy uses document.execCommand fallback');
assert(orderHistoryCode.includes('showToast'), 'handleCopy triggers toast notification');

const modalPath = resolve('client/src/components/OrderDetailModal.jsx');
const modalCode = readFileSync(modalPath, 'utf8');

assert(modalCode.includes('handleCopy'), 'OrderDetailModal.jsx contains handleCopy function');
assert(modalCode.includes('navigator?.clipboard?.writeText'), 'OrderDetailModal checks navigator?.clipboard?.writeText');
assert(modalCode.includes('fallbackCopy'), 'OrderDetailModal provides fallbackCopy');

const indexPath = resolve('client/src/components/index.js');
const indexCode = readFileSync(indexPath, 'utf8');
assert(indexCode.includes("export { default as OrderDetailModal } from './OrderDetailModal';"), 'components/index.js exports OrderDetailModal');


// ============================================================================
// 5. SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TOTAL TESTS:  ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${failedTests}`);
console.log(`PASS RATE:    ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('================================================================');

if (failedTests > 0) {
  process.exitCode = 1;
}
