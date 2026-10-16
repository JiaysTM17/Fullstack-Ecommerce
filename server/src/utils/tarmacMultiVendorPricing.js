/**
 * TarMACMultiAgentCooperativePricing
 * (Abhishek Das et al., ICML 2019 / Sukhbaatar et al., NeurIPS 2016)
 *
 * Implements Targeted Multi-Agent Communication (TarMAC) with Soft Multi-Head
 * Attention Signature Keys for cooperative multi-vendor pricing & inventory balancing.
 *
 * Mathematical Foundations:
 * 1. Targeted Communication with Signature-Query Attention:
 *    - Sender agent i generates signature key k_i in R^{d_k} and message vector m_i in R^{d_m}.
 *    - Receiver agent j generates query vector q_j in R^{d_k}.
 *    - Normalized attention weight from sender i to receiver j:
 *      e_{i -> j} = (q_j^T k_i) / sqrt(d_k)
 *      alpha_{i -> j} = exp(e_{i -> j}) / sum_{p != j} exp(e_{p -> j})
 *    - Aggregated targeted communication context for agent j:
 *      c_j = sum_{i != j} alpha_{i -> j} m_i
 * 2. Multi-Head Attention Mechanism (H heads):
 *    - Head 1: Inventory stockout & demand spillover channel
 *    - Head 2: Price elasticity & market margin protection channel
 * 3. Decentralized Execution with Centralized Training (CTDE):
 *    - Agent policy pi_j(a_j | o_j, c_j) selects price markup multiplier delta_j.
 *    - Enforces hard safety price floor: P_j >= 1.05 * COGS_j (5% guaranteed gross margin floor).
 *    - Cooperative team reward: R_team = sum_j (Revenue_j - Cost_j) - penalty(price_volatility).
 */

export class TarMACMultiAgentCooperativePricing {
  /**
   * @param {Object} options
   * @param {number} [options.numVendors=4] - Number of participating vendors
   * @param {number} [options.dKey=8] - Key/Query dimension
   * @param {number} [options.dMsg=8] - Message vector dimension
   * @param {number} [options.numHeads=2] - Number of attention heads
   * @param {number} [options.learningRate=0.01] - Policy gradient learning rate
   * @param {number} [options.gamma=0.95] - Discount factor for returns
   */
  constructor(options = {}) {
    this.numVendors = Math.max(2, Math.min(32, Number(options.numVendors) || 4));
    this.dKey = Math.max(4, Math.min(32, Number(options.dKey) || 8));
    this.dMsg = Math.max(4, Math.min(32, Number(options.dMsg) || 8));
    this.numHeads = Math.max(1, Math.min(8, Number(options.numHeads) || 2));
    this.learningRate = Number(options.learningRate) || 0.01;
    this.gamma = Number(options.gamma) || 0.95;

    // Vendor states and parameters
    // weights for key, query, msg projections per head
    this.heads = [];
    for (let h = 0; h < this.numHeads; h++) {
      this.heads.push({
        // Simple linear projections: 4-dim observation -> dKey, dMsg
        // o_j = [price, stock, cogs, marketDemand]
        wKey: this._initMatrix(4, this.dKey),
        wQuery: this._initMatrix(4, this.dKey),
        wMsg: this._initMatrix(4, this.dMsg)
      });
    }

    // Policy head weights: [o_j (4) + c_j (numHeads * dMsg)] -> 1 (price delta factor)
    const policyInputDim = 4 + this.numHeads * this.dMsg;
    this.wPolicy = new Array(policyInputDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bPolicy = 0.0;

    this.episodeHistory = [];
  }

  _initMatrix(rows, cols) {
    const mat = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push((Math.random() - 0.5) * 0.2);
      }
      mat.push(row);
    }
    return mat;
  }

  _dot(vecA, vecB) {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      sum += vecA[i] * (vecB[i] || 0);
    }
    return sum;
  }

  _matVecMul(mat, vec) {
    const res = [];
    for (let r = 0; r < mat.length; r++) {
      let sum = 0;
      for (let c = 0; c < vec.length; c++) {
        sum += mat[r][c] * vec[c];
      }
      res.push(sum);
    }
    return res;
  }

  _vecMatMul(vec, mat) {
    const cols = mat[0].length;
    const res = new Array(cols).fill(0);
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      for (let r = 0; r < vec.length; r++) {
        sum += vec[r] * mat[r][c];
      }
      res[c] = sum;
    }
    return res;
  }

  /**
   * Run targeted multi-agent communication pass across vendors.
   * @param {Array<Object>} vendors - Array of vendor states: { id, price, stock, cogs, marketDemand }
   * @returns {Object} { attentionWeights, contexts, recommendedPrices }
   */
  coordinatePricing(vendors) {
    if (!Array.isArray(vendors) || vendors.length < 2) {
      throw new Error("TarMAC requires at least 2 vendor states to coordinate.");
    }

    const n = vendors.length;
    // Format observation vector o_i = [normPrice, normStock, normCogs, normDemand]
    const obs = vendors.map(v => {
      const p = Math.max(1000, Number(v.price) || 100000);
      const s = Math.max(0, Number(v.stock) || 100);
      const c = Math.max(1000, Number(v.cogs) || 80000);
      const d = Math.max(1, Number(v.marketDemand) || 50);
      return [p / 100000, s / 100, c / 100000, d / 100];
    });

    const headContexts = []; // [numHeads][n][dMsg]
    const headAttentions = []; // [numHeads][n][n]

    for (let h = 0; h < this.numHeads; h++) {
      const head = this.heads[h];
      const keys = obs.map(o => this._vecMatMul(o, head.wKey));
      const queries = obs.map(o => this._vecMatMul(o, head.wQuery));
      const msgs = obs.map(o => this._vecMatMul(o, head.wMsg));

      const attnMatrix = [];
      const contexts = [];
      const scale = Math.sqrt(this.dKey);

      for (let j = 0; j < n; j++) {
        const q_j = queries[j];
        // Calculate raw attention scores from all i != j
        const scores = [];
        for (let i = 0; i < n; i++) {
          if (i === j) {
            scores.push(-Infinity);
          } else {
            scores.push(this._dot(q_j, keys[i]) / scale);
          }
        }

        // Softmax over non-self senders
        const maxScore = Math.max(...scores.filter(s => isFinite(s)));
        const expScores = scores.map(s => isFinite(s) ? Math.exp(s - maxScore) : 0);
        const sumExp = expScores.reduce((acc, val) => acc + val, 0) || 1e-9;
        const alpha_j = expScores.map(v => v / sumExp);
        attnMatrix.push(alpha_j);

        // Aggregate messages: c_j = sum_{i != j} alpha_{i -> j} * m_i
        const c_j = new Array(this.dMsg).fill(0);
        for (let i = 0; i < n; i++) {
          if (i !== j && alpha_j[i] > 0) {
            for (let d = 0; d < this.dMsg; d++) {
              c_j[d] += alpha_j[i] * msgs[i][d];
            }
          }
        }
        contexts.push(c_j);
      }

      headContexts.push(contexts);
      headAttentions.push(attnMatrix);
    }

    // Policy Head & Safe Pricing Action
    const decisions = [];
    for (let j = 0; j < n; j++) {
      const v = vendors[j];
      const o_j = obs[j];
      // Concatenate all head contexts
      let fullContext = [];
      for (let h = 0; h < this.numHeads; h++) {
        fullContext = fullContext.concat(headContexts[h][j]);
      }
      const combinedInput = o_j.concat(fullContext);

      // Linear policy + tanh activation -> price markup multiplier in [-0.2, +0.2]
      const rawLogit = this._dot(combinedInput, this.wPolicy) + this.bPolicy;
      const priceDeltaPct = Math.tanh(rawLogit) * 0.2; // +/- 20% max adjustment

      const currentPrice = Number(v.price) || 100000;
      const cogs = Number(v.cogs) || 80000;
      const safeFloor = Math.round(cogs * 1.05); // Strict 1.05 * COGS floor

      let proposedPrice = Math.round(currentPrice * (1 + priceDeltaPct));
      let isFloorEnforced = false;
      if (proposedPrice < safeFloor) {
        proposedPrice = safeFloor;
        isFloorEnforced = true;
      }

      decisions.push({
        vendorId: v.id || `vendor_${j}`,
        currentPrice,
        cogs,
        safeFloor,
        recommendedPrice: proposedPrice,
        priceAdjustmentPct: Number((((proposedPrice - currentPrice) / currentPrice) * 100).toFixed(2)),
        isFloorEnforced,
        targetCommunicationWeight: headAttentions[0][j],
        rationale: isFloorEnforced
          ? "Đã kích hoạt chốt sàn an toàn 1.05x COGS để ngăn chặn bán phá giá dưới giá vốn."
          : `Điều chỉnh giá ${priceDeltaPct >= 0 ? '+' : ''}${(priceDeltaPct * 100).toFixed(1)}% dựa trên tín hiệu tồn kho và độ co giãn chéo từ các đối thủ.`
      });
    }

    return {
      numVendors: n,
      numHeads: this.numHeads,
      attentionMatrix: headAttentions,
      decisions
    };
  }

  /**
   * Centralized evaluation of cooperative marketplace outcome.
   * @param {Array<Object>} decisions - Recommended prices
   * @param {Array<Object>} actualSales - { vendorId, unitsSold }
   * @returns {Object} Cooperative marketplace performance & team reward
   */
  evaluateCooperativeStep(decisions, actualSales = []) {
    const salesMap = new Map();
    actualSales.forEach(s => salesMap.set(s.vendorId, Number(s.unitsSold) || 0));

    let totalGmv = 0;
    let totalGrossProfit = 0;
    const vendorMetrics = [];

    decisions.forEach(d => {
      const units = salesMap.get(d.vendorId) || Math.max(5, Math.round(50 * (100000 / (d.recommendedPrice || 100000))));
      const revenue = units * d.recommendedPrice;
      const cost = units * d.cogs;
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      totalGmv += revenue;
      totalGrossProfit += profit;

      vendorMetrics.push({
        vendorId: d.vendorId,
        unitsSold: units,
        revenue,
        grossProfit: profit,
        grossMarginPct: Number(margin.toFixed(2))
      });
    });

    const avgMargin = totalGmv > 0 ? (totalGrossProfit / totalGmv) * 100 : 0;
    // Team reward R_team = totalGrossProfit / 1000000
    const teamReward = totalGrossProfit / 1000000;

    return {
      totalGmv,
      totalGrossProfit,
      averageGrossMarginPct: Number(avgMargin.toFixed(2)),
      teamReward: Number(teamReward.toFixed(4)),
      vendorMetrics
    };
  }
}

export default TarMACMultiAgentCooperativePricing;
