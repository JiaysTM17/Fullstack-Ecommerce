/**
 * Count-Min-Log Sketch (CML Sketch)
 * (Guillaume Pitel & Geoffroy Savin, 2014)
 * Phase 46 Server Utility Module
 */

class CountMinLogSketch {
  constructor(options = {}) {
    this.depth = options.depth || 4;
    this.width = options.width || 1024;
    this.gamma = options.gamma || 1.08;
    this.table = Array.from({ length: this.depth }, () => new Uint8Array(this.width));
  }

  _hash(key, seed = 0) {
    let h = 0x811c9dc5 ^ seed;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      let k = str.charCodeAt(i);
      k = Math.imul(k, 0xcc9e2d51);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, 0x1b873593);
      h ^= k;
      h = (h << 13) | (h >>> 19);
      h = Math.imul(h, 5) + 0xe6546b64;
    }
    h ^= str.length;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) % this.width;
  }

  _logValueToFrequency(c) {
    if (c === 0) return 0;
    return Math.round((Math.pow(this.gamma, c) - 1) / (this.gamma - 1));
  }

  add(item, count = 1) {
    if (!item || count <= 0) return;

    for (let c = 0; c < count; c++) {
      for (let i = 0; i < this.depth; i++) {
        const col = this._hash(item, i * 7919 + 31);
        const currentVal = this.table[i][col];

        if (currentVal < 255) {
          const p = Math.pow(this.gamma, -currentVal);
          if (Math.random() < p) {
            this.table[i][col]++;
          }
        }
      }
    }
  }

  estimate(item) {
    if (!item) return 0;

    let minLogVal = 255;
    for (let i = 0; i < this.depth; i++) {
      const col = this._hash(item, i * 7919 + 31);
      const val = this.table[i][col];
      if (val < minLogVal) {
        minLogVal = val;
      }
    }

    return this._logValueToFrequency(minLogVal);
  }

  getStats() {
    let nonZeroCells = 0;
    const totalCells = this.depth * this.width;

    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.table[i][j] > 0) nonZeroCells++;
      }
    }

    const memoryBytes = totalCells;
    const standardCmBytes = totalCells * 4;

    return {
      depth: this.depth,
      width: this.width,
      gamma: this.gamma,
      totalCells,
      nonZeroCells,
      sparsityRatio: Number(((totalCells - nonZeroCells) / totalCells).toFixed(4)),
      memoryBytes,
      memorySavingsPercent: Number(((1 - memoryBytes / standardCmBytes) * 100).toFixed(1))
    };
  }

  reset() {
    for (let i = 0; i < this.depth; i++) {
      this.table[i].fill(0);
    }
  }
}

export { CountMinLogSketch };
export default CountMinLogSketch;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CountMinLogSketch };
  }
} catch (e) {}
