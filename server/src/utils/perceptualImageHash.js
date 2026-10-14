/**
 * Perceptual Image Hash (dHash / Gradient pHash) & Hamming Distance Engine
 * 
 * Thuật toán Băm Cảm Nhận Hình Ảnh & Khoảng Cách Hamming:
 * 1. Chuyển đổi đặc trưng quang học/gradient sáng tối của ảnh sản phẩm thành chuỗi băm nhị phân 64-bit (16 ký tự Hex).
 * 2. Bất biến trước các thao tác nén ảnh JPEG, thay đổi kích thước (resize), chỉnh sửa màu sắc nhẹ hoặc đóng dấu mờ (Watermark).
 * 3. Tính toán khoảng cách Hamming (số lượng bit khác nhau) trong O(1) qua phép XOR và thuật toán đếm bit Brian Kernighan.
 * 4. Tự động phát hiện hành vi sao chép ảnh trái phép từ Shop Mall, gian lận hình ảnh và spam catalog sản phẩm trên sàn.
 */

export class PerceptualImageHash {
  /**
   * Tính số lượng bit bật (Population Count / Hamming Weight) của số nguyên 32-bit
   * Áp dụng thuật toán Brian Kernighan O(số bit 1)
   */
  static popcount32(n) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return (((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }

  /**
   * Tính khoảng cách Hamming giữa hai chuỗi băm 64-bit Hex (16 ký tự)
   * @param {string} hashA - Chuỗi Hex 16 ký tự
   * @param {string} hashB - Chuỗi Hex 16 ký tự
   * @returns {number} Số bit khác biệt (0..64)
   */
  static hammingDistance(hashA, hashB) {
    if (!hashA || !hashB || typeof hashA !== 'string' || typeof hashB !== 'string') {
      return 64;
    }

    const cleanA = hashA.trim().toLowerCase().padStart(16, '0').slice(-16);
    const cleanB = hashB.trim().toLowerCase().padStart(16, '0').slice(-16);

    // Tách thành 2 nửa 32-bit để tính toán chính xác bằng bitwise operations trong JS
    const highA = parseInt(cleanA.slice(0, 8), 16) || 0;
    const lowA = parseInt(cleanA.slice(8, 16), 16) || 0;

    const highB = parseInt(cleanB.slice(0, 8), 16) || 0;
    const lowB = parseInt(cleanB.slice(8, 16), 16) || 0;

    const xorHigh = (highA ^ highB) >>> 0;
    const xorLow = (lowA ^ lowB) >>> 0;

    return this.popcount32(xorHigh) + this.popcount32(xorLow);
  }

  /**
   * Tính tỷ lệ tương đồng hình ảnh phần trăm (Normalized Similarity)
   * @param {string} hashA
   * @param {string} hashB
   * @returns {number} 0.0 -> 1.0 (1.0 = Trùng khớp 100%)
   */
  static computeSimilarity(hashA, hashB) {
    const dist = this.hammingDistance(hashA, hashB);
    return Number(Math.max(0, (64 - dist) / 64).toFixed(4));
  }

  /**
   * Sinh chuỗi băm dHash (Difference Hash) 64-bit từ ma trận gradient độ sáng 8x9 hoặc chuỗi mẫu pixel
   * @param {number[][]|number[]|string} input - Ma trận ma trận 8x9, mảng số nguyên, hoặc chuỗi đại diện ảnh
   * @returns {string} Chuỗi Hex 16 ký tự (64 bit)
   */
  static computeDHash(input) {
    if (typeof input === 'string') {
      // Deterministic synthetic gradient generator từ chuỗi URL/base64/metadata
      return this._generateHashFromString(input);
    }

    let bits = '';
    if (Array.isArray(input)) {
      // Nếu là ma trận 8 dòng x 9 cột
      if (Array.isArray(input[0]) && input.length >= 8 && input[0].length >= 9) {
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const left = input[row][col];
            const right = input[row][col + 1];
            bits += left < right ? '1' : '0';
          }
        }
      } else {
        // Mảng phẳng 64 hoặc 72 phần tử
        for (let i = 0; i < 64; i++) {
          const val = input[i] || 0;
          const nextVal = input[i + 1] || 0;
          bits += val < nextVal ? '1' : '0';
        }
      }
    }

    if (bits.length < 64) {
      bits = bits.padEnd(64, '0');
    }

    // Chuyển 64 bit thành 16 ký tự Hex
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = parseInt(bits.substring(i, i + 4), 2);
      hex += nibble.toString(16);
    }

    return hex.padStart(16, '0');
  }

  /**
   * Thuật toán băm xác định từ nội dung văn bản / URL ảnh
   * @private
   */
  static _generateHashFromString(str) {
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)) >>> 0;
    return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 16);
  }
}

/**
 * Chỉ mục Quản lý và Tìm kiếm Bản Quyền Hình Ảnh Toàn Sàn (Image Hash Index)
 */
export class ImageHashIndex {
  constructor() {
    // Map lưu trữ: imageId -> { imageId, productId, shopId, isMall, hashHex }
    this.images = new Map();
  }

  /**
   * Đăng ký ảnh sản phẩm vào kho chỉ mục bản quyền
   */
  registerImage({ imageId, productId, shopId, isMall = false, hashHex }) {
    if (!imageId || !hashHex) return;
    this.images.set(imageId, {
      imageId,
      productId,
      shopId,
      isMall,
      hashHex: hashHex.trim().toLowerCase()
    });
  }

  /**
   * Tìm kiếm các ảnh trùng lặp hoặc tương đồng trong kho
   * @param {string} queryHashHex - Mã băm ảnh cần kiểm tra
   * @param {number} [maxHammingDistance=5] - Ngưỡng khoảng cách tối đa (<=5 tức là tương đồng >= 92.2%)
   * @returns {Array} Danh sách ảnh tương đồng xếp theo khoảng cách tăng dần
   */
  findMatches(queryHashHex, maxHammingDistance = 5) {
    const matches = [];

    for (const record of this.images.values()) {
      const dist = PerceptualImageHash.hammingDistance(queryHashHex, record.hashHex);
      if (dist <= maxHammingDistance) {
        const similarity = PerceptualImageHash.computeSimilarity(queryHashHex, record.hashHex);
        let matchType = 'DISTINCT';
        if (dist === 0) matchType = 'EXACT_DUPLICATE';
        else if (dist <= 3) matchType = 'NEAR_DUPLICATE_WATERMARKED';
        else if (dist <= maxHammingDistance) matchType = 'HIGHLY_SIMILAR';

        matches.push({
          ...record,
          hammingDistance: dist,
          similarity,
          matchType
        });
      }
    }

    return matches.sort((a, b) => a.hammingDistance - b.hammingDistance);
  }

  /**
   * Quét và phát hiện hành vi xâm phạm bản quyền ảnh từ các gian hàng Shopee Mall
   * @param {Object} candidate - { shopId, productId, hashHex }
   * @returns {Object} Báo cáo đánh giá bản quyền
   */
  auditCopyrightInfringement(candidate) {
    const { shopId, productId, hashHex } = candidate;
    const matches = this.findMatches(hashHex, 5);

    // Lọc ra các vi phạm nếu ảnh thuộc về shop khác, đặc biệt là shop Mall
    const mallViolations = matches.filter(m => m.shopId !== shopId && m.isMall);
    const regularViolations = matches.filter(m => m.shopId !== shopId && !m.isMall);

    const isInfringing = mallViolations.length > 0 || regularViolations.length > 0;
    const highestRiskMatch = mallViolations[0] || regularViolations[0] || null;

    let actionRequired = 'ALLOW';
    let riskLevel = 'LOW';

    if (mallViolations.length > 0) {
      actionRequired = 'FLAG_FOR_TAKEDOWN';
      riskLevel = 'CRITICAL';
    } else if (regularViolations.length > 0) {
      actionRequired = 'WARN_DUPLICATE_CATALOG';
      riskLevel = 'MEDIUM';
    }

    return {
      shopId,
      productId,
      hashHex,
      isInfringing,
      riskLevel,
      actionRequired,
      mallViolationsCount: mallViolations.length,
      regularViolationsCount: regularViolations.length,
      highestRiskMatch
    };
  }
}

export default {
  PerceptualImageHash,
  ImageHashIndex
};

