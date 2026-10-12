/**
 * auctionEngine.js - Động cơ Đấu giá Vị trí Tài trợ GSP & VCG
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 9 - Feature 156)
 * 
 * Vấn đề:
 * 1. Đấu giá giá thứ nhất (First-Price Auction - FPA) gây ra chiến tranh bot giật giá (Bid Shading)
 *    và không có cân bằng ổn định.
 * 2. Cần phân bổ vị trí tìm kiếm và Flash Sale độc quyền dựa trên điểm xếp hạng chất lượng (Ad Rank = Bid * QS).
 * 
 * Giải pháp:
 * 1. Generalized Second Price (GSP):
 *    Người thắng vị trí i chỉ trả CPC tối thiểu để giữ vị trí trên đối thủ i+1:
 *      CPC_i = floor(Rank_{i+1} / QS_i) + 1 VND
 *    Bất biến sống còn: CPC_i <= Bid_i (không bao giờ vượt mức thầu tối đa).
 * 2. Vickrey-Clarke-Groves (VCG):
 *    Người thắng trả chi phí ngoại ứng xã hội (Externality Payment).
 *    Đảm bảo tính đấu thầu trung thực là chiến lược trội yếu (DSIC / Truthful Bidding b_i = v_i).
 *    Với 1 vị trí độc quyền (M=1 Flash Sale Hero Slot), VCG thu gọn chính xác về Second-Price Vickrey.
 */

export class AuctionEngine {
  constructor(config = {}) {
    this.defaultReservePrice = Math.max(100, Number(config.defaultReservePrice) || 500);
    this.currency = config.currency || "VND";
    this.qualityScoreWeight = Number(config.qualityScoreWeight) || 1.0;
    this.positionCtrDecay = Array.isArray(config.positionCtrDecay)
      ? config.positionCtrDecay
      : [1.0, 0.7, 0.45, 0.3, 0.2];

    this.defaultSlots = Array.isArray(config.defaultSlots) && config.defaultSlots.length > 0
      ? config.defaultSlots
      : [
          { id: "slot_1", position: 1, name: "Top 1 Hero Sponsored", ctr: 0.15 },
          { id: "slot_2", position: 2, name: "Top 2 Sponsored Card", ctr: 0.09 },
          { id: "slot_3", position: 3, name: "Top 3 Sponsored Card", ctr: 0.05 },
        ];
  }

  /**
   * Tính toán Điểm chất lượng đa thành phần (0.1 - 10.0)
   */
  calculateQualityScore(bidder = {}) {
    if (typeof bidder.qualityScore === "number" && !isNaN(bidder.qualityScore)) {
      return Math.min(10.0, Math.max(0.1, Number(bidder.qualityScore.toFixed(2))));
    }

    const rel = typeof bidder.relevanceScore === "number" ? bidder.relevanceScore : 7.0;
    const ctr = typeof bidder.ctr === "number" ? bidder.ctr : 0.045;
    const cvr = typeof bidder.cvr === "number" ? bidder.cvr : 0.030;
    const rating = typeof bidder.shopRating === "number" ? bidder.shopRating : 4.5;

    // Benchmark chuẩn sàn TMĐT
    const score = (rel / 10.0) * 4.0 +
                  Math.min(1.0, ctr / 0.06) * 3.0 +
                  Math.min(1.0, cvr / 0.04) * 2.0 +
                  (rating / 5.0) * 1.0;

    return Math.min(10.0, Math.max(0.1, Number(score.toFixed(2))));
  }

  /**
   * Chuẩn hóa danh sách slot và bidder đầu vào
   */
  _normalizeInputs(slotsInput, biddersInput, reservePriceInput) {
    const reservePrice = typeof reservePriceInput === "number" ? reservePriceInput : this.defaultReservePrice;

    // Chuẩn hóa slots
    let slots = [];
    if (typeof slotsInput === "number" && slotsInput > 0) {
      const count = Math.min(10, Math.floor(slotsInput));
      for (let i = 1; i <= count; i++) {
        const ctr = Number((0.15 * Math.pow(0.65, i - 1)).toFixed(4));
        slots.push({ id: `slot_${i}`, position: i, name: `Vị trí tài trợ ${i}`, ctr });
      }
    } else if (Array.isArray(slotsInput) && slotsInput.length > 0) {
      slots = slotsInput.map((s, idx) => ({
        id: s.id || `slot_${idx + 1}`,
        position: s.position || idx + 1,
        name: s.name || `Vị trí tài trợ ${idx + 1}`,
        ctr: typeof s.ctr === "number" ? s.ctr : Number((0.15 * Math.pow(0.65, idx)).toFixed(4)),
      }));
    } else {
      slots = [...this.defaultSlots];
    }
    slots.sort((a, b) => b.ctr - a.ctr);

    // Chuẩn hóa bidders
    const rawBidders = Array.isArray(biddersInput) ? biddersInput : [];
    const validBidders = [];
    const disqualifiedBidders = [];

    for (const b of rawBidders) {
      const bid = Number(b.bid) || 0;
      const qs = this.calculateQualityScore(b);
      const adRank = Number((bid * qs).toFixed(2));

      const normalized = {
        bidderId: String(b.bidderId || b.id || `bidder_${validBidders.length + 1}`),
        shopId: String(b.shopId || "unknown_shop"),
        productId: String(b.productId || "unknown_product"),
        bid,
        qualityScore: qs,
        adRank,
        ctr: typeof b.ctr === "number" ? b.ctr : 0.05,
      };

      if (bid < reservePrice) {
        disqualifiedBidders.push({ ...normalized, reason: `Bid ${bid}₫ dưới giá sàn ${reservePrice}₫` });
      } else {
        validBidders.push(normalized);
      }
    }

    // Sắp xếp bidders theo AdRank giảm dần
    validBidders.sort((a, b) => b.adRank - a.adRank || b.bid - a.bid);

    return { slots, validBidders, disqualifiedBidders, reservePrice };
  }

  /**
   * 1. Generalized Second Price (GSP) Auction Engine
   */
  runGspAuction({ slots = 3, bidders = [], reservePrice, impressions = 1000 } = {}) {
    const norm = this._normalizeInputs(slots, bidders, reservePrice);
    const { slots: slotList, validBidders, disqualifiedBidders, reservePrice: minPrice } = norm;

    const allocations = [];
    const unallocatedBidders = [];
    const totalSlots = slotList.length;
    let totalRevenue = 0;
    let totalClicks = 0;

    for (let i = 0; i < validBidders.length; i++) {
      const bidder = validBidders[i];

      if (i < totalSlots) {
        const slot = slotList[i];

        // Tính toán CPC Second-Price
        let nextRank = 0;
        if (i + 1 < validBidders.length) {
          nextRank = validBidders[i + 1].adRank;
        }

        let computedCpc = 0;
        if (nextRank > 0) {
          // Công thức GSP: floor(Rank_{i+1} / QS_i) + 1 VND
          computedCpc = Math.floor(nextRank / bidder.qualityScore) + 1;
        } else {
          // Vị trí cuối cùng hoặc không có đối thủ: Trả giá sàn
          computedCpc = minPrice;
        }

        // Bất biến: minPrice <= CPC <= Bid_i
        const finalCpc = Math.min(bidder.bid, Math.max(minPrice, computedCpc));

        const slotCtr = slot.ctr;
        const estClicks = Math.round(impressions * slotCtr);
        const estCost = estClicks * finalCpc;
        const savingsPerClick = bidder.bid - finalCpc;
        const savings = savingsPerClick * estClicks;

        totalRevenue += estCost;
        totalClicks += estClicks;

        allocations.push({
          rank: i + 1,
          position: slot.position,
          slotIndex: i,
          slotId: slot.id,
          slotName: slot.name,
          slotCtr,
          bidderId: bidder.bidderId,
          shopId: bidder.shopId,
          productId: bidder.productId,
          bid: bidder.bid,
          qualityScore: bidder.qualityScore,
          adRank: bidder.adRank,
          cpc: finalCpc,
          nextAdRank: nextRank,
          nextCompetitorRank: nextRank,
          expectedClicks: estClicks,
          expectedCost: estCost,
          savingsPerClick,
          savings,
          pricingRule: nextRank > 0 ? "SECOND_PRICE_COMPETITOR" : "RESERVE_PRICE_FLOOR",
        });
      } else {
        unallocatedBidders.push({
          ...bidder,
          reason: `AdRank ${bidder.adRank} không đủ cao để vào top ${totalSlots} vị trí`,
        });
      }
    }

    return {
      mechanism: "GSP",
      auctionType: "GSP",
      reservePrice: minPrice,
      totalSlots,
      slotsAllocated: allocations.length,
      allocatedCount: allocations.length,
      unallocatedCount: unallocatedBidders.length,
      disqualifiedCount: disqualifiedBidders.length,
      winners: allocations,
      allocations,
      unallocated: unallocatedBidders,
      unallocatedBidders,
      disqualifiedBidders,
      totalRevenue,
      summary: {
        totalRevenue,
        totalClicks,
        averageCpc: totalClicks > 0 ? Math.round(totalRevenue / totalClicks) : 0,
        currency: this.currency,
      },
    };
  }

  /**
   * 2. Vickrey-Clarke-Groves (VCG) Auction Engine
   */
  runVcgAuction({ slots = 3, bidders = [], reservePrice, impressions = 1000 } = {}) {
    const norm = this._normalizeInputs(slots, bidders, reservePrice);
    const { slots: slotList, validBidders, disqualifiedBidders, reservePrice: minPrice } = norm;

    const M = slotList.length;
    const N = validBidders.length;
    const allocatedCount = Math.min(M, N);

    const allocations = [];
    const unallocatedBidders = [];
    let totalWelfare = 0;
    let totalRevenue = 0;
    let totalClicks = 0;

    // Vector CTR mở rộng với alpha_{M+1} = 0
    const alphas = slotList.map((s) => s.ctr);
    alphas.push(0);

    for (let i = 0; i < N; i++) {
      const bidder = validBidders[i];

      if (i < allocatedCount) {
        const slot = slotList[i];
        const alpha_i = alphas[i];

        // Trường hợp đặc biệt: M = 1 (Exclusive Slot như Flash Sale Hero Banner)
        // VCG thu gọn chính xác về đấu giá Vickrey cổ điển: P_1 = v_2, CPC_1 = v_2
        let externalityTotal = 0;
        if (M === 1) {
          const secondBidder = validBidders[1];
          const secondVal = secondBidder ? secondBidder.bid : minPrice;
          externalityTotal = secondVal;
        } else {
          // Tổng chi phí ngoại ứng VCG:
          // P_i = sum_{k=i+1}^{M+1} v_k * (alpha_{k-1} - alpha_k)
          for (let k = i + 1; k <= Math.min(M, N); k++) {
            const competitor = validBidders[k];
            if (competitor) {
              const deltaAlpha = alphas[k - 1] - alphas[k];
              externalityTotal += competitor.bid * deltaAlpha;
            }
          }
        }

        // Đơn giá CPC VCG = P_i / alpha_i
        let cpcVcg = M === 1
          ? Math.round(externalityTotal)
          : (alpha_i > 0 ? Math.round(externalityTotal / alpha_i) : minPrice);

        if (cpcVcg === 0 || isNaN(cpcVcg)) {
          cpcVcg = minPrice;
        }

        // Bất biến: minPrice <= CPC <= Bid_i
        const finalCpc = Math.min(bidder.bid, Math.max(minPrice, cpcVcg));

        const estClicks = Math.round(impressions * alpha_i);
        const estCost = estClicks * finalCpc;
        const welfareContribution = Number((bidder.bid * alpha_i).toFixed(2));
        const savingsPerClick = bidder.bid - finalCpc;
        const savings = savingsPerClick * estClicks;

        totalWelfare += welfareContribution;
        totalRevenue += estCost;
        totalClicks += estClicks;

        allocations.push({
          rank: i + 1,
          position: slot.position,
          slotIndex: i,
          slotId: slot.id,
          slotName: slot.name,
          slotCtr: alpha_i,
          bidderId: bidder.bidderId,
          shopId: bidder.shopId,
          productId: bidder.productId,
          bid: bidder.bid,
          qualityScore: bidder.qualityScore,
          adRank: bidder.adRank,
          cpc: finalCpc,
          externalityTotal: Number(externalityTotal.toFixed(2)),
          welfareContribution,
          expectedClicks: estClicks,
          expectedCost: estCost,
          savingsPerClick,
          savings,
          pricingRule: M === 1 ? "VCG_EXCLUSIVE_SLOT_COLLAPSE" : "VCG_EXTERNALITY_HARMONIC",
        });
      } else {
        unallocatedBidders.push({
          ...bidder,
          reason: `Vượt quá giới hạn ${M} vị trí hiển thị VCG`,
        });
      }
    }

    return {
      mechanism: "VCG",
      auctionType: "VCG",
      reservePrice: minPrice,
      totalSlots: M,
      slotsAllocated: allocatedCount,
      allocatedCount,
      unallocatedCount: unallocatedBidders.length,
      disqualifiedCount: disqualifiedBidders.length,
      winners: allocations,
      allocations,
      unallocated: unallocatedBidders,
      unallocatedBidders,
      disqualifiedBidders,
      totalRevenue,
      totalSocialWelfare: Number(totalWelfare.toFixed(2)),
      externalityPayments: allocations.map((a) => a.externalityTotal),
      summary: {
        socialWelfare: Number(totalWelfare.toFixed(2)),
        totalRevenue,
        totalClicks,
        averageCpc: totalClicks > 0 ? Math.round(totalRevenue / totalClicks) : 0,
        currency: this.currency,
      },
    };
  }

  /**
   * Bộ điều phối đấu giá hợp nhất
   */
  runAuction({ type = "GSP", mechanism = "GSP", slots, bidders, reservePrice, impressions } = {}) {
    const selectedType = String(type || mechanism).toUpperCase();
    if (selectedType === "VCG") {
      return this.runVcgAuction({ slots, bidders, reservePrice, impressions });
    }
    return this.runGspAuction({ slots, bidders, reservePrice, impressions });
  }

  /**
   * Mô phỏng chiến lược đặt thầu & Chứng minh tính trung thực (Truthful Bidding DSIC)
   */
  simulateBiddingStrategy({
    targetBidderId,
    originalBid,
    testBids,
    targetBidder,
    trueValuation,
    alternativeBids = [],
    competitors = [],
    slots = null,
    mechanism = "VCG",
    auctionType = "VCG",
  } = {}) {
    const v_i = Number(trueValuation || originalBid || targetBidder?.bid || 2000);
    const bidsToTest = Array.isArray(testBids) && testBids.length > 0
      ? testBids
      : (Array.isArray(alternativeBids) && alternativeBids.length > 0
          ? alternativeBids
          : [v_i * 0.5, v_i * 0.8, v_i, v_i * 1.2, v_i * 1.5]);

    const activeMechanism = String(auctionType || mechanism).toUpperCase();
    const targetId = targetBidderId || targetBidder?.bidderId || "target_bidder";

    const results = [];
    let bestBid = null;
    let maxUtility = -Infinity;

    for (const testBid of bidsToTest) {
      const simulatedBidder = {
        ...targetBidder,
        bidderId: targetId,
        bid: Number(testBid),
        qualityScore: targetBidder?.qualityScore || 8.0,
      };

      const biddersPool = [simulatedBidder, ...competitors];
      const outcome = this.runAuction({
        type: activeMechanism,
        slots,
        bidders: biddersPool,
      });

      const myAllocation = outcome.allocations.find((a) => a.bidderId === simulatedBidder.bidderId);

      let slotPosition = null;
      let slotCtr = 0;
      let cpcPaid = 0;
      let won = false;
      let utility = 0;

      if (myAllocation) {
        won = true;
        slotPosition = myAllocation.position;
        slotCtr = myAllocation.slotCtr;
        cpcPaid = myAllocation.cpc;
        // Utility = SlotCTR * (TrueValuation - CPC)
        utility = Number((slotCtr * (v_i - cpcPaid)).toFixed(4));
      }

      if (utility > maxUtility) {
        maxUtility = utility;
        bestBid = testBid;
      }

      results.push({
        bid: testBid,
        won,
        slotPosition,
        slotCtr,
        cpcPaid,
        utility,
      });
    }

    const truthfulScenario = results.find((r) => Number(r.bid) === Number(v_i));
    const truthfulUtility = truthfulScenario ? truthfulScenario.utility : maxUtility;
    const isTruthfulOptimal = results.every((r) => r.utility <= truthfulUtility + 1e-4);

    return {
      auctionType: activeMechanism,
      mechanism: activeMechanism,
      trueValuation: v_i,
      bestBid,
      maxUtility,
      truthfulUtility,
      isTruthfulOptimal,
      scenarios: results,
    };
  }

  toJSON() {
    return {
      defaultReservePrice: this.defaultReservePrice,
      currency: this.currency,
      qualityScoreWeight: this.qualityScoreWeight,
      positionCtrDecay: this.positionCtrDecay,
      defaultSlots: this.defaultSlots,
    };
  }

  static fromJSON(data) {
    if (!data) throw new Error("Invalid AuctionEngine JSON");
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return new AuctionEngine(parsed);
  }
}

export class GspAuctionEngine extends AuctionEngine {
  run(params) {
    return this.runGspAuction(params);
  }
}

export class VcgAuctionEngine extends AuctionEngine {
  run(params) {
    return this.runVcgAuction(params);
  }
}
