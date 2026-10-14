/**
 * Heavy-Light Decomposition (HLD) on Deep Category Taxonomies
 * Thuật toán Phân Rã Cây Nặng-Nhẹ Quản Trị Cây Danh Mục Sâu Cấp Doanh Nghiệp
 * 
 * Cho phép:
 * - Cập nhật chính sách chiết khấu, thuế sàn, hoặc phụ phí trên đường đi (Path) giữa 2 danh mục bất kỳ trong O(log^2 N).
 * - Cập nhật đồng loạt toàn bộ một cây con (Subtree) chỉ trong O(log N) do cây con tương ứng với một đoạn liên tục trên mảng phẳng.
 * - Truy vấn Max / Sum / Min chính sách giữa 2 danh mục bất kỳ (u, v) trong O(log^2 N).
 * - Tìm tổ tiên chung gần nhất LCA (Lowest Common Ancestor) trong O(log N).
 */

class SegmentTree {
  constructor(size) {
    this.n = size;
    this.treeMax = new Float64Array(4 * Math.max(1, size));
    this.lazy = new Float64Array(4 * Math.max(1, size));
  }

  _push(node) {
    if (this.lazy[node] !== 0) {
      const val = this.lazy[node];
      this.lazy[2 * node] += val;
      this.treeMax[2 * node] += val;
      this.lazy[2 * node + 1] += val;
      this.treeMax[2 * node + 1] += val;
      this.lazy[node] = 0;
    }
  }

  updateRange(node, start, end, l, r, val) {
    if (l > end || r < start) return;
    if (l <= start && end <= r) {
      this.treeMax[node] += val;
      this.lazy[node] += val;
      return;
    }
    this._push(node);
    const mid = Math.floor((start + end) / 2);
    this.updateRange(2 * node, start, mid, l, r, val);
    this.updateRange(2 * node + 1, mid + 1, end, l, r, val);
    this.treeMax[node] = Math.max(this.treeMax[2 * node], this.treeMax[2 * node + 1]);
  }

  queryRange(node, start, end, l, r) {
    if (l > end || r < start) return -Infinity;
    if (l <= start && end <= r) return this.treeMax[node];
    this._push(node);
    const mid = Math.floor((start + end) / 2);
    const leftVal = this.queryRange(2 * node, start, mid, l, r);
    const rightVal = this.queryRange(2 * node + 1, mid + 1, end, l, r);
    return Math.max(leftVal, rightVal);
  }
}

export class HeavyLightDecompositionTaxonomy {
  constructor() {
    this.nodes = new Map(); // id -> Node
    this.adj = new Map();   // id -> Array<id>
    this.rootId = null;
    this.built = false;

    // HLD properties
    this.parent = new Map();
    this.depth = new Map();
    this.size = new Map();
    this.heavy = new Map();
    this.head = new Map();
    this.pos = new Map();
    this.nodeAtPos = [];
    this.curPos = 0;
    this.segTree = null;
  }

  /**
   * Thêm một danh mục vào cây phân cấp
   * @param {string} id - Mã định danh danh mục (ví dụ: "CAT_TECH_LAPTOP")
   * @param {string} name - Tên danh mục (ví dụ: "Laptop & Máy Tính")
   * @param {string|null} [parentId=null] - Mã danh mục cha (null nếu là Root)
   * @param {number} [initialFeeRate=0] - Phí sàn hoặc tỷ lệ thuế mặc định (ví dụ: 0.05)
   */
  addCategory(id, name, parentId = null, initialFeeRate = 0) {
    this.nodes.set(id, {
      id,
      name,
      parentId,
      feeRate: Number(initialFeeRate) || 0
    });

    if (!this.adj.has(id)) {
      this.adj.set(id, []);
    }

    if (parentId === null) {
      this.rootId = id;
    } else {
      if (!this.adj.has(parentId)) {
        this.adj.set(parentId, []);
      }
      this.adj.get(parentId).push(id);
    }
    this.built = false;
  }

  /**
   * Xây dựng cấu trúc HLD (Heavy-Light Decomposition)
   */
  build() {
    if (!this.rootId && this.nodes.size > 0) {
      // Tìm node không có parent hoặc lấy node đầu tiên
      for (const [id, node] of this.nodes.entries()) {
        if (!node.parentId || !this.nodes.has(node.parentId)) {
          this.rootId = id;
          break;
        }
      }
    }

    if (!this.rootId) return;

    this.curPos = 0;
    this.nodeAtPos = new Array(this.nodes.size);

    // DFS 1: Tính kích thước cây con size, độ sâu depth, và xác định con nặng heavy child
    this._dfsSize(this.rootId, null, 0);

    // DFS 2: Phân rã chuỗi xích nặng (Heavy Chains) và ánh xạ vị trí mảng phẳng pos
    this._dfsHld(this.rootId, this.rootId);

    // Khởi tạo Segment Tree trên mảng phẳng
    this.segTree = new SegmentTree(this.nodes.size);
    for (const [id, node] of this.nodes.entries()) {
      const p = this.pos.get(id);
      if (p !== undefined && node.feeRate !== 0) {
        this.segTree.updateRange(1, 0, this.nodes.size - 1, p, p, node.feeRate);
      }
    }

    this.built = true;
  }

  _dfsSize(u, p, d) {
    this.parent.set(u, p);
    this.depth.set(u, d);
    this.size.set(u, 1);
    this.heavy.set(u, null);

    let maxChildSize = 0;
    const children = this.adj.get(u) || [];

    for (const v of children) {
      if (v === p) continue;
      this._dfsSize(v, u, d + 1);
      const subSize = this.size.get(v);
      this.size.set(u, this.size.get(u) + subSize);

      if (subSize > maxChildSize) {
        maxChildSize = subSize;
        this.heavy.set(u, v);
      }
    }
  }

  _dfsHld(u, h) {
    this.head.set(u, h);
    this.pos.set(u, this.curPos);
    this.nodeAtPos[this.curPos] = u;
    this.curPos++;

    // Ưu tiên duyệt con nặng (heavy child) trước để giữ tính liên tục trên mảng phẳng
    const heavyChild = this.heavy.get(u);
    if (heavyChild) {
      this._dfsHld(heavyChild, h);
    }

    // Sau đó duyệt các con nhẹ (light children), mỗi con nhẹ bắt đầu một Heavy Chain mới
    const children = this.adj.get(u) || [];
    for (const v of children) {
      if (v !== this.parent.get(u) && v !== heavyChild) {
        this._dfsHld(v, v);
      }
    }
  }

  _ensureBuilt() {
    if (!this.built) {
      this.build();
    }
  }

  /**
   * Cập nhật phí/chiết khấu cho toàn bộ cây con gốc rootId trong O(log N)
   * (Vì cây con tương ứng với một đoạn liên tục [pos[u], pos[u] + size[u] - 1])
   * @param {string} rootId - Mã danh mục gốc
   * @param {number} deltaFee - Mức tăng/giảm phí
   */
  updateSubtree(rootId, deltaFee) {
    this._ensureBuilt();
    if (!this.pos.has(rootId)) return;

    const p = this.pos.get(rootId);
    const sz = this.size.get(rootId);
    this.segTree.updateRange(1, 0, this.nodes.size - 1, p, p + sz - 1, deltaFee);
  }

  /**
   * Truy vấn giá trị phí/thuộc tính lớn nhất trong cây con gốc rootId trong O(log N)
   * @param {string} rootId
   * @returns {number}
   */
  querySubtreeMax(rootId) {
    this._ensureBuilt();
    if (!this.pos.has(rootId)) return 0;

    const p = this.pos.get(rootId);
    const sz = this.size.get(rootId);
    const res = this.segTree.queryRange(1, 0, this.nodes.size - 1, p, p + sz - 1);
    return res === -Infinity ? 0 : Number(res.toFixed(4));
  }

  /**
   * Cập nhật phí/chiết khấu trên đường đi giữa 2 danh mục u và v trong O(log^2 N)
   * @param {string} u
   * @param {string} v
   * @param {number} deltaFee
   */
  updatePath(u, v, deltaFee) {
    this._ensureBuilt();
    if (!this.pos.has(u) || !this.pos.has(v)) return;

    let currU = u;
    let currV = v;

    while (this.head.get(currU) !== this.head.get(currV)) {
      if (this.depth.get(this.head.get(currU)) > this.depth.get(this.head.get(currV))) {
        const h = this.head.get(currU);
        this.segTree.updateRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currU), deltaFee);
        currU = this.parent.get(h);
      } else {
        const h = this.head.get(currV);
        this.segTree.updateRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currV), deltaFee);
        currV = this.parent.get(h);
      }
    }

    // Khi cả 2 đã cùng nằm trên một Heavy Chain
    const pU = this.pos.get(currU);
    const pV = this.pos.get(currV);
    this.segTree.updateRange(1, 0, this.nodes.size - 1, Math.min(pU, pV), Math.max(pU, pV), deltaFee);
  }

  /**
   * Truy vấn giá trị lớn nhất trên đường đi giữa 2 danh mục u và v trong O(log^2 N)
   * @param {string} u
   * @param {string} v
   * @returns {number}
   */
  queryPathMax(u, v) {
    this._ensureBuilt();
    if (!this.pos.has(u) || !this.pos.has(v)) return 0;

    let currU = u;
    let currV = v;
    let maxVal = -Infinity;

    while (this.head.get(currU) !== this.head.get(currV)) {
      if (this.depth.get(this.head.get(currU)) > this.depth.get(this.head.get(currV))) {
        const h = this.head.get(currU);
        const val = this.segTree.queryRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currU));
        maxVal = Math.max(maxVal, val);
        currU = this.parent.get(h);
      } else {
        const h = this.head.get(currV);
        const val = this.segTree.queryRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currV));
        maxVal = Math.max(maxVal, val);
        currV = this.parent.get(h);
      }
    }

    const pU = this.pos.get(currU);
    const pV = this.pos.get(currV);
    const val = this.segTree.queryRange(1, 0, this.nodes.size - 1, Math.min(pU, pV), Math.max(pU, pV));
    maxVal = Math.max(maxVal, val);

    return maxVal === -Infinity ? 0 : Number(maxVal.toFixed(4));
  }

  /**
   * Tìm tổ tiên chung gần nhất LCA (Lowest Common Ancestor) trong O(log N)
   * @param {string} u
   * @param {string} v
   * @returns {string|null}
   */
  getLCA(u, v) {
    this._ensureBuilt();
    if (!this.pos.has(u) || !this.pos.has(v)) return null;

    let currU = u;
    let currV = v;

    while (this.head.get(currU) !== this.head.get(currV)) {
      if (this.depth.get(this.head.get(currU)) > this.depth.get(this.head.get(currV))) {
        currU = this.parent.get(this.head.get(currU));
      } else {
        currV = this.parent.get(this.head.get(currV));
      }
    }

    return this.depth.get(currU) < this.depth.get(currV) ? currU : currV;
  }

  /**
   * Lấy đường đi danh mục dạng Breadcrumb từ Root đến node u
   * @param {string} u
   * @returns {Array<{id: string, name: string}>}
   */
  getBreadcrumb(u) {
    this._ensureBuilt();
    if (!this.nodes.has(u)) return [];

    const path = [];
    let curr = u;
    while (curr) {
      const node = this.nodes.get(curr);
      if (node) path.unshift({ id: node.id, name: node.name });
      curr = this.parent.get(curr);
    }
    return path;
  }
}

export default HeavyLightDecompositionTaxonomy;
