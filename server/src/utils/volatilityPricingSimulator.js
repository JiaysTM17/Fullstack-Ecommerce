/**
 * Dynamic Volatility & Price Elasticity Simulator for Flash Sale Campaigns
 * 
 * Thuật toán Mô Phỏng Độ Co Giãn Giá & Phân Tích Biến Động Nhu Cầu (Price Elasticity of Demand - PED):
 * 1. Đo lường hệ số co giãn nhu cầu theo giá:
 *    ε_d = (% thay đổi lượng cầu ΔQ / Q) / (% thay đổi giá ΔP / P)
 * 2. Phân loại độ co giãn:
 *    - |ε_d| > 1: Cầu co giãn mạnh (Elastic) -> Giảm giá sẽ làm TĂNG tổng doanh thu.
 *    - |ε_d| = 1: Co giãn đơn vị (Unitary Elastic) -> Doanh thu đạt điểm CỰC ĐẠI tối ưu.
 *    - |ε_d| < 1: Cầu kém co giãn (Inelastic) -> Giảm giá sẽ làm GIẢM tổng doanh thu (không nên giảm sâu).
 * 3. Mô phỏng biến động lưu lượng theo hàm trọng số giờ vàng Flash Sale (12h, 20h)
 *    và tự động đề xuất mức chiết khấu tối ưu (Optimal Discount Rate) để tối đa hóa lợi nhuận gộp.
 */

export class PriceElasticitySimulator {
  /**
   * Tính hệ số co giãn của cầu theo giá (Price Elasticity of Demand)
   * Sử dụng công thức trung điểm (Midpoint Formula) để đảm bảo tính đối xứng
   * 
   * @param {number} p1 - Giá ban đầu
   * @param {number} q1 - Lượng bán tại giá ban đầu
   * @param {number} p2 - Giá sau khi giảm/tăng
   * @param {number} q2 - Lượng bán tại giá mới
   * @returns {Object} Hệ số co giãn và phân loại tính chất cầu
   */
  static calculateElasticity(p1, q1, p2, q2) {
    if (p1 <= 0 || p2 <= 0 || q1 < 0 || q2 < 0) {
      throw new Error("Giá và sản lượng phải là số dương hợp lệ.");
    }

    if (p1 === p2) {
      return { elasticity: 0, type: "PERFECTLY_INELASTIC", description: "Giá không đổi" };
    }

    const deltaQ = q2 - q1;
    const avgQ = (q1 + q2) / 2;
    const pctChangeQ = avgQ > 0 ? deltaQ / avgQ : 0;

    const deltaP = p2 - p1;
    const avgP = (p1 + p2) / 2;
    const pctChangeP = deltaP / avgP;

    const elasticity = Number((pctChangeQ / pctChangeP).toFixed(3));
    const absElasticity = Math.abs(elasticity);

    let type = "UNITARY";
    let advice = "";

    if (absElasticity > 1.2) {
      type = "ELASTIC";
      advice = "Nhu cầu rất nhạy cảm với giá. Giảm giá trong Flash Sale sẽ kích thích sức mua mạnh và làm tăng tổng doanh số.";
    } else if (absElasticity < 0.8) {
      type = "INELASTIC";
      advice = "Nhu cầu ít co giãn theo giá (khách hàng có lòng trung thành cao hoặc sản phẩm độc quyền). Không nên giảm giá sâu vì sẽ bào mòn lợi nhuận.";
    } else {
      type = "UNITARY";
      advice = "Độ co giãn xấp xỉ đơn vị (|ε| ≈ 1.0). Đây là điểm cân bằng hoàn hảo, tối đa hóa tổng doanh thu!";
    }

    return {
      p1,
      q1,
      p2,
      q2,
      pctChangeP: Number((pctChangeP * 100).toFixed(2)),
      pctChangeQ: Number((pctChangeQ * 100).toFixed(2)),
      elasticity,
      absElasticity,
      type,
      advice
    };
  }

  /**
   * Dự báo sản lượng bán và tổng doanh thu tại các mức chiết khấu Flash Sale khác nhau
   * 
   * @param {Object} product
   * @param {number} product.basePrice - Giá niêm yết chuẩn (VND)
   * @param {number} product.baseVolume - Sản lượng bán trung bình ngày
   * @param {number} product.cogs - Giá vốn hàng bán (VND)
   * @param {number} [product.assumedElasticity=-1.5] - Hệ số co giãn giả định của danh mục
   * @param {number[]} [discountRates=[0.05, 0.10, 0.15, 0.20, 0.30, 0.40]]
   * @returns {Object} Bảng mô phỏng kịch bản và đề xuất mức chiết khấu tối ưu
   */
  static simulateDiscounts({
    basePrice,
    baseVolume,
    cogs = 0,
    assumedElasticity = -1.6,
    discountRates = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]
  }) {
    if (basePrice <= 0 || baseVolume <= 0) {
      throw new Error("Giá gốc và sản lượng cơ sở phải lớn hơn 0.");
    }

    const scenarios = [];
    let bestScenario = null;
    let maxGrossProfit = -Infinity;

    for (const rate of discountRates) {
      const discountedPrice = Math.round(basePrice * (1 - rate));
      // % thay đổi giá: (discountedPrice - basePrice) / basePrice = -rate
      // % thay đổi lượng bán: %ΔQ = assumedElasticity * %ΔP = -1.6 * (-rate)
      const pctChangeQ = assumedElasticity * (-rate);
      const projectedVolume = Math.round(baseVolume * (1 + pctChangeQ));
      
      const projectedRevenue = discountedPrice * projectedVolume;
      const totalCogs = cogs * projectedVolume;
      const platformFee = Math.round(projectedRevenue * 0.05); // 5% hoa hồng
      const grossProfit = projectedRevenue - totalCogs - platformFee;

      const scenario = {
        discountRate: rate,
        discountPercent: `${Math.round(rate * 100)}%`,
        price: discountedPrice,
        volume: projectedVolume,
        projectedRevenue,
        projectedGrossProfit: grossProfit,
        profitMargin: Number(((grossProfit / projectedRevenue) * 100).toFixed(1))
      };

      scenarios.push(scenario);

      if (grossProfit > maxGrossProfit) {
        maxGrossProfit = grossProfit;
        bestScenario = scenario;
      }
    }

    return {
      basePrice,
      baseVolume,
      cogs,
      assumedElasticity,
      scenarios,
      optimalScenario: bestScenario,
      recommendation: `Mức chiết khấu ${bestScenario.discountPercent} mang lại lợi nhuận gộp cao nhất (${bestScenario.projectedGrossProfit.toLocaleString('vi-VN')}₫) với sản lượng dự kiến ${bestScenario.volume} đơn hàng.`
    };
  }
}

export default {
  PriceElasticitySimulator
};
