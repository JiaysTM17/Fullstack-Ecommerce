/**
 * Disjoint Set Union (DSU) & Sybil Ring Fraud Graph Detector
 * 
 * Vấn đề:
 * Trong các đợt phát hành mã giảm giá tân thủ (Newbie Vouchers) hoặc Flash Sale 1k,
 * các nhóm gian lận chuyên nghiệp (Sybil Farm / Cheat Ring) thường tạo hàng chục đến hàng trăm
 * tài khoản người mua ảo để gom sạch voucher rồi bùng đơn/bán lại.
 * Mặc dù tên tài khoản khác nhau, nhưng chúng liên kết qua:
 * - Dấu vân tay thiết bị (Device Fingerprint / IMEI / Hardware ID)
 * - Địa chỉ IP / Subnet chung
 * - Số tài khoản ngân hàng liên kết nhận tiền hoàn
 * - Số điện thoại nhận hàng hoặc địa chỉ giao hàng thực tế.
 * 
 * Giải pháp: Cấu trúc dữ liệu Disjoint Set Union (DSU)
 * 1. Nén đường đi (Path Compression):
 *    find(x) trỏ thẳng nút con tới nút gốc đại diện của cụm (Cluster Representative).
 * 2. Gộp theo cấp (Union by Rank):
 *    Gộp cây có độ sâu nhỏ hơn vào cây có độ sâu lớn hơn.
 * 3. Hiệu năng vượt trội:
 *    Độ phức tạp cho mỗi thao tác gần như là hằng số: O(alpha(N)) với alpha là hàm Ackermann nghịch đảo (<= 4 với mọi N thực tế).
 * 4. Radar phát hiện gian lận mạng lưới:
 *    Tự động nhóm các tài khoản liên thông vào một cụm (Connected Component).
 *    Nếu kích thước cụm vượt ngưỡng (>= clusterThreshold), gắn cờ nghi vấn Sybil Ring và tự động khóa tính năng áp mã voucher toàn cụm.
 */

export class DisjointSetUnion {
  constructor() {
    this.parent = new Map();
    this.rank = new Map();
    this.size = new Map();
    this.edgeTypes = new Map(); // Ghi nhận lý do liên kết (device, bank, ip, phone)
  }

  /**
   * Khởi tạo một phần tử độc lập nếu chưa tồn tại
   */
  makeSet(x) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      this.size.set(x, 1);
    }
  }

  /**
   * Tìm đại diện cụm kèm Nén đường đi (Path Compression)
   */
  find(x) {
    this.makeSet(x);
    if (this.parent.get(x) !== x) {
      // Đệ quy gán trực tiếp cha của x thành gốc đại diện
      this.parent.set(x, this.find(this.parent.get(x)));
    }
    return this.parent.get(x);
  }

  /**
   * Gộp 2 phần tử kèm Union by Rank
   * @param {string} x - Node A
   * @param {string} y - Node B
   * @param {string} relationType - 'device' | 'bank_account' | 'phone' | 'ip'
   * @returns {boolean} true nếu gộp 2 cụm khác nhau, false nếu đã chung cụm từ trước
   */
  union(x, y, relationType = "shared_entity") {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false; // Đã nằm trong cùng một cụm
    }

    const rankX = this.rank.get(rootX);
    const rankY = this.rank.get(rootY);
    const sizeX = this.size.get(rootX);
    const sizeY = this.size.get(rootY);

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
      this.size.set(rootY, sizeX + sizeY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
      this.size.set(rootX, sizeX + sizeY);
    } else {
      this.parent.set(rootY, rootX);
      this.size.set(rootX, sizeX + sizeY);
      this.rank.set(rootX, rankX + 1);
    }

    // Ghi nhận liên kết
    const edgeKey = `${x}<->${y}`;
    this.edgeTypes.set(edgeKey, relationType);

    return true;
  }

  /**
   * Kiểm tra xem 2 node có thuộc cùng một cụm liên thông không
   */
  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  /**
   * Lấy số lượng phần tử trong cụm chứa node x
   */
  getClusterSize(x) {
    const root = this.find(x);
    return this.size.get(root) || 1;
  }

  /**
   * Trả về toàn bộ danh sách các cụm liên thông
   */
  getAllClusters() {
    const clusters = new Map();

    for (const node of this.parent.keys()) {
      const root = this.find(node);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root).push(node);
    }

    return Array.from(clusters.values());
  }
}

export class SybilFraudRadar {
  /**
   * @param {object} options
   * @param {number} options.clusterSizeThreshold - Ngưỡng số tài khoản chung cụm bị coi là Sybil Ring (mặc định: 3)
   */
  constructor({ clusterSizeThreshold = 3 } = {}) {
    this.dsu = new DisjointSetUnion();
    this.clusterSizeThreshold = clusterSizeThreshold;
    this.accountMetadata = new Map(); // userId -> { vouchersClaimed, ordersCount, cancelledCount }
    this.entityIndex = {
      devices: new Map(), // deviceId -> Set<userId>
      bankAccounts: new Map(), // bankNo -> Set<userId>
      phones: new Map(), // phone -> Set<userId>
      ips: new Map() // ip -> Set<userId>
    };
  }

  /**
   * Đăng ký hoặc cập nhật hồ sơ tài khoản và liên kết với các thực thể dùng chung
   */
  registerUser({
    userId,
    deviceId = null,
    bankAccount = null,
    phone = null,
    ip = null,
    vouchersClaimed = 0,
    ordersCount = 0,
    cancelledCount = 0
  }) {
    if (!userId) return;

    this.dsu.makeSet(userId);
    this.accountMetadata.set(userId, {
      userId,
      deviceId,
      bankAccount,
      phone,
      ip,
      vouchersClaimed: Number(vouchersClaimed) || 0,
      ordersCount: Number(ordersCount) || 0,
      cancelledCount: Number(cancelledCount) || 0
    });

    // 1. Quét và liên kết qua Device ID
    if (deviceId) {
      if (!this.entityIndex.devices.has(deviceId)) {
        this.entityIndex.devices.set(deviceId, new Set());
      }
      const sharedUsers = this.entityIndex.devices.get(deviceId);
      for (const otherUser of sharedUsers) {
        this.dsu.union(userId, otherUser, "shared_device");
      }
      sharedUsers.add(userId);
    }

    // 2. Quét và liên kết qua Bank Account
    if (bankAccount) {
      if (!this.entityIndex.bankAccounts.has(bankAccount)) {
        this.entityIndex.bankAccounts.set(bankAccount, new Set());
      }
      const sharedUsers = this.entityIndex.bankAccounts.get(bankAccount);
      for (const otherUser of sharedUsers) {
        this.dsu.union(userId, otherUser, "shared_bank_account");
      }
      sharedUsers.add(userId);
    }

    // 3. Quét và liên kết qua Số điện thoại
    if (phone) {
      if (!this.entityIndex.phones.has(phone)) {
        this.entityIndex.phones.set(phone, new Set());
      }
      const sharedUsers = this.entityIndex.phones.get(phone);
      for (const otherUser of sharedUsers) {
        this.dsu.union(userId, otherUser, "shared_phone");
      }
      sharedUsers.add(userId);
    }

    // 4. Quét và liên kết qua IP
    if (ip) {
      if (!this.entityIndex.ips.has(ip)) {
        this.entityIndex.ips.set(ip, new Set());
      }
      const sharedUsers = this.entityIndex.ips.get(ip);
      for (const otherUser of sharedUsers) {
        this.dsu.union(userId, otherUser, "shared_ip");
      }
      sharedUsers.add(userId);
    }
  }

  /**
   * Phân tích và chấm điểm rủi ro cho một tài khoản cụ thể
   */
  analyzeUser(userId) {
    if (!this.dsu.parent.has(userId)) {
      return {
        userId,
        isSuspicious: false,
        clusterSize: 1,
        riskScore: 0,
        reasons: ["Tài khoản độc lập, không có liên kết chung"]
      };
    }

    const clusterSize = this.dsu.getClusterSize(userId);
    const root = this.dsu.find(userId);
    const allClusters = this.dsu.getAllClusters();
    const myCluster = allClusters.find(c => c.includes(userId)) || [userId];

    // Tính toán tổng số voucher đã bào của cả cụm
    let totalClusterVouchers = 0;
    let totalClusterOrders = 0;
    let totalClusterCancelled = 0;

    for (const u of myCluster) {
      const meta = this.accountMetadata.get(u);
      if (meta) {
        totalClusterVouchers += meta.vouchersClaimed;
        totalClusterOrders += meta.ordersCount;
        totalClusterCancelled += meta.cancelledCount;
      }
    }

    const reasons = [];
    let riskScore = 0;

    if (clusterSize >= this.clusterSizeThreshold) {
      riskScore += 40;
      reasons.push(`Nằm trong cụm liên kết ${clusterSize} tài khoản chia sẻ cùng thiết bị/ngân hàng`);
    }

    if (clusterSize >= 5) {
      riskScore += 30;
      reasons.push("Mạng lưới Sybil Farm quy mô lớn (>= 5 tài khoản liên kết)");
    }

    if (totalClusterVouchers >= clusterSize * 2) {
      riskScore += 20;
      reasons.push(`Lạm dụng voucher bất thường: ${totalClusterVouchers} voucher trên ${clusterSize} tài khoản`);
    }

    const cancelRate = totalClusterOrders > 0 ? (totalClusterCancelled / totalClusterOrders) : 0;
    if (cancelRate >= 0.3) {
      riskScore += 20;
      reasons.push(`Tỷ lệ bùng đơn/hủy đơn cụm bất thường (${(cancelRate * 100).toFixed(1)}%)`);
    }

    riskScore = Math.min(100, riskScore);
    const isSuspicious = riskScore >= 50;

    return {
      userId,
      rootRepresentative: root,
      clusterSize,
      clusterMembers: myCluster,
      totalClusterVouchers,
      riskScore,
      isSuspicious,
      recommendedAction: isSuspicious ? "LOCK_VOUCHER_PRIVILEGES_AND_REQUIRE_PREPAYMENT" : "ALLOW_NORMAL_ACCESS",
      reasons
    };
  }

  /**
   * Quét toàn sàn tìm tất cả các cụm gian lận Sybil Ring
   */
  findSybilRings() {
    const clusters = this.dsu.getAllClusters();
    const sybilRings = [];

    for (const members of clusters) {
      if (members.length >= this.clusterSizeThreshold) {
        const root = members[0];
        const analysis = this.analyzeUser(root);
        if (analysis.isSuspicious) {
          sybilRings.push(analysis);
        }
      }
    }

    return sybilRings.sort((a, b) => b.riskScore - a.riskScore);
  }
}
