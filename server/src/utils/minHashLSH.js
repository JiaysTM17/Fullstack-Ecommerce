/**
 * Locality-Sensitive Hashing (LSH) & MinHash Catalog Clone Detector
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 9 - Feature 156)
 * 
 * Vấn đề:
 * 1. Hiện tượng Shop gian lận cào tự động và sao chép nguyên vẹn catalog (Catalog Theft):
 *    Các gian hàng sao chép hình ảnh, tiêu đề, mô tả để trục lợi mã giảm giá tân thủ và spam tìm kiếm.
 * 2. So sánh toàn bộ cặp (Pairwise Comparison) có độ phức tạp O(N^2 * L):
 *    Với 100.000 sản phẩm, số phép so sánh lên tới 5 tỷ lượt, gây sập server.
 * 
 * Giải pháp MinHash & LSH:
 * 1. MinHash Signature (Broder 1997):
 *    Nén văn bản thành vector chữ ký K số nguyên (mặc định K = 100).
 *    Định lý MinHash chứng minh: P(h_i(A) == h_i(B)) = Jaccard(A, B).
 * 2. Phân đoạn băng LSH (Indyk & Motwani 1998):
 *    Chia chữ ký thành b băng, mỗi băng r dòng (K = b * r, ví dụ 20 băng x 5 dòng).
 *    Xác suất phát hiện cặp ứng viên tương đồng s:
 *      P(Candidate) = 1 - (1 - s^r)^b
 *    Với s >= 0.8, xác suất bắt trúng đạt 99.97% trong thời gian O(1) qua tra cứu bảng băm.
 * 3. Catalog Clone Radar:
 *    Tự động quét và phát hiện các gian hàng sao chép >= 50% danh mục của gian hàng khác,
 *    đề xuất hành động khóa shop hoặc gắn cờ vi phạm bản quyền.
 */

export const LSH_PRIME = 4294967311; // Số nguyên tố nhỏ nhất > 2^32

/**
 * Hàm băm Murmur32 độc lập không dấu 32-bit cho shingle string
 */
export function murmur32(str, seed = 0x9747b28c) {
  const s = String(str || "");
  let h = seed ^ s.length;
  for (let i = 0; i < s.length; i++) {
    let k = s.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);

    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Chuẩn hóa chuỗi tiếng Việt: loại bỏ dấu thanh, chuyển về chữ thường
 */
export function removeVietnameseTones(str) {
  if (!str) return "";
  let res = String(str).toLowerCase().trim();
  res = res.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  res = res.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  res = res.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  res = res.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  res = res.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  res = res.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  res = res.replace(/đ/g, "d");
  return res;
}

/**
 * Trích xuất k-shingles (word n-grams hoặc character n-grams) từ văn bản
 */
export function kShingles(text, optionsOrK = 2, maybeType = "word", maybeStrip = false) {
  let k = 2;
  let type = "word";
  let stripAccents = false;

  if (typeof optionsOrK === "object" && optionsOrK !== null) {
    k = Number(optionsOrK.k || optionsOrK.shingleSize || 2);
    type = optionsOrK.type || optionsOrK.shingleType || "word";
    stripAccents = Boolean(optionsOrK.stripAccents);
  } else {
    k = Number(optionsOrK) || 2;
    type = maybeType || "word";
    stripAccents = Boolean(maybeStrip);
  }

  k = Math.max(1, k);
  const shingles = new Set();
  if (!text || typeof text !== "string") return shingles;

  let clean = text.toLowerCase().normalize("NFC");
  if (stripAccents) {
    clean = removeVietnameseTones(clean);
  }
  clean = clean
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return shingles;

  if (type === "char") {
    if (clean.length <= k) {
      shingles.add(clean);
      return shingles;
    }
    for (let i = 0; i <= clean.length - k; i++) {
      shingles.add(clean.slice(i, i + k));
    }
  } else {
    // Word n-grams
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= k) {
      shingles.add(words.join(" "));
      return shingles;
    }
    for (let i = 0; i <= words.length - k; i++) {
      shingles.add(words.slice(i, i + k).join(" "));
    }
  }

  return shingles;
}

/**
 * MinHash Engine độc lập
 */
export class MinHash {
  constructor({ numHashes = 100, prime = LSH_PRIME, seed = 0x1f3d5b79 } = {}) {
    this.numHashes = numHashes;
    this.prime = prime;
    this.seed = seed;
    this.a = new Uint32Array(this.numHashes);
    this.b = new Uint32Array(this.numHashes);
    this._initHashCoefficients();
  }

  _initHashCoefficients() {
    let s = this.seed;
    const lcg = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s;
    };

    for (let i = 0; i < this.numHashes; i++) {
      let aVal = (lcg() % (this.prime - 1)) + 1;
      if (aVal % 2 === 0) aVal = (aVal + 1) >>> 0;
      this.a[i] = aVal;
      this.b[i] = lcg() % this.prime;
    }
  }

  getSignature(textOrShingles) {
    const shingles = textOrShingles instanceof Set
      ? textOrShingles
      : kShingles(textOrShingles);

    const sig = new Uint32Array(this.numHashes);
    sig.fill(0xffffffff);
    if (shingles.size === 0) return sig;

    const pBig = BigInt(this.prime);

    for (const shingle of shingles) {
      const x = murmur32(shingle);
      const xBig = BigInt(x);

      for (let i = 0; i < this.numHashes; i++) {
        const aBig = BigInt(this.a[i]);
        const bBig = BigInt(this.b[i]);
        const hVal = Number((aBig * xBig + bBig) % pBig);

        if (hVal < sig[i]) {
          sig[i] = hVal;
        }
      }
    }

    return sig;
  }

  calculateJaccard(sigA, sigB) {
    if (!sigA || !sigB || sigA.length !== sigB.length || sigA.length === 0) return 0;
    let matches = 0;
    const len = sigA.length;
    for (let i = 0; i < len; i++) {
      if (sigA[i] === sigB[i]) matches++;
    }
    return Number((matches / len).toFixed(4));
  }

  calculateExactJaccard(setA, setB) {
    if (!setA || !setB || (setA.size === 0 && setB.size === 0)) return 0;
    let intersection = 0;
    const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
    for (const item of smaller) {
      if (larger.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? Number((intersection / union).toFixed(4)) : 0;
  }
}

/**
 * MinHashLSH - Bộ lập chỉ mục và truy vấn tương đồng gần LSH
 */
export class MinHashLSH {
  constructor({
    numHashes = null,
    bands = null,
    numBands = null,
    rowsPerBand = null,
    shingleSize = 2,
    shingleType = "word",
    stripAccents = false,
  } = {}) {
    const effectiveBands = numBands !== null && numBands !== undefined ? numBands : bands;

    // Suy luận kích thước K, b, r
    if (effectiveBands !== null && rowsPerBand !== null) {
      this.bands = Number(effectiveBands);
      this.rowsPerBand = Number(rowsPerBand);
      this.numHashes = numHashes !== null ? Number(numHashes) : this.bands * this.rowsPerBand;
    } else if (numHashes !== null) {
      this.numHashes = Number(numHashes);
      if (this.numHashes === 64) {
        this.bands = 16;
        this.rowsPerBand = 4;
      } else if (this.numHashes === 128) {
        this.bands = 16;
        this.rowsPerBand = 8;
      } else {
        this.bands = 20;
        this.rowsPerBand = Math.floor(this.numHashes / 20) || 5;
        this.numHashes = this.bands * this.rowsPerBand;
      }
    } else {
      // Mặc định K = 100, b = 20, r = 5
      this.numHashes = 100;
      this.bands = 20;
      this.rowsPerBand = 5;
    }

    if (this.bands * this.rowsPerBand !== this.numHashes) {
      this.numHashes = this.bands * this.rowsPerBand;
    }

    this.shingleSize = Math.max(1, Number(shingleSize) || 2);
    this.shingleType = shingleType;
    this.stripAccents = Boolean(stripAccents);

    // Ngưỡng S-curve lý thuyết: s* = (1 / b)^(1 / r)
    this.theoreticalThreshold = Number(Math.pow(1 / this.bands, 1 / this.rowsPerBand).toFixed(4));

    // Khởi tạo MinHash engine bên trong
    this.minHashEngine = new MinHash({ numHashes: this.numHashes });

    // Tài liệu và xô
    this.documents = new Map();
    this.buckets = new Map();
  }

  preprocessText(text) {
    if (!text || typeof text !== "string") return "";
    let clean = text.toLowerCase().normalize("NFC");
    if (this.stripAccents) {
      clean = removeVietnameseTones(clean);
    }
    clean = clean
      .replace(/<[^>]*>/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean;
  }

  getShingles(text) {
    return kShingles(text, {
      k: this.shingleSize,
      type: this.shingleType,
      stripAccents: this.stripAccents,
    });
  }

  getSignature(textOrShingles) {
    return this.minHashEngine.getSignature(textOrShingles);
  }

  calculateJaccard(sigA, sigB) {
    return this.minHashEngine.calculateJaccard(sigA, sigB);
  }

  calculateExactJaccard(setA, setB) {
    return this.minHashEngine.calculateExactJaccard(setA, setB);
  }

  addDocument(id, text, metadata = {}) {
    if (!id || typeof text !== "string") {
      throw new Error("Document must have a valid string id and text");
    }

    if (this.documents.has(id)) {
      this.removeDocument(id);
    }

    const shingles = this.getShingles(text);
    const signature = this.getSignature(shingles);

    // Thêm vào từng xô theo b băng LSH
    for (let b = 0; b < this.bands; b++) {
      const start = b * this.rowsPerBand;
      const end = start + this.rowsPerBand;
      const bandValues = signature.subarray(start, end);
      const bandKey = `b${b}:${bandValues.join(",")}`;

      if (!this.buckets.has(bandKey)) {
        this.buckets.set(bandKey, new Set());
      }
      this.buckets.get(bandKey).add(id);
    }

    const docRecord = {
      id,
      text,
      signature,
      shingles,
      metadata,
    };
    this.documents.set(id, docRecord);
    return { id, signature };
  }

  removeDocument(id) {
    const doc = this.documents.get(id);
    if (!doc) return false;

    for (let b = 0; b < this.bands; b++) {
      const start = b * this.rowsPerBand;
      const end = start + this.rowsPerBand;
      const bandValues = doc.signature.subarray(start, end);
      const bandKey = `b${b}:${bandValues.join(",")}`;

      const bucket = this.buckets.get(bandKey);
      if (bucket) {
        bucket.delete(id);
        if (bucket.size === 0) {
          this.buckets.delete(bandKey);
        }
      }
    }

    this.documents.delete(id);
    return true;
  }

  getDocument(id) {
    return this.documents.get(id) || null;
  }

  hasDocument(id) {
    return this.documents.has(id);
  }

  clear() {
    this.documents.clear();
    this.buckets.clear();
  }

  queryNearDuplicates(queryTextOrId, threshold = 0.8, limit = 20) {
    let querySig;
    let excludeId = null;

    if (this.documents.has(queryTextOrId)) {
      const doc = this.documents.get(queryTextOrId);
      querySig = doc.signature;
      excludeId = doc.id;
    } else {
      querySig = this.getSignature(queryTextOrId);
    }

    // Tier 1: Thu thập ứng viên va chạm trong các xô LSH O(1)
    const candidates = new Set();
    for (let b = 0; b < this.bands; b++) {
      const start = b * this.rowsPerBand;
      const end = start + this.rowsPerBand;
      const bandValues = querySig.subarray(start, end);
      const bandKey = `b${b}:${bandValues.join(",")}`;

      const bucket = this.buckets.get(bandKey);
      if (bucket) {
        for (const docId of bucket) {
          if (docId !== excludeId) {
            candidates.add(docId);
          }
        }
      }
    }

    // Tier 2: Xác minh độ tương đồng Jaccard
    const results = [];
    for (const candId of candidates) {
      const candDoc = this.documents.get(candId);
      if (!candDoc) continue;

      const approxSim = this.calculateJaccard(querySig, candDoc.signature);
      if (approxSim >= threshold) {
        results.push({
          id: candId,
          similarity: approxSim,
          metadata: candDoc.metadata,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  detectCatalogClones(shopAId, shopBId, threshold = 0.8) {
    const productsA = [];
    const productsB = [];

    for (const doc of this.documents.values()) {
      if (doc.metadata?.shopId === shopAId) productsA.push(doc);
      if (doc.metadata?.shopId === shopBId) productsB.push(doc);
    }

    const clonedPairs = [];

    for (const pB of productsB) {
      const matches = this.queryNearDuplicates(pB.id, threshold, 5);
      const shopAMatch = matches.find((m) => m.metadata?.shopId === shopAId);
      if (shopAMatch) {
        clonedPairs.push({
          targetId: pB.id,
          sourceId: shopAMatch.id,
          similarity: shopAMatch.similarity,
          targetName: pB.metadata?.name || pB.id,
          sourceName: shopAMatch.metadata?.name || shopAMatch.id,
        });
      }
    }

    const totalTarget = productsB.length;
    const clonedCount = clonedPairs.length;
    const cloneRatio = totalTarget > 0 ? Number((clonedCount / totalTarget).toFixed(2)) : 0;

    let severity = "CLEAN";
    let isFraud = false;
    let riskLevel = "LOW";
    let action = "ALLOW_NORMAL_OPERATIONS";
    let recommendedAction = "ALLOW_NORMAL_OPERATIONS";

    if (clonedCount >= 3 || cloneRatio >= 0.5) {
      severity = "CRITICAL";
      isFraud = true;
      riskLevel = "CRITICAL_CATALOG_CLONE_FRAUD";
      action = "SUSPEND_SHOP_FOR_CATALOG_THEFT";
      recommendedAction = "SUSPEND_SHOP_FOR_CATALOG_THEFT";
    } else if (clonedCount >= 1 && cloneRatio >= 0.2) {
      severity = "SUSPICIOUS";
      isFraud = false;
      riskLevel = "SUSPICIOUS_PARTIAL_CLONE";
      action = "REQUIRE_MERCHANT_COPYRIGHT_AUDIT";
      recommendedAction = "REQUIRE_MERCHANT_COPYRIGHT_AUDIT";
    }

    return {
      shopAId,
      shopBId,
      isClone: isFraud,
      isFraud,
      cloneRatio,
      clonedPairs,
      clonedCount,
      totalTargetProducts: totalTarget,
      riskLevel,
      severity,
      action,
      recommendedAction,
    };
  }

  getStats() {
    let totalBucketEntries = 0;
    for (const set of this.buckets.values()) {
      totalBucketEntries += set.size;
    }
    const avgDepth = this.buckets.size > 0 ? Number((totalBucketEntries / this.buckets.size).toFixed(2)) : 0;

    return {
      totalDocs: this.documents.size,
      totalDocuments: this.documents.size,
      totalBuckets: this.buckets.size,
      avgBucketDepth: avgDepth,
      numHashes: this.numHashes,
      bands: this.bands,
      numBands: this.bands,
      rowsPerBand: this.rowsPerBand,
      theoreticalThreshold: this.theoreticalThreshold,
    };
  }

  toJSON() {
    const docs = [];
    for (const [id, doc] of this.documents.entries()) {
      docs.push({
        id,
        text: doc.text,
        signature: Array.from(doc.signature),
        metadata: doc.metadata,
      });
    }

    return {
      numHashes: this.numHashes,
      bands: this.bands,
      rowsPerBand: this.rowsPerBand,
      shingleSize: this.shingleSize,
      shingleType: this.shingleType,
      stripAccents: this.stripAccents,
      documents: docs,
    };
  }

  static fromJSON(data) {
    if (!data) throw new Error("Invalid LSH JSON data");
    const instance = new MinHashLSH({
      numHashes: data.numHashes,
      bands: data.bands,
      rowsPerBand: data.rowsPerBand,
      shingleSize: data.shingleSize,
      shingleType: data.shingleType,
      stripAccents: data.stripAccents,
    });

    if (Array.isArray(data.documents)) {
      for (const d of data.documents) {
        instance.addDocument(d.id, d.text, d.metadata);
      }
    }

    return instance;
  }
}

export const LSHCloneDetector = MinHashLSH;

/**
 * CatalogCloneRadar - Radar phát hiện gian lận sao chép catalog giữa các gian hàng
 */
export class CatalogCloneRadar {
  constructor(lshEngine = null, options = {}) {
    if (lshEngine instanceof MinHashLSH) {
      this.lsh = lshEngine;
    } else {
      this.lsh = new MinHashLSH(options);
    }
    this.indexedProducts = new Map();
  }

  indexProduct(product) {
    if (!product) return;
    const pId = String(product.id || product._id || `p_${Date.now()}`);
    const shopId = String(product.shopId || "unknown_shop");
    const title = String(product.name || product.title || "");
    const desc = String(product.description || "");
    const cat = String(product.category || "");
    const brand = String(product.brand || "");

    // Gộp văn bản với trọng số tiêu đề x2
    const docText = `${title} ${title} ${cat} ${brand} ${desc}`.trim();
    const metadata = {
      id: pId,
      shopId,
      name: title,
      price: product.price,
      category: cat,
      brand,
    };

    this.lsh.addDocument(pId, docText, metadata);
    this.indexedProducts.set(pId, metadata);
    return { id: pId, shopId };
  }

  analyzeShopPair(targetShopId, suspectShopId, threshold = 0.8) {
    return this.lsh.detectCatalogClones(targetShopId, suspectShopId, threshold);
  }

  detectCatalogClones(shopAId, shopBId, threshold = 0.8) {
    return this.lsh.detectCatalogClones(shopAId, shopBId, threshold);
  }

  scanAllShops(threshold = 0.8) {
    const shopMap = new Map();
    for (const doc of this.lsh.documents.values()) {
      const sId = doc.metadata?.shopId;
      if (sId) {
        if (!shopMap.has(sId)) shopMap.set(sId, []);
        shopMap.get(sId).push(doc);
      }
    }

    const shopIds = Array.from(shopMap.keys());
    const alerts = [];

    for (let i = 0; i < shopIds.length; i++) {
      for (let j = 0; j < shopIds.length; j++) {
        if (i === j) continue;
        const res = this.analyzeShopPair(shopIds[i], shopIds[j], threshold);
        if (res.isFraud || res.isClone) {
          alerts.push(res);
        }
      }
    }

    return {
      totalShopsScanned: shopIds.length,
      alertsCount: alerts.length,
      alerts,
    };
  }

  toJSON() {
    return {
      lsh: this.lsh.toJSON(),
      indexedProducts: Array.from(this.indexedProducts.entries()),
    };
  }

  static fromJSON(data) {
    if (!data) throw new Error("Invalid CatalogCloneRadar JSON");
    const lsh = MinHashLSH.fromJSON(data.lsh);
    const radar = new CatalogCloneRadar(lsh);
    if (Array.isArray(data.indexedProducts)) {
      radar.indexedProducts = new Map(data.indexedProducts);
    }
    return radar;
  }
}
