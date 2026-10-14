/**
 * hllJaccardEstimator.js - Ước Lượng Độ Tương Đồng Jaccard & Giao Tập Hợp Luồng Bằng HyperLogLog
 * 
 * NGUYÊN LÝ TOÁN HỌC & ĐỘ PHỨC TẠP:
 * 1. Thách thức trong Big Data TMĐT:
 *    - Muốn đo lường độ trùng khớp tệp khách hàng mua sắm giữa 2 danh mục lớn (VD: Thời trang 5 triệu user,
 *      Mỹ phẩm 3 triệu user) đòi hỏi lưu trữ và giao hai tập ID khổng lồ, tiêu tốn hàng trăm MB RAM.
 * 2. Nguyên lý HLL Merge & Inclusion-Exclusion:
 *    - HLL_A đếm xấp xỉ |A|, HLL_B đếm xấp xỉ |B| chỉ với 1-2 KB bộ nhớ!
 *    - Hợp của hai tập hợp: HLL_{A union B}[j] = max(HLL_A[j], HLL_B[j]).
 *    - Số lượng phần tử hợp: |A union B| = Cardinality(HLL_{A union B}).
 *    - Số lượng phần tử giao (Inclusion-Exclusion): |A cap B| = max(0, |A| + |B| - |A union B|).
 *    - Hệ số Jaccard: J(A, B) = |A cap B| / |A union B| in [0, 1].
 */

export class HLLSketch {
  /**
   * @param {number} [p=10] - Độ chính xác bit (m = 2^p registers; p=10 -> m=1024 registers)
   */
  constructor(p = 10) {
    this.p = Math.max(4, Math.min(16, p));
    this.m = 1 << this.p;
    this.registers = new Uint8Array(this.m);

    // Hằng số alpha_m cho HyperLogLog chuẩn
    if (this.m === 16) this.alphaM = 0.673;
    else if (this.m === 32) this.alphaM = 0.697;
    else if (this.m === 64) this.alphaM = 0.709;
    else this.alphaM = 0.7213 / (1 + 1.079 / this.m);
  }

  _hash(val) {
    const str = String(val);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  add(item) {
    const x = this._hash(item);
    const j = x >>> (32 - this.p); // p bit đầu làm chỉ số register
    const w = (x << this.p) >>> 0; // các bit còn lại

    // Đếm số lượng số 0 dẫn đầu (leading zeros) + 1
    let leadingZeros = 1;
    if (w !== 0) {
      let mask = 0x80000000;
      while ((w & mask) === 0 && leadingZeros <= (32 - this.p)) {
        leadingZeros++;
        mask >>>= 1;
      }
    } else {
      leadingZeros = 32 - this.p + 1;
    }

    if (leadingZeros > this.registers[j]) {
      this.registers[j] = leadingZeros;
    }
  }

  cardinality() {
    let sum = 0;
    let zeros = 0;

    for (let i = 0; i < this.m; i++) {
      sum += Math.pow(2, -this.registers[i]);
      if (this.registers[i] === 0) zeros++;
    }

    let estimate = (this.alphaM * this.m * this.m) / sum;

    // Hiệu chỉnh tập nhỏ (Linear Counting)
    if (estimate <= 2.5 * this.m && zeros > 0) {
      estimate = this.m * Math.log(this.m / zeros);
    }

    return Math.round(estimate);
  }

  merge(other) {
    if (this.p !== other.p) {
      throw new Error("Cannot merge HLL sketches with different precision");
    }
    const merged = new HLLSketch(this.p);
    for (let i = 0; i < this.m; i++) {
      merged.registers[i] = Math.max(this.registers[i], other.registers[i]);
    }
    return merged;
  }

  clone() {
    const copy = new HLLSketch(this.p);
    copy.registers.set(this.registers);
    return copy;
  }
}

export class HLLJaccardEstimator {
  /**
   * Ước lượng độ tương đồng Jaccard giữa hai phác thảo HLL
   * @param {HLLSketch} sketchA
   * @param {HLLSketch} sketchB
   * @returns {{ jaccard: number, intersection: number, union: number, cardA: number, cardB: number }}
   */
  static estimate(sketchA, sketchB) {
    if (!sketchA || !sketchB) {
      return { jaccard: 0, intersection: 0, union: 0, cardA: 0, cardB: 0 };
    }

    const cardA = sketchA.cardinality();
    const cardB = sketchB.cardinality();

    if (cardA === 0 && cardB === 0) {
      return { jaccard: 1.0, intersection: 0, union: 0, cardA: 0, cardB: 0 };
    }

    const merged = sketchA.merge(sketchB);
    const cardUnion = merged.cardinality();

    // Inclusion-Exclusion Principle
    const rawIntersection = cardA + cardB - cardUnion;
    const cardIntersection = Math.max(0, Math.min(rawIntersection, Math.min(cardA, cardB)));

    const jaccard = cardUnion > 0 ? cardIntersection / cardUnion : 0;

    return {
      jaccard: Math.round(jaccard * 10000) / 10000,
      intersection: cardIntersection,
      union: cardUnion,
      cardA,
      cardB
    };
  }
}

export default HLLJaccardEstimator;
