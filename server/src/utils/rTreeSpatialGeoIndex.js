/**
 * rTreeSpatialGeoIndex.js - Chỉ Mục Không Gian R-Tree Hộp Bao Cực Tiểu (MBR) Điều Phối SPX 2H
 * 
 * NGUYÊN LÝ TOÁN HỌC & CẤU TRÚC DỮ LIỆU:
 * 1. R-Tree (Antonin Guttman 1984):
 *    - Cấu trúc cây cân bằng bậc B (B-tree đa chiều) nhóm các đối tượng không gian gần nhau
 *      bằng Hộp Bao Cực Tiểu (Minimum Bounding Box - MBR: [minX, minY, maxX, maxY]).
 * 2. Phép giao cắt và tìm kiếm (Spatial Overlap Query):
 *    - Khi tìm bưu tá hoặc gian hàng trong một vùng địa lý [minLat, minLng, maxLat, maxLng],
 *      cây duyệt cắt tỉa: Nếu MBR của nút con không giao với vùng truy vấn, toàn bộ nhánh con đó bị loại bỏ.
 *    - Độ phức tạp tìm kiếm: O(log_M N) so với O(N) duyệt tuyến tính.
 * 3. Ứng dụng trong TMĐT:
 *    - Định vị các bưu tá SPX Instant đang trực chiến gần kho hàng trong bán kính 2-5km.
 *    - Phát hành mã giảm giá theo vùng địa lý khoanh vùng (Geo-fencing Vouchers).
 */

export class RTreeBoundingBox {
  constructor(minX, minY, maxX, maxY) {
    this.minX = Math.min(minX, maxX);
    this.minY = Math.min(minY, maxY);
    this.maxX = Math.max(minX, maxX);
    this.maxY = Math.max(minY, maxY);
  }

  intersects(other) {
    return !(
      this.maxX < other.minX ||
      this.minX > other.maxX ||
      this.maxY < other.minY ||
      this.minY > other.maxY
    );
  }

  containsPoint(x, y) {
    return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
  }

  expand(other) {
    return new RTreeBoundingBox(
      Math.min(this.minX, other.minX),
      Math.min(this.minY, other.minY),
      Math.max(this.maxX, other.maxX),
      Math.max(this.maxY, other.maxY)
    );
  }

  area() {
    return (this.maxX - this.minX) * (this.maxY - this.minY);
  }
}

export class RTreeNode {
  constructor(isLeaf = true) {
    this.isLeaf = isLeaf;
    this.entries = []; // Nếu leaf: [{ bbox, data }], nếu internal: [{ bbox, childNode }]
    this.bbox = null;
  }

  updateBBox() {
    if (this.entries.length === 0) {
      this.bbox = null;
      return;
    }
    let box = this.entries[0].bbox;
    for (let i = 1; i < this.entries.length; i++) {
      box = box.expand(this.entries[i].bbox);
    }
    this.bbox = box;
  }
}

export class RTreeSpatialGeoIndex {
  /**
   * @param {number} [maxEntries=8] - Bậc tối đa của nút R-tree
   * @param {number} [minEntries=4] - Bậc tối thiểu trước khi tách nhánh
   */
  constructor(maxEntries = 8, minEntries = 4) {
    this.maxEntries = Math.max(3, maxEntries);
    this.minEntries = Math.max(1, Math.min(minEntries, Math.floor(this.maxEntries / 2)));
    this.root = new RTreeNode(true);
    this._size = 0;
  }

  size() {
    return this._size;
  }

  /**
   * Thêm một điểm GPS hoặc đối tượng không gian vào R-tree
   * @param {number} x - Kinh độ hoặc Tọa độ X
   * @param {number} y - Vĩ độ hoặc Tọa độ Y
   * @param {Object} data - Dữ liệu bưu tá / shop (id, phone, status)
   */
  insertPoint(x, y, data = {}) {
    const bbox = new RTreeBoundingBox(x, y, x, y);
    this.insert(bbox, { x, y, ...data });
  }

  /**
   * Thêm một hình hộp không gian MBR vào cây
   */
  insert(bbox, data) {
    const entry = { bbox, data };
    this._size++;

    const splitNode = this._insertNode(this.root, entry);
    if (splitNode) {
      const newRoot = new RTreeNode(false);
      newRoot.entries.push({ bbox: this.root.bbox, childNode: this.root });
      newRoot.entries.push({ bbox: splitNode.bbox, childNode: splitNode });
      newRoot.updateBBox();
      this.root = newRoot;
    }
  }

  _insertNode(node, entry) {
    if (node.isLeaf) {
      node.entries.push(entry);
      node.updateBBox();
      if (node.entries.length > this.maxEntries) {
        return this._splitNode(node);
      }
      return null;
    }

    // Nút trung gian: chọn nhánh con có MBR nở rộng diện tích ít nhất
    let bestChildEntry = node.entries[0];
    let minIncrease = Infinity;

    for (const e of node.entries) {
      const enlarged = e.bbox.expand(entry.bbox);
      const increase = enlarged.area() - e.bbox.area();
      if (increase < minIncrease) {
        minIncrease = increase;
        bestChildEntry = e;
      }
    }

    const splitChild = this._insertNode(bestChildEntry.childNode, entry);
    bestChildEntry.bbox = bestChildEntry.childNode.bbox;

    if (splitChild) {
      node.entries.push({ bbox: splitChild.bbox, childNode: splitChild });
      node.updateBBox();
      if (node.entries.length > this.maxEntries) {
        return this._splitNode(node);
      }
    } else {
      node.updateBBox();
    }

    return null;
  }

  _splitNode(node) {
    const mid = Math.floor(node.entries.length / 2);
    const newNode = new RTreeNode(node.isLeaf);
    newNode.entries = node.entries.splice(mid);

    node.updateBBox();
    newNode.updateBBox();
    return newNode;
  }

  /**
   * Tìm kiếm tất cả các đối tượng nằm trong hoặc giao với hộp bao truy vấn
   * @param {RTreeBoundingBox|{ minX: number, minY: number, maxX: number, maxY: number }} queryBBox
   * @returns {Array<Object>}
   */
  search(queryBBox) {
    const box = queryBBox instanceof RTreeBoundingBox
      ? queryBBox
      : new RTreeBoundingBox(queryBBox.minX, queryBBox.minY, queryBBox.maxX, queryBBox.maxY);

    const results = [];
    const searchNode = (node) => {
      if (!node || !node.bbox || !node.bbox.intersects(box)) return;

      if (node.isLeaf) {
        for (const entry of node.entries) {
          if (entry.bbox.intersects(box)) {
            results.push(entry.data);
          }
        }
      } else {
        for (const entry of node.entries) {
          if (entry.bbox.intersects(box)) {
            searchNode(entry.childNode);
          }
        }
      }
    };

    searchNode(this.root);
    return results;
  }

  /**
   * Tìm kiếm các điểm trong bán kính Euclidean hình vuông R
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   */
  searchWithinRadius(x, y, radius) {
    const queryBox = new RTreeBoundingBox(x - radius, y - radius, x + radius, y + radius);
    const candidates = this.search(queryBox);
    const r2 = radius * radius;

    return candidates.filter(pt => {
      const dx = pt.x - x;
      const dy = pt.y - y;
      return dx * dx + dy * dy <= r2;
    });
  }

  clear() {
    this.root = new RTreeNode(true);
    this._size = 0;
  }
}

export default RTreeSpatialGeoIndex;
