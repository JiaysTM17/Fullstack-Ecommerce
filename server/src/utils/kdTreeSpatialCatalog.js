/**
 * K-D Tree (K-Dimensional Tree) for Multi-Attribute Geo & Pricing Radius Search
 * Cấu Trúc Cây K-D Tìm Kiếm Không Gian Đa Chiều (Tọa Độ GPS, Mức Giá, Điểm Đánh Giá)
 * 
 * Nguyên lý:
 * - Cây nhị phân phân tách không gian k-chiều bằng các siêu phẳng trực giao luân phiên
 *   theo từng trục tọa độ (Axis = depth % k).
 * - Cung cấp 2 phép toán cốt lõi với thời gian kỳ vọng O(log N):
 *   1. K-Nearest Neighbors (K-NN): Tìm K cửa hàng / sản phẩm gần nhất theo khoảng cách không gian.
 *   2. Hyper-Rectangle Range Search: Lọc đồng thời các tiêu chí (Vĩ độ Lat, Kinh độ Lon, Giá bán Price, Điểm uy tín Rating).
 *   3. Geo Radius Search: Tìm nhanh các gian hàng xung quanh người mua trong bán kính R km kết hợp khoảng giá.
 */

class KDNode {
  constructor(point, data, axis) {
    this.point = point;   // Array<number> [lat, lon, price, rating]
    this.data = data;     // Object (item/shop details)
    this.axis = axis;     // Trục phân tách hiện tại (0..k-1)
    this.left = null;
    this.right = null;
  }
}

export class KDTreeSpatialCatalog {
  /**
   * @param {Array<string>} [dimensions=['lat', 'lon', 'price', 'rating']] - Danh sách các thuộc tính chiều
   */
  constructor(dimensions = ['lat', 'lon', 'price', 'rating']) {
    this.dimensions = dimensions;
    this.k = dimensions.length;
    this.root = null;
    this.size = 0;
  }

  static calculateHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Xây dựng cây K-D từ mảng các phần tử
   * @param {Array<Object>} items
   */
  build(items = []) {
    this.size = items.length;
    const formatted = items.map(item => {
      const point = this.dimensions.map(dim => Number(item[dim]) || 0);
      return { point, data: item };
    });

    this.root = this._buildTree(formatted, 0);
  }

  _buildTree(points, depth) {
    if (points.length === 0) return null;

    const axis = depth % this.k;
    // Sắp xếp theo trục hiện tại và chọn phần tử trung vị (Median)
    points.sort((a, b) => a.point[axis] - b.point[axis]);
    const medianIdx = Math.floor(points.length / 2);
    const median = points[medianIdx];

    const node = new KDNode(median.point, median.data, axis);
    node.left = this._buildTree(points.slice(0, medianIdx), depth + 1);
    node.right = this._buildTree(points.slice(medianIdx + 1), depth + 1);

    return node;
  }

  /**
   * Thêm một phần tử vào cây K-D
   * @param {Object} item
   */
  insert(item) {
    const point = this.dimensions.map(dim => Number(item[dim]) || 0);
    const newNode = new KDNode(point, item, 0);

    if (!this.root) {
      this.root = newNode;
      this.size++;
      return;
    }

    let curr = this.root;
    let depth = 0;

    while (true) {
      const axis = depth % this.k;
      if (point[axis] < curr.point[axis]) {
        if (!curr.left) {
          newNode.axis = (depth + 1) % this.k;
          curr.left = newNode;
          this.size++;
          break;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          newNode.axis = (depth + 1) % this.k;
          curr.right = newNode;
          this.size++;
          break;
        }
        curr = curr.right;
      }
      depth++;
    }
  }

  /**
   * Truy vấn tìm kiếm vùng hộp siêu chữ nhật (Hyper-Rectangle Range Search)
   * @param {Array<number>} minBounds - Cận dưới cho từng chiều [minLat, minLon, minPrice, minRating]
   * @param {Array<number>} maxBounds - Cận trên cho từng chiều [maxLat, maxLon, maxPrice, maxRating]
   * @returns {Array<Object>}
   */
  rangeSearch(minBounds, maxBounds) {
    const results = [];
    this._rangeSearch(this.root, minBounds, maxBounds, 0, results);
    return results;
  }

  _rangeSearch(node, minBounds, maxBounds, depth, results) {
    if (!node) return;

    // Kiểm tra xem node hiện tại có nằm trọn trong vùng minBounds..maxBounds không
    let inside = true;
    for (let i = 0; i < this.k; i++) {
      if (node.point[i] < minBounds[i] || node.point[i] > maxBounds[i]) {
        inside = false;
        break;
      }
    }

    if (inside) {
      results.push(node.data);
    }

    const axis = depth % this.k;

    // Nhánh trái: nếu cận dưới nhỏ hơn hoặc bằng giá trị trục của node
    if (minBounds[axis] <= node.point[axis]) {
      this._rangeSearch(node.left, minBounds, maxBounds, depth + 1, results);
    }

    // Nhánh phải: nếu cận trên lớn hơn hoặc bằng giá trị trục của node
    if (maxBounds[axis] >= node.point[axis]) {
      this._rangeSearch(node.right, minBounds, maxBounds, depth + 1, results);
    }
  }

  /**
   * Tìm kiếm K láng giềng gần nhất (K-Nearest Neighbors)
   * @param {Array<number>} targetPoint - Tọa độ điểm mục tiêu
   * @param {number} [k=5] - Số lượng láng giềng cần lấy
   * @returns {Array<{ item: Object, distance: number }>}
   */
  kNearestNeighbors(targetPoint, k = 5) {
    const best = []; // Array<{ node, distSq }> sắp xếp tăng dần theo khoảng cách

    const distSq = (p1, p2) => {
      let sum = 0;
      for (let i = 0; i < this.k; i++) {
        const diff = p1[i] - p2[i];
        sum += diff * diff;
      }
      return sum;
    };

    const search = (node, depth) => {
      if (!node) return;

      const d = distSq(targetPoint, node.point);

      if (best.length < k) {
        best.push({ item: node.data, distSq: d });
        best.sort((a, b) => a.distSq - b.distSq);
      } else if (d < best[best.length - 1].distSq) {
        best[best.length - 1] = { item: node.data, distSq: d };
        best.sort((a, b) => a.distSq - b.distSq);
      }

      const axis = depth % this.k;
      const axisDiff = targetPoint[axis] - node.point[axis];

      const nearNode = axisDiff < 0 ? node.left : node.right;
      const farNode = axisDiff < 0 ? node.right : node.left;

      search(nearNode, depth + 1);

      // Cắt tỉa: Nếu khoảng cách tới siêu phẳng phân tách nhỏ hơn bán kính hiện tại tới đỉnh xa nhất trong top K
      const maxDistSq = best.length < k ? Infinity : best[best.length - 1].distSq;
      if (axisDiff * axisDiff < maxDistSq) {
        search(farNode, depth + 1);
      }
    };

    search(this.root, 0);

    return best.map(entry => ({
      item: entry.item,
      distance: Number(Math.sqrt(entry.distSq).toFixed(4))
    }));
  }

  /**
   * Tìm kiếm các shop/sản phẩm xung quanh vị trí người mua trong bán kính R km
   * @param {number} centerLat
   * @param {number} centerLon
   * @param {number} radiusKm
   * @param {Object} [filterOptions={}]
   * @param {number} [filterOptions.minPrice=0]
   * @param {number} [filterOptions.maxPrice=Infinity]
   * @param {number} [filterOptions.minRating=0]
   * @returns {Array<Object>}
   */
  geoRadiusSearch(centerLat, centerLon, radiusKm, { minPrice = 0, maxPrice = Infinity, minRating = 0 } = {}) {
    // 1 độ vĩ độ xấp xỉ 111 km
    const deltaLat = radiusKm / 111.0;
    const deltaLon = radiusKm / (111.0 * Math.cos((centerLat * Math.PI) / 180));

    const minBounds = [
      centerLat - deltaLat,
      centerLon - deltaLon,
      minPrice,
      minRating
    ];

    const maxBounds = [
      centerLat + deltaLat,
      centerLon + deltaLon,
      maxPrice,
      5.0
    ];

    const candidates = this.rangeSearch(minBounds, maxBounds);
    const inRadius = [];

    for (const item of candidates) {
      const d = KDTreeSpatialCatalog.calculateHaversineKm(centerLat, centerLon, item.lat, item.lon);
      if (d <= radiusKm) {
        inRadius.push({
          ...item,
          distanceKm: d
        });
      }
    }

    inRadius.sort((a, b) => a.distanceKm - b.distanceKm);
    return inRadius;
  }
}

export default KDTreeSpatialCatalog;
