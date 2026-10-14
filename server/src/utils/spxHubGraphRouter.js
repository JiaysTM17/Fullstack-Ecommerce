/**
 * SPX Express Multi-Hub Supply Chain Graph Routing Engine (Dijkstra / A*)
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 12 - Feature 159)
 * 
 * Vấn đề:
 * Mạng lưới giao vận SPX Express tại Việt Nam có hệ thống Hub trung chuyển liên tỉnh:
 * - Kho gom cấp 1 (First-mile Sorting Hub)
 * - Trung tâm khai thác liên vùng (Mega SOC: Bắc Ninh SOC, Củ Chi SOC)
 * - Hub trung chuyển vùng (Regional Hub: Đà Nẵng SOC, Vinh SOC, Nha Trang SOC, Cần Thơ SOC)
 * - Bưu cục phát chặng cuối (Last-mile Delivery Post)
 * 
 * Khi đơn hàng phát sinh, hệ thống cần:
 * 1. Định tuyến gói hàng qua các trạm sao cho tổng thời gian luân chuyển (transit time) hoặc
 *    chi phí vận tải (freight cost) là nhỏ nhất.
 * 2. Tính toán chính xác thời gian dự kiến (ETA) từng trạm cho Live Logistics Stepper.
 * 3. Hỗ trợ định tuyến có trọng số đa mục tiêu (Multi-criteria: Time, Distance, Cost).
 * 
 * Thuật toán:
 * 1. Biểu diễn đồ thị có hướng có trọng số $G = (V, E)$.
 * 2. Priority Queue (Min-Heap) tối ưu cho thuật toán Dijkstra đạt độ phức tạp $O((|E| + |V|) \log |V|)$.
 * 3. Thuật toán A* với hàm Heuristic khoảng cách địa lý Haversine (Great-circle distance)
 *    để tăng tốc độ hội tụ khi tìm đường đi giữa các tọa độ GPS đã biết.
 */

/**
 * Tọa độ và thông tin các trạm trung chuyển SPX tiêu chuẩn tại Việt Nam
 */
export const SPX_DEFAULT_HUBS = [
  { id: "HUB_HN", name: "SPX Hà Nội First-Mile Hub", city: "Hà Nội", lat: 21.0285, lng: 105.8542, type: "FIRST_MILE" },
  { id: "SOC_BN", name: "SPX Bắc Ninh Mega SOC", city: "Bắc Ninh", lat: 21.1861, lng: 106.0763, type: "MEGA_SOC" },
  { id: "SOC_VINH", name: "SPX Vinh Regional SOC", city: "Nghệ An", lat: 18.6734, lng: 105.6923, type: "REGIONAL_SOC" },
  { id: "SOC_DNG", name: "SPX Đà Nẵng Central SOC", city: "Đà Nẵng", lat: 16.0544, lng: 108.2022, type: "REGIONAL_SOC" },
  { id: "SOC_NTR", name: "SPX Nha Trang Coastal SOC", city: "Khánh Hòa", lat: 12.2388, lng: 109.1967, type: "REGIONAL_SOC" },
  { id: "SOC_CUCHI", name: "SPX Củ Chi Mega SOC", city: "TP. Hồ Chí Minh", lat: 11.0067, lng: 106.5133, type: "MEGA_SOC" },
  { id: "HUB_SG", name: "SPX Sài Gòn Hub", city: "TP. Hồ Chí Minh", lat: 10.7769, lng: 106.7009, type: "LAST_MILE" },
  { id: "SOC_CT", name: "SPX Cần Thơ Mekong SOC", city: "Cần Thơ", lat: 10.0452, lng: 105.7469, type: "REGIONAL_SOC" },
];

/**
 * Các cung đường kết nối mặc định giữa các trạm SPX (Khoảng cách km, Thời gian giờ, Chi phí VND/kg)
 */
export const SPX_DEFAULT_ROUTES = [
  { from: "HUB_HN", to: "SOC_BN", distanceKm: 35, transitHours: 1.5, baseCostVnd: 5000 },
  { from: "SOC_BN", to: "SOC_VINH", distanceKm: 310, transitHours: 6.0, baseCostVnd: 12000 },
  { from: "SOC_BN", to: "SOC_DNG", distanceKm: 760, transitHours: 14.0, baseCostVnd: 22000 },
  { from: "SOC_VINH", to: "SOC_DNG", distanceKm: 470, transitHours: 9.0, baseCostVnd: 15000 },
  { from: "SOC_DNG", to: "SOC_NTR", distanceKm: 530, transitHours: 10.0, baseCostVnd: 16000 },
  { from: "SOC_DNG", to: "SOC_CUCHI", distanceKm: 940, transitHours: 17.0, baseCostVnd: 25000 },
  { from: "SOC_NTR", to: "SOC_CUCHI", distanceKm: 420, transitHours: 8.0, baseCostVnd: 14000 },
  { from: "SOC_CUCHI", to: "HUB_SG", distanceKm: 40, transitHours: 2.0, baseCostVnd: 6000 },
  { from: "HUB_SG", to: "SOC_CT", distanceKm: 170, transitHours: 4.0, baseCostVnd: 10000 },
  // Tuyến đường ngược chiều (Two-way connectivity)
  { from: "SOC_BN", to: "HUB_HN", distanceKm: 35, transitHours: 1.5, baseCostVnd: 5000 },
  { from: "SOC_VINH", to: "SOC_BN", distanceKm: 310, transitHours: 6.0, baseCostVnd: 12000 },
  { from: "SOC_DNG", to: "SOC_BN", distanceKm: 760, transitHours: 14.0, baseCostVnd: 22000 },
  { from: "SOC_DNG", to: "SOC_VINH", distanceKm: 470, transitHours: 9.0, baseCostVnd: 15000 },
  { from: "SOC_NTR", to: "SOC_DNG", distanceKm: 530, transitHours: 10.0, baseCostVnd: 16000 },
  { from: "SOC_CUCHI", to: "SOC_DNG", distanceKm: 940, transitHours: 17.0, baseCostVnd: 25000 },
  { from: "SOC_CUCHI", to: "SOC_NTR", distanceKm: 420, transitHours: 8.0, baseCostVnd: 14000 },
  { from: "HUB_SG", to: "SOC_CUCHI", distanceKm: 40, transitHours: 2.0, baseCostVnd: 6000 },
  { from: "SOC_CT", to: "HUB_SG", distanceKm: 170, transitHours: 4.0, baseCostVnd: 10000 },
];

/**
 * Tính khoảng cách đường chim bay Haversine giữa 2 tọa độ GPS (km)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Cấu trúc Priority Queue (Min-Heap) tối ưu
 */
export class PriorityQueue {
  constructor(compareFn = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.compare = compareFn;
  }

  push(item) {
    this.heap.push(item);
    this._siftUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _siftUp(idx) {
    let parent = Math.floor((idx - 1) / 2);
    while (idx > 0 && this.compare(this.heap[idx], this.heap[parent]) < 0) {
      [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
      idx = parent;
      parent = Math.floor((idx - 1) / 2);
    }
  }

  _siftDown(idx) {
    const len = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < len && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== idx) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Bộ định tuyến đồ thị chuỗi cung ứng SPX
 */
export class SPXHubGraphRouter {
  constructor(hubs = SPX_DEFAULT_HUBS, routes = SPX_DEFAULT_ROUTES) {
    this.hubs = new Map();
    this.adjacencyList = new Map();

    for (const h of hubs) {
      this.addHub(h);
    }
    for (const r of routes) {
      this.addRoute(r);
    }
  }

  addHub(hub) {
    this.hubs.set(hub.id, { ...hub });
    if (!this.adjacencyList.has(hub.id)) {
      this.adjacencyList.set(hub.id, []);
    }
  }

  addRoute(route) {
    if (!this.adjacencyList.has(route.from)) {
      this.adjacencyList.set(route.from, []);
    }
    this.adjacencyList.get(route.from).push({
      to: route.to,
      distanceKm: Number(route.distanceKm) || 0,
      transitHours: Number(route.transitHours) || 1,
      baseCostVnd: Number(route.baseCostVnd) || 0,
    });
  }

  /**
   * Tìm đường đi tối ưu theo tiêu chí: 'time' | 'distance' | 'cost' bằng Dijkstra
   */
  findOptimalPath(sourceId, targetId, criterion = "time") {
    if (!this.hubs.has(sourceId) || !this.hubs.has(targetId)) {
      return {
        found: false,
        reason: `Trạm nguồn ${sourceId} hoặc trạm đích ${targetId} không tồn tại trên đồ thị.`,
      };
    }

    if (sourceId === targetId) {
      const hub = this.hubs.get(sourceId);
      return {
        found: true,
        criterion,
        source: hub,
        target: hub,
        path: [hub],
        totalDistanceKm: 0,
        totalTransitHours: 0,
        totalBaseCostVnd: 0,
        segments: [],
      };
    }

    const distances = new Map();
    const previous = new Map();
    const edgeUsed = new Map();
    const pq = new PriorityQueue((a, b) => a.priority - b.priority);

    for (const [id] of this.hubs) {
      distances.set(id, Infinity);
    }
    distances.set(sourceId, 0);
    pq.push({ id: sourceId, priority: 0 });

    while (!pq.isEmpty()) {
      const { id: u, priority: currentDist } = pq.pop();

      if (u === targetId) break;
      if (currentDist > distances.get(u)) continue;

      const neighbors = this.adjacencyList.get(u) || [];
      for (const edge of neighbors) {
        let weight = edge.transitHours;
        if (criterion === "distance") weight = edge.distanceKm;
        else if (criterion === "cost") weight = edge.baseCostVnd;

        const newDist = currentDist + weight;
        if (newDist < distances.get(edge.to)) {
          distances.set(edge.to, newDist);
          previous.set(edge.to, u);
          edgeUsed.set(edge.to, edge);
          pq.push({ id: edge.to, priority: newDist });
        }
      }
    }

    if (!previous.has(targetId)) {
      return {
        found: false,
        reason: `Không tìm thấy tuyến đường kết nối khả dụng từ ${sourceId} đến ${targetId}.`,
      };
    }

    // Tái tạo đường đi
    const pathIds = [];
    const segments = [];
    let curr = targetId;

    while (curr !== sourceId) {
      pathIds.unshift(curr);
      segments.unshift(edgeUsed.get(curr));
      curr = previous.get(curr);
    }
    pathIds.unshift(sourceId);

    const fullPath = pathIds.map((id) => this.hubs.get(id));
    const totalDistanceKm = segments.reduce((acc, s) => acc + s.distanceKm, 0);
    const totalTransitHours = segments.reduce((acc, s) => acc + s.transitHours, 0);
    const totalBaseCostVnd = segments.reduce((acc, s) => acc + s.baseCostVnd, 0);

    return {
      found: true,
      criterion,
      source: this.hubs.get(sourceId),
      target: this.hubs.get(targetId),
      path: fullPath,
      segments,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalTransitHours: Number(totalTransitHours.toFixed(1)),
      totalBaseCostVnd,
      estimatedDays: Number((totalTransitHours / 24).toFixed(1)),
    };
  }

  /**
   * Tìm đường đi nhanh nhất bằng thuật toán A* với Heuristic Haversine
   */
  findAStarPath(sourceId, targetId, averageSpeedKmh = 60) {
    if (!this.hubs.has(sourceId) || !this.hubs.has(targetId)) {
      return { found: false, reason: "Trạm nguồn hoặc trạm đích không tồn tại." };
    }

    const targetHub = this.hubs.get(targetId);
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();
    const edgeUsed = new Map();

    for (const [id] of this.hubs) {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    }

    const heuristic = (hubId) => {
      const hub = this.hubs.get(hubId);
      if (!hub || !targetHub) return 0;
      const distKm = calculateHaversineDistance(hub.lat, hub.lng, targetHub.lat, targetHub.lng);
      return distKm / averageSpeedKmh; // Thời gian ước tính lạc quan (giờ)
    };

    gScore.set(sourceId, 0);
    fScore.set(sourceId, heuristic(sourceId));

    const pq = new PriorityQueue((a, b) => a.f - b.f);
    pq.push({ id: sourceId, f: fScore.get(sourceId) });

    while (!pq.isEmpty()) {
      const { id: current } = pq.pop();

      if (current === targetId) {
        // Tái tạo đường đi
        const path = [];
        const segments = [];
        let curr = targetId;

        while (curr !== sourceId) {
          path.unshift(this.hubs.get(curr));
          segments.unshift(edgeUsed.get(curr));
          curr = cameFrom.get(curr);
        }
        path.unshift(this.hubs.get(sourceId));

        const totalDist = segments.reduce((acc, s) => acc + s.distanceKm, 0);
        const totalHours = segments.reduce((acc, s) => acc + s.transitHours, 0);
        const totalCost = segments.reduce((acc, s) => acc + s.baseCostVnd, 0);

        return {
          found: true,
          source: this.hubs.get(sourceId),
          target: targetHub,
          path,
          segments,
          totalDistanceKm: Number(totalDist.toFixed(1)),
          totalTransitHours: Number(totalHours.toFixed(1)),
          totalBaseCostVnd: totalCost,
        };
      }

      const neighbors = this.adjacencyList.get(current) || [];
      for (const edge of neighbors) {
        const tentativeG = gScore.get(current) + edge.transitHours;
        if (tentativeG < gScore.get(edge.to)) {
          cameFrom.set(edge.to, current);
          edgeUsed.set(edge.to, edge);
          gScore.set(edge.to, tentativeG);
          const f = tentativeG + heuristic(edge.to);
          fScore.set(edge.to, f);
          pq.push({ id: edge.to, f });
        }
      }
    }

    return { found: false, reason: "Không tìm thấy đường đi tới đích bằng A*." };
  }

  /**
   * Sinh các chặng lịch trình chi tiết (Live Tracking Stepper) dựa trên kết quả định tuyến
   */
  generateLiveTrackingSchedule(routePlan, startTime = new Date()) {
    if (!routePlan || !routePlan.found || !routePlan.path) {
      return [];
    }

    const steps = [];
    let currentTimestamp = new Date(startTime).getTime();

    for (let i = 0; i < routePlan.path.length; i++) {
      const hub = routePlan.path[i];
      let status = "COMPLETED";
      let description = "";

      if (i === 0) {
        description = `Đơn hàng đã nhập kho phát hành tại ${hub.name} (${hub.city})`;
      } else if (i === routePlan.path.length - 1) {
        description = `Đơn hàng đã đến trạm giao chặng cuối tại ${hub.name} (${hub.city}). Đang chuẩn bị phân phối bưu tá.`;
        status = "PENDING";
      } else {
        description = `Gói hàng đang được điều phối trung chuyển tại ${hub.name} (${hub.city})`;
      }

      steps.push({
        stepIndex: i + 1,
        hubId: hub.id,
        hubName: hub.name,
        city: hub.city,
        type: hub.type,
        timestamp: new Date(currentTimestamp).toISOString(),
        status,
        description,
      });

      if (i < routePlan.segments.length) {
        const seg = routePlan.segments[i];
        currentTimestamp += seg.transitHours * 3600 * 1000;
      }
    }

    return steps;
  }
}
