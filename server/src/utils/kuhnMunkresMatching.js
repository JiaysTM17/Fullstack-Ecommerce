/**
 * Kuhn-Munkres (Hungarian Algorithm) for Maximum Weight Bipartite Matching
 * Applications: Optimal assignment of SPX Couriers to High-Priority Flash Sale Deliveries,
 * minimizing SLA delay penalties while maximizing fulfillment satisfaction and workload fairness.
 * Complexity: O(N^3) with slack optimization.
 */

class KuhnMunkresMatching {
  /**
   * @param {Object} options
   * @param {number} [options.workloadFairnessFactor=0.1] - Penalty factor for overloading couriers
   */
  constructor(options = {}) {
    this.workloadFairnessFactor = options.workloadFairnessFactor || 0.1;
    this.workers = []; // e.g. Couriers
    this.tasks = [];   // e.g. Deliveries / Orders
    this.costMatrix = []; // weights/scores
  }

  /**
   * Set workers (couriers)
   * @param {Array<string|Object>} workers
   */
  setWorkers(workers) {
    this.workers = workers.map(w => (typeof w === "string" ? { id: w, name: w } : w));
  }

  /**
   * Set tasks (deliveries)
   * @param {Array<string|Object>} tasks
   */
  setTasks(tasks) {
    this.tasks = tasks.map(t => (typeof t === "string" ? { id: t, name: t } : t));
  }

  /**
   * Compute weight between worker and task
   * w(i, j) = BaseScore + TrustBonus - (DistanceKm * DistWeight) - (Workload * FairnessFactor)
   * @param {Object} worker
   * @param {Object} task
   * @returns {number}
   */
  calculateWeight(worker, task) {
    let score = 100.0;

    // SLA Rating bonus
    if (worker.rating) {
      score += (worker.rating - 4.0) * 20.0;
    }

    // Distance penalty
    if (worker.lat !== undefined && worker.lng !== undefined && task.lat !== undefined && task.lng !== undefined) {
      const dLat = worker.lat - task.lat;
      const dLng = worker.lng - task.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111.0; // approx km
      score -= dist * 3.0; // 3 points deduction per km
    } else if (task.distanceKm) {
      score -= task.distanceKm * 3.0;
    }

    // Priority bonus
    if (task.priority === "URGENT_2H" || task.isFlashSale) {
      score += 30.0;
    }

    // Workload fairness penalty
    const activeTasks = worker.activeTasksCount || 0;
    score -= activeTasks * (this.workloadFairnessFactor * 50.0);

    return Math.max(0.1, score);
  }

  /**
   * Build the NxN bipartite weight matrix
   */
  buildMatrix() {
    const n = Math.max(this.workers.length, this.tasks.length);
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < this.workers.length; i++) {
      for (let j = 0; j < this.tasks.length; j++) {
        matrix[i][j] = this.calculateWeight(this.workers[i], this.tasks[j]);
      }
    }
    this.costMatrix = matrix;
    return matrix;
  }

  /**
   * Execute Kuhn-Munkres (Hungarian) Maximum Weight Bipartite Matching
   * Returns optimal 1-1 assignment with total score and dual labels.
   */
  solve() {
    if (this.workers.length === 0 || this.tasks.length === 0) {
      return { matches: [], totalWeight: 0, unassignedWorkers: [], unassignedTasks: [] };
    }

    const n = Math.max(this.workers.length, this.tasks.length);
    const cost = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < this.workers.length; i++) {
      for (let j = 0; j < this.tasks.length; j++) {
        cost[i][j] = this.calculateWeight(this.workers[i], this.tasks[j]);
      }
    }

    // Dual feasible labels
    const lx = Array(n).fill(0);
    const ly = Array(n).fill(0);
    const matchY = Array(n).fill(-1); // matchY[j] = worker assigned to task j
    const matchX = Array(n).fill(-1); // matchX[i] = task assigned to worker i

    // Initialize lx[i] = max_j cost[i][j]
    for (let i = 0; i < n; i++) {
      let maxVal = 0;
      for (let j = 0; j < n; j++) {
        if (cost[i][j] > maxVal) maxVal = cost[i][j];
      }
      lx[i] = maxVal;
    }

    const slack = Array(n).fill(0);
    const slackX = Array(n).fill(0);
    const prev = Array(n).fill(-1);
    const visX = Array(n).fill(false);
    const visY = Array(n).fill(false);

    for (let root = 0; root < n; root++) {
      visX.fill(false);
      visY.fill(false);
      prev.fill(-1);

      for (let j = 0; j < n; j++) {
        slack[j] = lx[root] + ly[j] - cost[root][j];
        slackX[j] = root;
      }

      let yMatched = -1;
      let xCur = root;

      while (true) {
        visX[xCur] = true;
        let delta = Infinity;
        let yNext = -1;

        for (let j = 0; j < n; j++) {
          if (!visY[j]) {
            if (slack[j] < delta) {
              delta = slack[j];
              yNext = j;
            }
          }
        }

        if (delta > 0) {
          for (let i = 0; i < n; i++) {
            if (visX[i]) lx[i] -= delta;
          }
          for (let j = 0; j < n; j++) {
            if (visY[j]) ly[j] += delta;
            else slack[j] -= delta;
          }
        }

        visY[yNext] = true;
        prev[yNext] = slackX[yNext];

        if (matchY[yNext] === -1) {
          yMatched = yNext;
          break;
        }

        xCur = matchY[yNext];
        for (let j = 0; j < n; j++) {
          if (!visY[j]) {
            const curSlack = lx[xCur] + ly[j] - cost[xCur][j];
            if (curSlack < slack[j]) {
              slack[j] = curSlack;
              slackX[j] = xCur;
            }
          }
        }
      }

      // Augment matching
      while (yMatched !== -1) {
        const xPrev = prev[yMatched];
        const nextY = matchX[xPrev];
        matchY[yMatched] = xPrev;
        matchX[xPrev] = yMatched;
        yMatched = nextY;
      }
    }

    const matches = [];
    let totalWeight = 0;
    const assignedWorkers = new Set();
    const assignedTasks = new Set();

    for (let i = 0; i < this.workers.length; i++) {
      const taskIdx = matchX[i];
      if (taskIdx >= 0 && taskIdx < this.tasks.length && cost[i][taskIdx] > 0) {
        const worker = this.workers[i];
        const task = this.tasks[taskIdx];
        const weight = cost[i][taskIdx];
        matches.push({
          workerId: worker.id,
          workerName: worker.name,
          taskId: task.id,
          taskName: task.name,
          weight: Math.round(weight * 100) / 100,
        });
        totalWeight += weight;
        assignedWorkers.add(worker.id);
        assignedTasks.add(task.id);
      }
    }

    const unassignedWorkers = this.workers.filter(w => !assignedWorkers.has(w.id));
    const unassignedTasks = this.tasks.filter(t => !assignedTasks.has(t.id));

    return {
      matches,
      totalWeight: Math.round(totalWeight * 100) / 100,
      unassignedWorkers,
      unassignedTasks,
      isPerfect: matches.length === Math.min(this.workers.length, this.tasks.length),
    };
  }
}

export { KuhnMunkresMatching };
export default KuhnMunkresMatching;
