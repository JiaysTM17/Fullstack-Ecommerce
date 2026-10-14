/**
 * Wavelet Matrix (Rank-Select Succinct Indexing) for Enterprise E-Commerce Analytics
 * 
 * Provides succinct data structure for real-time order pricing / customer ratings
 * and range quantile / range frequency queries in O(log Sigma) time where Sigma is alphabet size.
 */

class BitVector {
  constructor(bits = []) {
    this.bits = bits.slice();
    this.prefixPopcount = new Int32Array(this.bits.length + 1);
    let count = 0;
    for (let i = 0; i < this.bits.length; i++) {
      this.prefixPopcount[i] = count;
      if (this.bits[i] === 1) count++;
    }
    this.prefixPopcount[this.bits.length] = count;
    this.totalOnes = count;
  }

  access(pos) {
    if (pos < 0 || pos >= this.bits.length) return 0;
    return this.bits[pos];
  }

  rank1(pos) {
    if (pos <= 0) return 0;
    if (pos >= this.bits.length) return this.totalOnes;
    return this.prefixPopcount[pos];
  }

  rank0(pos) {
    if (pos <= 0) return 0;
    const clampedPos = Math.min(pos, this.bits.length);
    return clampedPos - this.rank1(clampedPos);
  }

  select1(k) {
    if (k <= 0 || k > this.totalOnes) return -1;
    let low = 0, high = this.bits.length;
    let ans = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.rank1(mid) >= k) {
        ans = mid - 1;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  select0(k) {
    const totalZeroes = this.bits.length - this.totalOnes;
    if (k <= 0 || k > totalZeroes) return -1;
    let low = 0, high = this.bits.length;
    let ans = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.rank0(mid) >= k) {
        ans = mid - 1;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }
}

class WaveletMatrixIndex {
  /**
   * @param {Array<number>} data - Array of integer values (e.g. 0..maxVal)
   * @param {number} maxAlphabet - Upper bound on alphabet (default 256)
   */
  constructor(data = [], maxAlphabet = 256) {
    this.length = data.length;
    this.maxAlphabet = Math.max(2, maxAlphabet);
    this.numLevels = Math.ceil(Math.log2(this.maxAlphabet));
    this.layers = [];
    this.zeroCounts = [];

    this._build(data);
  }

  _build(data) {
    if (this.length === 0) {
      for (let d = this.numLevels - 1; d >= 0; d--) {
        this.layers.push(new BitVector([]));
        this.zeroCounts.push(0);
      }
      return;
    }

    let current = data.map((val) => Math.max(0, Math.floor(val)));

    for (let d = this.numLevels - 1; d >= 0; d--) {
      const bitMask = 1 << d;
      const bits = new Array(this.length);
      const zeroes = [];
      const ones = [];

      for (let i = 0; i < this.length; i++) {
        const bit = (current[i] & bitMask) !== 0 ? 1 : 0;
        bits[i] = bit;
        if (bit === 0) {
          zeroes.push(current[i]);
        } else {
          ones.push(current[i]);
        }
      }

      this.layers.push(new BitVector(bits));
      this.zeroCounts.push(zeroes.length);
      current = zeroes.concat(ones);
    }
  }

  /**
   * Access element at original 0-based position
   */
  access(pos) {
    if (pos < 0 || pos >= this.length) return null;
    let curPos = pos;
    let val = 0;

    for (let l = 0; l < this.numLevels; l++) {
      const bitVec = this.layers[l];
      const zCount = this.zeroCounts[l];
      const bit = bitVec.access(curPos);
      const d = this.numLevels - 1 - l;

      if (bit === 1) {
        val |= (1 << d);
        curPos = zCount + bitVec.rank1(curPos);
      } else {
        curPos = bitVec.rank0(curPos);
      }
    }
    return val;
  }

  /**
   * Return occurrences of val in prefix data[0..pos-1]
   */
  rank(val, pos) {
    if (pos <= 0 || this.length === 0) return 0;
    if (val < 0 || val >= this.maxAlphabet) return 0;

    let curPos = Math.min(pos, this.length);
    for (let l = 0; l < this.numLevels; l++) {
      const bitVec = this.layers[l];
      const zCount = this.zeroCounts[l];
      const d = this.numLevels - 1 - l;
      const bit = (val & (1 << d)) !== 0 ? 1 : 0;

      if (bit === 1) {
        curPos = zCount + bitVec.rank1(curPos);
      } else {
        curPos = bitVec.rank0(curPos);
      }
    }

    let start = 0;
    for (let l = 0; l < this.numLevels; l++) {
      const bitVec = this.layers[l];
      const zCount = this.zeroCounts[l];
      const d = this.numLevels - 1 - l;
      const bit = (val & (1 << d)) !== 0 ? 1 : 0;
      if (bit === 1) {
        start = zCount + bitVec.rank1(start);
      } else {
        start = bitVec.rank0(start);
      }
    }

    return Math.max(0, curPos - start);
  }

  /**
   * Return number of elements in range [left, right] with value val
   */
  countInRange(val, left, right) {
    if (left > right) return 0;
    return this.rank(val, right + 1) - this.rank(val, left);
  }

  /**
   * Return k-th smallest element (0-indexed) in data[left..right]
   */
  quantile(left, right, k) {
    const lClamped = Math.max(0, left);
    const rClamped = Math.min(this.length - 1, right);
    if (lClamped > rClamped || k < 0 || k > (rClamped - lClamped)) return null;

    let curLeft = lClamped;
    let curRight = rClamped + 1; // half-open [curLeft, curRight)
    let curK = k;
    let val = 0;

    for (let l = 0; l < this.numLevels; l++) {
      const bitVec = this.layers[l];
      const zCount = this.zeroCounts[l];
      const d = this.numLevels - 1 - l;

      const zerosLeft = bitVec.rank0(curLeft);
      const zerosRight = bitVec.rank0(curRight);
      const zerosInRange = zerosRight - zerosLeft;

      if (curK < zerosInRange) {
        curLeft = zerosLeft;
        curRight = zerosRight;
      } else {
        val |= (1 << d);
        curK -= zerosInRange;
        const onesLeft = bitVec.rank1(curLeft);
        const onesRight = bitVec.rank1(curRight);
        curLeft = zCount + onesLeft;
        curRight = zCount + onesRight;
      }
    }

    return val;
  }

  /**
   * Range Frequency: Count items in data[left..right] where minVal <= x <= maxVal
   */
  rangeFreq(left, right, minVal, maxVal) {
    if (left > right || minVal > maxVal) return 0;
    const lClamped = Math.max(0, left);
    const rClamped = Math.min(this.length - 1, right);
    if (lClamped > rClamped) return 0;

    const countLessOrEqual = (boundary) => {
      if (boundary < 0) return 0;
      if (boundary >= this.maxAlphabet - 1) return rClamped - lClamped + 1;

      let curLeft = lClamped;
      let curRight = rClamped + 1;
      let count = 0;

      for (let l = 0; l < this.numLevels; l++) {
        const bitVec = this.layers[l];
        const zCount = this.zeroCounts[l];
        const d = this.numLevels - 1 - l;
        const bit = (boundary & (1 << d)) !== 0 ? 1 : 0;

        const zerosLeft = bitVec.rank0(curLeft);
        const zerosRight = bitVec.rank0(curRight);
        const zerosInRange = zerosRight - zerosLeft;

        if (bit === 1) {
          count += zerosInRange;
          const onesLeft = bitVec.rank1(curLeft);
          const onesRight = bitVec.rank1(curRight);
          curLeft = zCount + onesLeft;
          curRight = zCount + onesRight;
        } else {
          curLeft = zerosLeft;
          curRight = zerosRight;
        }
      }
      count += (curRight - curLeft);
      return count;
    };

    return countLessOrEqual(maxVal) - countLessOrEqual(minVal - 1);
  }
}

export { BitVector, WaveletMatrixIndex };
export default WaveletMatrixIndex;
