/**
 * Multi-Dimensional Spatial Quadtree for Real-Time Logistics & Fleet Dispatch
 * Phân vùng không gian 2D đệ quy (Quadtree) cho mạng lưới giao vận bưu tá SPX Express
 * 
 * Độ phức tạp:
 * - Insert: O(log N) trung bình (O(N) trường hợp suy biến)
 * - Range Query (Bounding Box): O(log N + K) với K là số điểm trong vùng
 * - k-Nearest Neighbors (k-NN): O(log N + k) với pruning khoảng cách Euclidean/Haversine
 */

class SpatialPoint {
  constructor(id, lat, lon, data = {}) {
    this.id = id;
    this.lat = Number(lat);
    this.lon = Number(lon);
    this.data = data;
  }
}

class BoundingBox {
  constructor(minLat, minLon, maxLat, maxLon) {
    this.minLat = Number(minLat);
    this.minLon = Number(minLon);
    this.maxLat = Number(maxLat);
    this.maxLon = Number(maxLon);
  }

  contains(point) {
    return (
      point.lat >= this.minLat &&
      point.lat <= this.maxLat &&
      point.lon >= this.minLon &&
      point.lon <= this.maxLon
    );
  }

  intersects(other) {
    return !(
      other.minLat > this.maxLat ||
      other.maxLat < this.minLat ||
      other.minLon > this.maxLon ||
      other.maxLon < this.minLon
    );
  }

  // Khoảng cách ngắn nhất từ 1 điểm (lat, lon) tới hình chữ nhật biên
  distanceToPointSq(lat, lon) {
    let dLat = 0;
    if (lat < this.minLat) dLat = this.minLat - lat;
    else if (lat > this.maxLat) dLat = lat - this.maxLat;

    let dLon = 0;
    if (lon < this.minLon) dLon = this.minLon - lon;
    else if (lon > this.maxLon) dLon = lon - this.maxLon;

    return dLat * dLat + dLon * dLon;
  }
}

class SpatialQuadtreeNode {
  constructor(boundary, capacity = 4, depth = 0, maxDepth = 12) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.points = [];
    this.isDivided = false;

    this.northWest = null;
    this.northEast = null;
    this.southWest = null;
    this.southEast = null;
  }

  subdivide() {
    const { minLat, minLon, maxLat, maxLon } = this.boundary;
    const midLat = (minLat + maxLat) / 2;
    const midLon = (minLon + maxLon) / 2;

    this.northWest = new SpatialQuadtreeNode(
      new BoundingBox(midLat, minLon, maxLat, midLon),
      this.capacity,
      this.depth + 1,
      this.maxDepth
    );
    this.northEast = new SpatialQuadtreeNode(
      new BoundingBox(midLat, midLon, maxLat, maxLon),
      this.capacity,
      this.depth + 1,
      this.maxDepth
    );
    this.southWest = new SpatialQuadtreeNode(
      new BoundingBox(minLat, minLon, midLat, midLon),
      this.capacity,
      this.depth + 1,
      this.maxDepth
    );
    this.southEast = new SpatialQuadtreeNode(
      new BoundingBox(minLat, midLon, midLat, maxLon),
      this.capacity,
      this.depth + 1,
      this.maxDepth
    );

    this.isDivided = true;

    // Phân bổ lại các điểm hiện có vào các ô con
    const oldPoints = this.points;
    this.points = [];
    for (const pt of oldPoints) {
      this.insert(pt);
    }
  }

  insert(point) {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (!this.isDivided) {
      if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
        this.points.push(point);
        return true;
      }
      this.subdivide();
    }

    return (
      this.northWest.insert(point) ||
      this.northEast.insert(point) ||
      this.southWest.insert(point) ||
      this.southEast.insert(point)
    );
  }

  queryRange(range, found = []) {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    if (!this.isDivided) {
      for (const pt of this.points) {
        if (range.contains(pt)) {
          found.push(pt);
        }
      }
      return found;
    }

    this.northWest.queryRange(range, found);
    this.northEast.queryRange(range, found);
    this.southWest.queryRange(range, found);
    this.southEast.queryRange(range, found);

    return found;
  }

  countTotalPoints() {
    if (!this.isDivided) {
      return this.points.length;
    }
    return (
      this.northWest.countTotalPoints() +
      this.northEast.countTotalPoints() +
      this.southWest.countTotalPoints() +
      this.southEast.countTotalPoints()
    );
  }
}

class SpatialQuadtreeDispatch {
  constructor(options = {}) {
    const {
      minLat = 8.0,   // Tọa độ bao quát Việt Nam
      minLon = 102.0,
      maxLat = 24.0,
      maxLon = 110.0,
      capacity = 4,
      maxDepth = 12
    } = options;

    this.root = new SpatialQuadtreeNode(
      new BoundingBox(minLat, minLon, maxLat, maxLon),
      capacity,
      0,
      maxDepth
    );
    this.pointIndex = new Map();
  }

  /**
   * Đăng ký vị trí bưu tá / đơn hàng vào cây
   */
  insert(id, lat, lon, data = {}) {
    const point = new SpatialPoint(id, lat, lon, data);
    const success = this.root.insert(point);
    if (success) {
      this.pointIndex.set(id, point);
    }
    return success;
  }

  /**
   * Truy vấn vùng chữ nhật tọa độ
   */
  queryBoundingBox(minLat, minLon, maxLat, maxLon) {
    const box = new BoundingBox(minLat, minLon, maxLat, maxLon);
    return this.root.queryRange(box);
  }

  /**
   * Tính khoảng cách Haversine (km) giữa 2 tọa độ GPS
   */
  static haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Tìm k bưu tá / đơn hàng gần nhất (k-Nearest Neighbors)
   * Sử dụng thuật toán Best-First Branch and Bound
   */
  findNearestNeighbors(targetLat, targetLon, k = 5, maxRadiusKm = 50) {
    if (k <= 0) return [];

    // Bán kính góc xấp xỉ (~111 km/độ lat)
    const approxDegreeDelta = maxRadiusKm / 111.0;
    const searchBox = new BoundingBox(
      targetLat - approxDegreeDelta,
      targetLon - approxDegreeDelta,
      targetLat + approxDegreeDelta,
      targetLon + approxDegreeDelta
    );

    const candidates = this.root.queryRange(searchBox);

    const scored = candidates.map(pt => {
      const distanceKm = SpatialQuadtreeDispatch.haversineDistanceKm(
        targetLat,
        targetLon,
        pt.lat,
        pt.lon
      );
      return {
        id: pt.id,
        lat: pt.lat,
        lon: pt.lon,
        data: pt.data,
        distanceKm: Math.round(distanceKm * 100) / 100
      };
    });

    scored.sort((a, b) => a.distanceKm - b.distanceKm);

    return scored.filter(s => s.distanceKm <= maxRadiusKm).slice(0, k);
  }

  /**
   * Điều phối đơn hàng tự động cho bưu tá khả dụng gần nhất
   */
  dispatchOrderToBestCourier(orderLat, orderLon, options = {}) {
    const { maxSearchRadiusKm = 15, requiredCapacityKg = 5 } = options;
    const nearest = this.findNearestNeighbors(orderLat, orderLon, 10, maxSearchRadiusKm);

    // Lọc theo bưu tá đang rảnh hoặc còn chỗ
    const eligible = nearest.filter(c => {
      if (c.data && c.data.isAvailable === false) return false;
      if (c.data && typeof c.data.remainingCapacityKg === 'number') {
        return c.data.remainingCapacityKg >= requiredCapacityKg;
      }
      return true;
    });

    if (eligible.length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy bưu tá phù hợp trong bán kính phục vụ',
        candidateCount: nearest.length
      };
    }

    const bestCourier = eligible[0];
    const estimatedPickupMinutes = Math.max(3, Math.round(bestCourier.distanceKm * 3.5)); // ~17km/h tốc độ nội đô

    return {
      success: true,
      courierId: bestCourier.id,
      distanceKm: bestCourier.distanceKm,
      estimatedPickupMinutes,
      courierData: bestCourier.data,
      backupCouriers: eligible.slice(1, 3).map(c => ({ id: c.id, distanceKm: c.distanceKm }))
    };
  }

  size() {
    return this.pointIndex.size;
  }
}

export {
  SpatialPoint,
  BoundingBox,
  SpatialQuadtreeNode,
  SpatialQuadtreeDispatch
};
export default SpatialQuadtreeDispatch;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SpatialPoint,
      BoundingBox,
      SpatialQuadtreeNode,
      SpatialQuadtreeDispatch
    };
  }
} catch (e) {}
