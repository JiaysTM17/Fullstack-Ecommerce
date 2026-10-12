/**
 * ==============================================================================
 * ADVANCED AI & NLP ALGORITHMS SUITE FOR E-COMMERCE CHATBOTS
 * ==============================================================================
 * Includes:
 * 1. Levenshtein Distance & Fuzzy Matcher (Spelling auto-correction for Vietnamese shopping terms)
 * 2. TF-IDF & BM25 (Best Matching 25 Ranking Engine)
 * 3. Cosine Similarity Vector Search (Semantic RAG Retrieval)
 * 4. Sentiment Analysis & Frustration Radar (Buyer Anger Detection)
 */

// ------------------------------------------------------------------------------
// ALGORITHM 1: Levenshtein Distance & Fuzzy Matcher
// ------------------------------------------------------------------------------
/**
 * Calculates the minimum edit distance between two strings
 * Time complexity: O(m * n), Space: O(min(m, n))
 */
export function calculateLevenshteinDistance(str1, str2) {
  const s1 = String(str1 || "").toLowerCase().trim();
  const s2 = String(str2 || "").toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let currRow = new Array(s2.length + 1);

  for (let i = 0; i < s1.length; i++) {
    currRow[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      currRow[j + 1] = Math.min(
        currRow[j] + 1,       // Insertion
        prevRow[j + 1] + 1,   // Deletion
        prevRow[j] + cost     // Substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[s2.length];
}

/**
 * Fuzzy term matcher against a dictionary of valid vocabulary
 */
export function findClosestTerm(inputTerm, dictionary, maxDistance = 2) {
  let closest = null;
  let minDistance = Infinity;

  for (const candidate of dictionary) {
    const dist = calculateLevenshteinDistance(inputTerm, candidate);
    if (dist < minDistance && dist <= maxDistance) {
      minDistance = dist;
      closest = candidate;
    }
  }

  return closest ? { term: closest, distance: minDistance } : null;
}

// ------------------------------------------------------------------------------
// ALGORITHM 2: BM25 (Best Matching 25) Text Relevance Ranking
// ------------------------------------------------------------------------------
export class BM25Engine {
  constructor(documents = [], { k1 = 1.5, b = 0.75 } = {}) {
    this.k1 = k1;
    this.b = b;
    this.documents = documents.map((doc, idx) => ({
      id: doc.id || idx,
      content: doc.content || doc.text || "",
      metadata: doc,
      tokens: this.tokenize(doc.content || doc.text || ""),
    }));

    this.docCount = this.documents.length;
    this.avgDocLength = this.docCount > 0
      ? this.documents.reduce((acc, d) => acc + d.tokens.length, 0) / this.docCount
      : 0;

    // Document Frequency table
    this.docFreq = new Map();
    for (const doc of this.documents) {
      const uniqueTokens = new Set(doc.tokens);
      for (const token of uniqueTokens) {
        this.docFreq.set(token, (this.docFreq.get(token) || 0) + 1);
      }
    }
  }

  tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  calculateIDF(term) {
    const df = this.docFreq.get(term) || 0;
    // Robertson-Spärck Jones IDF formula
    return Math.log(1 + (this.docCount - df + 0.5) / (df + 0.5));
  }

  search(query, topK = 3) {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0 || this.docCount === 0) return [];

    const scores = this.documents.map((doc) => {
      let score = 0;
      const docLen = doc.tokens.length;

      // Count term frequency in document
      const termFreq = {};
      for (const t of doc.tokens) {
        termFreq[t] = (termFreq[t] || 0) + 1;
      }

      for (const token of queryTokens) {
        const tf = termFreq[token] || 0;
        if (tf > 0) {
          const idf = this.calculateIDF(token);
          const numerator = tf * (this.k1 + 1);
          const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / (this.avgDocLength || 1)));
          score += idf * (numerator / denominator);
        }
      }

      return {
        id: doc.id,
        score: Number(score.toFixed(4)),
        metadata: doc.metadata,
      };
    });

    return scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 3: Cosine Similarity Vector Space Engine (Vector Search RAG)
// ------------------------------------------------------------------------------
/**
 * Calculates Cosine Similarity between two n-dimensional vectors:
 * cos(theta) = (A . B) / (||A|| * ||B||)
 */
export function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return Number((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
}

/**
 * Creates a simple Term-Frequency embedding vector over a shared vocabulary
 */
export function createTfEmbedding(text, vocabulary) {
  const tokens = String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/);
  const tokenCounts = {};
  for (const t of tokens) {
    if (t) tokenCounts[t] = (tokenCounts[t] || 0) + 1;
  }

  return vocabulary.map((word) => tokenCounts[word] || 0);
}

// ------------------------------------------------------------------------------
// ALGORITHM 4: E-Commerce Sentiment & Frustration Radar (Buyer Anger Detection)
// ------------------------------------------------------------------------------
const POSITIVE_LEXICON = [
  "tuyệt vời", "rất tốt", "chất lượng", "hài lòng", "đẹp", "nhanh", "ưng ý",
  "chu đáo", "uy tín", "xuất sắc", "thích", "cảm ơn", "5 sao", "đáng tiền"
];

const NEGATIVE_LEXICON = [
  "tệ", "thất vọng", "lừa đảo", "chậm", "hư", "hỏng", "rách", "bẩn", "dỏm",
  "kém", "bom hàng", "bùng", "giao trễ", "sai mẫu", "mất tiền", "chửi", "bực"
];

const INTENSIFIERS = ["rất", "cực kỳ", "quá", "vô cùng", "quá mức", "thực sự"];

/**
 * Evaluates sentiment score from -1.0 (Extreme Frustration) to +1.0 (Extreme Satisfaction)
 */
export function analyzeSentiment(text) {
  const normalized = String(text || "").toLowerCase();
  let score = 0;
  let matches = 0;

  for (const pos of POSITIVE_LEXICON) {
    if (normalized.includes(pos)) {
      let weight = 1.0;
      for (const intensifier of INTENSIFIERS) {
        if (normalized.includes(`${intensifier} ${pos}`)) weight = 1.5;
      }
      score += weight;
      matches++;
    }
  }

  for (const neg of NEGATIVE_LEXICON) {
    if (normalized.includes(neg)) {
      let weight = -1.2; // Negative weight is slightly heavier in e-commerce
      for (const intensifier of INTENSIFIERS) {
        if (normalized.includes(`${intensifier} ${neg}`)) weight = -1.8;
      }
      score += weight;
      matches++;
    }
  }

  // Normalize between -1.0 and 1.0
  const normalizedScore = matches > 0 ? Math.max(-1.0, Math.min(1.0, score / (matches * 1.5))) : 0;
  const rounded = Number(normalizedScore.toFixed(2));

  let label = "NEUTRAL";
  if (rounded >= 0.25) label = "POSITIVE";
  else if (rounded <= -0.25) label = "NEGATIVE";

  const isFrustrated = rounded <= -0.4;

  return {
    score: rounded,
    label,
    isFrustrated,
    action: isFrustrated ? "ESCALATE_TO_SUPERVISOR_WITH_VOUCHER_COMPENSATION" : "STANDARD_AI_REPLY",
  };
}

// ------------------------------------------------------------------------------
// ALGORITHM 5: Consistent Hashing with Virtual Nodes (Sharding & Load Balancing)
// ------------------------------------------------------------------------------
export function fnv1a32(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class ConsistentHashRing {
  constructor({ replicas = 150, hashFn = fnv1a32 } = {}) {
    this.replicas = replicas;
    this.hashFn = hashFn;
    this.ring = [];
    this.nodes = new Set();
  }

  addNode(nodeId) {
    if (!nodeId || this.nodes.has(nodeId)) return;
    this.nodes.add(nodeId);

    for (let i = 0; i < this.replicas; i++) {
      const vnodeKey = `${nodeId}#vn${i}`;
      const hash = this.hashFn(vnodeKey);
      this.ring.push({ hash, nodeId, vnodeKey });
    }

    this.ring.sort((a, b) => a.hash - b.hash);
  }

  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) return;
    this.nodes.delete(nodeId);
    this.ring = this.ring.filter((entry) => entry.nodeId !== nodeId);
  }

  getNode(key) {
    if (this.ring.length === 0) return null;
    const hash = this.hashFn(String(key));

    let low = 0;
    let high = this.ring.length - 1;
    let targetIndex = 0;

    if (hash > this.ring[high].hash) {
      return this.ring[0].nodeId;
    }

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hash >= hash) {
        targetIndex = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return this.ring[targetIndex].nodeId;
  }

  getNodes() {
    return Array.from(this.nodes);
  }

  getDistribution(keys = []) {
    const counts = {};
    for (const node of this.nodes) counts[node] = 0;
    for (const k of keys) {
      const node = this.getNode(k);
      if (node) counts[node] = (counts[node] || 0) + 1;
    }
    const total = keys.length || 1;
    const dist = {};
    for (const node of Object.keys(counts)) {
      dist[node] = {
        count: counts[node],
        percentage: Number(((counts[node] / total) * 100).toFixed(2)),
      };
    }
    return dist;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 6: Bloom Filter (Probabilistic Cache Penetration Guard)
// ------------------------------------------------------------------------------
export function murmur32(str, seed = 0x9747b28c) {
  let h = seed ^ str.length;
  for (let i = 0; i < str.length; i++) {
    let k = str.charCodeAt(i);
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

export class BloomFilter {
  constructor({ expectedElements = 10000, falsePositiveRate = 0.01 } = {}) {
    this.n = Math.max(1, expectedElements);
    this.p = Math.min(Math.max(falsePositiveRate, 0.0001), 0.5);

    const ln2 = Math.LN2;
    const ln2Sq = ln2 * ln2;
    this.m = Math.ceil(-(this.n * Math.log(this.p)) / ln2Sq);
    this.k = Math.max(1, Math.ceil((this.m / this.n) * ln2));

    const byteLength = Math.ceil(this.m / 8);
    this.bitArray = new Uint8Array(byteLength);
    this.count = 0;
  }

  _getHashIndices(item) {
    const str = String(item);
    const h1 = fnv1a32(str);
    const h2 = murmur32(str);
    const indices = [];

    for (let i = 0; i < this.k; i++) {
      const combined = (h1 + Math.imul(i, h2)) >>> 0;
      indices.push(combined % this.m);
    }
    return indices;
  }

  add(item) {
    if (item === undefined || item === null) return;
    const indices = this._getHashIndices(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitOffset = idx % 8;
      this.bitArray[byteIdx] |= 1 << bitOffset;
    }
    this.count++;
  }

  addMany(items = []) {
    for (const it of items) this.add(it);
  }

  has(item) {
    if (item === undefined || item === null) return false;
    const indices = this._getHashIndices(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitOffset = idx % 8;
      if ((this.bitArray[byteIdx] & (1 << bitOffset)) === 0) {
        return false;
      }
    }
    return true;
  }

  clear() {
    this.bitArray.fill(0);
    this.count = 0;
  }

  getStats() {
    let bitsSet = 0;
    for (let i = 0; i < this.bitArray.length; i++) {
      let byte = this.bitArray[i];
      while (byte > 0) {
        byte &= byte - 1;
        bitsSet++;
      }
    }
    const fillRatio = Number(((bitsSet / this.m) * 100).toFixed(2));
    const expTerm = Math.exp((-this.k * this.count) / this.m);
    const estimatedFPR = Math.pow(1 - expTerm, this.k);

    return {
      sizeBits: this.m,
      sizeBytes: this.bitArray.byteLength,
      numHashFunctions: this.k,
      expectedElements: this.n,
      currentElements: this.count,
      targetFpr: this.p,
      fillRatioPercent: fillRatio,
      estimatedCurrentFpr: Number(estimatedFPR.toFixed(6)),
    };
  }
}

export default {
  calculateLevenshteinDistance,
  findClosestTerm,
  BM25Engine,
  calculateCosineSimilarity,
  createTfEmbedding,
  analyzeSentiment,
  ConsistentHashRing,
  fnv1a32,
  BloomFilter,
  murmur32,
};
