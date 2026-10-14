/**
 * Dynamic Inventory Repricing & Clearance Decay Optimizer
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 13 - Feature 160)
 * 
 * Vấn đề:
 * Trong quản trị chuỗi cung ứng TMĐT của Người Bán và Kho Fulfillment:
 * 1. Hàng tồn kho lưu bãi lâu ngày (Aging Stock) chiếm dụng diện tích kệ hàng,
 *    phát sinh phí lưu kho SPX (Storage fees) và làm ứ đọng dòng vốn lưu động.
 * 2. Hàng hóa giảm dần sức hút hoặc cận hạn sử dụng (đối với mỹ phẩm, thực phẩm, thời trang theo mùa).
 * 3. Nếu xả kho tùy tiện bằng tay, người bán dễ bị bán dưới điểm hòa vốn hoặc gây sốc giá làm mất uy tín.
 * 
 * Nguyên lý Thuật Toán Inventory Age Decay:
 * 1. Đo lường tuổi tồn kho ($t$ = số ngày kể từ ngày nhập kho):
 *    - Nhóm Fresh Stock ($0 - 30$ ngày): Giữ nguyên giá niêm yết chuẩn.
 *    - Nhóm Moderate Aging ($31 - 60$ ngày): Bắt đầu chiết khấu nhẹ ($5\% - 10\%$).
 *    - Nhóm Slow-moving ($61 - 90$ ngày): Kích hoạt ưu đãi xả kho trung bình ($15\% - 25\%$).
 *    - Nhóm Critical Deadstock ($> 90$ ngày): Xả kho khẩn cấp ($30\% - 50\%$).
 * 2. Đường cong phân rã giá trị mũ (Exponential Value Decay Curve):
 *    $$P_{\text{clearance}}(t) = \max\left(P_{\text{floor}}, P_{\text{original}} \times e^{-\lambda \cdot t}\right)$$
 * 3. Rào chắn giá sàn hòa vốn an toàn ($P_{\text{floor}}$):
 *    $$P_{\text{floor}} = \text{COGS} \times (1 + \text{Phí Sàn 5\%} + \text{Thuế 2.5\%})$$
 *    Đảm bảo dòng tiền thu hồi không bao giờ thấp hơn chi phí biên sản xuất/nhập hàng.
 */

export const INVENTORY_AGE_TIERS = [
  { code: "FRESH", minDays: 0, maxDays: 30, discountRate: 0.0, label: "Hàng Mới Nhập", recommendation: "Duy trì giá bán chuẩn và tập trung đẩy Shopee Ads." },
  { code: "MODERATE", minDays: 31, maxDays: 60, discountRate: 0.1, label: "Tồn Kho 1-2 Tháng", recommendation: "Tham gia Flash Sale khung giờ phụ, giảm nhẹ 10% để kích cầu." },
  { code: "SLOW", minDays: 61, maxDays: 90, discountRate: 0.25, label: "Chậm Luân Chuyển", recommendation: "Thiết lập gói Mua Kèm Deal Sốc bằng FP-Growth, chiết khấu 25%." },
  { code: "DEADSTOCK", minDays: 91, maxDays: Infinity, discountRate: 0.4, label: "Tồn Kho Báo Động (>3 Tháng)", recommendation: "Kích hoạt chiến dịch Xả Hàng Tồn Kho, giảm 40% về sát giá sàn hòa vốn để giải phóng mặt bằng kho." },
];

export class InventoryDecayOptimizer {
  constructor({
    decayConstant = 0.005, // Hệ số suy giảm lambda
    platformFeeRate = 0.05, // Phí sàn 5%
    taxRate = 0.025, // Thuế 2.5%
    referenceDate = new Date(),
  } = {}) {
    this.decayConstant = decayConstant;
    this.platformFeeRate = platformFeeRate;
    this.taxRate = taxRate;
    this.referenceDate = new Date(referenceDate);
  }

  /**
   * Tính toán giá sàn hòa vốn an toàn
   * @param {number} cogs Giá vốn hàng bán (VND)
   */
  calculateFloorPrice(cogs) {
    const cost = Math.max(0, Number(cogs) || 0);
    // Floor = COGS / (1 - FeeRate - TaxRate)
    const marginDivisor = 1 - (this.platformFeeRate + this.taxRate);
    return Math.ceil(cost / marginDivisor);
  }

  /**
   * Phân tích và đề xuất giá xả kho cho một sản phẩm cụ thể
   * @param {Object} product { id, name, price, cogs, stock, receivedDate }
   */
  evaluateProduct(product) {
    const originalPrice = Number(product.price) || 0;
    const cogs = Number(product.cogs || originalPrice * 0.5);
    const stock = Number(product.stock) || 0;
    const receivedDate = new Date(product.receivedDate || this.referenceDate);

    const diffDays = Math.max(
      0,
      Math.floor((this.referenceDate.getTime() - receivedDate.getTime()) / (1000 * 3600 * 24))
    );

    // Xác định phân tầng tuổi tồn kho
    let matchedTier = INVENTORY_AGE_TIERS.find(
      (tier) => diffDays >= tier.minDays && diffDays <= tier.maxDays
    ) || INVENTORY_AGE_TIERS[INVENTORY_AGE_TIERS.length - 1];

    // Tính giá sàn an toàn
    const floorPrice = this.calculateFloorPrice(cogs);

    let suggestedPrice = originalPrice;
    if (matchedTier.code !== "FRESH") {
      const tierDiscountPrice = Math.round(originalPrice * (1 - matchedTier.discountRate));
      suggestedPrice = Math.max(floorPrice, tierDiscountPrice);
    }
    const effectiveDiscountPct = originalPrice > 0
      ? Number((((originalPrice - suggestedPrice) / originalPrice) * 100).toFixed(1))
      : 0;

    const lockedCapital = stock * cogs;
    const projectedRecoveryRevenue = stock * suggestedPrice;

    return {
      productId: product.id,
      productName: product.name,
      stock,
      daysInInventory: diffDays,
      ageTier: matchedTier.code,
      tierLabel: matchedTier.label,
      originalPrice,
      cogs,
      floorPrice,
      suggestedPrice,
      effectiveDiscountPct,
      isAtFloorPrice: suggestedPrice <= floorPrice,
      lockedCapital,
      projectedRecoveryRevenue,
      recommendation: matchedTier.recommendation,
    };
  }

  /**
   * Phân tích hàng loạt danh mục tồn kho của gian hàng
   * @param {Array<Object>} products Danh sách sản phẩm
   */
  evaluateCatalog(products = []) {
    const evaluations = products.map((p) => this.evaluateProduct(p));
    let totalStock = 0;
    let totalLockedCapital = 0;
    let totalRecoveryRevenue = 0;
    const tierCounts = { FRESH: 0, MODERATE: 0, SLOW: 0, DEADSTOCK: 0 };

    for (const e of evaluations) {
      totalStock += e.stock;
      totalLockedCapital += e.lockedCapital;
      totalRecoveryRevenue += e.projectedRecoveryRevenue;
      tierCounts[e.ageTier] = (tierCounts[e.ageTier] || 0) + 1;
    }

    const deadstockItems = evaluations.filter((e) => e.ageTier === "SLOW" || e.ageTier === "DEADSTOCK");

    return {
      totalProducts: evaluations.length,
      totalUnitsInStock: totalStock,
      totalLockedCapital,
      projectedRecoveryRevenue: totalRecoveryRevenue,
      tierDistribution: tierCounts,
      deadstockCount: deadstockItems.length,
      deadstockAlert: deadstockItems.length > 0,
      evaluations,
    };
  }
}
