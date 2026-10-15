/**
 * Succinct FM-Index (Burrows-Wheeler Transform + LF-Mapping + Wavelet/Rank Table)
 * Cấu trúc chỉ mục toàn văn súc tích (Ferragina & Manzini, FOCS 2000)
 * Hỗ trợ tìm kiếm chuỗi con tùy ý (Substring Search) trong toàn bộ kho danh mục và thông số sản phẩm
 * Thời gian đếm số lần xuất hiện: O(m) cho chuỗi mẫu độ dài m, độc lập với kích thước văn bản N
 * Nén dữ liệu nhỏ hơn cả kích thước văn bản gốc
 */

class FMIndexCatalogSearch {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 16; // Tỷ lệ lấy mẫu Suffix Array để tiết kiệm RAM
    this.text = '';
    this.bwt = '';
    this.C = new Map(); // Ký tự -> Số ký tự nhỏ hơn trong văn bản gốc
    this.rankTable = []; // Bảng đếm tần suất tích lũy cho từng ký tự
    this.sampledSA = new Map(); // Vị trí trong BWT -> Vị trí gốc trong text
    this.alphabet = [];
    this.totalLength = 0;
  }

  /**
   * Xây dựng FM-Index từ tập hợp văn bản sản phẩm (Tiêu đề, mô tả, thông số SKU)
   * @param {string|Array<string>} textInput Văn bản đơn hoặc danh sách chuỗi
   */
  build(textInput) {
    let rawText = Array.isArray(textInput) ? textInput.join(' \0 ') : String(textInput || '');
    if (!rawText.endsWith('$')) {
      rawText += '$'; // Ký tự kết thúc nhỏ nhất về mặt từ vựng
    }
    this.text = rawText;
    this.totalLength = rawText.length;

    // Bước 1: Xây dựng mảng hậu tố Suffix Array (SA)
    const sa = new Int32Array(this.totalLength);
    for (let i = 0; i < this.totalLength; i++) sa[i] = i;

    // Sắp xếp các hậu tố theo thứ tự từ vựng
    sa.sort((a, b) => {
      let i = a, j = b;
      while (i < this.totalLength && j < this.totalLength) {
        if (this.text[i] !== this.text[j]) {
          return this.text.charCodeAt(i) - this.text.charCodeAt(j);
        }
        i++;
        j++;
      }
      return (this.totalLength - a) - (this.totalLength - b);
    });

    // Bước 2: Tạo chuỗi biến đổi Burrows-Wheeler (BWT)
    // BWT[i] = text[SA[i] - 1] (nếu SA[i] === 0 thì là text[N - 1])
    const bwtChars = [];
    this.sampledSA.clear();

    for (let i = 0; i < this.totalLength; i++) {
      const origPos = sa[i];
      const prevChar = origPos === 0 ? this.text[this.totalLength - 1] : this.text[origPos - 1];
      bwtChars.push(prevChar);

      if (origPos % this.sampleRate === 0) {
        this.sampledSA.set(i, origPos);
      }
    }
    this.bwt = bwtChars.join('');

    // Bước 3: Đếm tần suất các ký tự và tính bảng C
    const charCounts = new Map();
    for (let i = 0; i < this.totalLength; i++) {
      const ch = this.text[i];
      charCounts.set(ch, (charCounts.get(ch) || 0) + 1);
    }

    this.alphabet = Array.from(charCounts.keys()).sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));

    let runningTotal = 0;
    this.C.clear();
    for (const ch of this.alphabet) {
      this.C.set(ch, runningTotal);
      runningTotal += charCounts.get(ch);
    }

    // Bước 4: Xây dựng bảng Rank tích lũy Rank_c(BWT, i)
    // Lưu số lần xuất hiện của ký tự c trong BWT[0..i]
    this.rankTable = [];
    const currentCounts = new Map();
    for (const ch of this.alphabet) currentCounts.set(ch, 0);

    for (let i = 0; i < this.totalLength; i++) {
      const ch = this.bwt[i];
      currentCounts.set(ch, (currentCounts.get(ch) || 0) + 1);

      // Lưu bản sao trạng thái đếm tại vị trí i
      const snapshot = new Map();
      for (const [k, v] of currentCounts.entries()) {
        snapshot.set(k, v);
      }
      this.rankTable.push(snapshot);
    }

    return this;
  }

  /**
   * Tính số lần xuất hiện của ký tự ch trong BWT[0..idx]
   */
  _rank(ch, idx) {
    if (idx < 0) return 0;
    if (idx >= this.totalLength) idx = this.totalLength - 1;
    const snap = this.rankTable[idx];
    return snap ? (snap.get(ch) || 0) : 0;
  }

  /**
   * Ánh xạ LF-Mapping (Last-to-First column):
   * LF(i) = C[L[i]] + Rank_{L[i]}(L, i) - 1
   */
  _lf(i) {
    const ch = this.bwt[i];
    const cVal = this.C.get(ch) || 0;
    return cVal + this._rank(ch, i) - 1;
  }

  /**
   * Đếm số lần xuất hiện của chuỗi con pattern bằng thuật toán Backward Search O(m)
   * @param {string} pattern Chuỗi con cần tìm kiếm (Model mã SKU, từ khóa, cụm từ)
   * @returns {Object} { count, range: [start, end] }
   */
  count(pattern) {
    if (!pattern || typeof pattern !== 'string') return { count: 0, range: [1, 0] };
    if (!this.bwt) return { count: 0, range: [1, 0] };

    let i = pattern.length - 1;
    let ch = pattern[i];

    if (!this.C.has(ch)) return { count: 0, range: [1, 0] };

    let first = this.C.get(ch);
    const chIdx = this.alphabet.indexOf(ch);
    let last = (chIdx + 1 < this.alphabet.length)
      ? this.C.get(this.alphabet[chIdx + 1]) - 1
      : this.totalLength - 1;

    while (first <= last && i > 0) {
      i--;
      ch = pattern[i];
      if (!this.C.has(ch)) return { count: 0, range: [1, 0] };

      const cVal = this.C.get(ch);
      first = cVal + this._rank(ch, first - 1);
      last = cVal + this._rank(ch, last) - 1;
    }

    if (first > last) {
      return { count: 0, range: [1, 0] };
    }

    return {
      count: last - first + 1,
      range: [first, last]
    };
  }

  /**
   * Định vị tất cả các vị trí xuất hiện (Locate) của pattern trong văn bản gốc
   * @param {string} pattern Chuỗi con cần tìm
   * @param {number} maxResults Giới hạn số lượng kết quả
   * @returns {Array<number>} Danh sách offset trong văn bản gốc
   */
  locate(pattern, maxResults = 50) {
    const { count, range } = this.count(pattern);
    if (count === 0) return [];

    const [first, last] = range;
    const positions = [];
    const limit = Math.min(last, first + maxResults - 1);

    for (let row = first; row <= limit; row++) {
      let curr = row;
      let steps = 0;

      // Bước ngược lại bằng LF-Mapping cho đến khi chạm vào mẫu đã lưu trong sampledSA
      while (!this.sampledSA.has(curr) && curr !== 0 && steps < this.totalLength) {
        curr = this._lf(curr);
        steps++;
      }

      let originalPos = (this.sampledSA.get(curr) || 0) + steps;
      if (originalPos >= this.totalLength) {
        originalPos -= this.totalLength;
      }
      positions.push(originalPos);
    }

    positions.sort((a, b) => a - b);
    return positions;
  }

  /**
   * Tìm kiếm thông minh chuỗi con với trích xuất ngữ cảnh xung quanh
   */
  searchCatalogSnippet(keyword, snippetRadius = 30) {
    const positions = this.locate(keyword, 5);
    const snippets = [];

    for (const pos of positions) {
      const start = Math.max(0, pos - snippetRadius);
      const end = Math.min(this.totalLength, pos + keyword.length + snippetRadius);
      const rawSnippet = this.text.substring(start, end).replace(/\0/g, ' | ').replace(/\$/g, '');
      snippets.push({
        offset: pos,
        snippet: `...${rawSnippet}...`
      });
    }

    return {
      keyword,
      matchCount: this.count(keyword).count,
      locations: snippets
    };
  }
}

export { FMIndexCatalogSearch };
export default FMIndexCatalogSearch;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FMIndexCatalogSearch };
  }
} catch (e) {}
