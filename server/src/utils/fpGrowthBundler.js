/**
 * FP-Growth (Frequent Pattern Growth) & Association Rule Mining Engine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 11 - Feature 158)
 * 
 * Vấn đề:
 * Phân tích giỏ hàng mua sắm (Market Basket Analysis) và tạo combo bán kèm (Bundle Deals/Cross-Sell)
 * là nghiệp vụ trọng tâm tăng giá trị đơn hàng trung bình (AOV - Average Order Value) trên sàn.
 * Thuật toán Apriori cổ điển gặp thắt cổ chai hiệu năng vì phải sinh tổ hợp ứng viên $O(2^C)$
 * và quét lại cơ sở dữ liệu nhiều lần.
 * 
 * Giải pháp FP-Growth (Frequent Pattern Tree):
 * 1. Nén tập dữ liệu giao dịch thành cây FP-Tree gọn gàng trong 2 lần quét:
 *    - Quét 1: Đếm tần suất đơn lẻ của các mặt hàng, lọc các mặt hàng đạt ngưỡng hỗ trợ tối thiểu (Min Support).
 *    - Quét 2: Chèn từng giỏ hàng (đã sắp xếp giảm dần theo tần suất) vào cây FP-Tree với tiền tố chia sẻ (Shared Prefix).
 * 2. Khai phá mẫu đệ quy (Recursive Divide-and-Conquer):
 *    - Duyệt từ mặt hàng có tần suất thấp nhất đến cao nhất qua Header Table.
 *    - Xây dựng Cây điều kiện (Conditional FP-Tree) từ các đường dẫn tiền tố (Prefix Paths).
 * 3. Sinh luật kết hợp (Association Rules):
 *    - Hỗ trợ (Support): $P(X \cup Y) = \text{Freq}(X \cup Y) / N$
 *    - Độ tin cậy (Confidence): $P(Y | X) = \text{Freq}(X \cup Y) / \text{Freq}(X)$
 *    - Độ nâng (Lift): $\text{Lift}(X \Rightarrow Y) = \text{Confidence}(X \Rightarrow Y) / \text{Support}(Y)$
 *    - Nếu $\text{Lift} > 1.0$: Hai mặt hàng có sự tương quan dương mạnh mẽ (thích hợp bán combo giảm giá).
 */

/**
 * Node trong cây FP-Tree
 */
export class FPNode {
  constructor(item, parent = null) {
    this.item = item;
    this.count = 1;
    this.parent = parent;
    this.children = new Map(); // item -> FPNode
    this.nodeLink = null;      // Con trỏ liên kết tới node cùng item tiếp theo trong Header Table
  }
}

/**
 * Cấu trúc cây FP-Tree nén giỏ hàng
 */
export class FPTree {
  constructor() {
    this.root = new FPNode(null);
    this.headerTable = new Map(); // item -> { count, headNode, tailNode }
  }

  addTransaction(items, count = 1) {
    let currentNode = this.root;

    for (const item of items) {
      if (currentNode.children.has(item)) {
        const child = currentNode.children.get(item);
        child.count += count;
        currentNode = child;
      } else {
        const newChild = new FPNode(item, currentNode);
        newChild.count = count;
        currentNode.children.set(item, newChild);

        // Cập nhật Header Table
        if (!this.headerTable.has(item)) {
          this.headerTable.set(item, { count: newChild.count, headNode: newChild, tailNode: newChild });
        } else {
          const header = this.headerTable.get(item);
          header.tailNode.nodeLink = newChild;
          header.tailNode = newChild;
        }

        currentNode = newChild;
      }
    }
  }

  /**
   * Trích xuất các đường dẫn tiền tố (Prefix Paths) cho một item cụ thể
   */
  getPrefixPaths(item) {
    const paths = [];
    if (!this.headerTable.has(item)) return paths;

    let currNode = this.headerTable.get(item).headNode;
    while (currNode) {
      const count = currNode.count;
      const path = [];
      let parent = currNode.parent;
      while (parent && parent.item !== null) {
        path.push(parent.item);
        parent = parent.parent;
      }

      if (path.length > 0) {
        // Đảo ngược để theo thứ tự từ gốc tới lá
        path.reverse();
        paths.push({ path, count });
      }

      currNode = currNode.nodeLink;
    }

    return paths;
  }
}

/**
 * Engine Khai phá FP-Growth và Sinh Luật Bán Kèm (Association Rule Bundler)
 */
export class FPGrowthBundler {
  constructor({ minSupport = 0.05, minConfidence = 0.4, minLift = 0.0 } = {}) {
    this.minSupport = minSupport;       // Tỷ lệ xuất hiện tối thiểu trong toàn bộ đơn hàng
    this.minConfidence = minConfidence; // Tỷ lệ khi mua X sẽ mua kèm Y
    this.minLift = typeof minLift === "number" ? minLift : 0.0; // Mặc định không chặn rule hợp lệ
    this.itemFrequency = new Map();
    this.totalTransactions = 0;
  }

  /**
   * Huấn luyện và khai phá tập mục phổ biến từ lịch sử đơn hàng
   * @param {Array<Array<string>>} transactions Danh sách các giỏ hàng (mỗi giỏ hàng là mảng các SKU/tên sản phẩm)
   */
  mine(transactions = []) {
    this.totalTransactions = transactions.length;
    if (this.totalTransactions === 0) {
      return { frequentItemsets: [], associationRules: [] };
    }

    const minSupportCount =
      this.minSupport >= 1
        ? Math.floor(this.minSupport)
        : Math.max(1, Math.ceil(this.minSupport * this.totalTransactions));

    // 1. Quét 1: Đếm tần suất đơn lẻ của từng sản phẩm
    this.itemFrequency.clear();
    for (const tx of transactions) {
      const uniqueItems = new Set(tx);
      for (const item of uniqueItems) {
        this.itemFrequency.set(item, (this.itemFrequency.get(item) || 0) + 1);
      }
    }

    // Lọc các sản phẩm đạt minSupport
    const frequentItems = new Map();
    for (const [item, count] of this.itemFrequency.entries()) {
      if (count >= minSupportCount) {
        frequentItems.set(item, count);
      }
    }

    // 2. Quét 2: Xây dựng cây FP-Tree chính
    const tree = new FPTree();
    for (const tx of transactions) {
      const filteredSorted = tx
        .filter((item) => frequentItems.has(item))
        .sort((a, b) => {
          const freqA = frequentItems.get(a);
          const freqB = frequentItems.get(b);
          if (freqB !== freqA) return freqB - freqA;
          return String(a).localeCompare(String(b));
        });

      if (filteredSorted.length > 0) {
        tree.addTransaction(filteredSorted, 1);
      }
    }

    // 3. Khai phá đệ quy các tập mục phổ biến (Frequent Itemsets)
    const frequentItemsets = [];
    this._mineFPTree(tree, [], minSupportCount, frequentItemsets);

    // 4. Sinh luật kết hợp từ các tập mục phổ biến
    const associationRules = this._generateAssociationRules(frequentItemsets);

    return {
      frequentItemsets,
      associationRules,
      metrics: {
        totalTransactions: this.totalTransactions,
        minSupportCount,
        frequentItemsetsCount: frequentItemsets.length,
        rulesCount: associationRules.length,
      },
    };
  }

  _mineFPTree(tree, prefix, minSupportCount, results) {
    const sortedItems = Array.from(tree.headerTable.keys()).sort((a, b) => {
      return (tree.headerTable.get(a).count || 0) - (tree.headerTable.get(b).count || 0);
    });

    for (const item of sortedItems) {
      const header = tree.headerTable.get(item);
      let totalCount = 0;
      let curr = header.headNode;
      while (curr) {
        totalCount += curr.count;
        curr = curr.nodeLink;
      }

      if (totalCount < minSupportCount) continue;

      const newPattern = [...prefix, item];
      results.push({
        items: newPattern,
        count: totalCount,
        support: totalCount,
        supportRatio: Number((totalCount / this.totalTransactions).toFixed(4)),
      });

      // Tạo cơ sở mẫu có điều kiện (Conditional Pattern Base)
      const prefixPaths = tree.getPrefixPaths(item);
      if (prefixPaths.length > 0) {
        const condItemFreq = new Map();
        for (const pp of prefixPaths) {
          for (const it of pp.path) {
            condItemFreq.set(it, (condItemFreq.get(it) || 0) + pp.count);
          }
        }

        const condTree = new FPTree();
        for (const pp of prefixPaths) {
          const filteredPath = pp.path
            .filter((it) => (condItemFreq.get(it) || 0) >= minSupportCount)
            .sort((a, b) => (condItemFreq.get(b) || 0) - (condItemFreq.get(a) || 0));

          if (filteredPath.length > 0) {
            condTree.addTransaction(filteredPath, pp.count);
          }
        }

        if (condTree.headerTable.size > 0) {
          this._mineFPTree(condTree, newPattern, minSupportCount, results);
        }
      }
    }
  }

  _generateAssociationRules(frequentItemsets) {
    const rules = [];
    const multiItemSets = frequentItemsets.filter((s) => s.items.length >= 2);

    const supportMap = new Map();
    for (const fis of frequentItemsets) {
      const key = [...fis.items].sort().join("|||");
      supportMap.set(key, fis.count || fis.support);
    }

    for (const itemset of multiItemSets) {
      const items = itemset.items;
      const setCount = itemset.count || itemset.support;

      const subsets = this._getSubsets(items);
      for (const antecedent of subsets) {
        if (antecedent.length === 0 || antecedent.length === items.length) continue;

        const antecedentKey = [...antecedent].sort().join("|||");
        const antecedentCount = supportMap.get(antecedentKey) || 0;
        if (antecedentCount <= 0) continue;

        const consequent = items.filter((it) => !antecedent.includes(it));
        const consequentKey = [...consequent].sort().join("|||");
        const consequentCount = supportMap.get(consequentKey) || 0;
        if (consequentCount <= 0) continue;

        const confidence = setCount / antecedentCount;
        const consequentSupportRatio = consequentCount / this.totalTransactions;
        const lift = consequentSupportRatio > 0 ? confidence / consequentSupportRatio : 1.0;

        if (confidence >= this.minConfidence && lift >= this.minLift) {
          rules.push({
            antecedent,
            consequent,
            support: setCount,
            supportRatio: Number((setCount / this.totalTransactions).toFixed(4)),
            confidence: Number(confidence.toFixed(4)),
            lift: Number(lift.toFixed(2)),
            recommendationType: lift >= 2.0 ? "COMBO_DEAL_SHOCK" : "FREQUENTLY_BOUGHT_TOGETHER",
          });
        }
      }
    }

    rules.sort((a, b) => b.lift - a.lift);
    return rules;
  }

  _getSubsets(array) {
    const result = [[]];
    for (const val of array) {
      const len = result.length;
      for (let i = 0; i < len; i++) {
        result.push([...result[i], val]);
      }
    }
    return result;
  }

  /**
   * Đề xuất sản phẩm mua kèm tốt nhất khi người mua đang có giỏ hàng hiện tại
   */
  recommendAddons(cartItems = [], rules = []) {
    const cartSet = new Set(cartItems);
    const recommendations = new Map();

    for (const rule of rules) {
      const matchesAntecedent = rule.antecedent.every((item) => cartSet.has(item));
      if (matchesAntecedent) {
        for (const target of rule.consequent) {
          if (!cartSet.has(target)) {
            if (!recommendations.has(target) || recommendations.get(target).lift < rule.lift) {
              recommendations.set(target, {
                item: target,
                confidence: rule.confidence,
                lift: rule.lift,
                type: rule.recommendationType,
              });
            }
          }
        }
      }
    }

    return Array.from(recommendations.values()).sort((a, b) => b.lift - a.lift);
  }

  /**
   * Phương thức tiện ích huấn luyện tương thích với test suite
   */
  fit(transactions = []) {
    const mined = this.mine(transactions);
    this.lastResult = mined;
    return {
      totalTransactions: mined.metrics?.totalTransactions || transactions.length,
      frequentItemsets: mined.frequentItemsets,
      rules: mined.associationRules,
    };
  }

  /**
   * Lấy danh sách các Combo Mua Kèm Deal Sốc có Lift cao nhất
   */
  getDealSocCombos({ minLift = 1.0, limit = 5 } = {}) {
    const rules = this.lastResult?.associationRules || [];
    return rules
      .filter((r) => r.lift >= minLift)
      .slice(0, limit)
      .map((r, idx) => ({
        id: `bundle_${idx + 1}`,
        bundleName: `Combo Mua Kèm: ${r.antecedent.join(" + ")} tặng Deal Sốc ${r.consequent.join(" + ")}`,
        items: [...r.antecedent, ...r.consequent],
        mainItems: r.antecedent,
        addonItems: r.consequent,
        support: r.support,
        confidence: r.confidence,
        lift: r.lift,
        discountPct: Math.min(30, Math.round(r.lift * 10)),
      }));
  }

  /**
   * Đề xuất mua kèm cho một mặt hàng hoặc giỏ hàng cụ thể
   */
  recommendAddons(itemOrCart = [], options = {}) {
    const cart = Array.isArray(itemOrCart) ? itemOrCart : [itemOrCart];
    const minLift = options.minLift ?? 1.0;
    const limit = options.limit ?? 5;
    const rules = this.lastResult?.associationRules || [];
    const recs = [];

    for (const r of rules) {
      const match = r.antecedent.some((it) => cart.includes(it));
      if (match && r.lift >= minLift) {
        for (const target of r.consequent) {
          if (!cart.includes(target) && !recs.some((rc) => rc.recommendedItem === target)) {
            recs.push({
              recommendedItem: target,
              confidence: r.confidence,
              lift: r.lift,
            });
          }
        }
      }
    }
    return recs.slice(0, limit);
  }
}

export default {
  FPNode,
  FPTree,
  FPGrowthBundler,
};
