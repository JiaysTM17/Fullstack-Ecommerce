/**
 * Cuckoo Hashing with Stash & Bidirectional Eviction
 * Pagh & Rodler (2001) / Kirsch, Mitzenmacher & Wieder (2008)
 *
 * Applications in E-Commerce:
 * 1. Strict O(1) Worst-Case Read Latency for Flash Sale hot product prices and inventory cache.
 * 2. Never suffers from hash bucket clustering or chain degradation under heavy read load.
 * 3. Stash buffer (s = 4) drastically reduces rehashing probability to ~O(1/N^2).
 */

class CuckooStashTable {
  /**
   * @param {Object} options
   * @param {number} [options.capacity=128] - Number of slots in each of the two sub-tables
   * @param {number} [options.stashSize=4]   - Capacity of the auxiliary stash buffer
   * @param {number} [options.maxKicks=500]  - Max displacements before pushing to stash
   */
  constructor(options = {}) {
    this.capacity = Math.max(16, options.capacity || 128);
    this.stashSize = Math.max(2, options.stashSize || 4);
    this.maxKicks = options.maxKicks || 500;

    this.table1 = Array(this.capacity).fill(null);
    this.table2 = Array(this.capacity).fill(null);
    this.stash = []; // Array<{ key, value }>
    this.size = 0;

    // Seeds for two independent 32-bit hash functions
    this.seed1 = 0x9e3779b9;
    this.seed2 = 0x85ebca6b;
  }

  /**
   * Murmur-style 32-bit hash for table 1
   * @param {string} key
   * @returns {number}
   */
  _hash1(key) {
    let h = this.seed1 ^ key.length;
    for (let i = 0; i < key.length; i++) {
      h = Math.imul(h ^ key.charCodeAt(i), 0x5bd1e995);
      h ^= h >>> 15;
    }
    return (h >>> 0) % this.capacity;
  }

  /**
   * FNV-1a-style 32-bit hash for table 2
   * @param {string} key
   * @returns {number}
   */
  _hash2(key) {
    let h = this.seed2;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) % this.capacity;
  }

  /**
   * Strict O(1) worst-case lookup: checks T1, T2, then small constant stash
   * @param {string} key
   * @returns {*} value or undefined
   */
  get(key) {
    const k = String(key);

    // 1. Check Table 1
    const idx1 = this._hash1(k);
    const entry1 = this.table1[idx1];
    if (entry1 && entry1.key === k) {
      return entry1.value;
    }

    // 2. Check Table 2
    const idx2 = this._hash2(k);
    const entry2 = this.table2[idx2];
    if (entry2 && entry2.key === k) {
      return entry2.value;
    }

    // 3. Check Stash (constant size <= 4)
    for (let i = 0; i < this.stash.length; i++) {
      if (this.stash[i].key === k) {
        return this.stash[i].value;
      }
    }

    return undefined;
  }

  /**
   * Check key existence
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Insert or update key-value pair using cuckoo displacement kicks
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  set(key, value) {
    const k = String(key);

    // If key already exists in T1, update in place
    const idx1 = this._hash1(k);
    if (this.table1[idx1] && this.table1[idx1].key === k) {
      this.table1[idx1].value = value;
      return true;
    }

    // If key already exists in T2, update in place
    const idx2 = this._hash2(k);
    if (this.table2[idx2] && this.table2[idx2].key === k) {
      this.table2[idx2].value = value;
      return true;
    }

    // If key already exists in stash, update in place
    for (let i = 0; i < this.stash.length; i++) {
      if (this.stash[i].key === k) {
        this.stash[i].value = value;
        return true;
      }
    }

    // New item insertion with cuckoo displacement
    let cur = { key: k, value };
    let curTable = 1;

    for (let kick = 0; kick < this.maxKicks; kick++) {
      if (curTable === 1) {
        const pos = this._hash1(cur.key);
        const existing = this.table1[pos];
        this.table1[pos] = cur;

        if (!existing) {
          this.size++;
          return true;
        }

        // Existing evicted from T1, must move to T2
        cur = existing;
        curTable = 2;
      } else {
        const pos = this._hash2(cur.key);
        const existing = this.table2[pos];
        this.table2[pos] = cur;

        if (!existing) {
          this.size++;
          return true;
        }

        // Existing evicted from T2, must move to T1
        cur = existing;
        curTable = 1;
      }
    }

    // If kicks exhausted, push to stash
    if (this.stash.length < this.stashSize) {
      this.stash.push(cur);
      this.size++;
      return true;
    }

    // Stash also full: rehash with doubled capacity
    this._rehash(this.capacity * 2);
    return this.set(cur.key, cur.value);
  }

  /**
   * Delete key
   * @param {string} key
   * @returns {boolean}
   */
  delete(key) {
    const k = String(key);

    const idx1 = this._hash1(k);
    if (this.table1[idx1] && this.table1[idx1].key === k) {
      this.table1[idx1] = null;
      this.size--;
      return true;
    }

    const idx2 = this._hash2(k);
    if (this.table2[idx2] && this.table2[idx2].key === k) {
      this.table2[idx2] = null;
      this.size--;
      return true;
    }

    for (let i = 0; i < this.stash.length; i++) {
      if (this.stash[i].key === k) {
        this.stash.splice(i, 1);
        this.size--;
        return true;
      }
    }

    return false;
  }

  /**
   * Rehash all elements into a larger capacity
   * @param {number} newCapacity
   */
  _rehash(newCapacity) {
    const oldEntries = [];
    for (const e of this.table1) if (e) oldEntries.push(e);
    for (const e of this.table2) if (e) oldEntries.push(e);
    for (const e of this.stash) oldEntries.push(e);

    this.capacity = newCapacity;
    this.table1 = Array(this.capacity).fill(null);
    this.table2 = Array(this.capacity).fill(null);
    this.stash = [];
    this.size = 0;

    for (const entry of oldEntries) {
      this.set(entry.key, entry.value);
    }
  }

  /**
   * Table metrics & load factor
   */
  getStats() {
    const totalSlots = this.capacity * 2;
    return {
      size: this.size,
      capacityPerTable: this.capacity,
      totalSlots,
      stashUsed: this.stash.length,
      stashCapacity: this.stashSize,
      loadFactor: Number((this.size / totalSlots).toFixed(4)),
    };
  }
}

export { CuckooStashTable };
export default CuckooStashTable;
