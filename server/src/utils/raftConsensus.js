/**
 * Raft Distributed Consensus Engine & Quorum State Machine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 10 - Feature 157)
 * 
 * Vấn đề:
 * Trong sự kiện Flash Sale cao điểm (11.11, 12.12), hàng triệu người mua cùng tranh giành
 * một số lượng tồn kho giới hạn (ví dụ: 100 chiếc iPhone giá 1,000₫).
 * Cụm máy chủ phân tán (Distributed Edge Nodes) cần đồng thuận tuyệt đối về số lượng tồn kho đã đặt trước
 * mà không xảy ra tình trạng Phân mảnh cụm não đôi (Split-Brain) hay bán vượt kho (Overselling).
 * 
 * Giải pháp Raft Consensus:
 * 1. Bầu chọn Leader (Leader Election):
 *    - Các nút chuyển trạng thái Follower -> Candidate -> Leader.
 *    - Bộ đếm thời gian bầu cử ngẫu nhiên (Randomized Election Timeout) để triệt tiêu hiện tượng chia phiếu (Split Votes).
 *    - Một Candidate chỉ đắc cử khi nhận được đa số phiếu tuyệt đối (Quorum: floor(N/2) + 1).
 * 2. Sao chép nhật ký (Log Replication):
 *    - Mọi lệnh đặt hàng / trừ kho đi qua Leader.
 *    - Leader phát sóng RPC AppendEntries tới các Follower.
 *    - Một mục nhật ký chỉ được coi là ĐÃ CAM KẾT (Committed) khi đã được sao chép an toàn trên đa số các nút (Quorum).
 * 3. Tính An Toàn Tuyệt Đối (Safety Invariants):
 *    - Election Safety: Tối đa một Leader duy nhất cho mỗi nhiệm kỳ (Term).
 *    - Leader Append-Only: Leader không bao giờ ghi đè hoặc cắt bớt nhật ký của chính mình.
 *    - Log Matching Property: Nếu 2 nhật ký chứa một mục cùng index và term, thì toàn bộ nhật ký trước đó giống hệt nhau.
 *    - Leader Completeness: Nếu một mục nhật ký đã được cam kết ở một nhiệm kỳ, nó sẽ xuất hiện trong nhật ký của mọi Leader ở các nhiệm kỳ tương lai.
 */

export const NodeRole = {
  FOLLOWER: "FOLLOWER",
  CANDIDATE: "CANDIDATE",
  LEADER: "LEADER",
};

/**
 * Nút thành viên trong cụm phân tán Raft
 */
export class RaftNode {
  constructor({
    id,
    cluster = null,
    peers = [],
    stateMachine = null,
  } = {}) {
    this.id = String(id);
    this.cluster = cluster;
    this.peers = Array.from(peers).filter((p) => p !== this.id);

    // 1. Trạng thái bền vững (Persistent State on all servers)
    this.currentTerm = 0;
    this.votedFor = null;
    // Log entries: index 1-based, log[0] là sentinel entry
    this.log = [{ term: 0, index: 0, command: null }];

    // 2. Trạng thái tạm thời (Volatile State on all servers)
    this.role = NodeRole.FOLLOWER;
    this.commitIndex = 0;
    this.lastApplied = 0;
    this.leaderId = null;

    // 3. Trạng thái tạm thời của Leader (Volatile State on Leaders)
    this.nextIndex = new Map();  // peerId -> next log index to send
    this.matchIndex = new Map(); // peerId -> highest log index known replicated

    // 4. Máy trạng thái nghiệp vụ (E-Commerce Flash Sale State Machine)
    this.stateMachine = stateMachine || new FlashSaleStateMachine();
    this.appliedCommands = [];
  }

  get lastLogIndex() {
    return this.log.length - 1;
  }

  get lastLogTerm() {
    return this.log[this.lastLogIndex].term;
  }

  /**
   * Bắt đầu một cuộc bầu cử mới (Follower -> Candidate)
   */
  startElection() {
    this.role = NodeRole.CANDIDATE;
    this.currentTerm += 1;
    this.votedFor = this.id; // Tự bỏ phiếu cho chính mình
    this.leaderId = null;

    let votesGranted = 1;
    const quorum = Math.floor((this.peers.length + 1) / 2) + 1;

    // Gửi RequestVote RPC tới tất cả các nút ngang hàng
    for (const peerId of this.peers) {
      if (!this.cluster) continue;
      const peer = this.cluster.getNode(peerId);
      if (!peer || !this.cluster.canCommunicate(this.id, peerId)) continue;

      const reply = peer.handleRequestVote({
        term: this.currentTerm,
        candidateId: this.id,
        lastLogIndex: this.lastLogIndex,
        lastLogTerm: this.lastLogTerm,
      });

      if (reply.term > this.currentTerm) {
        this._stepDown(reply.term);
        return false;
      }

      if (reply.voteGranted) {
        votesGranted += 1;
      }
    }

    // Nếu đạt đa số phiếu tuyệt đối (Quorum), trở thành LEADER
    if (votesGranted >= quorum && this.role === NodeRole.CANDIDATE) {
      this.role = NodeRole.LEADER;
      this.leaderId = this.id;

      // Khởi tạo nextIndex và matchIndex cho Leader
      for (const peerId of this.peers) {
        this.nextIndex.set(peerId, this.lastLogIndex + 1);
        this.matchIndex.set(peerId, 0);
      }

      // Phát sóng Heartbeat rỗng để khẳng định quyền lực
      this.broadcastHeartbeat();
      return true;
    }

    return false;
  }

  /**
   * Xử lý RPC RequestVote từ ứng viên khác
   */
  handleRequestVote({ term, candidateId, lastLogIndex, lastLogTerm }) {
    // 1. Nếu term của ứng viên nhỏ hơn term hiện tại, từ chối
    if (term < this.currentTerm) {
      return { term: this.currentTerm, voteGranted: false };
    }

    // 2. Nếu nhận được term lớn hơn, hạ cấp về FOLLOWER
    if (term > this.currentTerm) {
      this._stepDown(term);
    }

    // 3. Quy tắc cập nhật nhật ký (Log Up-To-Dateness Rule):
    // Ứng viên có nhật ký ít nhất bằng mình nếu:
    // - lastLogTerm của candidate > lastLogTerm của mình, HOẶC
    // - Cùng lastLogTerm nhưng lastLogIndex của candidate >= lastLogIndex của mình
    const isLogUpToDate =
      lastLogTerm > this.lastLogTerm ||
      (lastLogTerm === this.lastLogTerm && lastLogIndex >= this.lastLogIndex);

    const canVote =
      (this.votedFor === null || this.votedFor === candidateId) && isLogUpToDate;

    if (canVote) {
      this.votedFor = candidateId;
      return { term: this.currentTerm, voteGranted: true };
    }

    return { term: this.currentTerm, voteGranted: false };
  }

  /**
   * Leader đề xuất một lệnh mới từ client (e.g., trừ kho Flash Sale)
   */
  propose(command) {
    if (this.role !== NodeRole.LEADER) {
      return {
        success: false,
        error: "NOT_LEADER",
        leaderId: this.leaderId,
      };
    }

    // 1. Thêm vào nhật ký cục bộ của Leader
    const entryIndex = this.log.length;
    const entry = {
      term: this.currentTerm,
      index: entryIndex,
      command,
    };
    this.log.push(entry);

    // 2. Sao chép nhật ký tới các Followers (Replication)
    const quorum = Math.floor((this.peers.length + 1) / 2) + 1;
    let matchCount = 1; // Tính chính Leader

    for (const peerId of this.peers) {
      if (!this.cluster) continue;
      const peer = this.cluster.getNode(peerId);
      if (!peer || !this.cluster.canCommunicate(this.id, peerId)) continue;

      const prevIndex = this.nextIndex.get(peerId) - 1 || 0;
      const prevTerm = this.log[prevIndex] ? this.log[prevIndex].term : 0;
      const entriesToSend = this.log.slice(prevIndex + 1);

      const reply = peer.handleAppendEntries({
        term: this.currentTerm,
        leaderId: this.id,
        prevLogIndex: prevIndex,
        prevLogTerm: prevTerm,
        entries: entriesToSend,
        leaderCommit: this.commitIndex,
      });

      if (reply.term > this.currentTerm) {
        this._stepDown(reply.term);
        return { success: false, error: "STEPPED_DOWN" };
      }

      if (reply.success) {
        this.nextIndex.set(peerId, entryIndex + 1);
        this.matchIndex.set(peerId, entryIndex);
        matchCount += 1;
      } else {
        // Lùi nextIndex để tìm điểm đồng thuận
        const curNext = this.nextIndex.get(peerId) || 1;
        this.nextIndex.set(peerId, Math.max(1, curNext - 1));
      }
    }

    // 3. Nếu được sao chép trên Quorum, cam kết (Commit) và áp dụng vào máy trạng thái
    if (matchCount >= quorum) {
      this.commitIndex = entryIndex;
      this._applyLogs();
      // Thông báo commitIndex đã cập nhật tới toàn bộ followers
      this.broadcastHeartbeat();
      return {
        success: true,
        committedIndex: this.commitIndex,
        commandResult: this.stateMachine.getLastResult(),
      };
    }

    return {
      success: false,
      error: "QUORUM_NOT_REACHED",
      replicatedNodes: matchCount,
      requiredQuorum: quorum,
    };
  }

  /**
   * Xử lý RPC AppendEntries (Heartbeat hoặc sao chép log từ Leader)
   */
  handleAppendEntries({
    term,
    leaderId,
    prevLogIndex,
    prevLogTerm,
    entries = [],
    leaderCommit = 0,
  }) {
    // 1. Trả về false nếu term < currentTerm
    if (term < this.currentTerm) {
      return { term: this.currentTerm, success: false };
    }

    // 2. Nhận diện Leader hợp lệ và cập nhật term
    if (term > this.currentTerm || this.role === NodeRole.CANDIDATE) {
      this._stepDown(term);
    }
    this.leaderId = leaderId;

    // 3. Trả về false nếu nhật ký không chứa mục tại prevLogIndex khớp prevLogTerm
    if (prevLogIndex > 0) {
      if (prevLogIndex >= this.log.length) {
        return { term: this.currentTerm, success: false };
      }
      if (this.log[prevLogIndex].term !== prevLogTerm) {
        return { term: this.currentTerm, success: false };
      }
    }

    // 4. Nếu một mục mới xung đột với mục hiện có, xóa mục đó và tất cả mục sau nó
    let insertIndex = prevLogIndex + 1;
    for (const newEntry of entries) {
      if (insertIndex < this.log.length) {
        if (this.log[insertIndex].term !== newEntry.term) {
          this.log = this.log.slice(0, insertIndex);
          this.log.push(newEntry);
        }
      } else {
        this.log.push(newEntry);
      }
      insertIndex += 1;
    }

    // 5. Nếu leaderCommit > commitIndex, đặt commitIndex = min(leaderCommit, index của mục mới cuối cùng)
    if (leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(leaderCommit, this.log.length - 1);
      this._applyLogs();
    }

    return { term: this.currentTerm, success: true };
  }

  broadcastHeartbeat() {
    if (this.role !== NodeRole.LEADER) return;
    for (const peerId of this.peers) {
      if (!this.cluster) continue;
      const peer = this.cluster.getNode(peerId);
      if (!peer || !this.cluster.canCommunicate(this.id, peerId)) continue;

      const prevIndex = (this.nextIndex.get(peerId) || 1) - 1;
      const prevTerm = this.log[prevIndex] ? this.log[prevIndex].term : 0;
      const entriesToSend = this.log.slice(prevIndex + 1);

      const reply = peer.handleAppendEntries({
        term: this.currentTerm,
        leaderId: this.id,
        prevLogIndex: prevIndex,
        prevLogTerm: prevTerm,
        entries: entriesToSend,
        leaderCommit: this.commitIndex,
      });

      if (reply.term > this.currentTerm) {
        this._stepDown(reply.term);
        return;
      }

      if (reply.success) {
        this.nextIndex.set(peerId, this.log.length);
        this.matchIndex.set(peerId, this.log.length - 1);
      }
    }
  }

  _stepDown(newTerm) {
    this.currentTerm = newTerm;
    this.role = NodeRole.FOLLOWER;
    this.votedFor = null;
    this.leaderId = null;
  }

  _applyLogs() {
    while (this.lastApplied < this.commitIndex) {
      this.lastApplied += 1;
      const entry = this.log[this.lastApplied];
      if (entry && entry.command) {
        const result = this.stateMachine.apply(entry.command);
        this.appliedCommands.push({
          index: this.lastApplied,
          term: entry.term,
          command: entry.command,
          result,
        });
      }
    }
  }

  getState() {
    return {
      id: this.id,
      role: this.role,
      currentTerm: this.currentTerm,
      votedFor: this.votedFor,
      leaderId: this.leaderId,
      commitIndex: this.commitIndex,
      lastApplied: this.lastApplied,
      logLength: this.log.length,
      lastLogIndex: this.lastLogIndex,
      lastLogTerm: this.lastLogTerm,
      stockState: this.stateMachine.getState(),
    };
  }
}

/**
 * Máy trạng thái quản trị tồn kho Flash Sale (Deterministic State Machine)
 */
export class FlashSaleStateMachine {
  constructor() {
    this.stocks = new Map();       // productId -> số lượng tồn
    this.reservations = new Map(); // orderId -> { productId, quantity, status }
    this.lastResult = null;
  }

  initStock(productId, initialStock) {
    this.stocks.set(String(productId), Math.max(0, Number(initialStock) || 0));
  }

  apply(command) {
    if (!command || !command.action) {
      this.lastResult = { error: "INVALID_COMMAND" };
      return this.lastResult;
    }

    const { action, productId, orderId, quantity = 1 } = command;
    const pId = String(productId);
    const oId = String(orderId);
    const qty = Math.max(1, Number(quantity) || 1);

    switch (action) {
      case "INIT_STOCK":
        this.initStock(pId, qty);
        this.lastResult = { action, productId: pId, stock: this.stocks.get(pId) };
        break;

      case "RESERVE_STOCK": {
        const currentStock = this.stocks.get(pId) || 0;
        if (currentStock >= qty) {
          this.stocks.set(pId, currentStock - qty);
          this.reservations.set(oId, {
            productId: pId,
            quantity: qty,
            status: "RESERVED",
          });
          this.lastResult = {
            success: true,
            action,
            orderId: oId,
            remainingStock: this.stocks.get(pId),
          };
        } else {
          this.lastResult = {
            success: false,
            action,
            error: "OUT_OF_STOCK",
            availableStock: currentStock,
            requested: qty,
          };
        }
        break;
      }

      case "RELEASE_STOCK": {
        const reservation = this.reservations.get(oId);
        if (reservation && reservation.status === "RESERVED") {
          reservation.status = "CANCELLED";
          const currentStock = this.stocks.get(reservation.productId) || 0;
          this.stocks.set(reservation.productId, currentStock + reservation.quantity);
          this.lastResult = {
            success: true,
            action,
            orderId: oId,
            restoredStock: this.stocks.get(reservation.productId),
          };
        } else {
          this.lastResult = { success: false, action, error: "NO_ACTIVE_RESERVATION" };
        }
        break;
      }

      default:
        this.lastResult = { error: `UNKNOWN_ACTION_${action}` };
    }

    return this.lastResult;
  }

  getLastResult() {
    return this.lastResult;
  }

  getStock(productId) {
    return this.stocks.get(String(productId)) || 0;
  }

  getState() {
    const stockObj = {};
    for (const [k, v] of this.stocks.entries()) {
      stockObj[k] = v;
    }
    return {
      stocks: stockObj,
      reservationsCount: this.reservations.size,
    };
  }
}

/**
 * Trình mô phỏng cụm Raft (Raft Cluster Simulator)
 * Cho phép kiểm thử chia cắt mạng (Network Partition), lỗi nút (Node Failures),
 * và bảo chứng zero-split-brain cho đợt Flash Sale triệu traffic.
 */
export class RaftCluster {
  constructor({ nodeCount = 3 } = {}) {
    this.nodes = new Map();
    this.partitions = []; // Mảng các Set chứa ID nút thuộc từng phân vùng mạng

    const count = Math.max(3, Number(nodeCount) || 3);
    const nodeIds = Array.from({ length: count }, (_, i) => `node_${i + 1}`);

    for (const id of nodeIds) {
      const node = new RaftNode({
        id,
        cluster: this,
        peers: nodeIds.filter((nid) => nid !== id),
      });
      this.nodes.set(id, node);
    }
  }

  getNode(id) {
    return this.nodes.get(String(id));
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getLeader() {
    for (const node of this.nodes.values()) {
      if (node.role === NodeRole.LEADER) {
        return node;
      }
    }
    return null;
  }

  /**
   * Tạo phân vùng mạng giữa 2 nhóm nút (Network Partition)
   */
  partition(groupA = [], groupB = []) {
    this.partitions = [new Set(groupA.map(String)), new Set(groupB.map(String))];
  }

  /**
   * Hàn gắn lại mạng (Heal network partition)
   */
  heal() {
    this.partitions = [];
  }

  /**
   * Kiểm tra xem 2 nút có thể truyền thông điệp được cho nhau không
   */
  canCommunicate(nodeAId, nodeBId) {
    if (this.partitions.length === 0) return true;
    for (const part of this.partitions) {
      if (part.has(nodeAId) && part.has(nodeBId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Khởi tạo tồn kho ban đầu cho toàn bộ cụm
   */
  initClusterStock(productId, stockQty) {
    for (const node of this.nodes.values()) {
      node.stateMachine.initStock(productId, stockQty);
    }
  }
}

export default {
  NodeRole,
  RaftNode,
  RaftCluster,
  FlashSaleStateMachine,
};
