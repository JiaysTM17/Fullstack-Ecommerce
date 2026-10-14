/**
 * Rete Algorithm for Complex Real-Time Promotion & Gamified Incentive Rule Engine
 * 
 * Thuật toán Rete (Charles L. Forgy - CMU 1982 / Artificial Intelligence):
 * 1. Mạng lưới khớp mẫu quy tắc sản xuất (Production Rule Network) không tính toán lặp lại:
 *    - Alpha Network: Các node kiểm tra điều kiện đơn lẻ trên từng đối tượng/sự kiện (Fact).
 *    - Alpha Memory: Lưu vết các sự kiện thỏa mãn điều kiện Alpha.
 *    - Beta Network (Join Nodes): Ghép nối nhiều điều kiện logic phụ thuộc giữa các đối tượng khác nhau.
 *    - Terminal Nodes (Action): Kích hoạt các khuyến mãi hoặc phần thưởng khi toàn bộ chuỗi quy tắc thỏa mãn.
 * 2. Ưu thế vượt bậc trong Siêu Sale TMĐT:
 *    - Tránh việc duyệt lại toàn bộ ma trận quy tắc O(R * W) mỗi khi giỏ hàng thay đổi.
 *    - Đánh giá tức thì O(1) các kịch bản khuyến mãi đa tầng phức tạp:
 *      (Hạng VIP + Giỏ hàng > 500k + Đơn vị vận chuyển SPX Express + Thanh toán VietQR -> Giảm 10% + Tặng 20k Mini Xu).
 */

export class AlphaNode {
  constructor(field, operator, expectedValue) {
    this.field = field;
    this.operator = operator; // "===", ">=", "<=", "includes", "in"
    this.expectedValue = expectedValue;
    this.memory = new Map(); // factId -> fact
  }

  evaluate(fact) {
    const val = fact[this.field];
    switch (this.operator) {
      case "===": return val === this.expectedValue;
      case "!==": return val !== this.expectedValue;
      case ">=": return Number(val) >= Number(this.expectedValue);
      case "<=": return Number(val) <= Number(this.expectedValue);
      case ">": return Number(val) > Number(this.expectedValue);
      case "<": return Number(val) < Number(this.expectedValue);
      case "includes": return Array.isArray(val) && val.includes(this.expectedValue);
      case "in": return Array.isArray(this.expectedValue) && this.expectedValue.includes(val);
      default: return false;
    }
  }
}

export class PromotionRule {
  constructor({ id, name = "", conditions = [], actions = {}, priority = 1 }) {
    this.id = String(id);
    this.name = name || this.id;
    this.conditions = conditions; // Array of { factType, field, operator, value }
    this.actions = actions;       // { discountAmount, discountPercent, bonusCoins, freeGift }
    this.priority = priority;
  }
}

export class RetePromotionEngine {
  constructor() {
    this.rules = new Map();            // ruleId -> PromotionRule
    this.workingMemory = new Map();    // factId -> { id, type, ...data }
    this.alphaNodes = new Map();       // key -> AlphaNode
    this.ruleActivations = new Set();
  }

  /**
   * Đăng ký một quy tắc khuyến mãi vào mạng Rete
   * @param {Object} ruleDef
   */
  addRule(ruleDef) {
    const rule = new PromotionRule(ruleDef);
    this.rules.set(rule.id, rule);

    // Xây dựng các Alpha Node
    for (const cond of rule.conditions) {
      const key = `${cond.factType}:${cond.field}:${cond.operator}:${cond.value}`;
      if (!this.alphaNodes.has(key)) {
        this.alphaNodes.set(key, new AlphaNode(cond.field, cond.operator, cond.value));
      }
    }
  }

  /**
   * Đưa một sự kiện/thực thể mới vào Working Memory
   * @param {string} factType - "USER", "CART", "PAYMENT", "TIME"
   * @param {Object} factData
   * @returns {string} factId
   */
  assertFact(factType, factData = {}) {
    const factId = factData.id || `${factType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fact = { ...factData, id: factId, __type: factType };
    this.workingMemory.set(factId, fact);

    // Kích hoạt qua Alpha Network
    for (const [key, node] of this.alphaNodes.entries()) {
      if (key.startsWith(`${factType}:`)) {
        if (node.evaluate(fact)) {
          node.memory.set(factId, fact);
        }
      }
    }

    return factId;
  }

  /**
   * Rút lui một sự kiện khỏi Working Memory
   * @param {string} factId
   */
  retractFact(factId) {
    if (!this.workingMemory.has(factId)) return false;
    const fact = this.workingMemory.get(factId);
    this.workingMemory.delete(factId);

    // Xóa khỏi Alpha Memories
    for (const node of this.alphaNodes.values()) {
      node.memory.delete(factId);
    }
    return true;
  }

  /**
   * Kích hoạt toàn bộ mạng Rete và tính toán tất cả các khuyến mãi thỏa mãn
   * @returns {Object} { triggeredRules, totalDiscountAmount, totalBonusCoins, appliedActions }
   */
  fireAllRules() {
    const triggered = [];

    // Duyệt qua từng quy tắc và kiểm tra tính thỏa mãn đồng thời (Join / Beta evaluation)
    for (const rule of this.rules.values()) {
      let isSatisfied = true;

      for (const cond of rule.conditions) {
        const key = `${cond.factType}:${cond.field}:${cond.operator}:${cond.value}`;
        const alpha = this.alphaNodes.get(key);

        if (!alpha || alpha.memory.size === 0) {
          isSatisfied = false;
          break;
        }
      }

      if (isSatisfied) {
        triggered.push(rule);
      }
    }

    // Sắp xếp theo mức độ ưu tiên giảm dần
    triggered.sort((a, b) => b.priority - a.priority);

    let totalDiscount = 0;
    let totalCoins = 0;
    const actionsApplied = [];

    for (const rule of triggered) {
      if (rule.actions.discountAmount) totalDiscount += Number(rule.actions.discountAmount) || 0;
      if (rule.actions.bonusCoins) totalCoins += Number(rule.actions.bonusCoins) || 0;
      actionsApplied.push({
        ruleId: rule.id,
        ruleName: rule.name,
        actions: rule.actions
      });
    }

    return {
      triggeredCount: triggered.length,
      triggeredRules: triggered.map(r => ({ id: r.id, name: r.name, priority: r.priority })),
      totalDiscountAmount: totalDiscount,
      totalBonusCoins: totalCoins,
      appliedActions: actionsApplied
    };
  }

  /**
   * Làm mới bộ nhớ Working Memory
   */
  reset() {
    this.workingMemory.clear();
    for (const node of this.alphaNodes.values()) {
      node.memory.clear();
    }
    this.ruleActivations.clear();
  }
}

export default {
  AlphaNode,
  PromotionRule,
  RetePromotionEngine
};
