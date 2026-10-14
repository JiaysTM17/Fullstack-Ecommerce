/**
 * PrefixSpan (Prefix-projected Sequential Pattern Mining) for Next-In-Basket & User Journey Recommendations
 * 
 * Thuật toán PrefixSpan (Jian Pei, Jiawei Han, Mortazavi-Asl, Pinto, Chen, Dayal, Hsu - IEEE TKDE 2001/2004):
 * 1. Khai phá các chuỗi hành vi tuần tự phổ biến (Sequential Patterns) mà không cần sinh tổ hợp ứng viên khổng lồ:
 *    - Ví dụ chuỗi duyệt hàng: <(Áo Polo) -> (Quần Kaki) -> (Giày Sneaker)>.
 * 2. Kỹ thuật Chiếu Cơ Sở Dữ Liệu Theo Tiền Tố (Prefix-Projected Database):
 *    - Tìm kiếm các phần tử có độ phổ biến (Support) >= minSupport.
 *    - Chiếu cơ sở dữ liệu con (projected suffixes) sau mỗi tiền tố thường gặp để đệ quy mở rộng chuỗi.
 * 3. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Dự báo sản phẩm mua tiếp theo (Next-In-Basket Recommendation) với độ tin cậy Confidence cao.
 *    - Tối ưu hóa chuỗi phễu chuyển đổi (Conversion Funnel Analysis) và nhắc hẹn bổ sung hàng tiêu dùng (Smart Reorder).
 */

export class PrefixSpanSequentialMining {
  /**
   * @param {number} [minSupport=2]       - Ngưỡng xuất hiện tối thiểu trong các chuỗi
   * @param {number} [maxPatternLength=5] - Độ dài tối đa của chuỗi mẫu
   */
  constructor(minSupport = 2, maxPatternLength = 5) {
    this.minSupport = Math.max(1, minSupport);
    this.maxPatternLength = Math.max(1, maxPatternLength);
    this.patterns = []; // { pattern: string[], support: number }
  }

  /**
   * Khai phá tất cả các mẫu tuần tự từ tập chuỗi lịch sử người dùng
   * @param {Array<Array<string>>} sequences - Danh sách các chuỗi hành động: [["A", "B", "C"], ["A", "C"]]
   * @param {number} [minSupport]
   * @returns {Array<{ pattern: string[], support: number }>}
   */
  minePatterns(sequences = [], minSupport = this.minSupport) {
    this.minSupport = Math.max(1, minSupport);
    this.patterns = [];

    if (!Array.isArray(sequences) || sequences.length === 0) {
      return [];
    }

    // Đệ quy PrefixSpan
    this._prefixSpan([], sequences);

    // Sắp xếp theo support giảm dần và độ dài mẫu
    this.patterns.sort((a, b) => b.support - a.support || b.pattern.length - a.pattern.length);
    return this.patterns;
  }

  /**
   * Đệ quy mở rộng tiền tố với cơ sở dữ liệu chiếu
   * @private
   */
  _prefixSpan(prefix, projectedDb) {
    if (prefix.length >= this.maxPatternLength) return;

    // Đếm tần suất xuất hiện của các item tiếp theo trong projectedDb
    const itemCounts = new Map();
    for (const seq of projectedDb) {
      const seenInThisSeq = new Set();
      for (const item of seq) {
        if (!seenInThisSeq.has(item)) {
          seenInThisSeq.add(item);
          itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
        }
      }
    }

    // Lọc các item thỏa mãn minSupport
    for (const [item, count] of itemCounts.entries()) {
      if (count >= this.minSupport) {
        const newPrefix = [...prefix, item];
        this.patterns.push({
          pattern: newPrefix,
          support: count
        });

        // Tạo projected database mới sau lần xuất hiện đầu tiên của item
        const newProjectedDb = [];
        for (const seq of projectedDb) {
          const idx = seq.indexOf(item);
          if (idx !== -1 && idx + 1 < seq.length) {
            newProjectedDb.push(seq.slice(idx + 1));
          }
        }

        if (newProjectedDb.length >= this.minSupport) {
          this._prefixSpan(newPrefix, newProjectedDb);
        }
      }
    }
  }

  /**
   * Dự báo sản phẩm tiếp theo (Next-In-Basket) dựa trên lịch sử gần đây của người mua
   * @param {string[]} recentHistory - Ví dụ: ["Áo polo", "Quần âu"]
   * @param {number} [minConfidence=0.3]
   * @returns {Object|null}
   */
  predictNextItem(recentHistory = [], minConfidence = 0.3) {
    if (!Array.isArray(recentHistory) || recentHistory.length === 0 || this.patterns.length === 0) {
      return null;
    }

    const n = recentHistory.length;
    let bestCandidate = null;
    let maxScore = -1;

    // So khớp hậu tố của recentHistory với tiền tố của các pattern đã học
    for (let len = Math.min(n, this.maxPatternLength - 1); len >= 1; len--) {
      const queryPrefix = recentHistory.slice(n - len);

      // Tìm prefix support
      const prefixMatch = this.patterns.find(p =>
        p.pattern.length === queryPrefix.length &&
        p.pattern.every((val, idx) => val === queryPrefix[idx])
      );

      const prefixSupport = prefixMatch ? prefixMatch.support : 0;
      if (prefixSupport === 0) continue;

      // Tìm các pattern dài hơn 1 phần tử bắt đầu bằng queryPrefix
      for (const p of this.patterns) {
        if (p.pattern.length === queryPrefix.length + 1) {
          const startsWithPrefix = queryPrefix.every((val, idx) => val === p.pattern[idx]);
          if (startsWithPrefix) {
            const nextItem = p.pattern[p.pattern.length - 1];
            const confidence = Number((p.support / prefixSupport).toFixed(3));

            if (confidence >= minConfidence && p.support > maxScore) {
              maxScore = p.support;
              bestCandidate = {
                matchedHistory: queryPrefix,
                predictedItem: nextItem,
                confidence,
                support: p.support
              };
            }
          }
        }
      }

      if (bestCandidate) break; // Ưu tiên độ dài tiền tố khớp dài nhất
    }

    return bestCandidate;
  }

  /**
   * Trích xuất các luồng hành trình mua sắm phổ biến nhất (Top Common Journeys)
   * @param {number} [topK=5]
   * @returns {Array<Object>}
   */
  getTopJourneys(topK = 5) {
    const multiStep = this.patterns.filter(p => p.pattern.length >= 2);
    return multiStep.slice(0, topK).map(p => ({
      journey: p.pattern.join(" ➔ "),
      steps: p.pattern,
      frequency: p.support
    }));
  }
}

export default {
  PrefixSpanSequentialMining
};
