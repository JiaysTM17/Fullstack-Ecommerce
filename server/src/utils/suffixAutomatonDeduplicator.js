/**
 * Suffix Automaton (SAM) & Longest Common Substring for Product Catalog Deduplication & SEO Stuffing Detection
 * 
 * Thuật toán Tự Động Hóa Hậu Tố Tuyến Tính Tuyệt Đối O(N) (Blumer et al.):
 * 1. Biểu diễn toàn bộ hậu tố và chuỗi con của văn bản bằng đồ thị có hướng không chu trình (DAG):
 *    - Số lượng trạng thái tối đa: 2N - 1.
 *    - Số lượng chuyển trạng thái (Transitions) tối đa: 3N - 4.
 * 2. Ứng dụng nghiệp vụ trên Mini Shopee Multi-Vendor:
 *    - Longest Common Substring (LCS) trong O(M): Phát hiện đoạn văn bản mô tả sản phẩm bị sao chép nguyên văn từng câu từ shop khác.
 *    - Nhận diện hành vi nhồi nhét từ khóa SEO (Keyword Stuffing) và gian lận sao chép bản quyền bài đăng.
 */

export class SAMState {
  constructor(len = 0, link = -1) {
    this.len = len;            // Độ dài xâu dài nhất trong trạng thái này
    this.link = link;          // Suffix link tới trạng thái cha
    this.next = new Map();     // Chuyển trạng thái char -> state_id
  }
}

export class SuffixAutomatonDeduplicator {
  /**
   * @param {string} [baseText=""] - Văn bản gốc cần lập chỉ mục SAM
   */
  constructor(baseText = "") {
    this.st = [];
    this.sz = 0;
    this.last = 0;

    this._init();
    if (baseText) {
      this.build(baseText);
    }
  }

  _init() {
    this.st = [new SAMState(0, -1)];
    this.sz = 1;
    this.last = 0;
  }

  /**
   * Thêm một ký tự vào Suffix Automaton theo thuật toán trực tuyến O(1) trung bình
   * @param {string} c
   */
  extend(c) {
    const cur = this.sz++;
    this.st.push(new SAMState(this.st[this.last].len + 1));

    let p = this.last;
    while (p !== -1 && !this.st[p].next.has(c)) {
      this.st[p].next.set(c, cur);
      p = this.st[p].link;
    }

    if (p === -1) {
      this.st[cur].link = 0;
    } else {
      const q = this.st[p].next.get(c);
      if (this.st[p].len + 1 === this.st[q].len) {
        this.st[cur].link = q;
      } else {
        const clone = this.sz++;
        this.st.push(new SAMState(this.st[p].len + 1, this.st[q].link));
        // Sao chép transitions từ q sang clone
        for (const [ch, nxt] of this.st[q].next.entries()) {
          this.st[clone].next.set(ch, nxt);
        }

        while (p !== -1 && this.st[p].next.get(c) === q) {
          this.st[p].next.set(c, clone);
          p = this.st[p].link;
        }

        this.st[q].link = clone;
        this.st[cur].link = clone;
      }
    }

    this.last = cur;
  }

  /**
   * Xây dựng Suffix Automaton từ chuỗi văn bản
   * @param {string} text
   */
  build(text) {
    this._init();
    if (!text || typeof text !== "string") return;
    for (let i = 0; i < text.length; i++) {
      this.extend(text[i]);
    }
  }

  /**
   * Kiểm tra xem chuỗi con sub có tồn tại trong văn bản gốc hay không O(|sub|)
   * @param {string} sub
   * @returns {boolean}
   */
  contains(sub) {
    if (!sub) return true;
    let curr = 0;
    for (let i = 0; i < sub.length; i++) {
      const c = sub[i];
      if (!this.st[curr].next.has(c)) return false;
      curr = this.st[curr].next.get(c);
    }
    return true;
  }

  /**
   * Tìm chuỗi con chung dài nhất (Longest Common Substring - LCS) với văn bản đối chiếu targetText O(|targetText|)
   * @param {string} targetText
   * @returns {Object} { lcsLength, lcsString, bestEndPosition }
   */
  findLongestCommonSubstring(targetText) {
    if (!targetText || typeof targetText !== "string" || this.sz <= 1) {
      return { lcsLength: 0, lcsString: "", similarityRatio: 0 };
    }

    let v = 0;
    let l = 0;
    let best = 0;
    let bestpos = 0;

    for (let i = 0; i < targetText.length; i++) {
      const c = targetText[i];
      while (v > 0 && !this.st[v].next.has(c)) {
        v = this.st[v].link;
        l = this.st[v].len;
      }

      if (this.st[v].next.has(c)) {
        v = this.st[v].next.get(c);
        l++;
      }

      if (l > best) {
        best = l;
        bestpos = i;
      }
    }

    const lcsString = targetText.substring(bestpos - best + 1, bestpos + 1);
    const similarityRatio = Number(((best / Math.max(1, targetText.length)) * 100).toFixed(1));

    return {
      lcsLength: best,
      lcsString,
      similarityRatio,
      isPlagiarized: best >= 30 || similarityRatio >= 50 // Đoạn văn trùng lặp >= 30 ký tự hoặc >= 50%
    };
  }

  /**
   * Nhận diện hành vi nhồi nhét từ khóa lặp lại (Keyword Stuffing)
   * @param {string} text - Văn bản mô tả
   * @param {string} keyword - Từ khóa nghi vấn
   * @returns {Object}
   */
  static detectKeywordStuffing(text, keyword, maxThreshold = 5) {
    if (!text || !keyword) return { count: 0, isStuffed: false };
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    return {
      keyword,
      occurrences: count,
      isStuffed: count > maxThreshold,
      recommendation: count > maxThreshold
        ? `CẢNH BÁO SEO STUFFING: Từ khóa "${keyword}" lặp lại ${count} lần bất thường! Vui lòng viết tự nhiên để tránh bị hạ điểm hiển thị.`
        : "Mật độ từ khóa đạt chuẩn tự nhiên."
    };
  }
}

export default {
  SAMState,
  SuffixAutomatonDeduplicator
};
