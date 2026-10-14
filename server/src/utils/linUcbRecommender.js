/**
 * Contextual Multi-Armed Bandit (LinUCB) Recommendation Engine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 13 - Feature 160)
 * 
 * Vấn đề:
 * Trong tính năng "Gợi Ý Hôm Nay / Daily Discover" tại trang chủ Mini Shopee:
 * 1. Các thuật toán khuyến nghị truyền thống (Collaborative Filtering, Best-sellers) chỉ gợi ý
 *    các sản phẩm phổ biến nhất, gây ra hiện tượng bão hòa (Popularity Bias) và "bong bóng lọc" (Filter Bubble).
 * 2. Cần cân bằng thông minh giữa Thử nghiệm các sản phẩm mới (Exploration) và Khai thác các sản phẩm
 *    đang có tỷ lệ chuyển đổi cao (Exploitation), đồng thời thích ứng theo ngữ cảnh cá nhân của từng khách hàng:
 *    - Khung giờ mua sắm (Sáng, Trưa, Tối, Đêm)
 *    - Thiết bị truy cập (Mobile, Desktop)
 *    - Độ nhạy cảm về giá (Ưa thích hàng giá rẻ, tầm trung hay cao cấp)
 *    - Lịch sử tương tác gần nhất
 * 
 * Nguyên lý Thuật Toán LinUCB (Disjoint Linear Upper Confidence Bound):
 * 1. Mỗi sản phẩm / danh mục ứng viên được xem như một cánh tay (Arm $a$).
 * 2. Giả định phần thưởng kỳ vọng (CTR / CVR) phụ thuộc tuyến tính vào vector ngữ cảnh $x \in \mathbb{R}^d$:
 *    $$\mathbb{E}[r_{t, a} \mid x_{t, a}] = x_{t, a}^\top \theta_a^*$$
 * 3. Cho mỗi cánh tay $a$:
 *    - Duy trì ma trận hiệp phương sai $A_a \in \mathbb{R}^{d \times d}$, khởi tạo $A_a = I_d$ (Ma trận đơn vị).
 *    - Duy trì vector tích lũy phần thưởng $b_a \in \mathbb{R}^d$, khởi tạo $b_a = \mathbf{0}$.
 * 4. Ước lượng tham số hồi quy Ridge:
 *    $$\hat{\theta}_a = A_a^{-1} b_a$$
 * 5. Tính toán điểm số UCB (Expected Payoff + Confidence Bound):
 *    $$p_{t, a} = x_{t, a}^\top \hat{\theta}_a + \alpha \sqrt{x_{t, a}^\top A_a^{-1} x_{t, a}}$$
 *    trong đó $\alpha > 0$ là hệ số điều tiết mức độ khám phá (Exploration parameter).
 * 6. Chọn cánh tay $a^* = \arg\max_a p_{t, a}$ để hiển thị.
 * 7. Khi nhận được phản hồi (Click / Mua = 1, Xem bỏ qua = 0), cập nhật trực tuyến:
 *    $$A_a \leftarrow A_a + x x^\top, \quad b_a \leftarrow b_a + r x$$
 */

/**
 * Phép nghịch đảo ma trận vuông nhỏ bằng khử Gauss-Jordan
 */
export function invertMatrix(A) {
  const n = A.length;
  const M = A.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1;
    return [...row, ...identityRow];
  });

  for (let i = 0; i < n; i++) {
    // Tìm phần tử trục (pivot)
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }

    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
    }

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-9) {
      // Regularize nếu ma trận suy biến
      M[i][i] += 1e-5;
    }

    const currentPivot = M[i][i];
    for (let j = 0; j < 2 * n; j++) {
      M[i][j] /= currentPivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = 0; j < 2 * n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row.slice(n));
}

/**
 * Phép nhân ma trận và vector
 */
export function matrixVectorMultiply(A, x) {
  return A.map((row) => row.reduce((sum, val, idx) => sum + val * x[idx], 0));
}

/**
 * Tích vô hướng hai vector
 */
export function dotProduct(x, y) {
  return x.reduce((sum, val, idx) => sum + val * y[idx], 0);
}

/**
 * Bộ đề xuất Contextual Bandit LinUCB
 */
export class LinUCBRecommender {
  constructor({ dimension = 4, alpha = 0.5 } = {}) {
    this.d = dimension;
    this.alpha = alpha;
    this.arms = new Map(); // armId -> { A, b, metadata }
  }

  /**
   * Đăng ký một cánh tay (Sản phẩm hoặc Danh mục)
   */
  addArm(armId, metadata = {}) {
    const id = String(armId);
    if (!this.arms.has(id)) {
      // Khởi tạo ma trận A = I_d (Identity matrix)
      const A = Array.from({ length: this.d }, (_, i) =>
        Array.from({ length: this.d }, (_, j) => (i === j ? 1.0 : 0.0))
      );
      // Khởi tạo vector b = 0
      const b = new Array(this.d).fill(0.0);

      this.arms.set(id, { A, b, metadata, pullCount: 0, rewardSum: 0 });
    }
  }

  /**
   * Trích xuất vector đặc trưng ngữ cảnh từ thông tin khách hàng
   * @param {Object} context { isMobile, hourOfDay, priceSensitivity, isNewUser }
   * @returns {Array<number>} Vector d chiều (chuẩn hóa)
   */
  extractContextVector(context = {}) {
    // d = 4 mặc định:
    // x[0]: Bias cố định = 1.0
    // x[1]: Thiết bị (Mobile = 1.0, Desktop = 0.0)
    // x[2]: Khung giờ vàng Flash Sale (12h trưa hoặc 20h tối = 1.0, khác = 0.2)
    // x[3]: Độ nhạy giá (Săn deal = 1.0, Khách VIP Mall = 0.0)
    const isMobile = context.isMobile !== undefined ? (context.isMobile ? 1.0 : 0.0) : 0.8;
    const hour = context.hourOfDay !== undefined ? Number(context.hourOfDay) : new Date().getHours();
    const isPeakHour = (hour >= 11 && hour <= 13) || (hour >= 19 && hour <= 22) ? 1.0 : 0.2;
    const priceSensitive = context.priceSensitivity !== undefined ? Number(context.priceSensitivity) : 0.5;

    return [1.0, isMobile, isPeakHour, priceSensitive];
  }

  /**
   * Đề xuất Top-K cánh tay có điểm LinUCB cao nhất cho một vector ngữ cảnh
   * @param {Array<number>} contextVector Vector đặc trưng ngữ cảnh
   * @param {number} topK Số lượng gợi ý
   */
  recommend(contextVector, topK = 3) {
    const x = contextVector || new Array(this.d).fill(1.0);
    const scoredArms = [];

    for (const [armId, armData] of this.arms.entries()) {
      const A_inv = invertMatrix(armData.A);
      const thetaHat = matrixVectorMultiply(A_inv, armData.b);
      const expectedPayoff = dotProduct(x, thetaHat);

      // Độ bất định: alpha * sqrt(x^T * A^-1 * x)
      const A_inv_x = matrixVectorMultiply(A_inv, x);
      const variance = Math.max(0, dotProduct(x, A_inv_x));
      const confidenceBound = this.alpha * Math.sqrt(variance);

      const ucbScore = expectedPayoff + confidenceBound;

      scoredArms.push({
        armId,
        score: Number(ucbScore.toFixed(4)),
        expectedPayoff: Number(expectedPayoff.toFixed(4)),
        confidenceBound: Number(confidenceBound.toFixed(4)),
        pullCount: armData.pullCount,
        metadata: armData.metadata,
      });
    }

    scoredArms.sort((a, b) => b.score - a.score);
    return scoredArms.slice(0, topK);
  }

  /**
   * Cập nhật phản hồi trực tuyến cho một cánh tay
   * @param {string} armId Cánh tay đã chọn
   * @param {Array<number>} contextVector Vector ngữ cảnh khi chọn
   * @param {number} reward Phần thưởng (1.0 = click/mua, 0.0 = bỏ qua)
   */
  update(armId, contextVector, reward = 1.0) {
    const id = String(armId);
    if (!this.arms.has(id)) {
      this.addArm(id);
    }

    const arm = this.arms.get(id);
    const x = contextVector;
    const r = Number(reward);

    // Cập nhật A += x * x^T
    for (let i = 0; i < this.d; i++) {
      for (let j = 0; j < this.d; j++) {
        arm.A[i][j] += x[i] * x[j];
      }
    }

    // Cập nhật b += r * x
    for (let i = 0; i < this.d; i++) {
      arm.b[i] += r * x[i];
    }

    arm.pullCount++;
    arm.rewardSum += r;
  }
}
