/**
 * Roaring Bitmaps Faceted Filter Index Engine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 12 - Feature 159)
 * 
 * Vấn đề:
 * Trong sàn TMĐT quy mô lớn hàng triệu SKU, người mua liên tục tìm kiếm và lọc đa thuộc tính:
 * Ví dụ: Category="Thời trang" AND Brand="Coolmate" AND Rating>=4.0 AND PriceTier="100k-300k" AND Location="Hà Nội".
 * 1. Quét bảng CSDL (Full-table scan) hoặc duyệt mảng lọc JavaScript $O(N)$ gây nghẽn CPU và độ trễ cao.
 * 2. Lưu trữ Bitset truyền thống ($1$ bit cho mỗi ID) cực kỳ lãng phí RAM khi tập dữ liệu thưa thớt (Sparse).
 * 
 * Nguyên lý Thuật Toán Roaring Bitmaps:
 * 1. Chia không gian số nguyên 32-bit thành các khối (Chunks) theo 16 bit cao ($0$ đến $65,535$).
 * 2. Mỗi khối chứa một container quản lý 16 bit thấp ($0$ đến $65,535$):
 *    - ArrayContainer: Lưu trữ mảng số nguyên đã sắp xếp khi số phần tử $< 4096$ (tiết kiệm RAM tối đa).
 *    - BitmapContainer: Lưu trữ mảng bit (1024 từ 64-bit hoặc 2048 từ 32-bit) khi số phần tử $\ge 4096$.
 * 3. Tối ưu hóa các phép toán đại số tập hợp Bool:
 *    - AND (Giao tập hợp): Duyệt đồng thời theo hai con trỏ hoặc bitwise AND trực tiếp.
 *    - OR (Hợp tập hợp): Trộn hai mảng đã sắp xếp hoặc bitwise OR.
 *    - AND_NOT (Hiệu tập hợp): Loại trừ các phần tử bị cấm/hết hàng.
 * 4. FacetedCatalogIndex: Lưu trữ chỉ mục bitmap cho từng giá trị thuộc tính sản phẩm,
 *    giúp lọc đồng thời hàng chục tiêu chí chỉ trong vài microsecond ($< 0.1\text{ms}$).
 */

const MAX_ARRAY_CARDINALITY = 4096;
const BITS_PER_CONTAINER = 65536;

/**
 * Lấy 16 bit cao làm key của chunk
 */
function getHighBits(val) {
  return (val >>> 16) & 0xffff;
}

/**
 * Lấy 16 bit thấp làm giá trị bên trong chunk
 */
function getLowBits(val) {
  return val & 0xffff;
}

/**
 * ArrayContainer: Dành cho tập hợp thưa (cardinality < 4096)
 */
export class ArrayContainer {
  constructor(initialValues = []) {
    this.values = [...initialValues].sort((a, b) => a - b);
  }

  cardinality() {
    return this.values.length;
  }

  contains(val) {
    let low = 0;
    let high = this.values.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = this.values[mid];
      if (midVal === val) return true;
      if (midVal < val) low = mid + 1;
      else high = mid - 1;
    }
    return false;
  }

  add(val) {
    let low = 0;
    let high = this.values.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = this.values[mid];
      if (midVal === val) return; // Đã tồn tại
      if (midVal < val) low = mid + 1;
      else high = mid - 1;
    }
    this.values.splice(low, 0, val);
  }

  remove(val) {
    let low = 0;
    let high = this.values.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = this.values[mid];
      if (midVal === val) {
        this.values.splice(mid, 1);
        return;
      }
      if (midVal < val) low = mid + 1;
      else high = mid - 1;
    }
  }

  toArray() {
    return [...this.values];
  }

  and(other) {
    const res = [];
    const a = this.values;
    const b = other.toArray();
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        res.push(a[i]);
        i++;
        j++;
      } else if (a[i] < b[j]) {
        i++;
      } else {
        j++;
      }
    }
    return new ArrayContainer(res);
  }

  or(other) {
    const res = [];
    const a = this.values;
    const b = other.toArray();
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        res.push(a[i]);
        i++;
        j++;
      } else if (a[i] < b[j]) {
        res.push(a[i]);
        i++;
      } else {
        res.push(b[j]);
        j++;
      }
    }
    while (i < a.length) res.push(a[i++]);
    while (j < b.length) res.push(b[j++]);

    if (res.length >= MAX_ARRAY_CARDINALITY) {
      const bitmap = new BitmapContainer();
      for (const v of res) bitmap.add(v);
      return bitmap;
    }
    return new ArrayContainer(res);
  }

  andNot(other) {
    const res = [];
    const a = this.values;
    const b = other.toArray();
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
      } else if (a[i] < b[j]) {
        res.push(a[i]);
        i++;
      } else {
        j++;
      }
    }
    while (i < a.length) res.push(a[i++]);
    return new ArrayContainer(res);
  }
}

/**
 * BitmapContainer: Dành cho tập hợp dày đặc (cardinality >= 4096)
 * Lưu trữ dưới dạng mảng Uint32 gồm 2048 phần tử (2048 * 32 = 65,536 bit)
 */
export class BitmapContainer {
  constructor() {
    this.words = new Uint32Array(2048);
    this._cardinality = 0;
  }

  cardinality() {
    return this._cardinality;
  }

  contains(val) {
    const wordIdx = val >>> 5;
    const bitIdx = val & 31;
    return (this.words[wordIdx] & (1 << bitIdx)) !== 0;
  }

  add(val) {
    const wordIdx = val >>> 5;
    const bitIdx = val & 31;
    const mask = 1 << bitIdx;
    if ((this.words[wordIdx] & mask) === 0) {
      this.words[wordIdx] |= mask;
      this._cardinality++;
    }
  }

  remove(val) {
    const wordIdx = val >>> 5;
    const bitIdx = val & 31;
    const mask = 1 << bitIdx;
    if ((this.words[wordIdx] & mask) !== 0) {
      this.words[wordIdx] &= ~mask;
      this._cardinality--;
    }
  }

  toArray() {
    const res = [];
    for (let i = 0; i < 2048; i++) {
      let w = this.words[i];
      if (w !== 0) {
        for (let b = 0; b < 32; b++) {
          if ((w & (1 << b)) !== 0) {
            res.push(i * 32 + b);
          }
        }
      }
    }
    return res;
  }

  and(other) {
    if (other instanceof ArrayContainer) {
      return other.and(this);
    }
    const res = new BitmapContainer();
    for (let i = 0; i < 2048; i++) {
      const w = this.words[i] & other.words[i];
      res.words[i] = w;
      if (w !== 0) {
        for (let b = 0; b < 32; b++) {
          if ((w & (1 << b)) !== 0) res._cardinality++;
        }
      }
    }
    if (res._cardinality < MAX_ARRAY_CARDINALITY) {
      return new ArrayContainer(res.toArray());
    }
    return res;
  }

  or(other) {
    const res = new BitmapContainer();
    if (other instanceof ArrayContainer) {
      for (let i = 0; i < 2048; i++) res.words[i] = this.words[i];
      res._cardinality = this._cardinality;
      for (const v of other.toArray()) res.add(v);
      return res;
    }
    for (let i = 0; i < 2048; i++) {
      const w = this.words[i] | other.words[i];
      res.words[i] = w;
      if (w !== 0) {
        for (let b = 0; b < 32; b++) {
          if ((w & (1 << b)) !== 0) res._cardinality++;
        }
      }
    }
    return res;
  }

  andNot(other) {
    const res = new BitmapContainer();
    if (other instanceof ArrayContainer) {
      for (let i = 0; i < 2048; i++) res.words[i] = this.words[i];
      res._cardinality = this._cardinality;
      for (const v of other.toArray()) res.remove(v);
      return res;
    }
    for (let i = 0; i < 2048; i++) {
      const w = this.words[i] & ~other.words[i];
      res.words[i] = w;
      if (w !== 0) {
        for (let b = 0; b < 32; b++) {
          if ((w & (1 << b)) !== 0) res._cardinality++;
        }
      }
    }
    if (res._cardinality < MAX_ARRAY_CARDINALITY) {
      return new ArrayContainer(res.toArray());
    }
    return res;
  }
}

/**
 * Cấu trúc RoaringBitmap đầy đủ hỗ trợ các ID 32-bit
 */
export class RoaringBitmap {
  constructor(initialIds = []) {
    this.containers = new Map(); // chunkKey (16-bit) -> Container
    for (const id of initialIds) {
      this.add(id);
    }
  }

  cardinality() {
    let total = 0;
    for (const [, c] of this.containers) {
      total += c.cardinality();
    }
    return total;
  }

  isEmpty() {
    return this.cardinality() === 0;
  }

  contains(id) {
    const key = getHighBits(id);
    const low = getLowBits(id);
    const c = this.containers.get(key);
    return c ? c.contains(low) : false;
  }

  add(id) {
    const key = getHighBits(id);
    const low = getLowBits(id);
    let c = this.containers.get(key);
    if (!c) {
      c = new ArrayContainer();
      this.containers.set(key, c);
    }

    c.add(low);

    if (c instanceof ArrayContainer && c.cardinality() >= MAX_ARRAY_CARDINALITY) {
      const bitmap = new BitmapContainer();
      for (const val of c.toArray()) {
        bitmap.add(val);
      }
      this.containers.set(key, bitmap);
    }
  }

  remove(id) {
    const key = getHighBits(id);
    const low = getLowBits(id);
    const c = this.containers.get(key);
    if (!c) return;

    c.remove(low);
    if (c.cardinality() === 0) {
      this.containers.delete(key);
    }
  }

  toArray() {
    const result = [];
    const sortedKeys = [...this.containers.keys()].sort((a, b) => a - b);
    for (const key of sortedKeys) {
      const c = this.containers.get(key);
      const lowVals = c.toArray();
      const base = key << 16;
      for (const low of lowVals) {
        result.push(base + low);
      }
    }
    return result;
  }

  /**
   * Phép toán GIAO (AND) giữa hai RoaringBitmap
   */
  and(other) {
    const result = new RoaringBitmap();
    for (const [key, c1] of this.containers) {
      const c2 = other.containers.get(key);
      if (c2) {
        const intersection = c1.and(c2);
        if (intersection.cardinality() > 0) {
          result.containers.set(key, intersection);
        }
      }
    }
    return result;
  }

  /**
   * Phép toán HỢP (OR) giữa hai RoaringBitmap
   */
  or(other) {
    const result = new RoaringBitmap();
    const allKeys = new Set([...this.containers.keys(), ...other.containers.keys()]);
    for (const key of allKeys) {
      const c1 = this.containers.get(key);
      const c2 = other.containers.get(key);
      if (c1 && c2) {
        result.containers.set(key, c1.or(c2));
      } else if (c1) {
        result.containers.set(key, c1);
      } else if (c2) {
        result.containers.set(key, c2);
      }
    }
    return result;
  }

  /**
   * Phép toán HIỆU (AND_NOT): this \ other
   */
  andNot(other) {
    const result = new RoaringBitmap();
    for (const [key, c1] of this.containers) {
      const c2 = other.containers.get(key);
      if (c2) {
        const diff = c1.andNot(c2);
        if (diff.cardinality() > 0) {
          result.containers.set(key, diff);
        }
      } else {
        result.containers.set(key, c1);
      }
    }
    return result;
  }
}

/**
 * Bộ chỉ mục lọc đa thuộc tính Faceted Search bằng Roaring Bitmaps
 */
export class FacetedCatalogIndex {
  constructor() {
    this.indexes = new Map(); // facetField -> Map(facetValue -> RoaringBitmap)
    this.allProducts = new RoaringBitmap();
    this.productDetails = new Map(); // numericId -> productObject
    this.codeToIdMap = new Map(); // stringCode (e.g. "prod_101") -> numericId
    this.nextNumericId = 1;
  }

  /**
   * Đăng ký một sản phẩm vào chỉ mục tìm kiếm lọc đa thuộc tính
   */
  indexProduct(product) {
    let numericId = product.numericId;
    if (!numericId) {
      const code = String(product.id || `prod_${this.nextNumericId}`);
      if (this.codeToIdMap.has(code)) {
        numericId = this.codeToIdMap.get(code);
      } else {
        numericId = this.nextNumericId++;
        this.codeToIdMap.set(code, numericId);
      }
    }

    const item = { ...product, numericId };
    this.productDetails.set(numericId, item);
    this.allProducts.add(numericId);

    // 1. Phân loại danh mục (Category)
    if (item.category) {
      this._addToFacet("category", String(item.category).toLowerCase(), numericId);
    }

    // 2. Phân loại thương hiệu (Brand)
    if (item.brand) {
      this._addToFacet("brand", String(item.brand).toLowerCase(), numericId);
    }

    // 3. Phân khúc giá (Price Tier)
    const price = Number(item.price) || 0;
    if (price < 100000) this._addToFacet("priceTier", "UNDER_100K", numericId);
    else if (price <= 300000) this._addToFacet("priceTier", "100K_300K", numericId);
    else if (price <= 1000000) this._addToFacet("priceTier", "300K_1M", numericId);
    else this._addToFacet("priceTier", "OVER_1M", numericId);

    // 4. Đánh giá sao (Rating)
    const rating = Math.floor(Number(item.rating) || 5);
    for (let r = 1; r <= rating; r++) {
      this._addToFacet("minRating", `${r}_STAR`, numericId);
    }

    // 5. Khu vực / Tỉnh thành (Location)
    if (item.location) {
      this._addToFacet("location", String(item.location).toLowerCase(), numericId);
    }

    // 6. Trạng thái hàng có sẵn (In Stock)
    const stock = Number(item.stock) || 0;
    if (stock > 0) {
      this._addToFacet("inStock", "TRUE", numericId);
    } else {
      this._addToFacet("inStock", "FALSE", numericId);
    }

    return numericId;
  }

  _addToFacet(field, val, id) {
    if (!this.indexes.has(field)) {
      this.indexes.set(field, new Map());
    }
    const valMap = this.indexes.get(field);
    if (!valMap.has(val)) {
      valMap.set(val, new RoaringBitmap());
    }
    valMap.get(val).add(id);
  }

  /**
   * Lọc đa thuộc tính kết hợp các toán tử AND
   * @param {Object} query { category, brand, priceTier, minRating, location, inStock }
   */
  filter(query = {}) {
    let resultBitmap = this.allProducts;

    if (query.category) {
      const b = this._getFacetBitmap("category", String(query.category).toLowerCase());
      resultBitmap = resultBitmap.and(b);
    }

    if (query.brand) {
      const b = this._getFacetBitmap("brand", String(query.brand).toLowerCase());
      resultBitmap = resultBitmap.and(b);
    }

    if (query.priceTier) {
      const b = this._getFacetBitmap("priceTier", query.priceTier);
      resultBitmap = resultBitmap.and(b);
    }

    if (query.minRating) {
      const b = this._getFacetBitmap("minRating", `${query.minRating}_STAR`);
      resultBitmap = resultBitmap.and(b);
    }

    if (query.location) {
      const b = this._getFacetBitmap("location", String(query.location).toLowerCase());
      resultBitmap = resultBitmap.and(b);
    }

    if (query.inStock !== undefined) {
      const b = this._getFacetBitmap("inStock", query.inStock ? "TRUE" : "FALSE");
      resultBitmap = resultBitmap.and(b);
    }

    const matchedIds = resultBitmap.toArray();
    const matchedProducts = matchedIds.map((id) => this.productDetails.get(id)).filter(Boolean);

    return {
      totalMatches: matchedIds.length,
      matchedIds,
      products: matchedProducts,
    };
  }

  _getFacetBitmap(field, val) {
    const fieldMap = this.indexes.get(field);
    if (!fieldMap || !fieldMap.has(val)) {
      return new RoaringBitmap();
    }
    return fieldMap.get(val);
  }
}
