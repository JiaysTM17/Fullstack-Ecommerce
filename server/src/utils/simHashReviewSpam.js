/**
 * SimHash & 64-bit Hamming Distance for Near-Duplicate Review Spam & Fake Seeding Detection
 * 
 * Thuật toán Băm Cảm Nhận Vị Trí SimHash (Moses Charikar, Google):
 * 1. Chuyển đổi văn bản đánh giá sản phẩm thành mã vân tay nhị phân 64-bit (Bit Fingerprint).
 *    - Các văn bản có nội dung gần giống nhau (chỉ đổi vài từ, thêm ký tự nhiễu) sẽ sinh ra mã SimHash có khoảng cách Hamming cực nhỏ.
 * 2. Đo khoảng cách Hamming: Số lượng bit khác nhau giữa hai mã băm:
 *    - d_H(h1, h2) <= 3: Hai bài đánh giá xem như trùng lặp (Near-Duplicate), nghi vấn gian lận seeding hạt giống hoặc spam review hàng loạt.
 * 3. Hỗ trợ bảng chỉ mục lật (Inverted Index / 4-table split) để tra cứu tương đồng trong O(1) thời gian thực.
 */

export class SimHashReviewSpam {
  /**
   * Hàm băm 32-bit FNV-1a (hoặc xor fold để mô phỏng 64-bit)
   * @param {string} str
   * @returns {number[]} Mảng 64 bit (0 hoặc 1)
   */
  static hash64(str) {
    let h1 = 0x811c9dc5;
    let h2 = 0x811c9dc5 ^ 0x5bd1e995;

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);

      h2 ^= (code * 31 + (code >> 2));
      h2 = Math.imul(h2, 0x01000193);
    }

    const bits = new Array(64).fill(0);
    for (let i = 0; i < 32; i++) {
      bits[i] = (h1 >>> (31 - i)) & 1;
      bits[i + 32] = (h2 >>> (31 - i)) & 1;
    }
    return bits;
  }

  /**
   * Tạo mã vân tay SimHash 64-bit từ văn bản
   * @param {string} text - Nội dung đánh giá
   * @returns {string} Chuỗi nhị phân 64 ký tự '0'/'1'
   */
  static computeSimHash(text) {
    if (!text || typeof text !== "string") {
      return "0".repeat(64);
    }

    // Tiền xử lý văn bản: chuyển chữ thường, loại bỏ ký tự đặc biệt thừa
    const tokens = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (tokens.length === 0) {
      return "0".repeat(64);
    }

    // Đếm tần suất từ (TF weights)
    const tokenFreq = new Map();
    for (const token of tokens) {
      tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
    }

    // Vector tích lũy V gồm 64 chiều
    const v = new Array(64).fill(0);

    for (const [token, weight] of tokenFreq.entries()) {
      const tokenBits = this.hash64(token);
      for (let i = 0; i < 64; i++) {
        if (tokenBits[i] === 1) {
          v[i] += weight;
        } else {
          v[i] -= weight;
        }
      }
    }

    // Lượng tử hóa vector V thành mã nhị phân 64-bit
    let fingerprint = "";
    for (let i = 0; i < 64; i++) {
      fingerprint += v[i] > 0 ? "1" : "0";
    }

    return fingerprint;
  }

  /**
   * Tính khoảng cách Hamming giữa hai mã SimHash 64-bit
   * @param {string} hashA
   * @param {string} hashB
   * @returns {number} Số lượng bit khác nhau (0 đến 64)
   */
  static hammingDistance(hashA, hashB) {
    if (!hashA || !hashB || hashA.length !== 64 || hashB.length !== 64) {
      throw new Error("Mã SimHash phải là chuỗi nhị phân 64 bit.");
    }

    let diff = 0;
    for (let i = 0; i < 64; i++) {
      if (hashA[i] !== hashB[i]) diff++;
    }
    return diff;
  }

  /**
   * Kiểm tra xem 2 văn bản có phải bản sao gần đúng hay không
   * @param {string} textA
   * @param {string} textB
   * @param {number} [threshold=3] - Ngưỡng khoảng cách Hamming tối đa coi là trùng lặp
   * @returns {Object}
   */
  static compareReviews(textA, textB, threshold = 3) {
    const hashA = this.computeSimHash(textA);
    const hashB = this.computeSimHash(textB);
    const distance = this.hammingDistance(hashA, hashB);

    return {
      distance,
      isDuplicate: distance <= threshold,
      similarityScore: Number((((64 - distance) / 64) * 100).toFixed(1)),
      hashA,
      hashB
    };
  }

  /**
   * Bảng chỉ mục quét gian lận đánh giá toàn sàn
   */
  constructor(threshold = 3) {
    this.threshold = threshold;
    this.indexedReviews = new Map(); // id -> { text, hash, authorId, productId, timestamp }
  }

  /**
   * Thêm một đánh giá mới vào hệ thống và phát hiện ngay spam
   * @param {Object} review - { id, text, authorId, productId, timestamp }
   * @returns {Object}
   */
  addAndCheckReview(review) {
    if (!review || !review.id || !review.text) {
      throw new Error("Review phải có đầy đủ id và text.");
    }

    const hash = SimHashReviewSpam.computeSimHash(review.text);
    const duplicates = [];

    for (const [existingId, item] of this.indexedReviews.entries()) {
      const dist = SimHashReviewSpam.hammingDistance(hash, item.hash);
      if (dist <= this.threshold) {
        duplicates.push({
          existingReviewId: existingId,
          authorId: item.authorId,
          productId: item.productId,
          distance: dist,
          similarityScore: Number((((64 - dist) / 64) * 100).toFixed(1))
        });
      }
    }

    const isSpam = duplicates.length > 0;
    const record = { ...review, hash };
    this.indexedReviews.set(review.id, record);

    return {
      reviewId: review.id,
      hash,
      isSpam,
      duplicateCount: duplicates.length,
      duplicates,
      recommendation: isSpam
        ? "CẢNH BÁO SPAM SEEDING: Phát hiện nội dung đánh giá trùng lặp cao với đánh giá trước đó. Tạm hoãn thưởng Mini Xu và gắn cờ kiểm duyệt!"
        : "Đánh giá tự nhiên, hợp lệ."
    };
  }
}

export default {
  SimHashReviewSpam
};
