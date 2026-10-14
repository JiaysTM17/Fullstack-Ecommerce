/**
 * K-Means Clustering & Silhouette Coefficient Engine for Dynamic Product Price Tiers
 * 
 * Thuật toán Phân Cụm K-Means Tối Ưu Tự Động:
 * 1. Khởi tạo tâm cụm thông minh K-Means++ tránh hội tụ vào cực tiểu địa phương.
 * 2. Phân tách danh mục sản phẩm thành các tầng giá tự nhiên (Natural Price Tiers):
 *    - BUDGET: Hàng bình dân giá rẻ (deal 1k, 9k, giá sinh viên).
 *    - MID_RANGE: Hàng phổ thông chất lượng cao (phù hợp số đông).
 *    - PREMIUM_MALL: Hàng cao cấp chính hãng Shopee Mall.
 * 3. Tự động chọn số cụm tối ưu K* dựa trên Hệ số Silhouette (Silhouette Score s ∈ [-1, 1]):
 *    s(i) = (b(i) - a(i)) / max(a(i), b(i))
 *    Điểm càng gần 1.0 chứng minh các cụm phân tách càng rõ nét và nhất quán.
 */

export class HierarchicalKMeans {
  /**
   * Tính hệ số Silhouette cho kết quả phân cụm 1 chiều
   * @param {number[]} data - Dữ liệu điểm số/giá sản phẩm
   * @param {number[]} clusterAssignments - Mảng nhãn cụm tương ứng của từng phần tử
   * @param {number} k - Số lượng cụm
   * @returns {number} Điểm Silhouette trung bình toàn bộ tập dữ liệu (-1.0 -> 1.0)
   */
  static computeSilhouetteScore(data, clusterAssignments, k) {
    const n = data.length;
    if (n <= k || k <= 1) return 0;

    const clusters = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) {
      clusters[clusterAssignments[i]].push({ val: data[i], idx: i });
    }

    let totalScore = 0;

    for (let i = 0; i < n; i++) {
      const myClusterIdx = clusterAssignments[i];
      const myCluster = clusters[myClusterIdx];
      const val = data[i];

      // 1. Tính a(i): Khoảng cách trung bình nội cụm
      let a = 0;
      if (myCluster.length > 1) {
        let distSum = 0;
        for (const other of myCluster) {
          if (other.idx !== i) {
            distSum += Math.abs(val - other.val);
          }
        }
        a = distSum / (myCluster.length - 1);
      }

      // 2. Tính b(i): Khoảng cách trung bình nhỏ nhất tới cụm ngoại vi gần nhất
      let b = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === myClusterIdx || clusters[c].length === 0) continue;
        let otherClusterDistSum = 0;
        for (const other of clusters[c]) {
          otherClusterDistSum += Math.abs(val - other.val);
        }
        const avgDist = otherClusterDistSum / clusters[c].length;
        if (avgDist < b) {
          b = avgDist;
        }
      }

      // 3. Hệ số silhouette của điểm i
      const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
      totalScore += s;
    }

    return Number((totalScore / n).toFixed(4));
  }

  /**
   * Khởi tạo Centroids bằng phương pháp phân chia mẫu (K-Means++)
   * @param {number[]} values
   * @param {number} k
   * @returns {number[]}
   */
  static initKMeansPlusPlus(values, k) {
    if (!values || values.length === 0) return [];
    const n = values.length;
    k = Math.min(k, n);
    const sortedVals = [...values].sort((a, b) => a - b);
    const centroids = [];
    const step = Math.floor(n / k);
    for (let i = 0; i < k; i++) {
      centroids.push(sortedVals[Math.min(n - 1, Math.floor(i * step + step / 2))]);
    }
    return centroids;
  }

  /**
   * Chạy K-Means clustering với số cụm K cố định
   * 
   * @param {number[]} values - Mảng giá trị số 1D
   * @param {number} k - Số lượng cụm
   * @param {number} [maxIterations=50]
   * @returns {Object}
   */
  static cluster(values, k, maxIterations = 50) {
    if (!values || values.length === 0) throw new Error("Mảng dữ liệu không được rỗng.");
    const n = values.length;
    k = Math.min(k, n);

    if (k === 1) {
      return {
        k: 1,
        centroids: [values.reduce((s, v) => s + v, 0) / n],
        assignments: Array(n).fill(0),
        silhouetteScore: 0,
        iterations: 1
      };
    }

    // Khởi tạo Centroids bằng K-Means++
    let centroids = this.initKMeansPlusPlus(values, k);

    let assignments = new Array(n).fill(0);
    let iterations = 0;
    let converged = false;

    while (iterations < maxIterations && !converged) {
      iterations++;
      let changed = false;

      // Pha gán cụm (Assignment step)
      for (let i = 0; i < n; i++) {
        const val = values[i];
        let minDist = Infinity;
        let bestCluster = 0;

        for (let c = 0; c < k; c++) {
          const dist = Math.abs(val - centroids[c]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = c;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Pha cập nhật tâm cụm (Update step)
      const newCentroids = new Array(k).fill(0);
      const counts = new Array(k).fill(0);

      for (let i = 0; i < n; i++) {
        newCentroids[assignments[i]] += values[i];
        counts[assignments[i]]++;
      }

      for (let c = 0; c < k; c++) {
        if (counts[c] > 0) {
          newCentroids[c] = Number((newCentroids[c] / counts[c]).toFixed(2));
        } else {
          newCentroids[c] = centroids[c]; // Giữ nguyên nếu cụm rỗng
        }
      }

      // Kiểm tra hội tụ
      let maxShift = 0;
      for (let c = 0; c < k; c++) {
        maxShift = Math.max(maxShift, Math.abs(centroids[c] - newCentroids[c]));
      }

      centroids = newCentroids;
      if (!changed || maxShift < 0.01) {
        converged = true;
      }
    }

    const silhouetteScore = this.computeSilhouetteScore(values, assignments, k);

    return {
      k,
      centroids,
      assignments,
      iterations,
      silhouetteScore
    };
  }

  /**
   * Tự động tìm số cụm K* tối ưu nhất theo điểm Silhouette và phân tầng giá
   * 
   * @param {Object[]} products - Danh sách sản phẩm { id, name, price }
   * @param {number[]} [kRange=[2, 3, 4]] - Dải số cụm khảo sát
   * @returns {Object} Phân tầng giá sản phẩm tự nhiên
   */
  static autoClusterPriceTiers(products, kRange = [2, 3, 4]) {
    if (!products || products.length === 0) {
      return { optimalK: 0, clusters: [], bestSilhouette: 0, priceTiers: [] };
    }

    if (products.length === 1) {
      return {
        optimalK: 1,
        bestSilhouette: 1.0,
        iterations: 1,
        priceTiers: [{
          tierRank: 1,
          tierCode: "BUDGET",
          label: "TIẾT KIỆM (BUDGET)",
          centroidPrice: Math.round(Number(products[0].price || 0)),
          productCount: 1,
          products: [products[0]]
        }]
      };
    }

    const prices = products.map(p => Number(p.price || 0));
    let bestResult = null;
    let maxSilhouette = -Infinity;

    for (const k of kRange) {
      if (k > prices.length) continue;
      const res = this.cluster(prices, k);
      if (res.silhouetteScore > maxSilhouette) {
        maxSilhouette = res.silhouetteScore;
        bestResult = res;
      }
    }

    if (!bestResult) {
      bestResult = this.cluster(prices, Math.min(3, prices.length));
    }

    // Sắp xếp các cụm theo giá tâm cụm tăng dần để gán nhãn ngữ nghĩa
    const sortedCentroidIndices = bestResult.centroids
      .map((c, idx) => ({ c, idx }))
      .sort((a, b) => a.c - b.c)
      .map(item => item.idx);

    const labels = ["TIẾT KIỆM (BUDGET)", "PHỔ THÔNG (MID-RANGE)", "CAO CẤP (PREMIUM MALL)", "SIÊU SANG (ULTRA LUXURY)"];

    const clusterGroups = [];
    for (let rank = 0; rank < sortedCentroidIndices.length; rank++) {
      const origClusterIdx = sortedCentroidIndices[rank];
      const groupProducts = [];

      for (let i = 0; i < products.length; i++) {
        if (bestResult.assignments[i] === origClusterIdx) {
          groupProducts.push(products[i]);
        }
      }

      clusterGroups.push({
        tierRank: rank + 1,
        tierCode: rank === 0 ? "BUDGET" : rank === 1 ? "MID_RANGE" : "PREMIUM",
        label: labels[rank] || `TẦNG GIÁ ${rank + 1}`,
        centroidPrice: Math.round(bestResult.centroids[origClusterIdx]),
        productCount: groupProducts.length,
        products: groupProducts
      });
    }

    return {
      optimalK: bestResult.k,
      bestSilhouette: bestResult.silhouetteScore,
      iterations: bestResult.iterations,
      priceTiers: clusterGroups
    };
  }
}

export default {
  HierarchicalKMeans
};
