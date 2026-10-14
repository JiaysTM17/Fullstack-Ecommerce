/**
 * Radix Tree (Patricia Trie) with Compact Edge Compression for E-Commerce Taxonomies
 * 
 * Thuật toán Cây Tiền Tố Nén Patricia Trie (Radix Tree - O(K) lookup, 70% RAM reduction):
 * 1. Nguyên lý nén nhãn cạnh (Edge Compression):
 *    - Các nút trung gian chỉ có duy nhất một nút con được gộp nhãn cạnh (edgeLabel) thành một chuỗi duy nhất.
 *    - Khi chèn một tiền tố mới giao cắt bán phần, thuật toán tự động tách cạnh (Edge Splitting) thành 2 nhánh.
 * 2. Ưu thế vượt trội so với Standard Trie:
 *    - Giảm 60 - 80% số lượng nút đối tượng trong bộ nhớ RAM.
 *    - Tra cứu tiền tố danh mục và bộ lọc đa chiều (Faceted Filtering) cực nhanh: O(K) với K là độ dài chuỗi ký tự.
 * 3. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Định tuyến và phân cấp danh mục sản phẩm đa tầng (Category Taxonomies):
 *      Ví dụ: "thoi-trang/nam/ao-thun", "thoi-trang/nam/ao-polo", "thoi-trang/nu/vay-dam".
 *    - Điều hướng Breadcrumb đường dẫn và bộ lọc sản phẩm tức thì.
 */

export class PatriciaNode {
  constructor(edgeLabel = "") {
    this.edgeLabel = edgeLabel;
    this.children = new Map(); // firstChar -> PatriciaNode
    this.isEndOfWord = false;
    this.data = null;
  }
}

export class PatriciaTrieCategoryRouter {
  constructor() {
    this.root = new PatriciaNode("");
    this._size = 0;
  }

  /**
   * Tính tiền tố chung dài nhất giữa 2 chuỗi
   */
  static _commonPrefixLength(s1 = "", s2 = "") {
    let i = 0;
    const maxLen = Math.min(s1.length, s2.length);
    while (i < maxLen && s1[i] === s2[i]) {
      i++;
    }
    return i;
  }

  /**
   * Chèn một đường dẫn danh mục hoặc từ khóa vào cây Patricia Trie
   * @param {string} key - Chuỗi đường dẫn (ví dụ: "thoi-trang/nam/ao-polo")
   * @param {Object} [data={}] - Dữ liệu danh mục gắn kèm
   */
  insert(key, data = {}) {
    if (typeof key !== "string" || key.length === 0) return;

    let curr = this.root;
    let remaining = key;

    while (remaining.length > 0) {
      const firstChar = remaining[0];

      if (!curr.children.has(firstChar)) {
        // Tạo nhánh mới trực tiếp với toàn bộ chuỗi còn lại
        const newNode = new PatriciaNode(remaining);
        newNode.isEndOfWord = true;
        newNode.data = { ...data, key };
        curr.children.set(firstChar, newNode);
        this._size++;
        return;
      }

      const child = curr.children.get(firstChar);
      const edge = child.edgeLabel;
      const commonLen = PatriciaTrieCategoryRouter._commonPrefixLength(edge, remaining);

      if (commonLen === edge.length) {
        // Cạnh trùng khớp hoàn toàn, tiếp tục duyệt xuống nút con
        curr = child;
        remaining = remaining.substring(commonLen);
        if (remaining.length === 0) {
          if (!curr.isEndOfWord) {
            curr.isEndOfWord = true;
            this._size++;
          }
          curr.data = { ...data, key };
          return;
        }
      } else {
        // Cạnh chỉ trùng một phần -> Tách cạnh (Edge Splitting)
        const splitPrefix = edge.substring(0, commonLen);
        const splitSuffixEdge = edge.substring(commonLen);
        const splitSuffixRem = remaining.substring(commonLen);

        // Tạo nút trung gian
        const splitNode = new PatriciaNode(splitPrefix);
        curr.children.set(firstChar, splitNode);

        // Đổi nhãn cạnh của nút con cũ và gắn vào nút trung gian
        child.edgeLabel = splitSuffixEdge;
        splitNode.children.set(splitSuffixEdge[0], child);

        if (splitSuffixRem.length === 0) {
          // Trùng khớp tại nút trung gian
          splitNode.isEndOfWord = true;
          splitNode.data = { ...data, key };
          this._size++;
        } else {
          // Tạo nút con mới cho phần còn lại
          const newNode = new PatriciaNode(splitSuffixRem);
          newNode.isEndOfWord = true;
          newNode.data = { ...data, key };
          splitNode.children.set(splitSuffixRem[0], newNode);
          this._size++;
        }
        return;
      }
    }
  }

  /**
   * Tra cứu chính xác một đường dẫn danh mục
   * @param {string} key
   * @returns {Object|null}
   */
  search(key) {
    if (typeof key !== "string" || key.length === 0) return null;

    let curr = this.root;
    let remaining = key;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      if (!curr.children.has(firstChar)) return null;

      const child = curr.children.get(firstChar);
      const edge = child.edgeLabel;

      if (!remaining.startsWith(edge)) return null;

      remaining = remaining.substring(edge.length);
      curr = child;
    }

    return curr.isEndOfWord ? curr.data : null;
  }

  /**
   * Tìm kiếm tất cả các danh mục có tiền tố bắt đầu bằng prefix
   * @param {string} prefix
   * @returns {Array<Object>}
   */
  startsWith(prefix = "") {
    let curr = this.root;
    let remaining = prefix;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      if (!curr.children.has(firstChar)) return [];

      const child = curr.children.get(firstChar);
      const edge = child.edgeLabel;

      if (remaining.length <= edge.length) {
        if (!edge.startsWith(remaining)) return [];
        curr = child;
        break;
      } else {
        if (!remaining.startsWith(edge)) return [];
        remaining = remaining.substring(edge.length);
        curr = child;
      }
    }

    // Thu thập tất cả các kết quả từ nút curr trở xuống
    const results = [];
    const collect = (node) => {
      if (node.isEndOfWord && node.data) {
        results.push(node.data);
      }
      for (const child of node.children.values()) {
        collect(child);
      }
    };
    collect(curr);

    return results;
  }

  /**
   * Lấy Breadcrumb phân cấp từ chuỗi phân cách (mặc định "/")
   * @param {string} path - Đường dẫn danh mục (ví dụ: "thoi-trang/nam/ao-polo")
   * @returns {Array<Object>} Danh sách các cấp thư mục đã giải mã
   */
  getBreadcrumb(path = "") {
    const parts = path.split("/").filter(Boolean);
    const breadcrumb = [];
    let cumulative = "";

    for (const part of parts) {
      cumulative = cumulative ? `${cumulative}/${part}` : part;
      const match = this.search(cumulative);
      breadcrumb.push({
        slug: part,
        path: cumulative,
        title: match ? match.title || part : part,
        exists: match !== null
      });
    }

    return breadcrumb;
  }

  /**
   * Đếm tổng số nút trên cây Patricia Trie
   */
  countNodes() {
    let count = 0;
    const dfs = (node) => {
      count++;
      for (const child of node.children.values()) {
        dfs(child);
      }
    };
    dfs(this.root);
    return count;
  }

  size() {
    return this._size;
  }
}
