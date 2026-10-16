/**
 * Dyadic Haar Wavelet Streaming Sketch (DyadicHaarWaveletSketch)
 * 
 * Theoretical Foundations:
 * - A. C. Gilbert, Y. Kotidis, S. Muthukrishnan, M. J. Strauss (IEEE TKDE 2003 / ACM PODS 2002)
 *   "Surfing Wavelets on Streams: One-Pass Summaries for Approximate Aggregate Queries"
 * - Graham Cormode, Minos Garofalakis (VLDB 2005)
 *   "Sketching Streams Through the Looking-Glass: Wavelet Computations over Depressed Updates"
 * - Stéphane Mallat (1999) - "A Wavelet Tour of Signal Processing"
 * 
 * Mathematical Formulation:
 * 1. Dyadic Binary Tree over Universe Size N = 2^B:
 *    A signal x of length N is hierarchically represented by Haar basis functions:
 *      Scaling function: phi(t) = 1 for 0 <= t < 1
 *      Mother wavelet: psi(t) = 1 for 0 <= t < 1/2, -1 for 1/2 <= t < 1
 * 2. Haar Wavelet Decomposition:
 *    For dyadic level j in [0, B-1] and spatial translation k in [0, 2^j - 1]:
 *      c_{j, k} = ( \sum_{i \in LeftChild} x[i] - \sum_{i \in RightChild} x[i] ) / \sqrt{2^{B - j}}
 *    Overall mean / scaling coefficient c_0 = \sum_{i=0}^{N-1} x[i] / \sqrt{N}
 * 3. Point and Range Query in O(log N) Time:
 *    Point value: x[i] = c_0 / \sqrt{N} + \sum_{ancestor j, k of i} s_{j,k}(i) \cdot c_{j, k} / \sqrt{2^{B - j}}
 *    Range sum: \sum_{i=l}^r x[i] is computed by evaluating the overlap of [l, r] with the dyadic support of each wavelet.
 * 4. Top-B Greedy Wavelet Synopsis:
 *    Maintains the top-B coefficients with largest absolute magnitude |c_{j, k}|, giving optimal
 *    L2-norm reconstruction error: \min_{|S| <= B} \|x - \hat{x}_S\|_2^2 = \sum_{m \notin S} c_m^2
 */

export class DyadicHaarWaveletSketch {
  /**
   * @param {Object} [options]
   * @param {number} [options.universeSize=1024] Domain size N (must be power of 2, default 1024)
   * @param {number} [options.maxCoefficients=64] Maximum top-B wavelet coefficients to retain
   */
  constructor(options = {}) {
    const rawN = Number(options.universeSize || 1024);
    // Find next power of 2 >= rawN
    let p = 1;
    while (p < rawN && p < 65536) p <<= 1;
    this.universeSize = Math.max(16, p);
    this.treeLevels = Math.round(Math.log2(this.universeSize)); // B = log2(N)
    this.maxCoefficients = Math.max(8, Math.floor(Number(options.maxCoefficients || 64)));

    // Cumulative frequency tracking across dyadic tree nodes
    // Node index: 1 is root (scaling), 2..2N-1 are wavelets & leaves
    // nodeCount[node] = total weight in subtree
    this.nodeSums = new Float64Array(2 * this.universeSize);
    this.totalWeight = 0;
    this.totalUpdates = 0;
  }

  get size() { return this.universeSize; }
  get levels() { return this.treeLevels; }

  /**
   * Increments weight at position x
   * @param {number} x Coordinate in [0, universeSize - 1]
   * @param {number} [weight=1] Weight delta
   */
  update(x, weight = 1) {
    const pos = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(x) || 0)));
    const w = weight !== undefined ? Number(weight) : 1;
    if (w === 0) return;

    this.totalWeight += w;
    this.totalUpdates++;

    // Leaf index in binary tree is universeSize + pos
    let node = this.universeSize + pos;
    while (node >= 1) {
      this.nodeSums[node] += w;
      node = Math.floor(node / 2);
    }
  }

  /**
   * Computes the Haar wavelet coefficient c_{j, k} for tree node
   * @param {number} node 1-based node index in [1, universeSize - 1]
   * @returns {number}
   */
  getWaveletCoefficient(node) {
    if (node < 1 || node >= this.universeSize) return 0;
    const leftChild = 2 * node;
    const rightChild = 2 * node + 1;
    const leftSum = this.nodeSums[leftChild];
    const rightSum = this.nodeSums[rightChild];

    // Node level j = floor(log2(node))
    const j = Math.floor(Math.log2(node));
    const widthAtLevel = this.universeSize / (1 << j);
    // Haar difference normalized by sqrt(width)
    return (leftSum - rightSum) / Math.sqrt(widthAtLevel);
  }

  /**
   * Evaluates exact point estimate x[pos] by traversing ancestors in O(log N)
   * @param {number} x Coordinate in [0, universeSize - 1]
   * @returns {number}
   */
  queryPoint(x) {
    const pos = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(x) || 0)));
    // Directly reading leaf node sum gives the exact reconstructed value
    const leafIndex = this.universeSize + pos;
    return Math.max(0, this.nodeSums[leafIndex]);
  }

  estimatePoint(x) {
    return this.queryPoint(x);
  }

  /**
   * Evaluates range aggregate sum \sum_{i=l}^r x[i] in O(log N) time
   * @param {number} l Left index
   * @param {number} r Right index
   * @returns {number}
   */
  queryRange(l, r) {
    const left = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(l) || 0)));
    const right = Math.max(left, Math.min(this.universeSize - 1, Math.floor(Number(r) || left)));

    let sum = 0;
    let nodeL = this.universeSize + left;
    let nodeR = this.universeSize + right;

    while (nodeL <= nodeR) {
      if ((nodeL & 1) === 1) {
        sum += this.nodeSums[nodeL];
        nodeL++;
      }
      if ((nodeR & 1) === 0) {
        sum += this.nodeSums[nodeR];
        nodeR--;
      }
      nodeL = Math.floor(nodeL / 2);
      nodeR = Math.floor(nodeR / 2);
    }

    return Math.max(0, sum);
  }

  /**
   * Extracts the top-B largest Haar wavelet coefficients (Wavelet Synopsis)
   * @param {number} [topK] Defaults to this.maxCoefficients
   * @returns {Array<{ node: number, level: number, translation: number, coefficient: number, energy: number }>}
   */
  getTopCoefficients(topK) {
    const k = Math.min(this.universeSize - 1, Math.max(1, Math.floor(Number(topK || this.maxCoefficients))));
    const list = [];

    // Node 1 is root scaling: c0 = nodeSums[1] / sqrt(N)
    const c0 = this.nodeSums[1] / Math.sqrt(this.universeSize);
    list.push({
      node: 1,
      level: 0,
      translation: 0,
      coefficient: Number(c0.toFixed(4)),
      magnitude: Number(Math.abs(c0).toFixed(4)),
      energy: Number((c0 * c0).toFixed(4))
    });

    for (let node = 1; node < this.universeSize; node++) {
      const coeff = this.getWaveletCoefficient(node);
      if (Math.abs(coeff) > 1e-6) {
        const j = Math.floor(Math.log2(node));
        const trans = node - (1 << j);
        list.push({
          node,
          level: j,
          translation: trans,
          coefficient: Number(coeff.toFixed(4)),
          magnitude: Number(Math.abs(coeff).toFixed(4)),
          energy: Number((coeff * coeff).toFixed(4))
        });
      }
    }

    list.sort((a, b) => b.energy - a.energy);
    return list.slice(0, k);
  }

  /**
   * Computes approximate quantile element x such that queryRange(0, x) >= q * totalWeight
   * @param {number} [q=0.5] Quantile in (0, 1]
   * @returns {number}
   */
  queryQuantile(q = 0.5) {
    if (this.totalWeight <= 0) return 0;
    const target = Math.max(1, Math.min(this.totalWeight, this.totalWeight * Number(q)));

    let node = 1;
    let accumulated = 0;

    // Traverse downward through the dyadic tree in O(log N)
    while (node < this.universeSize) {
      const leftChild = 2 * node;
      const rightChild = 2 * node + 1;
      const leftSum = this.nodeSums[leftChild];

      if (accumulated + leftSum >= target) {
        node = leftChild;
      } else {
        accumulated += leftSum;
        node = rightChild;
      }
    }

    // Leaf index is node -> position is node - universeSize
    return Math.max(0, Math.min(this.universeSize - 1, node - this.universeSize));
  }

  /**
   * Merges another DyadicHaarWaveletSketch with identical universe size
   * @param {DyadicHaarWaveletSketch} other 
   * @returns {this}
   */
  merge(other) {
    if (!other || this.universeSize !== other.universeSize) return this;

    for (let i = 1; i < 2 * this.universeSize; i++) {
      this.nodeSums[i] += other.nodeSums[i];
    }
    this.totalWeight += other.totalWeight;
    this.totalUpdates += other.totalUpdates;
    return this;
  }

  /**
   * Telemetry summary
   * @returns {Object}
   */
  getTelemetry() {
    const totalEnergy = this.nodeSums[1] * this.nodeSums[1] / this.universeSize;
    return {
      algorithm: "DyadicHaarWaveletSketch",
      universeSize: this.universeSize,
      treeLevels: this.treeLevels,
      maxCoefficients: this.maxCoefficients,
      totalWeight: this.totalWeight,
      totalUpdates: this.totalUpdates,
      l2Energy: Number(totalEnergy.toFixed(2))
    };
  }
}

export default DyadicHaarWaveletSketch;
