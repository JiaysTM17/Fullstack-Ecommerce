/**
 * Traveling Salesperson Problem (TSP) Last-Mile Route Optimizer
 * (Thuật toán Tối ưu Lộ trình Giao hàng Chặng cuối cho SPX Express)
 * 
 * Vấn đề:
 * Bưu tá SPX mỗi ca phải giao từ 20 đến 50 đơn hàng. Nếu giao theo thứ tự ngẫu nhiên
 * hoặc thứ tự đặt hàng, tổng quãng đường di chuyển sẽ rất lớn, gây lãng phí nhiên liệu,
 * tăng tỷ lệ trễ hạn (Late Shipment Rate) và giảm năng suất giao nhận.
 * 
 * Giải pháp Thuật toán:
 * 1. Khoảng cách Haversine (Great-Circle Distance):
 *    Tính khoảng cách thực tế giữa hai tọa độ GPS (vĩ độ, kinh độ) trên bề mặt Trái Đất theo km.
 * 2. Phương pháp Tham lam Lân cận Gần nhất (Nearest Neighbor Heuristic):
 *    Xuất phát từ Kho hàng / Bưu cục Hub, ở mỗi bước luôn chọn điểm giao hàng chưa ghé
 *    gần nhất với điểm hiện tại -> Đạt nghiệm xấp xỉ O(N^2) cực nhanh.
 * 3. Tinh chỉnh Cục bộ 2-Opt (2-Opt Edge Swapping):
 *    Liên tục tìm và đảo ngược các đoạn đường chéo nhau (Crossing paths) để rút ngắn
 *    tổng quãng đường di chuyển cho đến khi hội tụ về cực tiểu địa phương.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Tính khoảng cách đường cong mặt cầu (Haversine) giữa 2 tọa độ GPS (km)
 */
export function calculateHaversineDistance(locA, locB) {
  if (!locA || !locB) return 0;
  const lat1 = locA.lat || locA.latitude || 0;
  const lon1 = locA.lng || locA.lon || locA.longitude || 0;
  const lat2 = locB.lat || locB.latitude || 0;
  const lon2 = locB.lng || locB.lon || locB.longitude || 0;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(3));
}

/**
 * Tính tổng khoảng cách của một lộ trình
 */
export function calculateTotalRouteDistance(route = []) {
  if (route.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateHaversineDistance(route[i], route[i + 1]);
  }
  return Number(total.toFixed(3));
}

/**
 * Thuật toán Nearest Neighbor Heuristic
 */
export function nearestNeighborTSP(depot, stops = []) {
  if (!stops || stops.length === 0) return [depot];
  const unvisited = [...stops];
  const route = [depot];
  let current = depot;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistance(current, unvisited[i]);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    route.push(current);
  }

  return route;
}

/**
 * Thuật toán tinh chỉnh 2-Opt để gỡ các đoạn giao lộ chéo nhau
 */
export function twoOptOptimize(route = [], maxIterations = 50) {
  if (route.length <= 3) return route;

  let bestRoute = [...route];
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    // Điểm đầu tiên (index 0) là kho trung tâm, giữ cố định
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        const currentDist =
          calculateHaversineDistance(bestRoute[i - 1], bestRoute[i]) +
          calculateHaversineDistance(bestRoute[j], bestRoute[j + 1]);

        const newDist =
          calculateHaversineDistance(bestRoute[i - 1], bestRoute[j]) +
          calculateHaversineDistance(bestRoute[i], bestRoute[j + 1]);

        // Nếu đảo ngược đoạn từ i đến j giúp giảm tổng khoảng cách
        if (newDist < currentDist - 0.001) {
          // 2-Opt swap: Đảo ngược đoạn [i, j]
          const newRoute = bestRoute.slice(0, i);
          const reversedSegment = bestRoute.slice(i, j + 1).reverse();
          bestRoute = newRoute.concat(reversedSegment, bestRoute.slice(j + 1));
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Bộ tối ưu hóa lộ trình hoàn chỉnh cho Bưu tá SPX
 * @param {Object} depot - Tọa độ kho xuất phát { lat, lng, name }
 * @param {Array<Object>} stops - Danh sách đơn hàng giao { id, lat, lng, address }
 * @param {number} speedKmH - Vận tốc trung bình bưu tá (mặc định 25 km/h trong đô thị)
 */
export function optimizeDeliveryRoute(depot, stops = [], speedKmH = 25) {
  if (!depot) throw new Error("Depot location is required");
  if (!stops || stops.length === 0) {
    return {
      optimizedStops: [],
      totalDistanceKm: 0,
      estimatedMinutes: 0,
    };
  }

  // 1. Chạy Nearest Neighbor để lấy lộ trình ban đầu
  const initialRoute = nearestNeighborTSP(depot, stops);

  // 2. Tinh chỉnh bằng 2-Opt để triệt tiêu các đoạn đường chéo
  const optimizedRoute = twoOptOptimize(initialRoute);

  // 3. Tính toán các chỉ số
  const totalDistanceKm = calculateTotalRouteDistance(optimizedRoute);
  // Thời gian di chuyển (phút) + 5 phút dừng giao hàng/gọi điện cho mỗi điểm
  const travelMinutes = (totalDistanceKm / speedKmH) * 60;
  const handlingMinutes = stops.length * 5;
  const estimatedMinutes = Math.round(travelMinutes + handlingMinutes);

  // 4. Gắn thứ tự giao và ETA tích lũy
  let accumulatedDist = 0;
  const stopsWithEta = optimizedRoute.slice(1).map((stop, index) => {
    const legDist = calculateHaversineDistance(optimizedRoute[index], stop);
    accumulatedDist += legDist;
    const stopEtaMinutes = Math.round((accumulatedDist / speedKmH) * 60 + (index + 1) * 5);
    return {
      ...stop,
      deliverySequence: index + 1,
      legDistanceKm: legDist,
      cumulativeDistanceKm: Number(accumulatedDist.toFixed(2)),
      etaMinutes: stopEtaMinutes,
    };
  });

  return {
    depot,
    optimizedStops: stopsWithEta,
    totalDistanceKm,
    estimatedMinutes,
  };
}
