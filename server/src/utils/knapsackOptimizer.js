/**
 * 0/1 Knapsack Dynamic Programming & Voucher Optimizer
 * (Thuật toán Quy hoạch động Tối ưu hóa Giỏ hàng & Xếp chồng Voucher)
 * 
 * Vấn đề:
 * Người mua có một ngân sách cố định B (hoặc muốn đạt ngưỡng chi tiêu tối thiểu của Voucher,
 * ví dụ: "Đơn từ 300k giảm 50k", "Đơn từ 500k giảm 100k").
 * Làm sao để chọn ra tập hợp các mặt hàng trong danh sách mong muốn sao cho:
 * 1. Đạt giá trị sử dụng (Utility/Value) cao nhất trong ngân sách B.
 * 2. Tìm ra mặt hàng mua kèm có giá thấp nhất để vừa đủ vượt qua ngưỡng bậc thang Voucher
 *    (Voucher Tier Threshold Optimization).
 * 
 * Giải pháp:
 * 1. Thuật toán Quy hoạch động Knapsack 0/1 kinh điển O(N * Capacity):
 *    DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i]] + value[i])
 * 2. Truy vết (Backtracking) để tìm chính xác danh sách các mặt hàng được chọn.
 * 3. Voucher Gap Optimizer: Đề xuất món đồ rẻ nhất cần mua thêm để "vừa khít" ngưỡng áp mã.
 */

export function knapsack01(items = [], capacity = 0) {
  const cap = Math.floor(Math.max(0, capacity));
  const n = items.length;
  if (n === 0 || cap === 0) {
    return { maxValue: 0, totalWeight: 0, chosenItems: [] };
  }

  // Khởi tạo bảng DP kích thước (n + 1) x (cap + 1)
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(cap + 1));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const weight = Math.floor(item.weight || item.price || 0);
    const value = Math.floor(item.value || item.utility || item.rating || 0);

    for (let w = 0; w <= cap; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Truy vết các phần tử được chọn
  let currentCap = cap;
  const chosenItems = [];
  let totalWeight = 0;

  for (let i = n; i > 0; i--) {
    if (dp[i][currentCap] !== dp[i - 1][currentCap]) {
      const item = items[i - 1];
      chosenItems.unshift(item);
      const weight = Math.floor(item.weight || item.price || 0);
      totalWeight += weight;
      currentCap -= weight;
    }
  }

  return {
    maxValue: dp[n][cap],
    totalWeight,
    chosenItems,
  };
}

/**
 * Tối ưu hóa bậc thang Voucher (Voucher Threshold Gap Optimizer)
 * @param {Array<Object>} availableProducts - Các sản phẩm có thể mua kèm
 * @param {number} currentCartTotal - Tổng tiền giỏ hàng hiện tại
 * @param {number} voucherMinSpend - Ngưỡng tối thiểu của voucher (ví dụ 300,000đ)
 */
export function findOptimalAddonToUnlockVoucher(availableProducts = [], currentCartTotal = 0, voucherMinSpend = 300000) {
  const gap = voucherMinSpend - currentCartTotal;
  if (gap <= 0) {
    return {
      alreadyQualified: true,
      neededAmount: 0,
      bestAddons: [],
    };
  }

  // Tìm các sản phẩm có giá >= gap sao cho chênh lệch (giá - gap) là nhỏ nhất
  const candidates = availableProducts
    .filter((p) => (p.price || 0) >= gap)
    .sort((a, b) => (a.price || 0) - (b.price || 0));

  if (candidates.length > 0) {
    const bestSingle = candidates[0];
    return {
      alreadyQualified: false,
      neededAmount: gap,
      bestAddons: [bestSingle],
      excessAmount: (bestSingle.price || 0) - gap,
    };
  }

  // Nếu không có sản phẩm đơn lẻ nào >= gap, chọn tổ hợp sản phẩm rẻ nhất có tổng >= gap
  const sortedCheap = [...availableProducts].sort((a, b) => (a.price || 0) - (b.price || 0));
  let currentSum = 0;
  const bundle = [];

  for (const item of sortedCheap) {
    bundle.push(item);
    currentSum += item.price || 0;
    if (currentSum >= gap) break;
  }

  return {
    alreadyQualified: false,
    neededAmount: gap,
    bestAddons: bundle,
    excessAmount: Math.max(0, currentSum - gap),
  };
}
