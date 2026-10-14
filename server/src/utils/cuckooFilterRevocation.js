/**
 * Cuckoo Filter with Dynamic Deletion for Real-Time Account Blacklist & Revoked Voucher Tokens
 * 
 * Thuật toán Bộ Lọc Cuckoo (Fan, Andersen, Kaminsky, Mitzenmacher - ACM CoNEXT 2014):
 * 1. Khắc phục nhược điểm cốt tử của Bloom Filter: Cuckoo Filter HỖ TRỢ XÓA (DELETE) phần tử linh hoạt
 *    mà không làm tăng tỷ lệ dương tính giả (False Positive Rate).
 * 2. Kỹ thuật Băm Cuckoo với Khóa Cục Bộ (Partial-Key Cuckoo Hashing):
 *    - Mỗi phần tử chỉ lưu một chuỗi vân tay nhỏ (Fingerprint f = hash_fp(x), 8-bit).
 *    - Hai vị trí xô tiềm năng:
 *      i1 = hash(x) mod M
 *      i2 = (i1 xor hash(f)) mod M
 *    - Khi xóa một phần tử: Tìm thấy fingerprint f trong xô i1 hoặc i2 thì giải phóng slot đó.
 * 3. Ứng dụng thực tiễn trên Mini Shopee:
 *    - Quản lý danh sách đen tài khoản gian lận cần phong tỏa tức thì (Revoked JWTs / Frozen Wallets).
 *    - Danh sách mã Voucher đã bị thu hồi/vô hiệu hóa khẩn cấp trong Siêu Sale mà vẫn cho phép mở khóa lại (Unban/Re-enable).
 */

export class CuckooFilterRevocation {
  /**
   * @param {number} [bucketCount=128] - Số lượng xô (Nên là lũy thừa của 2)
   * @param {number} [bucketSize=4]    - Số lượng slot trong mỗi xô
   * @param {number} [maxKicks=50]     - Số lần đá tối đa khi xô bị đầy
   */
  constructor(bucketCount = 128, bucketSize = 4, maxKicks = 50) {
    this.bucketCount = bucketCount;
    this.bucketSize = bucketSize;
    this.maxKicks = maxKicks;

    // Khởi tạo các xô chứa (mỗi xô là mảng tối đa bucketSize fingerprints)
    this.buckets = Array.from({ length: bucketCount }, () => []);
    this.count = 0;
  }

  /**
   * Sinh mã vân tay 8-bit từ giá trị đầu vào (1 đến 255, tránh 0)
   * @private
   */
  _fingerprint(item) {
    const str = String(item);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    const fp = (Math.abs(h) % 255) + 1;
    return fp;
  }

  /**
   * Hàm băm chỉ số xô 1
   * @private
   */
  _hashIndex(item) {
    const str = String(item);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h) % this.bucketCount;
  }

  /**
   * Tính chỉ số xô thứ hai qua phép XOR với hash của fingerprint
   * @private
   */
  _altIndex(index, fp) {
    let h = Math.imul(fp, 0x5bd1e995);
    h ^= h >>> 15;
    const hashFp = Math.abs(h) % this.bucketCount;
    return (index ^ hashFp) % this.bucketCount;
  }

  /**
   * Thêm một phần tử vào Cuckoo Filter
   * @param {string|number} item
   * @returns {boolean} true nếu thêm thành công, false nếu bộ lọc đã đầy (kick limit reached)
   */
  insert(item) {
    const fp = this._fingerprint(item);
    const i1 = this._hashIndex(item);
    const i2 = this._altIndex(i1, fp);

    if (this.buckets[i1].length < this.bucketSize) {
      this.buckets[i1].push(fp);
      this.count++;
      return true;
    }

    if (this.buckets[i2].length < this.bucketSize) {
      this.buckets[i2].push(fp);
      this.count++;
      return true;
    }

    // Nếu cả 2 xô đều đầy, thực hiện quy trình đá Cuckoo (Cuckoo Kick)
    let currIndex = Math.random() < 0.5 ? i1 : i2;
    let currFp = fp;

    for (let k = 0; k < this.maxKicks; k++) {
      // Chọn ngẫu nhiên một slot trong xô để đá ra
      const slot = Math.floor(Math.random() * this.bucketSize);
      const kickedFp = this.buckets[currIndex][slot];
      this.buckets[currIndex][slot] = currFp;

      currFp = kickedFp;
      currIndex = this._altIndex(currIndex, currFp);

      if (this.buckets[currIndex].length < this.bucketSize) {
        this.buckets[currIndex].push(currFp);
        this.count++;
        return true;
      }
    }

    // Bộ lọc đã đầy, cần tái mở rộng kích thước (Rehash)
    return false;
  }

  /**
   * Kiểm tra xem phần tử có nằm trong bộ lọc hay không
   * @param {string|number} item
   * @returns {boolean}
   */
  lookup(item) {
    const fp = this._fingerprint(item);
    const i1 = this._hashIndex(item);
    const i2 = this._altIndex(i1, fp);

    return this.buckets[i1].includes(fp) || this.buckets[i2].includes(fp);
  }

  /**
   * XÓA một phần tử khỏi Cuckoo Filter (Khả năng vượt trội mà Bloom Filter không có)
   * @param {string|number} item
   * @returns {boolean} true nếu xóa thành công, false nếu không tìm thấy
   */
  delete(item) {
    const fp = this._fingerprint(item);
    const i1 = this._hashIndex(item);
    const i2 = this._altIndex(i1, fp);

    const idx1 = this.buckets[i1].indexOf(fp);
    if (idx1 !== -1) {
      this.buckets[i1].splice(idx1, 1);
      this.count--;
      return true;
    }

    const idx2 = this.buckets[i2].indexOf(fp);
    if (idx2 !== -1) {
      this.buckets[i2].splice(idx2, 1);
      this.count--;
      return true;
    }

    return false;
  }

  /**
   * Lấy tỷ lệ tải (Load Factor) hiện tại của bộ lọc
   * @returns {number} 0.0 -> 1.0
   */
  getLoadFactor() {
    const totalCapacity = this.bucketCount * this.bucketSize;
    return Number((this.count / totalCapacity).toFixed(4));
  }
}

export default {
  CuckooFilterRevocation
};
