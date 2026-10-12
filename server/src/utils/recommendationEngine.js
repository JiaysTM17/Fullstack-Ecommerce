/**
 * Collaborative Filtering & Item Affinity Recommendation Engine
 * (Thuật toán Gợi ý Sản phẩm Cá nhân hóa)
 * 
 * Vấn đề:
 * Trên sàn TMĐT Shopee, việc đề xuất đúng sản phẩm người dùng cần ("Có thể bạn cũng thích"
 * và "Thường mua cùng nhau") đóng góp tới 35% tổng doanh thu GMV (Amazon/Shopee benchmark).
 * 
 * Thuật toán triển khai:
 * 1. Item-Item Co-occurrence Matrix (Ma trận đồng xuất hiện mặt hàng):
 *    Đo lường tần suất 2 sản phẩm A và B cùng xuất hiện trong 1 giỏ hàng hoặc đơn hàng.
 * 2. Jaccard & Cosine Affinity Metric:
 *    Affinity(A, B) = CoOccur(A, B) / sqrt(Occur(A) * Occur(B))
 * 3. Personalized User Recommendations:
 *    Gợi ý cho người dùng U dựa trên tập hợp sản phẩm đã xem/đã mua,
 *    loại trừ sản phẩm đã sở hữu và xếp hạng theo tổng điểm tương đồng.
 */

/**
 * Tính hệ số tương đồng Jaccard giữa 2 tập hợp
 */
export function calculateJaccardSimilarity(setA, setB) {
  if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? Number((intersection / union).toFixed(4)) : 0;
}

export class RecommendationEngine {
  constructor() {
    this.itemFrequencies = new Map(); // productId -> count
    this.cooccurrenceMatrix = new Map(); // productId -> Map(otherId -> count)
  }

  /**
   * Huấn luyện ma trận từ tập dữ liệu đơn hàng
   * @param {Array<Object>} orders - Danh sách đơn hàng với items: [{ productId, ... }]
   */
  trainFromOrders(orders = []) {
    this.itemFrequencies.clear();
    this.cooccurrenceMatrix.clear();

    for (const order of orders) {
      const items = order.items || [];
      const productIds = Array.from(new Set(items.map((i) => String(i.productId || i.id || i._id)).filter(Boolean)));

      // Cập nhật tần suất từng sản phẩm
      for (const pId of productIds) {
        this.itemFrequencies.set(pId, (this.itemFrequencies.get(pId) || 0) + 1);

        if (!this.cooccurrenceMatrix.has(pId)) {
          this.cooccurrenceMatrix.set(pId, new Map());
        }
      }

      // Cập nhật ma trận đồng xuất hiện giữa các cặp sản phẩm
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const idA = productIds[i];
          const idB = productIds[j];

          const mapA = this.cooccurrenceMatrix.get(idA);
          mapA.set(idB, (mapA.get(idB) || 0) + 1);

          const mapB = this.cooccurrenceMatrix.get(idB);
          mapB.set(idA, (mapB.get(idA) || 0) + 1);
        }
      }
    }
  }

  /**
   * Gợi ý các mặt hàng "Thường mua cùng nhau" (Frequently Bought Together)
   * @param {string|number} productId
   * @param {number} limit
   * @returns {Array<{ productId: string, score: number, cooccurCount: number }>}
   */
  getFrequentlyBoughtTogether(productId, limit = 4) {
    const targetId = String(productId);
    const cooccurMap = this.cooccurrenceMatrix.get(targetId);
    if (!cooccurMap || cooccurMap.size === 0) return [];

    const targetFreq = this.itemFrequencies.get(targetId) || 1;
    const candidates = [];

    for (const [otherId, cooccurCount] of cooccurMap.entries()) {
      if (otherId === targetId) continue;
      const otherFreq = this.itemFrequencies.get(otherId) || 1;

      // Cosine co-occurrence score: CoOccur / sqrt(FreqA * FreqB)
      const cosineAffinity = cooccurCount / Math.sqrt(targetFreq * otherFreq);

      candidates.push({
        productId: otherId,
        score: Number(cosineAffinity.toFixed(4)),
        cooccurCount,
      });
    }

    candidates.sort((a, b) => b.score - a.score || b.cooccurCount - a.cooccurCount);
    return candidates.slice(0, limit);
  }

  /**
   * Gợi ý cá nhân hóa cho Người dùng (You May Also Like)
   * @param {Array<string|number>} userHistoryProductIds - Lịch sử sản phẩm đã tương tác
   * @param {Array<Object>} allProducts - Danh mục toàn bộ sản phẩm để fallback
   * @param {number} limit
   */
  getPersonalizedRecommendations(userHistoryProductIds = [], allProducts = [], limit = 6) {
    const historySet = new Set(userHistoryProductIds.map(String));
    const scoreMap = new Map();

    for (const viewedId of historySet) {
      const related = this.getFrequentlyBoughtTogether(viewedId, limit * 2);
      for (const item of related) {
        if (!historySet.has(item.productId)) {
          const current = scoreMap.get(item.productId) || 0;
          scoreMap.set(item.productId, current + item.score);
        }
      }
    }

    const ranked = Array.from(scoreMap.entries()).map(([productId, score]) => ({
      productId,
      score: Number(score.toFixed(4)),
    }));
    ranked.sort((a, b) => b.score - a.score);

    const resultIds = ranked.slice(0, limit).map((r) => r.productId);

    // Nếu chưa đủ limit (người dùng mới / cold start), bổ sung bằng Top sản phẩm phổ biến
    if (resultIds.length < limit && allProducts.length > 0) {
      const popularProducts = [...allProducts]
        .sort((a, b) => (b.soldCount || b.sold || 0) - (a.soldCount || a.sold || 0))
        .map((p) => String(p.id || p._id))
        .filter((id) => !historySet.has(id) && !resultIds.includes(id));

      for (const pid of popularProducts) {
        if (resultIds.length >= limit) break;
        resultIds.push(pid);
      }
    }

    return resultIds;
  }
}
