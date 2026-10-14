/**
 * Locality-Sensitive Hashing with Hyperplane Random Projections (Cosine LSH / SimHash)
 * Charikar (2002) / Goemans & Williamson (1995)
 *
 * Applications in E-Commerce:
 * 1. O(1) detection of near-duplicate catalog listings and copy-pasted storefront items.
 * 2. Compresses high-dimensional text/image embeddings (e.g. 64-dim) into compact 64-bit binary signatures.
 * 3. Hamming distance between signatures approximates Cosine angle:
 *    Pr[h(u) = h(v)] = 1 - arccos(cos(u, v)) / pi
 */

class CosineLshSignatures {
  /**
   * @param {Object} options
   * @param {number} [options.dim=16]      - Dimension of feature vectors
   * @param {number} [options.numBits=32]   - Length of binary signature (number of random hyperplanes)
   * @param {number} [options.numTables=4]  - Number of LSH hash tables (bands) for sub-linear candidate lookup
   */
  constructor(options = {}) {
    this.dim = Math.max(2, options.dim || 16);
    this.numBits = Math.max(8, options.numBits || 32);
    this.numTables = Math.max(1, options.numTables || 4);

    // Generate random hyperplanes sampled from standard normal distribution
    this.hyperplanes = this._generateHyperplanes();

    // Multi-table hash buckets: tableIndex -> Map(bucketKey -> Set(itemId))
    this.tables = Array.from({ length: this.numTables }, () => new Map());
    this.itemSignatures = new Map(); // itemId -> BigInt signature
    this.itemMetadata = new Map();   // itemId -> Object
  }

  /**
   * Box-Muller transform for standard Gaussian random numbers
   * @returns {number}
   */
  _gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Generate random hyperplanes
   * @returns {Array<Array<number>>}
   */
  _generateHyperplanes() {
    const planes = [];
    for (let i = 0; i < this.numBits; i++) {
      const plane = [];
      let norm = 0;
      for (let d = 0; d < this.dim; d++) {
        const val = this._gaussianRandom();
        plane.push(val);
        norm += val * val;
      }
      norm = Math.sqrt(norm) || 1;
      planes.push(plane.map(v => v / norm));
    }
    return planes;
  }

  /**
   * Compute binary signature from vector
   * Bit i is 1 if vector is on the positive side of hyperplane i, else 0
   * @param {Array<number>} vector
   * @returns {BigInt}
   */
  computeSignature(vector) {
    let signature = 0n;
    for (let i = 0; i < this.numBits; i++) {
      const plane = this.hyperplanes[i];
      let dot = 0;
      const len = Math.min(plane.length, vector.length);
      for (let d = 0; d < len; d++) {
        dot += plane[d] * vector[d];
      }
      if (dot >= 0) {
        signature |= (1n << BigInt(i));
      }
    }
    return signature;
  }

  /**
   * Compute Hamming distance between two binary signatures
   * @param {BigInt} sig1
   * @param {BigInt} sig2
   * @returns {number}
   */
  hammingDistance(sig1, sig2) {
    let xor = sig1 ^ sig2;
    let dist = 0;
    while (xor > 0n) {
      if ((xor & 1n) === 1n) dist++;
      xor >>= 1n;
    }
    return dist;
  }

  /**
   * Estimate Cosine similarity from Hamming distance
   * sim = cos(dist * pi / numBits)
   * @param {number} hammingDist
   * @returns {number}
   */
  estimateCosineSimilarity(hammingDist) {
    const angle = (hammingDist * Math.PI) / this.numBits;
    return Math.cos(angle);
  }

  /**
   * Add an item to the index
   * @param {string} id
   * @param {Array<number>} vector
   * @param {Object} [metadata]
   */
  add(id, vector, metadata = {}) {
    const itemId = String(id);
    const signature = this.computeSignature(vector);
    this.itemSignatures.set(itemId, signature);
    this.itemMetadata.set(itemId, metadata);

    // Insert into LSH tables (partition signature bits into bands)
    const bitsPerTable = Math.floor(this.numBits / this.numTables);
    for (let t = 0; t < this.numTables; t++) {
      const shift = BigInt(t * bitsPerTable);
      const mask = (1n << BigInt(bitsPerTable)) - 1n;
      const bucketKey = Number((signature >> shift) & mask);

      if (!this.tables[t].has(bucketKey)) {
        this.tables[t].set(bucketKey, new Set());
      }
      this.tables[t].get(bucketKey).add(itemId);
    }
  }

  /**
   * Query for nearest near-duplicate items
   * @param {Array<number>} queryVector
   * @param {number} [maxHammingDistance=3] - Maximum bit differences to consider near-duplicate
   * @returns {Array<{id: string, hammingDistance: number, estimatedSimilarity: number, metadata: Object}>}
   */
  findDuplicates(queryVector, maxHammingDistance = 3) {
    const querySig = this.computeSignature(queryVector);
    const candidateIds = new Set();

    // Gather candidate items from matching buckets across all LSH tables
    const bitsPerTable = Math.floor(this.numBits / this.numTables);
    for (let t = 0; t < this.numTables; t++) {
      const shift = BigInt(t * bitsPerTable);
      const mask = (1n << BigInt(bitsPerTable)) - 1n;
      const bucketKey = Number((querySig >> shift) & mask);

      const bucket = this.tables[t].get(bucketKey);
      if (bucket) {
        for (const id of bucket) {
          candidateIds.add(id);
        }
      }
    }

    const results = [];
    for (const id of candidateIds) {
      const sig = this.itemSignatures.get(id);
      const dist = this.hammingDistance(querySig, sig);
      if (dist <= maxHammingDistance) {
        results.push({
          id,
          hammingDistance: dist,
          estimatedSimilarity: Math.round(this.estimateCosineSimilarity(dist) * 10000) / 10000,
          metadata: this.itemMetadata.get(id) || {},
        });
      }
    }

    return results.sort((a, b) => a.hammingDistance - b.hammingDistance);
  }

  /**
   * Index statistics
   */
  getStats() {
    return {
      totalItems: this.itemSignatures.size,
      dimension: this.dim,
      numBits: this.numBits,
      numTables: this.numTables,
    };
  }
}

export { CosineLshSignatures };
export default CosineLshSignatures;
