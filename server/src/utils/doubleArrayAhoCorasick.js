/**
 * Double-Array Aho-Corasick String Matcher (Aoe 1989 / Yata et al. 2007)
 * Cấu trúc từ điển Aho-Corasick nén thành 2 mảng phẳng 1D (BASE & CHECK)
 * Độ phức tạp: O(L + Z) tìm kiếm đồng thời hàng nghìn từ khóa nhạy cảm, vi phạm bản quyền
 * Nén bộ nhớ tới 80% so với cây Trie liên kết truyền thống
 */

class DoubleArrayAhoCorasick {
  constructor(options = {}) {
    this.initialCapacity = options.initialCapacity || 4096;
    this.base = new Int32Array(this.initialCapacity);
    this.check = new Int32Array(this.initialCapacity).fill(-1);
    this.fail = new Int32Array(this.initialCapacity);
    this.output = new Map(); // state -> Array<{ keyword, category, severity }>
    this.size = 1; // Nút gốc là 0
    this.base[0] = 1;
    this.check[0] = 0;
  }

  /**
   * Mở rộng kích thước mảng khi vượt dung lượng
   */
  _resize(minCapacity) {
    let newCap = this.base.length * 2;
    while (newCap <= minCapacity) newCap *= 2;

    const newBase = new Int32Array(newCap);
    const newCheck = new Int32Array(newCap).fill(-1);
    const newFail = new Int32Array(newCap);

    newBase.set(this.base);
    newCheck.set(this.check);
    newFail.set(this.fail);

    this.base = newBase;
    this.check = newCheck;
    this.fail = newFail;
  }

  /**
   * Xây dựng Double-Array Trie từ danh sách từ khóa nhạy cảm
   * @param {Array<Object>} patterns Danh sách [{ keyword, category, severity }]
   */
  build(patterns) {
    if (!patterns || patterns.length === 0) return this;

    // Bước 1: Dựng Trie trung gian để tính toán chuyển trạng thái
    const root = { children: new Map(), output: [] };

    for (const pat of patterns) {
      const word = (pat.keyword || pat).toLowerCase().trim();
      if (!word) continue;

      let curr = root;
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        if (!curr.children.has(charCode)) {
          curr.children.set(charCode, { children: new Map(), output: [] });
        }
        curr = curr.children.get(charCode);
      }
      curr.output.push({
        keyword: word,
        category: pat.category || 'PROHIBITED',
        severity: pat.severity || 'HIGH'
      });
    }

    // Bước 2: Chuyển Trie sang 2 mảng BASE và CHECK bằng thuật toán BFS
    const nodeQueue = [{ trieNode: root, daIndex: 0 }];
    const stateMap = new Map(); // trieNode -> daIndex
    stateMap.set(root, 0);

    while (nodeQueue.length > 0) {
      const { trieNode, daIndex } = nodeQueue.shift();
      const childrenEntries = Array.from(trieNode.children.entries());
      if (childrenEntries.length === 0) continue;

      // Tìm vị trí baseValue sao cho baseValue + charCode trống cho tất cả các con
      let baseVal = 1;
      let found = false;

      while (!found) {
        found = true;
        for (const [charCode] of childrenEntries) {
          const nextPos = baseVal + charCode;
          if (nextPos >= this.check.length) {
            this._resize(nextPos + 1);
          }
          if (this.check[nextPos] !== -1) {
            found = false;
            break;
          }
        }
        if (!found) baseVal++;
      }

      this.base[daIndex] = baseVal;

      for (const [charCode, childNode] of childrenEntries) {
        const nextPos = baseVal + charCode;
        this.check[nextPos] = daIndex;
        if (nextPos >= this.size) this.size = nextPos + 1;

        if (childNode.output.length > 0) {
          this.output.set(nextPos, [...childNode.output]);
        }

        stateMap.set(childNode, nextPos);
        nodeQueue.push({ trieNode: childNode, daIndex: nextPos });
      }
    }

    // Bước 3: Xây dựng Failure Function FAIL[s] tương tự Aho-Corasick BFS
    const failQueue = [];
    for (const [, childPos] of root.children.entries()) {
      const daPos = stateMap.get(childPos);
      this.fail[daPos] = 0; // Con của root trỏ về root
      failQueue.push(daPos);
    }

    while (failQueue.length > 0) {
      const r = failQueue.shift();

      // Duyệt tất cả các cung đi ra từ r
      const rBase = this.base[r];
      if (rBase <= 0) continue;

      for (let charCode = 0; charCode < 65536; charCode++) {
        const s = rBase + charCode;
        if (s < this.check.length && this.check[s] === r) {
          failQueue.push(s);

          // Tìm failure state cho s
          let f = this.fail[r];
          while (f > 0 && !this._hasTransition(f, charCode)) {
            f = this.fail[f];
          }

          const fallback = this._transition(f, charCode);
          this.fail[s] = fallback;

          // Hợp nhất output nếu failure state có từ khóa
          if (this.output.has(fallback)) {
            const currentOut = this.output.get(s) || [];
            this.output.set(s, currentOut.concat(this.output.get(fallback)));
          }
        }
      }
    }

    return this;
  }

  _hasTransition(state, charCode) {
    const next = this.base[state] + charCode;
    return next < this.check.length && this.check[next] === state;
  }

  _transition(state, charCode) {
    const next = this.base[state] + charCode;
    if (next < this.check.length && this.check[next] === state) {
      return next;
    }
    return state === 0 ? 0 : this._transition(this.fail[state], charCode);
  }

  /**
   * Quét và phát hiện tất cả các vi phạm từ khóa trong văn bản
   * @param {string} text Văn bản kiểm duyệt (Tiêu đề, mô tả, đánh giá)
   */
  search(text) {
    if (!text || typeof text !== 'string') return [];
    const normalized = text.toLowerCase();
    const matches = [];
    let state = 0;

    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);

      while (state > 0 && !this._hasTransition(state, charCode)) {
        state = this.fail[state];
      }

      state = this._hasTransition(state, charCode)
        ? (this.base[state] + charCode)
        : 0;

      if (this.output.has(state)) {
        for (const item of this.output.get(state)) {
          matches.push({
            keyword: item.keyword,
            category: item.category,
            severity: item.severity,
            position: i - item.keyword.length + 1
          });
        }
      }
    }

    return matches;
  }

  /**
   * Kiểm duyệt văn bản tự động và che từ ngữ vi phạm (Masking)
   */
  moderate(text, maskChar = '*') {
    const matches = this.search(text);
    if (matches.length === 0) {
      return { isClean: true, maskedText: text, violationsCount: 0, violations: [] };
    }

    let chars = text.split('');
    for (const match of matches) {
      const start = Math.max(0, match.position);
      const end = Math.min(chars.length, start + match.keyword.length);
      for (let p = start; p < end; p++) {
        chars[p] = maskChar;
      }
    }

    return {
      isClean: false,
      maskedText: chars.join(''),
      violationsCount: matches.length,
      violations: matches
    };
  }
}

export { DoubleArrayAhoCorasick };
export default DoubleArrayAhoCorasick;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DoubleArrayAhoCorasick };
  }
} catch (e) {}
