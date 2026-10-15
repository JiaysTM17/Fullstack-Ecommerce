/**
 * SimHash Multi-Fingerprint Permutation Table (Manku et al., WWW 2007 - Google Search)
 * Bảng hoán vị SimHash đa khối (Permutation Blocks) tra cứu trùng lặp văn bản/catalog
 * trong Hamming Distance <= k với độ phức tạp O(1) bảng băm thay vì O(N) quét tuyến tính.
 */

class SimHashGenerator {
  /**
   * Băm chuỗi 32-bit FNV-1a
   */
  static fnv1a(str, seed = 0x811c9dc5) {
    let hval = seed;
    for (let i = 0; i < str.length; i++) {
      hval ^= str.charCodeAt(i);
      hval = Math.imul(hval, 0x01000193);
    }
    return hval >>> 0;
  }

  /**
   * Băm chuỗi 64-bit sử dụng cặp 32-bit FNV-1a với seeds khác nhau
   * Trả về định dạng Hex 16 ký tự (64 bits)
   */
  static hash64(str) {
    const high = SimHashGenerator.fnv1a(str, 0x811c9dc5);
    const low = SimHashGenerator.fnv1a(str, 0x9e3779b9);
    const highHex = high.toString(16).padStart(8, '0');
    const lowHex = low.toString(16).padStart(8, '0');
    return highHex + lowHex;
  }

  /**
   * Tạo 64-bit SimHash từ văn bản (tách từ/shingles)
   */
  static computeSimHash64(text, options = {}) {
    const { shingleSize = 2 } = options;
    if (!text || typeof text !== 'string') {
      return '0'.repeat(16);
    }

    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) {
      return '0'.repeat(16);
    }

    const shingles = [];
    for (const t of tokens) {
      shingles.push(t);
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      shingles.push(tokens[i] + ' ' + tokens[i + 1]);
    }

    // 64-bit weights accumulator
    const v = new Array(64).fill(0);

    for (const shingle of shingles) {
      const h64 = SimHashGenerator.hash64(shingle);
      const high = parseInt(h64.slice(0, 8), 16);
      const low = parseInt(h64.slice(8, 16), 16);

      for (let bit = 0; bit < 32; bit++) {
        const isHighSet = (high >>> (31 - bit)) & 1;
        v[bit] += isHighSet ? 1 : -1;

        const isLowSet = (low >>> (31 - bit)) & 1;
        v[bit + 32] += isLowSet ? 1 : -1;
      }
    }

    // Sinh fingerprint 64-bit
    let highRes = 0;
    let lowRes = 0;
    for (let bit = 0; bit < 32; bit++) {
      if (v[bit] > 0) {
        highRes = (highRes | (1 << (31 - bit))) >>> 0;
      }
      if (v[bit + 32] > 0) {
        lowRes = (lowRes | (1 << (31 - bit))) >>> 0;
      }
    }

    return highRes.toString(16).padStart(8, '0') + lowRes.toString(16).padStart(8, '0');
  }

  static popcount32(n) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return (((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }

  /**
   * Tính khoảng cách Hamming giữa 2 chuỗi Hex 64-bit (16 chars)
   */
  static hammingDistance64(hexA, hexB) {
    if (!hexA || !hexB || hexA.length !== 16 || hexB.length !== 16) {
      return 64;
    }

    const aHigh = parseInt(hexA.slice(0, 8), 16);
    const aLow = parseInt(hexA.slice(8, 16), 16);
    const bHigh = parseInt(hexB.slice(0, 8), 16);
    const bLow = parseInt(hexB.slice(8, 16), 16);

    const xorHigh = (aHigh ^ bHigh) >>> 0;
    const xorLow = (aLow ^ bLow) >>> 0;

    return SimHashGenerator.popcount32(xorHigh) + SimHashGenerator.popcount32(xorLow);
  }
}

class SimHashPermutationTable {
  constructor(options = {}) {
    const {
      numBlocks = 4, // 4 khối x 16 bit = 64 bit (Bảo đảm tìm thấy mọi cặp lệch <= 3 bit)
      maxHammingDistance = 3
    } = options;

    this.numBlocks = numBlocks;
    this.blockSize = 64 / numBlocks; // 16 bits
    this.maxHammingDistance = maxHammingDistance;

    // p bảng tra cứu tương ứng p hoán vị: permutationTables[blockIdx] = Map(blockHex -> Set(id))
    this.tables = [];
    for (let i = 0; i < this.numBlocks; i++) {
      this.tables.push(new Map());
    }

    this.fingerprintIndex = new Map(); // id -> { hex, metadata }
  }

  /**
   * Trích xuất khối thứ i (0..numBlocks-1) từ chuỗi 64-bit hex
   */
  extractBlockHex(hex64, blockIdx) {
    // 64 bit chia 4 khối => mỗi khối 16 bit = 4 ký tự hex
    const charsPerBlock = 16 / this.numBlocks;
    const start = blockIdx * charsPerBlock;
    return hex64.slice(start, start + charsPerBlock);
  }

  /**
   * Thêm fingerprint 64-bit vào các bảng hoán vị
   */
  insert(id, hex64, metadata = {}) {
    if (!hex64 || hex64.length !== 16) {
      throw new Error('Fingerprint phải là chuỗi hex 16 ký tự (64-bit)');
    }

    // Xóa vị trí cũ nếu trùng id
    if (this.fingerprintIndex.has(id)) {
      this.remove(id);
    }

    this.fingerprintIndex.set(id, { hex: hex64, metadata });

    for (let b = 0; b < this.numBlocks; b++) {
      const blockKey = this.extractBlockHex(hex64, b);
      if (!this.tables[b].has(blockKey)) {
        this.tables[b].set(blockKey, new Set());
      }
      this.tables[b].get(blockKey).add(id);
    }

    return true;
  }

  /**
   * Thêm từ văn bản thô
   */
  insertDocument(id, text, metadata = {}) {
    const hex64 = SimHashGenerator.computeSimHash64(text);
    return this.insert(id, hex64, { ...metadata, textSample: text.slice(0, 100) });
  }

  /**
   * Xóa một document/fingerprint khỏi bảng
   */
  remove(id) {
    if (!this.fingerprintIndex.has(id)) return false;
    const { hex } = this.fingerprintIndex.get(id);

    for (let b = 0; b < this.numBlocks; b++) {
      const blockKey = this.extractBlockHex(hex, b);
      const set = this.tables[b].get(blockKey);
      if (set) {
        set.delete(id);
        if (set.size === 0) {
          this.tables[b].delete(blockKey);
        }
      }
    }

    this.fingerprintIndex.delete(id);
    return true;
  }

  /**
   * Tìm kiếm các bản ghi trùng lặp gần (Near-Duplicates) với khoảng cách Hamming <= maxDistance
   * Độ phức tạp O(1) tra cứu khối + O(C) lọc ứng viên (C << N)
   */
  findDuplicates(queryHex64, maxDistance = this.maxHammingDistance) {
    if (!queryHex64 || queryHex64.length !== 16) {
      return [];
    }

    const candidateIds = new Set();

    // Tra cứu qua từng bảng hoán vị
    for (let b = 0; b < this.numBlocks; b++) {
      const blockKey = this.extractBlockHex(queryHex64, b);
      const bucket = this.tables[b].get(blockKey);
      if (bucket) {
        for (const id of bucket) {
          candidateIds.add(id);
        }
      }
    }

    const results = [];
    for (const id of candidateIds) {
      const entry = this.fingerprintIndex.get(id);
      if (entry) {
        const dist = SimHashGenerator.hammingDistance64(queryHex64, entry.hex);
        if (dist <= maxDistance) {
          results.push({
            id,
            hammingDistance: dist,
            similarityScore: Math.round(((64 - dist) / 64) * 100) / 100,
            metadata: entry.metadata
          });
        }
      }
    }

    results.sort((a, b) => a.hammingDistance - b.hammingDistance);
    return results;
  }

  /**
   * Tra cứu trùng lặp từ văn bản trực tiếp
   */
  findDuplicateDocuments(text, maxDistance = this.maxHammingDistance) {
    const queryHex = SimHashGenerator.computeSimHash64(text);
    return {
      querySimHash: queryHex,
      matches: this.findDuplicates(queryHex, maxDistance)
    };
  }

  size() {
    return this.fingerprintIndex.size;
  }
}

export {
  SimHashGenerator,
  SimHashPermutationTable
};
export default SimHashPermutationTable;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SimHashGenerator,
      SimHashPermutationTable
    };
  }
} catch (e) {}
