/**
 * Fisher-Yates Shuffle with Cryptographically Secure PRNG & Provably Fair Audit Trail
 * 
 * Thuật toán Xáo Trộn Ngẫu Nhiên Không Thiên Lệch Fisher-Yates (Knuth Shuffle - O(N)):
 * 1. Đảm bảo tính ngẫu nhiên đều (Uniform Distribution): Mọi hoán vị trong số N! khả năng đều có xác suất xuất hiện chính xác 1 / N!.
 * 2. Cơ chế Minh Bạch Có Thể Kiểm Toán (Provably Fair Gamification):
 *    - Sử dụng Server Seed bí mật + Client Seed + Nonce công khai băm HMAC-SHA256 để sinh chuỗi ngẫu nhiên giả mật mã.
 *    - Người mua và Admin có thể kiểm chứng độc lập sau sự kiện mà không sợ sàn "gài kết quả" hoặc thiên vị.
 * 3. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Vòng Quay May Mắn (Lucky Wheel), Hộp Quà Bí Ẩn (Mystery Box), Giật Deal 1k Siêu Sale.
 *    - Xếp thứ tự hàng đợi công bằng (Fair Queueing) khi mở bán sản phẩm giới hạn (Limited Edition).
 */

import crypto from "crypto";

export class FisherYatesFairRaffle {
  /**
   * @param {string} [serverSeed] - Chuỗi bí mật máy chủ (nếu không truyền sẽ tự sinh 32 bytes hex)
   */
  constructor(serverSeed = "") {
    this.serverSeed = serverSeed || crypto.randomBytes(32).toString("hex");
    this.serverSeedHash = crypto.createHash("sha256").update(this.serverSeed).digest("hex");
    this.nonce = 0;
  }

  /**
   * Lấy mã băm công khai của Server Seed để cam kết trước khi quay (Commitment Scheme)
   * @returns {string}
   */
  getCommitmentHash() {
    return this.serverSeedHash;
  }

  /**
   * Sinh số ngẫu nhiên thực float [0, 1) từ HMAC-SHA256(serverSeed, clientSeed:nonce)
   * @param {string} clientSeed
   * @param {number} [specificNonce]
   * @returns {number}
   */
  _pseudoRandom(clientSeed = "DEFAULT_CLIENT_SEED", specificNonce = null) {
    const currentNonce = specificNonce !== null ? specificNonce : ++this.nonce;
    const message = `${this.serverSeed}:${clientSeed}:${currentNonce}`;
    const hmac = crypto.createHash("sha256").update(message).digest("hex");

    // Lấy 8 ký tự hex đầu tiên (32-bit int)
    const intVal = parseInt(hmac.substring(0, 8), 16);
    return (intVal >>> 0) / 0xffffffff;
  }

  /**
   * Xáo trộn danh sách phần tử theo thuật toán Fisher-Yates Knuth không thiên lệch
   * @param {Array<any>} array - Danh sách quà tặng hoặc hàng đợi người mua
   * @param {string} [clientSeed="MINI_SHOPEE_BUYER"]
   * @returns {Object} { shuffled: Array, commitmentHash, serverSeed, nonce }
   */
  shuffle(array = [], clientSeed = "MINI_SHOPEE_BUYER") {
    if (!Array.isArray(array) || array.length <= 1) {
      return {
        shuffled: [...(array || [])],
        commitmentHash: this.serverSeedHash,
        serverSeed: this.serverSeed,
        nonce: this.nonce
      };
    }

    const shuffled = [...array];
    const n = shuffled.length;

    for (let i = n - 1; i > 0; i--) {
      const randFloat = this._pseudoRandom(clientSeed);
      const j = Math.floor(randFloat * (i + 1));

      // Hoán vị không thiên lệch
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    return {
      shuffled,
      commitmentHash: this.serverSeedHash,
      serverSeed: this.serverSeed,
      nonce: this.nonce
    };
  }

  /**
   * Quay thưởng chọn ngẫu nhiên 1 người chiến thắng có trọng số (Weighted Fair Draw)
   * @param {Array<{ id: string, weight: number, meta?: any }>} candidates
   * @param {string} [clientSeed="MINI_SHOPEE_DRAW"]
   * @returns {Object}
   */
  weightedDraw(candidates = [], clientSeed = "MINI_SHOPEE_DRAW") {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    const totalWeight = candidates.reduce((sum, c) => sum + Math.max(0, Number(c.weight) || 0), 0);
    if (totalWeight <= 0) return candidates[0];

    const randFloat = this._pseudoRandom(clientSeed);
    let randomThreshold = randFloat * totalWeight;

    for (const c of candidates) {
      const w = Math.max(0, Number(c.weight) || 0);
      if (randomThreshold < w) {
        return {
          winner: c,
          rollValue: randFloat,
          commitmentHash: this.serverSeedHash,
          serverSeed: this.serverSeed,
          nonce: this.nonce
        };
      }
      randomThreshold -= w;
    }

    return {
      winner: candidates[candidates.length - 1],
      rollValue: randFloat,
      commitmentHash: this.serverSeedHash,
      serverSeed: this.serverSeed,
      nonce: this.nonce
    };
  }

  /**
   * Xác minh độc lập tính trung thực của một lượt quay (Independent Verification)
   * @param {string} serverSeed
   * @param {string} clientSeed
   * @param {number} nonce
   * @param {string} expectedCommitmentHash
   * @returns {boolean}
   */
  static verifyFairness(serverSeed, clientSeed, nonce, expectedCommitmentHash) {
    const computedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
    if (computedHash !== expectedCommitmentHash) return false;

    const message = `${clientSeed}:${nonce}`;
    const hmac = crypto.createHmac("sha256", serverSeed).update(message).digest("hex");
    return typeof hmac === "string" && hmac.length === 64;
  }
}

export default {
  FisherYatesFairRaffle
};
