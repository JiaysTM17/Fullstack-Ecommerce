/**
 * Gale-Shapley Stable Matching Algorithm (Two-Sided Deferred Acceptance)
 * 
 * Thuật toán Ghép Đôi Ổn Định Gale-Shapley (Nobel Kinh Tế 2012 - O(N^2)):
 * 1. Nguyên lý toán học & Lý thuyết trò chơi (Game Theory):
 *    - Giải bài toán ghép đôi hai phía giữa Tập người đề xuất (Proposers: e.g. Đơn hàng / Người mua / Shop)
 *      và Tập người tiếp nhận (Acceptors: e.g. Shipper bưu tá SPX / Slot Flash Sale độc quyền / KOL Affiliate).
 *    - Mỗi bên có bảng thứ bậc ưu tiên nghiêm ngặt (Strict Preference Ordering).
 *    - Thuật toán Chấp nhận trì hoãn (Deferred Acceptance): Bên đề xuất lần lượt gửi đề nghị;
 *      bên tiếp nhận tạm thời giữ đề nghị tốt nhất hiện có và từ chối các đề nghị kém hơn.
 * 2. Tính chất cốt lõi:
 *    - Ổn định tối ưu (Stable Matching): Tuyệt đối không tồn tại cặp cản trở (Blocking Pair: không có cặp (a, b) nào cùng muốn rời bỏ đối tác hiện tại để bắt cặp với nhau).
 *    - Tối ưu cho bên đề xuất (Proposer-Optimal).
 * 3. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Phân bổ đơn hàng giao gấp cho tài xế giao vận SPX Express theo khoảng cách và hiệu suất.
 *    - Ghép nối Shop với các gói tài trợ chiến dịch Flash Sale / Influencer Affiliate Marketing.
 */

export class GaleShapleyStableMatcher {
  constructor() {
    this.proposers = new Map(); // id -> { id, preferences: Array<string> }
    this.acceptors = new Map(); // id -> { id, preferences: Array<string>, ranking: Map<string, number> }
  }

  /**
   * Thêm bên đề xuất cùng danh sách ưu tiên
   * @param {string} id - Mã định danh (ví dụ: ORDER_1, SHOP_A)
   * @param {Array<string>} preferences - Mảng ID bên tiếp nhận theo thứ tự ưu tiên giảm dần
   */
  addProposer(id, preferences = []) {
    if (!id || !Array.isArray(preferences)) return;
    this.proposers.set(id, {
      id,
      preferences: [...preferences]
    });
  }

  /**
   * Thêm bên tiếp nhận cùng danh sách ưu tiên
   * @param {string} id - Mã định danh (ví dụ: DRIVER_1, SLOT_SALE)
   * @param {Array<string>} preferences - Mảng ID bên đề xuất theo thứ tự ưu tiên giảm dần
   */
  addAcceptor(id, preferences = []) {
    if (!id || !Array.isArray(preferences)) return;
    const ranking = new Map();
    preferences.forEach((propId, rank) => {
      ranking.set(propId, rank);
    });

    this.acceptors.set(id, {
      id,
      preferences: [...preferences],
      ranking
    });
  }

  /**
   * Thực thi thuật toán Gale-Shapley tìm cặp ghép ổn định
   * @returns {Object} { matches: Map<proposerId, acceptorId>, reverseMatches: Map<acceptorId, proposerId>, iterations: number }
   */
  match() {
    const freeProposers = Array.from(this.proposers.keys());
    const nextProposalIndex = new Map(); // proposerId -> index in preferences
    for (const pId of freeProposers) {
      nextProposalIndex.set(pId, 0);
    }

    const currentMatches = new Map(); // acceptorId -> proposerId
    let iterations = 0;
    const maxIterations = (this.proposers.size * this.acceptors.size) + 10;

    while (freeProposers.length > 0 && iterations < maxIterations) {
      iterations++;
      const pId = freeProposers.shift();
      const pObj = this.proposers.get(pId);
      const propIndex = nextProposalIndex.get(pId);

      // Nếu bên đề xuất đã dùng hết danh sách ưu tiên
      if (propIndex >= pObj.preferences.length) {
        continue;
      }

      const preferredAcceptorId = pObj.preferences[propIndex];
      nextProposalIndex.set(pId, propIndex + 1);

      const acceptorObj = this.acceptors.get(preferredAcceptorId);
      if (!acceptorObj) {
        // Bên tiếp nhận không tồn tại, tiếp tục tìm
        freeProposers.unshift(pId);
        continue;
      }

      // Kiểm tra xem bên tiếp nhận hiện đang tự do hay đã có người ghép
      const currentPartnerId = currentMatches.get(preferredAcceptorId);

      if (!currentPartnerId) {
        // Chấp nhận tạm thời
        currentMatches.set(preferredAcceptorId, pId);
      } else {
        // So sánh mức độ ưu tiên của đối tác mới so với đối tác hiện tại
        const currentRank = acceptorObj.ranking.has(currentPartnerId)
          ? acceptorObj.ranking.get(currentPartnerId)
          : Infinity;
        const newRank = acceptorObj.ranking.has(pId)
          ? acceptorObj.ranking.get(pId)
          : Infinity;

        if (newRank < currentRank) {
          // Đối tác mới tốt hơn -> thay thế đối tác cũ
          currentMatches.set(preferredAcceptorId, pId);
          freeProposers.push(currentPartnerId); // đối tác cũ trở lại trạng thái tự do
        } else {
          // Từ chối đề xuất mới -> bên đề xuất tiếp tục tự do
          freeProposers.unshift(pId);
        }
      }
    }

    const matches = new Map(); // proposerId -> acceptorId
    for (const [accId, propId] of currentMatches.entries()) {
      matches.set(propId, accId);
    }

    return {
      matches,
      reverseMatches: currentMatches,
      iterations,
      matchedCount: matches.size,
      totalProposers: this.proposers.size,
      totalAcceptors: this.acceptors.size
    };
  }

  /**
   * Kiểm chứng tính ổn định (Verification for Zero Blocking Pairs)
   * @param {Map<string, string>} matches - Kết quả ghép cặp
   * @returns {boolean} true nếu không có blocking pairs nào
   */
  isStable(matches) {
    for (const [pId, aId] of matches.entries()) {
      const pObj = this.proposers.get(pId);
      if (!pObj) continue;

      const currentAcceptorRank = pObj.preferences.indexOf(aId);
      // Xét tất cả các bên tiếp nhận mà pId thích hơn aId hiện tại
      const preferredAcceptors = currentAcceptorRank > 0
        ? pObj.preferences.slice(0, currentAcceptorRank)
        : [];

      for (const prefAccId of preferredAcceptors) {
        const accObj = this.acceptors.get(prefAccId);
        if (!accObj) continue;

        // Tìm đối tác hiện tại của prefAccId
        let partnerOfPrefAcc = null;
        for (const [prop, acc] of matches.entries()) {
          if (acc === prefAccId) {
            partnerOfPrefAcc = prop;
            break;
          }
        }

        if (!partnerOfPrefAcc) {
          // prefAccId chưa ghép với ai và pId thích prefAccId -> Blocking pair!
          return false;
        }

        const rankOfCurrent = accObj.ranking.get(partnerOfPrefAcc);
        const rankOfP = accObj.ranking.get(pId);

        // Nếu prefAccId cũng thích pId hơn đối tác hiện tại -> Blocking pair!
        if (rankOfP !== undefined && rankOfCurrent !== undefined && rankOfP < rankOfCurrent) {
          return false;
        }
      }
    }

    return true;
  }
}
