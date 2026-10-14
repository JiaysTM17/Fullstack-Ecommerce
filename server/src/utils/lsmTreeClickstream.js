/**
 * Log-Structured Merge-Tree (LSM-Tree) Engine for High-Throughput Clickstream & Telemetry
 * 
 * Kiến trúc LSM-Tree (Google Bigtable / Apache Cassandra / RocksDB):
 * 1. MemTable (In-Memory SkipList/Sorted Map): Tiếp nhận luồng ghi sự kiện Clickstream,
 *    lượt xem sản phẩm (Impression), và lượt nhấp quảng cáo Flash Sale với tốc độ O(1) vào RAM.
 * 2. Immutable SSTable (Sorted String Table): Khi MemTable đạt ngưỡng dung lượng, xả tuần tự
 *    ra đĩa (Sequential Write) thành các đoạn dữ liệu bất biến đã được sắp xếp sẵn theo key.
 * 3. Bloom Filter Acceleration: Mỗi SSTable có Bloom Filter kèm theo để kiểm tra tức thì O(1)
 *    xem key có trong SSTable hay không, triệt tiêu các lần đọc đĩa lãng phí.
 * 4. Minor & Major Compaction: Hợp nhất (Merge Sort) các SSTable để thu gọn dung lượng và xóa bỏ Tombstone.
 */

export class LSMTreeClickstream {
  /**
   * @param {Object} options
   * @param {number} [options.maxMemTableSize=100] - Số lượng bản ghi tối đa trước khi tự động Flush
   * @param {number} [options.bloomFilterBits=1024] - Số bit của Bloom Filter cho mỗi SSTable
   */
  constructor({ maxMemTableSize = 100, bloomFilterBits = 1024 } = {}) {
    this.maxMemTableSize = maxMemTableSize;
    this.bloomFilterBits = bloomFilterBits;

    // MemTable hoạt động trong RAM: Map lưu giữ [key, { value, timestamp, isDeleted }]
    this.memTable = new Map();

    // Danh sách các SSTable bất biến đã xả: Array of { id, records, bloomFilter, minKey, maxKey }
    this.sstables = [];

    // Bộ đếm tạo ID SSTable
    this.sstableCounter = 0;
  }

  /**
   * Hàm băm đơn giản cho Bloom Filter của SSTable
   * @private
   */
  _hashKey(key, seed = 0) {
    let hash = seed;
    for (let i = 0; i < key.length; i++) {
      hash = (Math.imul(31, hash) + key.charCodeAt(i)) >>> 0;
    }
    return hash % this.bloomFilterBits;
  }

  /**
   * Tạo Bloom Filter cho một mảng các bản ghi
   * @private
   */
  _createBloomFilter(records) {
    const bits = new Uint8Array(Math.ceil(this.bloomFilterBits / 8));
    const setBit = (idx) => {
      bits[Math.floor(idx / 8)] |= (1 << (idx % 8));
    };

    for (const { key } of records) {
      setBit(this._hashKey(key, 0x9747b28c));
      setBit(this._hashKey(key, 0x517cc1b7));
      setBit(this._hashKey(key, 0xee6b27eb));
    }

    return {
      bits,
      mayContain: (key) => {
        const h1 = this._hashKey(key, 0x9747b28c);
        const h2 = this._hashKey(key, 0x517cc1b7);
        const h3 = this._hashKey(key, 0xee6b27eb);

        const checkBit = (idx) => (bits[Math.floor(idx / 8)] & (1 << (idx % 8))) !== 0;
        return checkBit(h1) && checkBit(h2) && checkBit(h3);
      }
    };
  }

  /**
   * Ghi nhận một sự kiện Clickstream / Telemetry vào MemTable
   * @param {string} key - Định danh sự kiện (VD: 'click:user_123:prod_456')
   * @param {any} value - Dữ liệu sự kiện
   */
  put(key, value) {
    if (!key) throw new Error("Key sự kiện không được để trống.");

    this.memTable.set(key, {
      value,
      timestamp: Date.now(),
      isDeleted: false
    });

    if (this.memTable.size >= this.maxMemTableSize) {
      this.flushMemTable();
    }
  }

  /**
   * Xóa một bản ghi bằng cờ Tombstone
   * @param {string} key
   */
  delete(key) {
    if (!key) return;
    this.memTable.set(key, {
      value: null,
      timestamp: Date.now(),
      isDeleted: true
    });

    if (this.memTable.size >= this.maxMemTableSize) {
      this.flushMemTable();
    }
  }

  /**
   * Tra cứu sự kiện theo khóa
   * Thứ tự tra cứu chuẩn LSM:
   * 1. MemTable (RAM)
   * 2. SSTables từ mới nhất tới cũ nhất (kiểm tra Bloom Filter trước khi quét nhị phân)
   * 
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    if (!key) return null;

    // 1. Kiểm tra trong MemTable (bộ nhớ nóng)
    if (this.memTable.has(key)) {
      const entry = this.memTable.get(key);
      if (entry.isDeleted) return null; // Tombstone
      return entry.value;
    }

    // 2. Kiểm tra trong các SSTable từ mới nhất về cũ nhất
    for (let i = this.sstables.length - 1; i >= 0; i--) {
      const sstable = this.sstables[i];

      // Tối ưu hóa: kiểm tra minKey / maxKey boundary
      if (key < sstable.minKey || key > sstable.maxKey) {
        continue;
      }

      // Tối ưu hóa: kiểm tra Bloom Filter
      if (!sstable.bloomFilter.mayContain(key)) {
        continue; // Chắc chắn 100% không có trong SSTable này
      }

      // Quét tìm kiếm nhị phân trong mảng đã sắp xếp của SSTable
      const record = this._binarySearchRecord(sstable.records, key);
      if (record) {
        if (record.isDeleted) return null; // Tombstone
        return record.value;
      }
    }

    return null;
  }

  /**
   * Tìm kiếm nhị phân trong SSTable đã sắp xếp O(log N)
   * @private
   */
  _binarySearchRecord(records, targetKey) {
    let low = 0;
    let high = records.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const currKey = records[mid].key;

      if (currKey === targetKey) {
        return records[mid];
      } else if (currKey < targetKey) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return null;
  }

  /**
   * Xả (Flush) MemTable hiện tại ra một SSTable mới đã sắp xếp
   * @returns {Object} Thông tin SSTable vừa tạo
   */
  flushMemTable() {
    if (this.memTable.size === 0) return null;

    // Sắp xếp các bản ghi theo thứ tự tăng dần của key
    const sortedEntries = Array.from(this.memTable.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const sstableId = `sstable_${++this.sstableCounter}`;
    const bloomFilter = this._createBloomFilter(sortedEntries);

    const sstable = {
      id: sstableId,
      records: sortedEntries,
      bloomFilter,
      recordCount: sortedEntries.length,
      minKey: sortedEntries[0].key,
      maxKey: sortedEntries[sortedEntries.length - 1].key,
      createdAt: Date.now()
    };

    this.sstables.push(sstable);
    this.memTable.clear();

    return sstable;
  }

  /**
   * Hợp nhất (Compaction) tất cả các SSTables thành 1 SSTable duy nhất
   * Loại bỏ các bản ghi cũ trùng lặp và loại trừ các bản ghi đã bị xóa (Tombstone)
   * @returns {Object} Kết quả sau khi nén
   */
  compact() {
    if (this.sstables.length <= 1) {
      return { compactedCount: this.sstables.length, totalRecords: this.sstables[0]?.records.length || 0 };
    }

    // Map hợp nhất giữ bản ghi mới nhất theo timestamp
    const mergedMap = new Map();

    for (const sstable of this.sstables) {
      for (const record of sstable.records) {
        const existing = mergedMap.get(record.key);
        if (!existing || record.timestamp >= existing.timestamp) {
          mergedMap.set(record.key, record);
        }
      }
    }

    // Lọc bỏ các bản ghi đã bị Tombstone xóa
    const aliveRecords = Array.from(mergedMap.values())
      .filter(r => !r.isDeleted)
      .sort((a, b) => a.key.localeCompare(b.key));

    if (aliveRecords.length === 0) {
      this.sstables = [];
      return { compactedCount: 0, totalRecords: 0 };
    }

    const compactedId = `sstable_compacted_${++this.sstableCounter}`;
    const compactedBloom = this._createBloomFilter(aliveRecords);

    const compactedTable = {
      id: compactedId,
      records: aliveRecords,
      bloomFilter: compactedBloom,
      recordCount: aliveRecords.length,
      minKey: aliveRecords[0].key,
      maxKey: aliveRecords[aliveRecords.length - 1].key,
      createdAt: Date.now()
    };

    const previousTableCount = this.sstables.length;
    this.sstables = [compactedTable];

    return {
      previousTableCount,
      compactedCount: 1,
      totalRecords: aliveRecords.length
    };
  }

  /**
   * Thống kê trạng thái LSM-Tree
   */
  getStats() {
    const sstableRecordCount = this.sstables.reduce((sum, t) => sum + t.records.length, 0);
    return {
      memTableSize: this.memTable.size,
      sstableCount: this.sstables.length,
      sstableRecordCount,
      totalRecordsTracked: this.memTable.size + sstableRecordCount
    };
  }
}

export default {
  LSMTreeClickstream
};
