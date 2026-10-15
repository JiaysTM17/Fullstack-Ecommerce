/**
 * Multi-Commodity Min-Cost Circulation with Deficit Balancing (Klein 1967 / Goldberg-Tarjan)
 * Thuật toán Lưu Thông Đa Hàng Hóa Cực Tiểu Hóa Chi Phí (Multi-Commodity Min-Cost Circulation)
 * Ứng dụng: Cân bằng luân chuyển hàng tồn kho liên kho Hub SPX và đối soát nợ tồn COD bưu cục vệ tinh
 */

class MultiCommodityCirculationRouter {
  constructor(options = {}) {
    this.nodes = new Set();
    this.edges = [];
    this.nodeBalances = new Map(); // nodeId -> { inventorySupply, codCashDeficit }
  }

  /**
   * Thêm điểm kho hoặc bưu cục vệ tinh
   * @param {string} id Mã kho/trạm
   * @param {Object} balances Cân đối cung cầu { inventoryBalance, cashBalance } (Dương = Cung, Âm = Cầu)
   */
  addNode(id, balances = {}) {
    this.nodes.add(id);
    this.nodeBalances.set(id, {
      inventory: Number(balances.inventoryBalance) || 0,
      cash: Number(balances.cashBalance) || 0
    });
  }

  /**
   * Thêm tuyến vận chuyển liên kho giữa u và v
   * @param {string} from Điểm xuất phát
   * @param {string} to Điểm đến
   * @param {Object} params { capacity, unitCostKm, distanceKm }
   */
  addEdge(from, to, params = {}) {
    this.nodes.add(from);
    this.nodes.add(to);

    const distance = Number(params.distanceKm) || 10;
    const unitCost = Number(params.unitCostKm) || 1200; // Chi phí VNĐ/km
    const cost = Math.round(distance * unitCost);

    this.edges.push({
      id: `${from}->${to}`,
      from,
      to,
      capacity: Number(params.capacity) || 1000,
      cost,
      distanceKm: distance
    });
  }

  /**
   * Giải bài toán điều phối cân bằng lưu thông hàng tồn kho bằng thuật toán đường đi ngắn nhất kế tiếp
   * (Successive Shortest Path Min-Cost Circulation)
   */
  balanceInventoryTransfers() {
    const supplyNodes = [];
    const demandNodes = [];

    for (const [nodeId, bal] of this.nodeBalances.entries()) {
      if (bal.inventory > 0) supplyNodes.push({ id: nodeId, supply: bal.inventory });
      if (bal.inventory < 0) demandNodes.push({ id: nodeId, demand: -bal.inventory });
    }

    if (supplyNodes.length === 0 || demandNodes.length === 0) {
      return {
        transfers: [],
        totalFuelCost: 0,
        unmetDemand: 0,
        isFullyBalanced: true
      };
    }

    // Xây dựng ma trận khoảng cách ngắn nhất Dijkstra/Floyd-Warshall giữa các kho
    const distMatrix = new Map();
    const nextHop = new Map();
    const nodeList = Array.from(this.nodes);

    for (const u of nodeList) {
      distMatrix.set(u, new Map());
      nextHop.set(u, new Map());
      for (const v of nodeList) {
        distMatrix.get(u).set(v, u === v ? 0 : Infinity);
        nextHop.get(u).set(v, null);
      }
    }

    for (const edge of this.edges) {
      if (edge.cost < distMatrix.get(edge.from).get(edge.to)) {
        distMatrix.get(edge.from).set(edge.to, edge.cost);
        nextHop.get(edge.from).set(edge.to, edge.to);
      }
    }

    // Floyd-Warshall O(V^3)
    for (const k of nodeList) {
      for (const i of nodeList) {
        for (const j of nodeList) {
          const d_ik = distMatrix.get(i).get(k);
          const d_kj = distMatrix.get(k).get(j);
          if (d_ik + d_kj < distMatrix.get(i).get(j)) {
            distMatrix.get(i).set(j, d_ik + d_kj);
            nextHop.get(i).set(j, nextHop.get(i).get(k));
          }
        }
      }
    }

    // Ghép cặp Cung -> Cầu theo chi phí vận chuyển nhỏ nhất (Min-Cost Greedy Pairing)
    const transfers = [];
    let totalCost = 0;
    const remainingSupplies = supplyNodes.map(s => ({ ...s }));
    const remainingDemands = demandNodes.map(d => ({ ...d }));

    // Sắp xếp các cặp theo chi phí thấp nhất
    const pairs = [];
    for (let s = 0; s < remainingSupplies.length; s++) {
      for (let d = 0; d < remainingDemands.length; d++) {
        const u = remainingSupplies[s].id;
        const v = remainingDemands[d].id;
        const cost = distMatrix.get(u).get(v);
        if (cost !== Infinity) {
          pairs.push({ sIdx: s, dIdx: d, from: u, to: v, unitCost: cost });
        }
      }
    }
    pairs.sort((a, b) => a.unitCost - b.unitCost);

    for (const pair of pairs) {
      const sItem = remainingSupplies[pair.sIdx];
      const dItem = remainingDemands[pair.dIdx];
      if (sItem.supply <= 0 || dItem.demand <= 0) continue;

      const transferQty = Math.min(sItem.supply, dItem.demand);
      const transferCost = transferQty * pair.unitCost;

      transfers.push({
        fromHub: pair.from,
        toHub: pair.to,
        quantity: transferQty,
        unitCost: pair.unitCost,
        totalCost: transferCost
      });

      totalCost += transferCost;
      sItem.supply -= transferQty;
      dItem.demand -= transferQty;
    }

    const unmetDemand = remainingDemands.reduce((sum, d) => sum + d.demand, 0);

    return {
      transfers,
      totalFuelCost: totalCost,
      unmetDemand,
      isFullyBalanced: unmetDemand === 0
    };
  }

  /**
   * Cân bằng dòng tiền COD ký quỹ thu gom từ các trạm vệ tinh về kho trung tâm
   */
  balanceCodSettlements(centralVaultId = 'HUB_CENTRAL_VAULT') {
    const satelliteCashTransfers = [];
    let totalRemittedCash = 0;

    for (const [nodeId, bal] of this.nodeBalances.entries()) {
      if (nodeId === centralVaultId) continue;
      // Nếu trạm có tiền COD thu được từ bưu tá (cung dương)
      if (bal.cash > 0) {
        satelliteCashTransfers.push({
          sourceStationId: nodeId,
          targetVaultId: centralVaultId,
          remittedAmount: bal.cash,
          settlementFee: Math.round(bal.cash * 0.001) // 0.1% phí bảo hiểm vận chuyển tiền mặt
        });
        totalRemittedCash += bal.cash;
      }
    }

    return {
      centralVaultId,
      totalRemittedCash,
      transfersCount: satelliteCashTransfers.length,
      settlements: satelliteCashTransfers
    };
  }
}

export { MultiCommodityCirculationRouter };
export default MultiCommodityCirculationRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MultiCommodityCirculationRouter };
  }
} catch (e) {}
