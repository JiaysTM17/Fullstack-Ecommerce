/**
 * SWIM Gossip Protocol & Failure Detector with Suspicion Mechanism
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 11 - Feature 158)
 * 
 * Vấn đề:
 * Trong hạ tầng phân tán của sàn TMĐT (API Gateway, WebSocket Push Servers, Search Clusters):
 * 1. Cơ chế Heartbeat tập trung tạo điểm nghẽn Single Point of Failure (SPOF) và lưu lượng mạng $O(N^2)$.
 * 2. Mạng chập chờn hoặc dừng luồng tạm thời (Garbage Collection Pauses) gây báo động giả (False-Positive Failures),
 *    dẫn đến việc cách ly nhầm các nút đang hoạt động bình thường và kích hoạt tái cân bằng cụm không cần thiết.
 * 
 * Giải pháp SWIM (Structured Weakly-Consistent Infection-Style Membership Protocol):
 * 1. Thăm dò trực tiếp & gián tiếp (Direct & Indirect Probing):
 *    - Mỗi chu kỳ T, một nút gửi PING trực tiếp tới một nút ngang hàng ngẫu nhiên.
 *    - Nếu không nhận được ACK trong $T_{\text{ping}}$, nút chọn $K$ nút trung gian gửi PING-REQ để thăm dò gián tiếp qua các tuyến đường khác.
 * 2. Cơ chế Nghi ngờ (Suspicion Mechanism):
 *    - Nếu thăm dò gián tiếp thất bại, nút không lập tức đánh dấu DEAD mà chuyển sang trạng thái SUSPECT kèm bộ đếm thời gian ân hạn (Grace Period).
 *    - Tự bác bỏ (Self-Refutation): Nếu nút bị nghi ngờ vẫn còn sống, nó phát sóng thông điệp ALIVE với Incarnation Number tăng lên:
 *      $$\text{Incarnation}_{\text{new}} = \text{Incarnation}_{\text{suspect}} + 1$$
 *    - Nếu hết thời gian ân hạn mà không nhận được phản hồi, nút mới chính thức bị tuyên bố DEAD.
 * 3. Lan truyền kiểu lây nhiễm (Piggybacked Dissemination):
 *    - Cập nhật thành viên (Join, Suspect, Alive, Dead) được gửi kèm (piggyback) trên các bản tin Ping/Ack thông thường,
 *      đạt chi phí truyền thông $O(1)$ trên mỗi nút và lan tỏa toàn cụm trong $O(\log N)$ chu kỳ.
 */

export const MemberStatus = {
  ALIVE: "ALIVE",
  SUSPECT: "SUSPECT",
  DEAD: "DEAD",
};

/**
 * Thành viên trong danh sách thành viên cụm SWIM
 */
export class ClusterMember {
  constructor(id, address = "127.0.0.1", port = 8000) {
    this.id = String(id);
    this.address = address;
    this.port = port;
    this.status = MemberStatus.ALIVE;
    this.incarnation = 0;
    this.lastObservedAt = Date.now();
    this.suspectTimer = null;
  }
}

/**
 * Nút tham gia giao thức SWIM (SWIM Node)
 */
export class SwimNode {
  constructor({
    id,
    cluster = null,
    pingTimeoutMs = 200,
    indirectPingCount = 2,
    suspicionTimeoutTicks = 3,
  } = {}) {
    this.id = String(id);
    this.cluster = cluster;
    this.status = MemberStatus.ALIVE;
    this.incarnation = 0;
    this.pingTimeoutMs = pingTimeoutMs;
    this.indirectPingCount = indirectPingCount;
    this.suspicionTimeoutTicks = suspicionTimeoutTicks;

    // Danh sách thành viên: memberId -> ClusterMember
    this.members = new Map();
    // Thêm chính mình vào danh sách thành viên
    const selfMember = new ClusterMember(this.id);
    this.members.set(this.id, selfMember);

    // Hàng đợi lan truyền cập nhật (Dissemination Buffer): [{ memberId, status, incarnation, transmitsLeft }]
    this.disseminationBuffer = [];
    this.probeIndex = 0;
  }

  get memberList() {
    return this.members;
  }

  get memberListArray() {
    return Array.from(this.members.values());
  }

  joinMember(memberId, address = "127.0.0.1", port = 8000) {
    this.addMember(memberId, address, port);
  }

  refuteSuspicion(suspectIncarnation = 0) {
    this.incarnation = Math.max(this.incarnation, Number(suspectIncarnation) || 0) + 1;
    this.status = MemberStatus.ALIVE;
    const self = this.members.get(this.id);
    if (self) {
      self.status = MemberStatus.ALIVE;
      self.incarnation = this.incarnation;
    }
    this._enqueueUpdate(this.id, MemberStatus.ALIVE, this.incarnation);
  }

  applyMemberUpdate(update) {
    if (!update) return;
    this.applyUpdates([update]);
  }

  checkSuspicionTimeouts() {
    for (const [mId, mem] of this.members.entries()) {
      if (mId === this.id) continue;
      if (mem.status === MemberStatus.SUSPECT) {
        mem.suspectTicks = (mem.suspectTicks || 0) + 1;
        if (mem.suspectTicks >= this.suspicionTimeoutTicks) {
          mem.status = MemberStatus.DEAD;
          this._enqueueUpdate(mId, MemberStatus.DEAD, mem.incarnation);
        }
      }
    }
  }

  addMember(memberId, address = "127.0.0.1", port = 8000) {
    const strId = String(memberId);
    if (!this.members.has(strId)) {
      const newMem = new ClusterMember(strId, address, port);
      this.members.set(strId, newMem);
      this._enqueueUpdate(strId, MemberStatus.ALIVE, 0);
    }
  }

  getAliveMembers() {
    return Array.from(this.members.values()).filter((m) => m.status === MemberStatus.ALIVE);
  }

  getActiveMembers() {
    return Array.from(this.members.values()).filter((m) => m.status !== MemberStatus.DEAD);
  }

  _enqueueUpdate(memberId, status, incarnation) {
    const existing = this.disseminationBuffer.find((u) => u.memberId === memberId);
    if (existing) {
      if (incarnation >= existing.incarnation) {
        existing.status = status;
        existing.incarnation = incarnation;
        existing.transmitsLeft = 8;
      }
    } else {
      this.disseminationBuffer.push({
        memberId,
        status,
        incarnation,
        transmitsLeft: 8,
      });
    }
  }

  _getPiggybackedUpdates() {
    const updates = [];
    for (const u of this.disseminationBuffer) {
      if (u.transmitsLeft > 0) {
        updates.push({
          memberId: u.memberId,
          id: u.memberId,
          status: u.status,
          incarnation: u.incarnation,
        });
        u.transmitsLeft -= 1;
      }
    }
    this.disseminationBuffer = this.disseminationBuffer.filter((u) => u.transmitsLeft > 0);
    return updates;
  }

  /**
   * Áp dụng các cập nhật thành viên được gửi kèm từ nút khác
   */
  applyUpdates(updates = []) {
    for (const u of updates) {
      const targetId = String(u.memberId || u.id || "");
      if (!targetId) continue;

      // Nếu người khác đồn mình bị SUSPECT hoặc DEAD, nhưng mình vẫn đang ALIVE -> Tự bác bỏ!
      if (targetId === this.id) {
        if (u.status === MemberStatus.SUSPECT || u.status === MemberStatus.DEAD) {
          if (u.incarnation >= this.incarnation) {
            this.incarnation = u.incarnation + 1;
            const self = this.members.get(this.id);
            if (self) {
              self.status = MemberStatus.ALIVE;
              self.incarnation = this.incarnation;
            }
            this._enqueueUpdate(this.id, MemberStatus.ALIVE, this.incarnation);
          }
        }
        continue;
      }

      if (!this.members.has(targetId)) {
        this.members.set(targetId, new ClusterMember(targetId));
        this._enqueueUpdate(targetId, u.status || MemberStatus.ALIVE, u.incarnation || 0);
      }

      const member = this.members.get(targetId);

      // Quy tắc ưu tiên cập nhật trạng thái của SWIM:
      // 1. Incarnation lớn hơn luôn thắng.
      // 2. Cùng Incarnation: DEAD > SUSPECT > ALIVE.
      if (u.incarnation > member.incarnation) {
        member.incarnation = u.incarnation;
        member.status = u.status;
        member.lastObservedAt = Date.now();
        this._enqueueUpdate(targetId, u.status, u.incarnation);
      } else if (u.incarnation === member.incarnation) {
        if (member.status === MemberStatus.ALIVE && (u.status === MemberStatus.SUSPECT || u.status === MemberStatus.DEAD)) {
          member.status = u.status;
          this._enqueueUpdate(targetId, u.status, u.incarnation);
        } else if (member.status === MemberStatus.SUSPECT && u.status === MemberStatus.DEAD) {
          member.status = MemberStatus.DEAD;
          this._enqueueUpdate(targetId, MemberStatus.DEAD, u.incarnation);
        }
      }
    }
  }

  /**
   * Thực hiện một chu kỳ kiểm tra giao thức SWIM (Gossip Period Tick)
   */
  stepProtocol() {
    if (this.status === MemberStatus.DEAD) return null;

    // 1. Giảm bộ đếm thời gian các nút đang bị SUSPECT; nếu hết hạn thì chuyển thành DEAD
    for (const [mId, mem] of this.members.entries()) {
      if (mId === this.id) continue;
      if (mem.status === MemberStatus.SUSPECT) {
        mem.suspectTicks = (mem.suspectTicks || 0) + 1;
        if (mem.suspectTicks >= this.suspicionTimeoutTicks) {
          mem.status = MemberStatus.DEAD;
          this._enqueueUpdate(mId, MemberStatus.DEAD, mem.incarnation);
        }
      }
    }

    // 2. Chọn một nút mục tiêu (ưu tiên probeIndex nếu được thiết lập)
    const candidates = Array.from(this.members.values()).filter(
      (m) => m.id !== this.id && m.status !== MemberStatus.DEAD
    );

    if (candidates.length === 0) return null;
    let target = null;
    if (typeof this.probeIndex === "number" && this.probeIndex >= 0) {
      const probeCandidate = this.memberListArray[this.probeIndex];
      if (probeCandidate && probeCandidate.id !== this.id && probeCandidate.status !== MemberStatus.DEAD) {
        target = probeCandidate;
      } else if (this.probeIndex < candidates.length) {
        target = candidates[this.probeIndex];
      }
    }
    if (!target) {
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // 3. Thăm dò trực tiếp (Direct Ping)
    const piggyback = this._getPiggybackedUpdates();
    let directSuccess = false;

    if (this.cluster && this.cluster.canDeliver(this.id, target.id)) {
      const targetNode = this.cluster.getNode(target.id);
      if (targetNode && targetNode.status !== MemberStatus.DEAD) {
        const reply = targetNode.receivePing(this.id, piggyback);
        if (reply && reply.updates && reply.updates.length > 0) {
          this.applyUpdates(reply.updates);
        }
        directSuccess = true;
      }
    }

    if (directSuccess) {
      target.status = MemberStatus.ALIVE;
      target.suspectTicks = 0;
      return {
        type: "DIRECT_PING",
        targetId: target.id,
        directSuccess: true,
        success: true,
      };
    }

    // 4. Nếu thăm dò trực tiếp thất bại, thực hiện thăm dò gián tiếp (Indirect Ping-Req)
    const intermediaries = candidates.filter((m) => m.id !== target.id);
    let indirectSuccess = false;

    if (intermediaries.length > 0 && this.cluster) {
      const selectedIntermediaries = intermediaries.slice(0, this.indirectPingCount);
      for (const inter of selectedIntermediaries) {
        if (this.cluster.canDeliver(this.id, inter.id) && this.cluster.canDeliver(inter.id, target.id)) {
          const interNode = this.cluster.getNode(inter.id);
          const targetNode = this.cluster.getNode(target.id);
          if (interNode && targetNode && targetNode.status !== MemberStatus.DEAD) {
            indirectSuccess = true;
            break;
          }
        }
      }
    }

    // 5. Nếu cả gián tiếp cũng thất bại, chuyển sang SUSPECT (chứ chưa coi là DEAD)
    if (!indirectSuccess) {
      if (target.status === MemberStatus.ALIVE) {
        target.status = MemberStatus.SUSPECT;
        target.suspectTicks = 0;
        this._enqueueUpdate(target.id, MemberStatus.SUSPECT, target.incarnation);
      }
      return {
        type: "INDIRECT_PING_REQ",
        targetId: target.id,
        directSuccess: false,
        indirectSuccess: false,
        success: false,
        newStatus: MemberStatus.SUSPECT,
        status: MemberStatus.SUSPECT,
      };
    }

    return {
      type: "INDIRECT_PING_REQ",
      targetId: target.id,
      directSuccess: false,
      indirectSuccess: true,
      success: true,
    };
  }

  receivePing(fromId, updates = []) {
    this.applyUpdates(updates);
    const piggyback = this._getPiggybackedUpdates();
    return { ack: true, incarnation: this.incarnation, updates: piggyback };
  }
}

/**
 * Bộ mô phỏng Cụm mạng SWIM (SWIM Cluster Simulator)
 */
export class SwimCluster {
  constructor({ nodeCount = 5, suspicionTimeoutRounds = 3 } = {}) {
    this.nodes = new Map();
    this.partitions = [];
    this.droppedLinks = new Set(); // Set các "nodeA->nodeB" bị rớt gói

    const count = Math.max(2, Number(nodeCount) || 5);
    const nodeIds = Array.from({ length: count }, (_, i) => `swim_node_${i + 1}`);

    for (const id of nodeIds) {
      const node = new SwimNode({
        id,
        cluster: this,
        suspicionTimeoutTicks: suspicionTimeoutRounds,
      });
      this.nodes.set(id, node);
    }

    // Cho tất cả các node biết về nhau ban đầu
    for (const node of this.nodes.values()) {
      for (const otherId of nodeIds) {
        node.addMember(otherId);
      }
    }
  }

  getNode(id) {
    const sId = String(id);
    if (this.nodes.has(sId)) return this.nodes.get(sId);
    for (const [k, v] of this.nodes.entries()) {
      if (k.replace(/^swim_/, "") === sId.replace(/^swim_/, "")) {
        return v;
      }
    }
    return undefined;
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  setDroppedLink(fromId, toId, isDropped = true) {
    const key = `${fromId}->${toId}`;
    if (isDropped) {
      this.droppedLinks.add(key);
    } else {
      this.droppedLinks.delete(key);
    }
  }

  isolateNode(id) {
    const strId = String(id);
    for (const node of this.nodes.values()) {
      this.droppedLinks.add(`${strId}->${node.id}`);
      this.droppedLinks.add(`${node.id}->${strId}`);
    }
  }

  healNetwork() {
    this.droppedLinks.clear();
    this.partitions = [];
  }

  canDeliver(fromId, toId) {
    if (this.droppedLinks.has(`${fromId}->${toId}`)) {
      return false;
    }
    return true;
  }

  /**
   * Chạy mô phỏng N vòng lặp giao thức trên toàn cụm
   */
  runRounds(rounds = 5) {
    const results = [];
    for (let r = 0; r < rounds; r++) {
      for (const node of this.nodes.values()) {
        const step = node.stepProtocol();
        if (step) results.push({ round: r + 1, nodeId: node.id, ...step });
      }
    }
    return results;
  }
}

export default {
  MemberStatus,
  ClusterMember,
  SwimNode,
  SwimCluster,
};
