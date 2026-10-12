/**
 * Multi-Armed Bandit (MAB) - Dynamic Pricing & Flash Sale Price Elasticity Optimizer
 * 
 * Vấn đề:
 * Khi người bán tham gia Flash Sale hoặc chiến dịch khuyến mãi toàn sàn,
 * việc định giá chiết khấu thủ công thường gặp 2 lỗi:
 * 1. Chiết khấu quá sâu (Underpricing): Lợi nhuận biên bị bào mòn, bán nhiều nhưng lỗ.
 * 2. Chiết khấu quá nông (Overpricing): Tỷ lệ chuyển đổi thấp, không cạnh tranh được đối thủ.
 * 
 * Giải pháp: Thuật toán Thompson Sampling (Bayesian Multi-Armed Bandit)
 * - Mỗi mức giá (hoặc mức chiết khấu) là một "Cánh tay" (Arm).
 * - Tỷ lệ chuyển đổi mua hàng (Conversion Rate - CVR) tại mức giá k tuân theo phân phối xác suất:
 *     theta_k ~ Beta(alpha_k + 1, beta_k + 1)
 *   với:
 *     - alpha_k: Số lượt mua hàng thành công (Successes).
 *     - beta_k: Số lượt xem sản phẩm nhưng không mua (Failures).
 * - Cân bằng tối ưu giữa Khám phá (Exploration) và Khai thác (Exploitation):
 *   Tại mỗi lượt hiển thị, thuật toán rút mẫu ngẫu nhiên từ phân phối Beta của từng cánh tay.
 *   Cánh tay nào có Doanh thu kỳ vọng mẫu (Expected Revenue = Price * sampled_theta) lớn nhất sẽ được chọn hiển thị.
 */

/**
 * Sinh biến ngẫu nhiên tuân theo phân phối chuẩn chuẩn tắc N(0, 1) bằng Box-Muller transform
 */
function randomStandardNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Sinh biến ngẫu nhiên tuân theo phân phối Gamma(shape, 1) bằng thuật toán Marsaglia & Tsang (2000)
 */
function sampleGamma(shape) {
  if (shape < 1) {
    // Thuộc tính: Gamma(a, 1) = Gamma(a + 1, 1) * U^(1/a)
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1.0 / shape);
  }

  const d = shape - 1.0 / 3.0;
  const c = 1.0 / Math.sqrt(9.0 * d);

  while (true) {
    let z = randomStandardNormal();
    let v = 1.0 + c * z;
    if (v <= 0) continue;

    v = v * v * v;
    let u = Math.random();

    // Điều kiện chấp nhận vắt chặt (squeeze test)
    if (u < 1.0 - 0.0331 * z * z * z * z) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * z * z + d * (1.0 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Sinh mẫu ngẫu nhiên từ phân phối Beta(alpha, beta)
 * Thuộc tính: X ~ Gamma(alpha), Y ~ Gamma(beta) => X / (X + Y) ~ Beta(alpha, beta)
 */
export function sampleBeta(alpha, beta) {
  const safeAlpha = Math.max(alpha, 0.001);
  const safeBeta = Math.max(beta, 0.001);
  const x = sampleGamma(safeAlpha);
  const y = sampleGamma(safeBeta);
  return x / (x + y);
}

export class DynamicPricingBandit {
  /**
   * @param {Array<{ id: string, price: number, discountPercent?: number, name?: string }>} arms
   */
  constructor(arms = []) {
    this.arms = new Map();

    for (const arm of arms) {
      this.addArm(arm);
    }
  }

  /**
   * Thêm một mức giá/cánh tay thử nghiệm
   */
  addArm({ id, price, discountPercent = 0, name = "" }) {
    if (!id || price <= 0) {
      throw new Error("Arm must have a valid id and positive price");
    }

    this.arms.set(id, {
      id,
      price: Number(price),
      discountPercent: Number(discountPercent),
      name: name || `Mức giá ${price.toLocaleString("vi-VN")}₫`,
      alpha: 1, // Prior Beta(1, 1) - Uniform distribution
      beta: 1,
      impressions: 0,
      conversions: 0,
      revenueGenerated: 0
    });
  }

  /**
   * Chọn mức giá tối ưu cho lượt hiển thị tiếp theo bằng Thompson Sampling
   * @param {'revenue' | 'conversion'} objective - Mục tiêu tối ưu hóa: 'revenue' (tổng tiền) hoặc 'conversion' (tỷ lệ mua)
   */
  selectArm(objective = "revenue") {
    if (this.arms.size === 0) return null;

    let bestArm = null;
    let maxMetric = -Infinity;

    for (const arm of this.arms.values()) {
      // Rút mẫu tỷ lệ chuyển đổi ngẫu nhiên từ phân phối hậu nghiệm Beta(alpha, beta)
      const sampledCVR = sampleBeta(arm.alpha, arm.beta);

      // Doanh thu kỳ vọng kỳ này = Price * Sampled CVR
      const metric = objective === "revenue" ? arm.price * sampledCVR : sampledCVR;

      if (metric > maxMetric) {
        maxMetric = metric;
        bestArm = arm;
      }
    }

    return bestArm;
  }

  /**
   * Ghi nhận phản hồi người dùng (Feedback loop)
   * @param {string} armId - ID của mức giá được hiển thị
   * @param {boolean} converted - true nếu khách mua hàng, false nếu chỉ xem rồi bỏ đi
   */
  recordFeedback(armId, converted) {
    const arm = this.arms.get(armId);
    if (!arm) return;

    arm.impressions++;

    if (converted) {
      arm.conversions++;
      arm.alpha += 1;
      arm.revenueGenerated += arm.price;
    } else {
      arm.beta += 1;
    }
  }

  /**
   * Lấy mức giá có hiệu năng tốt nhất hiện tại (Exploitation only - Mean Estimate)
   */
  getBestArm(objective = "revenue") {
    let bestArm = null;
    let maxMetric = -Infinity;

    for (const arm of this.arms.values()) {
      const expectedCVR = arm.alpha / (arm.alpha + arm.beta);
      const metric = objective === "revenue" ? arm.price * expectedCVR : expectedCVR;

      if (metric > maxMetric) {
        maxMetric = metric;
        bestArm = arm;
      }
    }

    return bestArm;
  }

  /**
   * Lấy thông số thống kê toàn diện của các mức giá
   */
  getStats() {
    const totalImpressions = Array.from(this.arms.values()).reduce((sum, a) => sum + a.impressions, 0);
    const totalRevenue = Array.from(this.arms.values()).reduce((sum, a) => sum + a.revenueGenerated, 0);

    const armsSummary = Array.from(this.arms.values()).map(arm => {
      const empiricalCVR = arm.impressions > 0 ? (arm.conversions / arm.impressions) : 0;
      const expectedCVR = arm.alpha / (arm.alpha + arm.beta);
      const variance = (arm.alpha * arm.beta) / (Math.pow(arm.alpha + arm.beta, 2) * (arm.alpha + arm.beta + 1));
      const stdDev = Math.sqrt(variance);

      return {
        id: arm.id,
        name: arm.name,
        price: arm.price,
        discountPercent: arm.discountPercent,
        impressions: arm.impressions,
        conversions: arm.conversions,
        empiricalCVR: Number((empiricalCVR * 100).toFixed(2)),
        expectedCVR: Number((expectedCVR * 100).toFixed(2)),
        confidenceInterval: [
          Math.max(0, Number(((expectedCVR - 1.96 * stdDev) * 100).toFixed(2))),
          Math.min(100, Number(((expectedCVR + 1.96 * stdDev) * 100).toFixed(2)))
        ],
        revenueGenerated: arm.revenueGenerated,
        expectedRevenuePerImpression: Math.round(arm.price * expectedCVR)
      };
    });

    return {
      totalArms: this.arms.size,
      totalImpressions,
      totalRevenue,
      bestArm: this.getBestArm("revenue"),
      arms: armsSummary
    };
  }

  /**
   * Đặt lại trạng thái Prior ban đầu
   */
  reset() {
    for (const arm of this.arms.values()) {
      arm.alpha = 1;
      arm.beta = 1;
      arm.impressions = 0;
      arm.conversions = 0;
      arm.revenueGenerated = 0;
    }
  }
}
