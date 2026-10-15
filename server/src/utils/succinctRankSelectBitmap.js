/**
 * Succinct Rank/Select Bitmap (Jacobson 1989 / Clark 1996)
 * Cấu trúc dữ liệu bitmap súc tích hỗ trợ truy vấn Rank và Select O(1) với chi phí bộ nhớ N + o(N) bits
 * Ứng dụng: Nén chỉ mục bộ lọc sản phẩm (Freeship, Mall, Flash Sale, Danh mục) cho hàng triệu SKU
 */

class SuccinctRankSelectBitmap {
  /**
   * @param {number} size Số lượng bit cần quản lý (N)
   * @param {Object} options Cấu hình superblock và block
   */
  constructor(size = 0, options = {}) {
    this.size = Math.max(0, Number(size) || 0);
    this.wordsPerSuperblock = 16; // 16 words * 32 bits = 512 bits per superblock
    this.words = new Uint32Array(Math.ceil(this.size / 32) || 1);
    
    // Siêu khối (Superblocks) và Khối (Blocks) cho Rank-1
    this.numSuperblocks = Math.ceil(this.size / 512) || 1;
    this.superblocks = new Uint32Array(this.numSuperblocks + 1);
    this.blocks = new Uint16Array(Math.ceil(this.size / 32) + 1);

    // Select-1 sampling table
    this.selectSamplingRate = options.selectSamplingRate || 64; // Lưu vị trí sau mỗi 64 bit 1
    this.select1Table = [];
    this.totalOnes = 0;
    this.isBuilt = false;
  }

  /**
   * SWAR 32-bit popcount song song
   */
  static popcount32(x) {
    let n = x >>> 0;
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return (((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }

  /**
   * Gán giá trị bit tại chỉ số index (0 <= index < size)
   */
  set(index, value = true) {
    if (index < 0 || index >= this.size) return false;
    const wordIdx = (index / 32) | 0;
    const bitPos = index % 32;

    if (value) {
      this.words[wordIdx] |= (1 << bitPos);
    } else {
      this.words[wordIdx] &= ~(1 << bitPos);
    }
    this.isBuilt = false;
    return true;
  }

  /**
   * Đọc giá trị bit tại index
   */
  get(index) {
    if (index < 0 || index >= this.size) return false;
    const wordIdx = (index / 32) | 0;
    const bitPos = index % 32;
    return ((this.words[wordIdx] >>> bitPos) & 1) === 1;
  }

  /**
   * Xây dựng chỉ mục Rank và Select hai tầng
   */
  build() {
    let runningTotal = 0;
    let superblockTotal = 0;
    this.select1Table = [];

    const numWords = Math.ceil(this.size / 32);

    for (let w = 0; w < numWords; w++) {
      const superIdx = (w / this.wordsPerSuperblock) | 0;
      const wordWithinSuper = w % this.wordsPerSuperblock;

      if (wordWithinSuper === 0) {
        this.superblocks[superIdx] = runningTotal;
        superblockTotal = runningTotal;
      }

      // Lưu số bit 1 tương đối so với đầu superblock
      this.blocks[w] = (runningTotal - superblockTotal) & 0xFFFF;

      const wordVal = this.words[w];
      const bitsInWord = SuccinctRankSelectBitmap.popcount32(wordVal);

      // Xây dựng sampling table cho Select-1
      for (let b = 0; b < 32; b++) {
        const bitIdx = w * 32 + b;
        if (bitIdx >= this.size) break;
        if ((wordVal >>> b) & 1) {
          runningTotal++;
          if (runningTotal % this.selectSamplingRate === 1) {
            this.select1Table.push(bitIdx);
          }
        }
      }
    }

    this.totalOnes = runningTotal;
    this.superblocks[this.numSuperblocks] = runningTotal;
    this.isBuilt = true;
    return this;
  }

  /**
   * Rank1(i): Số lượng bit 1 trong khoảng [0, i] (0 <= i < size)
   * Thời gian O(1)
   */
  rank1(index) {
    if (index < 0) return 0;
    if (index >= this.size) return this.totalOnes;
    if (!this.isBuilt) this.build();

    const wordIdx = (index / 32) | 0;
    const superIdx = (wordIdx / this.wordsPerSuperblock) | 0;
    const bitPos = index % 32;

    const superCount = this.superblocks[superIdx];
    const blockCount = this.blocks[wordIdx];

    // Mặt nạ che các bit sau index trong word hiện tại
    const mask = bitPos === 31 ? 0xFFFFFFFF : (1 << (bitPos + 1)) - 1;
    const inWordCount = SuccinctRankSelectBitmap.popcount32(this.words[wordIdx] & mask);

    return superCount + blockCount + inWordCount;
  }

  /**
   * Rank0(i): Số lượng bit 0 trong khoảng [0, i]
   */
  rank0(index) {
    if (index < 0) return 0;
    if (index >= this.size) return this.size - this.totalOnes;
    return (index + 1) - this.rank1(index);
  }

  /**
   * Select1(k): Tìm vị trí xuất hiện của bit 1 thứ k (1 <= k <= totalOnes)
   * Sử dụng kết hợp sampling table và tìm kiếm nhị phân
   */
  select1(k) {
    if (k <= 0 || k > this.totalOnes) return -1;
    if (!this.isBuilt) this.build();

    // 1. Dùng sampling table thu hẹp phạm vi
    const sampleIdx = ((k - 1) / this.selectSamplingRate) | 0;
    let low = sampleIdx < this.select1Table.length ? this.select1Table[sampleIdx] : 0;
    let high = this.size - 1;

    if (sampleIdx + 1 < this.select1Table.length) {
      high = this.select1Table[sampleIdx + 1];
    }

    let ans = high;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.rank1(mid) >= k) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  /**
   * Select0(k): Tìm vị trí xuất hiện của bit 0 thứ k (1 <= k <= totalZeros)
   */
  select0(k) {
    const totalZeros = this.size - this.totalOnes;
    if (k <= 0 || k > totalZeros) return -1;
    if (!this.isBuilt) this.build();

    let low = 0;
    let high = this.size - 1;
    let ans = high;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.rank0(mid) >= k) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  /**
   * Ước lượng dung lượng bộ nhớ (Bytes) so với mảng nguyên bản
   */
  getMemoryFootprint() {
    const bitmapBytes = this.words.byteLength;
    const superblockBytes = this.superblocks.byteLength;
    const blockBytes = this.blocks.byteLength;
    const tableBytes = this.select1Table.length * 4;
    const totalBytes = bitmapBytes + superblockBytes + blockBytes + tableBytes;
    
    // So sánh với mảng JavaScript chuẩn (8 bytes mỗi số hoặc boolean)
    const rawArrayBytes = this.size * 4;
    const compressionRatio = Number((rawArrayBytes / Math.max(1, totalBytes)).toFixed(2));

    return {
      bitmapBytes,
      overheadBytes: superblockBytes + blockBytes + tableBytes,
      totalBytes,
      compressionRatio
    };
  }

  /**
   * Lọc danh mục sản phẩm kết hợp nhiều tiêu chí bitmap (Bitwise AND / OR)
   */
  static intersect(bitmapA, bitmapB) {
    const minSize = Math.min(bitmapA.size, bitmapB.size);
    const result = new SuccinctRankSelectBitmap(minSize);
    const numWords = Math.ceil(minSize / 32);

    for (let w = 0; w < numWords; w++) {
      result.words[w] = (bitmapA.words[w] & bitmapB.words[w]) >>> 0;
    }
    result.build();
    return result;
  }
}

export { SuccinctRankSelectBitmap };
export default SuccinctRankSelectBitmap;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SuccinctRankSelectBitmap };
  }
} catch (e) {}
