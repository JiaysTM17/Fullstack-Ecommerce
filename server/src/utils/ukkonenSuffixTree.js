/**
 * Compact Suffix Tree via Ukkonen's Online Algorithm O(N) (Esko Ukkonen, Algorithmica 1995)
 * Cấu trúc Cây Hậu Tố Rút Gọn Tuyến Tính với Suffix Links và Active Point Skip-Count
 * Ứng dụng: Phát hiện mạng lưới seeding sao chép đánh giá (Review Spam Collusion)
 * Tìm kiếm Chuỗi Con Chung Dài Nhất (Longest Common Substring - LCS) giữa các bài đăng sản phẩm
 */

class SuffixNode {
  constructor(start = -1, end = null) {
    this.start = start;
    this.end = end; // Con trỏ tới end hoặc số nguyên
    this.children = new Map(); // Ký tự -> SuffixNode
    this.suffixLink = null;
    this.suffixIndex = -1; // Vị trí hậu tố trong chuỗi
  }

  edgeLength(currentEnd) {
    const endVal = typeof this.end === 'number' ? this.end : currentEnd.val;
    return endVal - this.start + 1;
  }
}

class UkkonenSuffixTree {
  constructor() {
    this.text = '';
    this.root = null;
    this.activeNode = null;
    this.activeEdge = -1;
    this.activeLength = 0;
    this.remainingSuffixCount = 0;
    this.leafEnd = { val: -1 };
    this.size = 0;
  }

  /**
   * Xây dựng Suffix Tree trong O(N) thời gian
   * @param {string} text Chuỗi văn bản
   */
  build(text) {
    if (!text || typeof text !== 'string') return this;
    let raw = text;
    if (!raw.endsWith('$')) raw += '$';
    this.text = raw;

    this.root = new SuffixNode(-1, -1);
    this.activeNode = this.root;
    this.activeEdge = -1;
    this.activeLength = 0;
    this.remainingSuffixCount = 0;
    this.leafEnd = { val: -1 };
    this.size = 1;

    for (let i = 0; i < this.text.length; i++) {
      this._extend(i);
    }

    this._setSuffixIndexByDFS(this.root, 0);
    return this;
  }

  _extend(pos) {
    this.leafEnd.val = pos;
    this.remainingSuffixCount++;
    let lastNewNode = null;

    while (this.remainingSuffixCount > 0) {
      if (this.activeLength === 0) {
        this.activeEdge = pos;
      }

      const activeChar = this.text[this.activeEdge];

      if (!this.activeNode.children.has(activeChar)) {
        // Rule 2: Tạo lá mới
        const leaf = new SuffixNode(pos, this.leafEnd);
        this.activeNode.children.set(activeChar, leaf);
        this.size++;

        if (lastNewNode !== null) {
          lastNewNode.suffixLink = this.activeNode;
          lastNewNode = null;
        }
      } else {
        const nextNode = this.activeNode.children.get(activeChar);
        const edgeLen = nextNode.edgeLength(this.leafEnd);

        // Skip-count trick
        if (this.activeLength >= edgeLen) {
          this.activeEdge += edgeLen;
          this.activeLength -= edgeLen;
          this.activeNode = nextNode;
          continue;
        }

        // Rule 3: Ký tự tiếp theo đã tồn tại trên cạnh hiện tại
        if (this.text[nextNode.start + this.activeLength] === this.text[pos]) {
          if (lastNewNode !== null && this.activeNode !== this.root) {
            lastNewNode.suffixLink = this.activeNode;
            lastNewNode = null;
          }
          this.activeLength++;
          break; // Dừng pha hiện tại
        }

        // Rule 2: Tách cạnh (Split edge)
        const split = new SuffixNode(nextNode.start, nextNode.start + this.activeLength - 1);
        this.activeNode.children.set(activeChar, split);
        this.size++;

        const leaf = new SuffixNode(pos, this.leafEnd);
        split.children.set(this.text[pos], leaf);
        this.size++;

        nextNode.start += this.activeLength;
        split.children.set(this.text[nextNode.start], nextNode);

        if (lastNewNode !== null) {
          lastNewNode.suffixLink = split;
        }
        lastNewNode = split;
      }

      this.remainingSuffixCount--;

      if (this.activeNode === this.root && this.activeLength > 0) {
        this.activeLength--;
        this.activeEdge = pos - this.remainingSuffixCount + 1;
      } else if (this.activeNode !== this.root) {
        this.activeNode = this.activeNode.suffixLink || this.root;
      }
    }
  }

  _setSuffixIndexByDFS(node, labelHeight) {
    if (!node) return;
    let isLeaf = true;

    for (const [, child] of node.children.entries()) {
      isLeaf = false;
      const edgeLen = child.edgeLength(this.leafEnd);
      this._setSuffixIndexByDFS(child, labelHeight + edgeLen);
    }

    if (isLeaf) {
      node.suffixIndex = this.text.length - labelHeight;
    }
  }

  /**
   * Kiểm tra chuỗi mẫu pattern có tồn tại trong text không
   * @param {string} pattern
   * @returns {boolean}
   */
  contains(pattern) {
    if (!pattern || !this.root) return false;
    let currNode = this.root;
    let i = 0;

    while (i < pattern.length) {
      const ch = pattern[i];
      if (!currNode.children.has(ch)) return false;

      const edgeNode = currNode.children.get(ch);
      const edgeLen = edgeNode.edgeLength(this.leafEnd);

      for (let j = 0; j < edgeLen && i < pattern.length; j++) {
        if (this.text[edgeNode.start + j] !== pattern[i]) {
          return false;
        }
        i++;
      }
      currNode = edgeNode;
    }

    return true;
  }

  /**
   * Tìm Chuỗi Con Chung Dài Nhất (Longest Common Substring - LCS) giữa 2 chuỗi
   * @param {string} s1 Chuỗi 1
   * @param {string} s2 Chuỗi 2
   */
  static findLongestCommonSubstring(s1, s2) {
    if (!s1 || !s2) return '';
    // Xây dựng Generalized Suffix Tree nối s1 + '#' + s2 + '$'
    const combined = `${s1}#${s2}$`;
    const separatorIndex = s1.length;
    const tree = new UkkonenSuffixTree();
    tree.build(combined);

    let maxLen = 0;
    let longestSub = '';

    // Hàm DFS tìm nút có hậu tố từ cả s1 và s2
    function dfs(node, currentDepth, currentStr) {
      let mask = 0; // bit 0 cho s1, bit 1 cho s2

      if (node.suffixIndex !== -1) {
        if (node.suffixIndex < separatorIndex) mask |= 1;
        else if (node.suffixIndex > separatorIndex) mask |= 2;
      }

      for (const [, child] of node.children.entries()) {
        const edgeLen = child.edgeLength(tree.leafEnd);
        const edgeChars = tree.text.substring(child.start, child.start + edgeLen);
        const childMask = dfs(child, currentDepth + edgeLen, currentStr + edgeChars);
        mask |= childMask;
      }

      // Nếu nút chứa hậu tố từ cả 2 chuỗi và không chứa ký tự phân cách '#'
      if (mask === 3) {
        const cleanStr = currentStr.split('#')[0].split('$')[0];
        if (cleanStr.length > maxLen) {
          maxLen = cleanStr.length;
          longestSub = cleanStr;
        }
      }

      return mask;
    }

    dfs(tree.root, 0, '');
    return longestSub;
  }

  /**
   * Quét và phát hiện hành vi sao chép nội dung đánh giá seeding giữa 2 tài khoản
   */
  static detectReviewPlagiarism(review1, review2, minMatchLength = 15) {
    const lcs = UkkonenSuffixTree.findLongestCommonSubstring(review1, review2);
    const len1 = review1.length || 1;
    const len2 = review2.length || 1;
    const similarity = Number(((2 * lcs.length) / (len1 + len2)).toFixed(2));

    return {
      longestCommonSubstring: lcs,
      matchLength: lcs.length,
      similarityScore: similarity,
      isCollusionDetected: lcs.length >= minMatchLength && similarity >= 0.35
    };
  }
}

export { UkkonenSuffixTree };
export default UkkonenSuffixTree;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UkkonenSuffixTree };
  }
} catch (e) {}
