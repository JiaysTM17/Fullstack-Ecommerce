/**
 * Geohash Hierarchical Spatial Indexing Engine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 13 - Feature 160)
 * 
 * Vấn đề:
 * Trong dịch vụ giao vận hỏa tốc SPX Now 2H và tìm kiếm gian hàng lân cận (Nearby Shops):
 * 1. Khách hàng muốn tìm các shop hoặc điểm gửi hàng bưu cục SPX trong bán kính $R$ km gần nhất.
 * 2. Tính toán khoảng cách Haversine quét toàn bộ hàng nghìn địa chỉ trên CSDL $O(N)$
 *    làm nghẽn CPU và tăng độ trễ truy vấn khi có hàng vạn người mua cùng tra cứu.
 * 
 * Nguyên lý Thuật Toán Geohash:
 * 1. Phân chia không gian 2D (Kinh độ [-180, 180] và Vĩ độ [-90, 90]) thành cây nhị phân (Binary Space Partitioning).
 * 2. Đan xen các bit nhị phân (Interleaving bits): bit chẵn là kinh độ, bit lẻ là vĩ độ.
 * 3. Mã hóa chuỗi nhị phân thành ký tự Base32 (32 ký tự: '0123456789bcdefghjkmnpqrstuvwxyz').
 * 4. Độ dài tiền tố Geohash (Precision) đại diện cho kích thước ô không gian:
 *    - Precision 5: ~4.9km x 4.9km (Tìm kiếm cấp quận/huyện)
 *    - Precision 6: ~1.2km x 0.6km (Tìm kiếm bán kính giao hỏa tốc 2-5km)
 *    - Precision 7: ~152m x 152m (Vị trí bưu tá SPX chính xác)
 * 5. Bán kính lân cận 8 ô (8 Neighbors): Quét ô trung tâm và 8 ô kề cận (N, NE, E, SE, S, SW, W, NW)
 *    để triệt tiêu hoàn toàn hiệu ứng biên (Edge boundary effects).
 */

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const BITS = [16, 8, 4, 2, 1];

/**
 * Mã hóa tọa độ GPS (lat, lon) thành chuỗi Geohash
 */
export function encodeGeohash(latitude, longitude, precision = 6) {
  let lat = Number(latitude);
  let lon = Number(longitude);

  let isEven = true;
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;
  let bit = 0;
  let ch = 0;
  let geohash = "";

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        ch |= BITS[bit];
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= BITS[bit];
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Giải mã chuỗi Geohash thành khoảng tọa độ lat, lon
 */
export function decodeGeohash(geohash) {
  let isEven = true;
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = BASE32.indexOf(c);
    if (cd === -1) continue;

    for (let j = 0; j < 5; j++) {
      const mask = BITS[j];
      if (isEven) {
        const lonMid = (lonMin + lonMax) / 2;
        if ((cd & mask) !== 0) lonMin = lonMid;
        else lonMax = lonMid;
      } else {
        const latMid = (latMin + latMax) / 2;
        if ((cd & mask) !== 0) latMin = latMid;
        else latMax = latMid;
      }
      isEven = !isEven;
    }
  }

  const lat = (latMin + latMax) / 2;
  const lon = (lonMin + lonMax) / 2;
  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    latError: (latMax - latMin) / 2,
    lonError: (lonMax - lonMin) / 2,
  };
}

/**
 * Tính khoảng cách Haversine (km)
 */
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Tìm 8 ô lân cận của một Geohash
 */
export function getGeohashNeighbors(geohash) {
  const decoded = decodeGeohash(geohash);
  const latDelta = decoded.latError * 2;
  const lonDelta = decoded.lonError * 2;
  const prec = geohash.length;

  return {
    center: geohash,
    north: encodeGeohash(decoded.latitude + latDelta, decoded.longitude, prec),
    south: encodeGeohash(decoded.latitude - latDelta, decoded.longitude, prec),
    east: encodeGeohash(decoded.latitude, decoded.longitude + lonDelta, prec),
    west: encodeGeohash(decoded.latitude, decoded.longitude - lonDelta, prec),
    northEast: encodeGeohash(decoded.latitude + latDelta, decoded.longitude + lonDelta, prec),
    northWest: encodeGeohash(decoded.latitude + latDelta, decoded.longitude - lonDelta, prec),
    southEast: encodeGeohash(decoded.latitude - latDelta, decoded.longitude + lonDelta, prec),
    southWest: encodeGeohash(decoded.latitude - latDelta, decoded.longitude - lonDelta, prec),
  };
}

/**
 * Chỉ mục không gian địa lý Geohash
 */
export class GeohashSpatialIndex {
  constructor(defaultPrecision = 6) {
    this.defaultPrecision = defaultPrecision;
    this.buckets = new Map(); // geohashKey -> Array<Object>
    this.items = new Map(); // id -> itemObject
  }

  /**
   * Đăng ký một địa điểm vào chỉ mục không gian
   */
  addLocation(id, latitude, longitude, metadata = {}) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const geohash = encodeGeohash(lat, lon, this.defaultPrecision);

    const record = {
      id: String(id),
      latitude: lat,
      longitude: lon,
      geohash,
      metadata,
    };

    this.items.set(record.id, record);

    if (!this.buckets.has(geohash)) {
      this.buckets.set(geohash, []);
    }
    this.buckets.get(geohash).push(record);

    return geohash;
  }

  /**
   * Tìm kiếm các địa điểm lân cận trong bán kính radiusKm
   * @param {number} latitude Vĩ độ tìm kiếm
   * @param {number} longitude Kinh độ tìm kiếm
   * @param {number} radiusKm Bán kính tìm kiếm (km)
   * @param {number} limit Số lượng tối đa trả về
   */
  findNearby(latitude, longitude, radiusKm = 5.0, limit = 10) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const centerGeohash = encodeGeohash(lat, lon, this.defaultPrecision);

    // Lấy ô trung tâm và 8 ô lân cận
    const neighbors = getGeohashNeighbors(centerGeohash);
    const searchHashes = [
      neighbors.center,
      neighbors.north,
      neighbors.south,
      neighbors.east,
      neighbors.west,
      neighbors.northEast,
      neighbors.northWest,
      neighbors.southEast,
      neighbors.southWest,
    ];

    const candidates = [];
    const seenIds = new Set();

    for (const h of searchHashes) {
      const list = this.buckets.get(h) || [];
      for (const item of list) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const distance = calculateHaversineKm(lat, lon, item.latitude, item.longitude);
          if (distance <= radiusKm) {
            candidates.push({
              ...item,
              distanceKm: distance,
            });
          }
        }
      }
    }

    candidates.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      query: { latitude: lat, longitude: lon, radiusKm, centerGeohash },
      totalFound: candidates.length,
      locations: candidates.slice(0, limit),
    };
  }
}
