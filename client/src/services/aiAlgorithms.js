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
    const isMatched = neg.length <= 3
      ? new RegExp(`(^|\\s|[.,!?;:])${neg}($|\\s|[.,!?;:])`, "i").test(normalized)
      : normalized.includes(neg);
    if (isMatched) {
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

// ------------------------------------------------------------------------------
// ALGORITHM 7: Recommendation Engine (Collaborative Filtering & Item Affinity)
// ------------------------------------------------------------------------------
export class RecommendationEngine {
  constructor() {
    this.itemFrequencies = new Map();
    this.cooccurrenceMatrix = new Map();
  }

  trainFromOrders(orders = []) {
    this.itemFrequencies.clear();
    this.cooccurrenceMatrix.clear();

    for (const order of orders) {
      const items = order.items || [];
      const productIds = Array.from(new Set(items.map((i) => String(i.productId || i.id || i._id)).filter(Boolean)));

      for (const pId of productIds) {
        this.itemFrequencies.set(pId, (this.itemFrequencies.get(pId) || 0) + 1);
        if (!this.cooccurrenceMatrix.has(pId)) {
          this.cooccurrenceMatrix.set(pId, new Map());
        }
      }

      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const idA = productIds[i];
          const idB = productIds[j];

          const mapA = this.cooccurrenceMatrix.get(idA);
          mapA.set(idB, (mapA.get(idB) || 0) + 1);

          const mapB = this.cooccurrenceMatrix.get(idB);
          mapB.set(idA, (mapB.get(idA) || 0) + 1);
        }
      }
    }
  }

  getFrequentlyBoughtTogether(productId, limit = 4) {
    const targetId = String(productId);
    const cooccurMap = this.cooccurrenceMatrix.get(targetId);
    if (!cooccurMap || cooccurMap.size === 0) return [];

    const targetFreq = this.itemFrequencies.get(targetId) || 1;
    const candidates = [];

    for (const [otherId, cooccurCount] of cooccurMap.entries()) {
      if (otherId === targetId) continue;
      const otherFreq = this.itemFrequencies.get(otherId) || 1;
      const cosineAffinity = cooccurCount / Math.sqrt(targetFreq * otherFreq);

      candidates.push({
        productId: otherId,
        score: Number(cosineAffinity.toFixed(4)),
        cooccurCount,
      });
    }

    candidates.sort((a, b) => b.score - a.score || b.cooccurCount - a.cooccurCount);
    return candidates.slice(0, limit);
  }

  getPersonalizedRecommendations(userHistoryProductIds = [], allProducts = [], limit = 6) {
    const historySet = new Set(userHistoryProductIds.map(String));
    const scoreMap = new Map();

    for (const viewedId of historySet) {
      const related = this.getFrequentlyBoughtTogether(viewedId, limit * 2);
      for (const item of related) {
        if (!historySet.has(item.productId)) {
          const current = scoreMap.get(item.productId) || 0;
          scoreMap.set(item.productId, current + item.score);
        }
      }
    }

    const ranked = Array.from(scoreMap.entries()).map(([productId, score]) => ({
      productId,
      score: Number(score.toFixed(4)),
    }));
    ranked.sort((a, b) => b.score - a.score);

    const resultIds = ranked.slice(0, limit).map((r) => r.productId);

    if (resultIds.length < limit && allProducts.length > 0) {
      const popularProducts = [...allProducts]
        .sort((a, b) => (b.soldCount || b.sold || 0) - (a.soldCount || a.sold || 0))
        .map((p) => String(p.id || p._id))
        .filter((id) => !historySet.has(id) && !resultIds.includes(id));

      for (const pid of popularProducts) {
        if (resultIds.length >= limit) break;
        resultIds.push(pid);
      }
    }

    return resultIds;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 8: Aho-Corasick Multi-Pattern Matcher (Content Moderation & Fraud Words)
// ------------------------------------------------------------------------------
class AhoNode {
  constructor() {
    this.children = new Map();
    this.fail = null;
    this.output = [];
  }
}

export class AhoCorasick {
  constructor(patterns = []) {
    this.root = new AhoNode();
    this.built = false;

    if (patterns.length > 0) {
      for (const p of patterns) this.addWord(p);
      this.buildFailureLinks();
    }
  }

  addWord(word) {
    const pattern = String(word || "").trim().toLowerCase();
    if (!pattern) return;

    let curr = this.root;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (!curr.children.has(char)) {
        curr.children.set(char, new AhoNode());
      }
      curr = curr.children.get(char);
    }
    curr.output.push(pattern);
    this.built = false;
  }

  buildFailureLinks() {
    const queue = [];
    for (const [, child] of this.root.children.entries()) {
      child.fail = this.root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const current = queue.shift();

      for (const [char, child] of current.children.entries()) {
        let fallback = current.fail;
        while (fallback !== null && !fallback.children.has(char)) {
          fallback = fallback.fail;
        }

        child.fail = fallback ? fallback.children.get(char) : this.root;
        if (child.fail && child.fail.output.length > 0) {
          child.output = child.output.concat(child.fail.output);
        }
        queue.push(child);
      }
    }
    this.built = true;
  }

  scan(text) {
    if (!this.built) this.buildFailureLinks();
    const input = String(text || "").toLowerCase();
    const matches = [];
    let curr = this.root;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      while (curr !== null && !curr.children.has(char)) {
        curr = curr.fail;
      }
      if (curr === null) {
        curr = this.root;
        continue;
      }
      curr = curr.children.get(char);
      if (curr.output.length > 0) {
        for (const pattern of curr.output) {
          matches.push({
            pattern,
            start: i - pattern.length + 1,
            end: i + 1,
          });
        }
      }
    }
    return matches;
  }

  hasMatch(text) {
    return this.scan(text).length > 0;
  }

  censor(text, replacement = "***") {
    const matches = this.scan(text);
    if (matches.length === 0) return text;

    const chars = text.split("");
    const masked = new Uint8Array(chars.length);

    for (const m of matches) {
      for (let i = m.start; i < m.end; i++) {
        if (i >= 0 && i < masked.length) masked[i] = 1;
      }
    }

    let result = "";
    let i = 0;
    while (i < chars.length) {
      if (masked[i] === 1) {
        result += replacement;
        while (i < chars.length && masked[i] === 1) i++;
      } else {
        result += chars[i];
        i++;
      }
    }
    return result;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 9: TSP Last-Mile Logistics Route Optimizer (Nearest Neighbor + 2-Opt)
// ------------------------------------------------------------------------------
const EARTH_RADIUS_KM = 6371;

export function calculateHaversineDistance(locA, locB, lat2Arg, lon2Arg) {
  if (locA === undefined || locA === null) return 0;
  let lat1, lon1, lat2, lon2;
  if (typeof locA === "number" && typeof locB === "number") {
    lat1 = locA;
    lon1 = locB;
    lat2 = Number(lat2Arg) || 0;
    lon2 = Number(lon2Arg) || 0;
  } else {
    if (!locA || !locB) return 0;
    lat1 = locA.lat || locA.latitude || 0;
    lon1 = locA.lng || locA.lon || locA.longitude || 0;
    lat2 = locB.lat || locB.latitude || 0;
    lon2 = locB.lng || locB.lon || locB.longitude || 0;
  }

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(3));
}

export function nearestNeighborTSP(depot, stops = []) {
  if (!stops || stops.length === 0) return [depot];
  const unvisited = [...stops];
  const route = [depot];
  let current = depot;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistance(current, unvisited[i]);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }
    current = unvisited.splice(nearestIndex, 1)[0];
    route.push(current);
  }
  return route;
}

export function twoOptOptimize(route = [], maxIterations = 50) {
  if (route.length <= 3) return route;
  let bestRoute = [...route];
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        const currentDist =
          calculateHaversineDistance(bestRoute[i - 1], bestRoute[i]) +
          calculateHaversineDistance(bestRoute[j], bestRoute[j + 1]);

        const newDist =
          calculateHaversineDistance(bestRoute[i - 1], bestRoute[j]) +
          calculateHaversineDistance(bestRoute[i], bestRoute[j + 1]);

        if (newDist < currentDist - 0.001) {
          const newRoute = bestRoute.slice(0, i);
          const reversed = bestRoute.slice(i, j + 1).reverse();
          bestRoute = newRoute.concat(reversed, bestRoute.slice(j + 1));
          improved = true;
        }
      }
    }
  }
  return bestRoute;
}

export function optimizeDeliveryRoute(depot, stops = [], speedKmH = 25) {
  if (!depot) throw new Error("Depot location is required");
  if (!stops || stops.length === 0) {
    return { optimizedStops: [], totalDistanceKm: 0, estimatedMinutes: 0 };
  }

  const initialRoute = nearestNeighborTSP(depot, stops);
  const optimizedRoute = twoOptOptimize(initialRoute);

  let totalDist = 0;
  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    totalDist += calculateHaversineDistance(optimizedRoute[i], optimizedRoute[i + 1]);
  }
  totalDist = Number(totalDist.toFixed(3));

  const travelMinutes = (totalDist / speedKmH) * 60;
  const handlingMinutes = stops.length * 5;
  const estimatedMinutes = Math.round(travelMinutes + handlingMinutes);

  let accDist = 0;
  const stopsWithEta = optimizedRoute.slice(1).map((stop, index) => {
    const legDist = calculateHaversineDistance(optimizedRoute[index], stop);
    accDist += legDist;
    return {
      ...stop,
      deliverySequence: index + 1,
      legDistanceKm: legDist,
      cumulativeDistanceKm: Number(accDist.toFixed(2)),
      etaMinutes: Math.round((accDist / speedKmH) * 60 + (index + 1) * 5),
    };
  });

  return {
    depot,
    optimizedStops: stopsWithEta,
    totalDistanceKm: totalDist,
    estimatedMinutes,
  };
}

// ------------------------------------------------------------------------------
// ALGORITHM 10: Count-Min Sketch (Real-Time Heavy Hitters & Stream Frequency)
// ------------------------------------------------------------------------------
export class CountMinSketch {
  constructor({ epsilon = 0.005, delta = 0.01 } = {}) {
    this.epsilon = Math.max(0.0001, epsilon);
    this.delta = Math.max(0.0001, delta);
    this.w = Math.ceil(Math.E / this.epsilon);
    this.d = Math.max(2, Math.ceil(Math.log(1 / this.delta)));
    this.table = new Uint32Array(this.d * this.w);
    this.totalEvents = 0;
    this.seeds = Array.from({ length: this.d }, (_, i) => (0x9e3779b9 + i * 0x85ebca6b) >>> 0);
    this.topCandidates = new Map();
  }

  _hash(item, rowIdx) {
    const str = String(item);
    return murmur32(str, this.seeds[rowIdx]) % this.w;
  }

  update(item, count = 1) {
    if (item === undefined || item === null || count <= 0) return;
    for (let r = 0; r < this.d; r++) {
      const col = this._hash(item, r);
      this.table[r * this.w + col] += count;
    }
    this.totalEvents += count;

    const est = this.estimate(item);
    this.topCandidates.set(String(item), est);

    if (this.topCandidates.size > 100) {
      let minKey = null;
      let minVal = Infinity;
      for (const [k, v] of this.topCandidates.entries()) {
        if (v < minVal) {
          minVal = v;
          minKey = k;
        }
      }
      if (minKey) this.topCandidates.delete(minKey);
    }
  }

  estimate(item) {
    if (item === undefined || item === null) return 0;
    let minVal = Infinity;
    for (let r = 0; r < this.d; r++) {
      const col = this._hash(item, r);
      const val = this.table[r * this.w + col];
      if (val < minVal) minVal = val;
    }
    return minVal === Infinity ? 0 : minVal;
  }

  getTopK(k = 5) {
    const list = [];
    for (const [item] of this.topCandidates.entries()) {
      list.push({ item, estimatedCount: this.estimate(item) });
    }
    list.sort((a, b) => b.estimatedCount - a.estimatedCount);
    return list.slice(0, k);
  }

  clear() {
    this.table.fill(0);
    this.totalEvents = 0;
    this.topCandidates.clear();
  }

  getStats() {
    return {
      rows: this.d,
      columns: this.w,
      totalCells: this.d * this.w,
      memoryBytes: this.table.byteLength,
      totalEventsProcessed: this.totalEvents,
      epsilon: this.epsilon,
      delta: this.delta,
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 11: HyperLogLog (Cardinality Estimation for Unique Users / Viewers)
// ------------------------------------------------------------------------------
export class HyperLogLog {
  constructor(precision = 10) {
    this.b = Math.min(Math.max(precision, 4), 16);
    this.m = 1 << this.b;
    this.registers = new Uint8Array(this.m);

    if (this.m === 16) this.alpha = 0.673;
    else if (this.m === 32) this.alpha = 0.697;
    else if (this.m === 64) this.alpha = 0.709;
    else this.alpha = 0.7213 / (1 + 1.079 / this.m);
  }

  _countLeadingZeros(value, maxBits) {
    let zeros = 0;
    for (let i = maxBits - 1; i >= 0; i--) {
      if ((value & (1 << i)) === 0) zeros++;
      else break;
    }
    return zeros + 1;
  }

  add(item) {
    if (item === undefined || item === null) return;
    const hash = murmur32(String(item));
    const j = hash >>> (32 - this.b);
    const w = hash & ((1 << (32 - this.b)) - 1);
    const lz = this._countLeadingZeros(w, 32 - this.b);
    if (lz > this.registers[j]) {
      this.registers[j] = lz;
    }
  }

  addMany(items = []) {
    for (const it of items) this.add(it);
  }

  count() {
    let sum = 0;
    let zeroRegisters = 0;
    for (let j = 0; j < this.m; j++) {
      const val = this.registers[j];
      sum += Math.pow(2, -val);
      if (val === 0) zeroRegisters++;
    }

    let estimate = (this.alpha * this.m * this.m) / sum;
    if (estimate <= 2.5 * this.m) {
      if (zeroRegisters > 0) {
        estimate = this.m * Math.log(this.m / zeroRegisters);
      }
    } else if (estimate > (1 / 30) * 4294967296) {
      estimate = -4294967296 * Math.log(1 - estimate / 4294967296);
    }
    return Math.round(estimate);
  }

  merge(otherHLL) {
    if (!otherHLL || otherHLL.m !== this.m) {
      throw new Error("Cannot merge HyperLogLog with different precision");
    }
    for (let j = 0; j < this.m; j++) {
      if (otherHLL.registers[j] > this.registers[j]) {
        this.registers[j] = otherHLL.registers[j];
      }
    }
  }

  clear() {
    this.registers.fill(0);
  }

  getStats() {
    return {
      precisionBits: this.b,
      registersCount: this.m,
      memoryBytes: this.registers.byteLength,
      standardErrorPercent: Number(((1.04 / Math.sqrt(this.m)) * 100).toFixed(2)),
      estimatedCardinality: this.count(),
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 12: 0/1 Knapsack Dynamic Programming & Voucher Optimizer
// ------------------------------------------------------------------------------
export function knapsack01(items = [], capacity = 0) {
  const cap = Math.floor(Math.max(0, capacity));
  const n = items.length;
  if (n === 0 || cap === 0) return { maxValue: 0, totalWeight: 0, chosenItems: [] };

  const dp = Array.from({ length: n + 1 }, () => new Int32Array(cap + 1));
  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const weight = Math.floor(item.weight || item.price || 0);
    const value = Math.floor(item.value || item.utility || item.rating || 0);

    for (let w = 0; w <= cap; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  let currentCap = cap;
  const chosenItems = [];
  let totalWeight = 0;

  for (let i = n; i > 0; i--) {
    if (dp[i][currentCap] !== dp[i - 1][currentCap]) {
      const item = items[i - 1];
      chosenItems.unshift(item);
      const weight = Math.floor(item.weight || item.price || 0);
      totalWeight += weight;
      currentCap -= weight;
    }
  }

  return { maxValue: dp[n][cap], totalWeight, chosenItems };
}

export function findOptimalAddonToUnlockVoucher(availableProducts = [], currentCartTotal = 0, voucherMinSpend = 300000) {
  const gap = voucherMinSpend - currentCartTotal;
  if (gap <= 0) return { alreadyQualified: true, neededAmount: 0, bestAddons: [] };

  const candidates = availableProducts
    .filter((p) => (p.price || 0) >= gap)
    .sort((a, b) => (a.price || 0) - (b.price || 0));

  if (candidates.length > 0) {
    const bestSingle = candidates[0];
    return {
      alreadyQualified: false,
      neededAmount: gap,
      bestAddons: [bestSingle],
      excessAmount: (bestSingle.price || 0) - gap,
    };
  }

  const sortedCheap = [...availableProducts].sort((a, b) => (a.price || 0) - (b.price || 0));
  let currentSum = 0;
  const bundle = [];

  for (const item of sortedCheap) {
    bundle.push(item);
    currentSum += item.price || 0;
    if (currentSum >= gap) break;
  }

  return {
    alreadyQualified: false,
    neededAmount: gap,
    bestAddons: bundle,
    excessAmount: Math.max(0, currentSum - gap),
  };
}

// ------------------------------------------------------------------------------
// ALGORITHM 13: Dynamic Pricing Multi-Armed Bandit (Thompson Sampling)
// ------------------------------------------------------------------------------
function randomStandardNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function sampleGamma(shape) {
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1.0 / shape);
  }
  const d = shape - 1.0 / 3.0;
  const c = 1.0 / Math.sqrt(9.0 * d);
  while (true) {
    let z = randomStandardNormal();
    let v = 1.0 + c * z;
    if (v <= 0) continue;
    v = v * v * v;
    let u = Math.random();
    if (u < 1.0 - 0.0331 * z * z * z * z) return d * v;
    if (Math.log(u) < 0.5 * z * z + d * (1.0 - v + Math.log(v))) return d * v;
  }
}

export function sampleBeta(alpha, beta) {
  const safeAlpha = Math.max(alpha, 0.001);
  const safeBeta = Math.max(beta, 0.001);
  const x = sampleGamma(safeAlpha);
  const y = sampleGamma(safeBeta);
  return x / (x + y);
}

export class DynamicPricingBandit {
  constructor(arms = []) {
    this.arms = new Map();
    for (const arm of arms) this.addArm(arm);
  }

  addArm({ id, price, discountPercent = 0, name = "" }) {
    if (!id || price <= 0) throw new Error("Arm must have a valid id and positive price");
    this.arms.set(id, {
      id,
      price: Number(price),
      discountPercent: Number(discountPercent),
      name: name || `Mức giá ${price.toLocaleString("vi-VN")}₫`,
      alpha: 1,
      beta: 1,
      impressions: 0,
      conversions: 0,
      revenueGenerated: 0
    });
  }

  selectArm(objective = "revenue") {
    if (this.arms.size === 0) return null;
    let bestArm = null;
    let maxMetric = -Infinity;
    for (const arm of this.arms.values()) {
      const sampledCVR = sampleBeta(arm.alpha, arm.beta);
      const metric = objective === "revenue" ? arm.price * sampledCVR : sampledCVR;
      if (metric > maxMetric) {
        maxMetric = metric;
        bestArm = arm;
      }
    }
    return bestArm;
  }

  recordFeedback(armId, converted) {
    const arm = this.arms.get(armId);
    if (!arm) return;
    arm.impressions++;
    if (converted) {
      arm.conversions++;
      arm.alpha += 1;
      arm.revenueGenerated += arm.price;
    } else {
      arm.beta += 1;
    }
  }

  getBestArm(objective = "revenue") {
    let bestArm = null;
    let maxMetric = -Infinity;
    for (const arm of this.arms.values()) {
      const expectedCVR = arm.alpha / (arm.alpha + arm.beta);
      const metric = objective === "revenue" ? arm.price * expectedCVR : expectedCVR;
      if (metric > maxMetric) {
        maxMetric = metric;
        bestArm = arm;
      }
    }
    return bestArm;
  }

  getStats() {
    const totalImpressions = Array.from(this.arms.values()).reduce((sum, a) => sum + a.impressions, 0);
    const totalRevenue = Array.from(this.arms.values()).reduce((sum, a) => sum + a.revenueGenerated, 0);
    const armsSummary = Array.from(this.arms.values()).map(arm => {
      const empiricalCVR = arm.impressions > 0 ? (arm.conversions / arm.impressions) : 0;
      const expectedCVR = arm.alpha / (arm.alpha + arm.beta);
      return {
        id: arm.id,
        name: arm.name,
        price: arm.price,
        discountPercent: arm.discountPercent,
        impressions: arm.impressions,
        conversions: arm.conversions,
        empiricalCVR: Number((empiricalCVR * 100).toFixed(2)),
        expectedCVR: Number((expectedCVR * 100).toFixed(2)),
        revenueGenerated: arm.revenueGenerated,
        expectedRevenuePerImpression: Math.round(arm.price * expectedCVR)
      };
    });
    return {
      totalArms: this.arms.size,
      totalImpressions,
      totalRevenue,
      bestArm: this.getBestArm("revenue"),
      arms: armsSummary
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 14: Disjoint Set Union (DSU) & Sybil Fraud Radar
// ------------------------------------------------------------------------------
export class DisjointSetUnion {
  constructor() {
    this.parent = new Map();
    this.rank = new Map();
    this.size = new Map();
  }

  makeSet(x) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      this.size.set(x, 1);
    }
  }

  find(x) {
    this.makeSet(x);
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)));
    }
    return this.parent.get(x);
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

    const rankX = this.rank.get(rootX);
    const rankY = this.rank.get(rootY);
    const sizeX = this.size.get(rootX);
    const sizeY = this.size.get(rootY);

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
      this.size.set(rootY, sizeX + sizeY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
      this.size.set(rootX, sizeX + sizeY);
    } else {
      this.parent.set(rootY, rootX);
      this.size.set(rootX, sizeX + sizeY);
      this.rank.set(rootX, rankX + 1);
    }
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  getClusterSize(x) {
    return this.size.get(this.find(x)) || 1;
  }

  getAllClusters() {
    const clusters = new Map();
    for (const node of this.parent.keys()) {
      const root = this.find(node);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(node);
    }
    return Array.from(clusters.values());
  }
}

export class SybilFraudRadar {
  constructor({ clusterSizeThreshold = 3 } = {}) {
    this.dsu = new DisjointSetUnion();
    this.clusterSizeThreshold = clusterSizeThreshold;
    this.accountMetadata = new Map();
    this.entityIndex = {
      devices: new Map(),
      bankAccounts: new Map(),
      phones: new Map(),
      ips: new Map()
    };
  }

  registerUser({
    userId,
    deviceId = null,
    bankAccount = null,
    phone = null,
    ip = null,
    vouchersClaimed = 0,
    ordersCount = 0,
    cancelledCount = 0
  }) {
    if (!userId) return;
    this.dsu.makeSet(userId);
    this.accountMetadata.set(userId, {
      userId,
      deviceId,
      bankAccount,
      phone,
      ip,
      vouchersClaimed: Number(vouchersClaimed) || 0,
      ordersCount: Number(ordersCount) || 0,
      cancelledCount: Number(cancelledCount) || 0
    });

    const link = (map, key) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, new Set());
      const set = map.get(key);
      for (const other of set) this.dsu.union(userId, other);
      set.add(userId);
    };

    link(this.entityIndex.devices, deviceId);
    link(this.entityIndex.bankAccounts, bankAccount);
    link(this.entityIndex.phones, phone);
    link(this.entityIndex.ips, ip);
  }

  analyzeUser(userId) {
    if (!this.dsu.parent.has(userId)) {
      return { userId, isSuspicious: false, clusterSize: 1, riskScore: 0 };
    }
    const clusterSize = this.dsu.getClusterSize(userId);
    const root = this.dsu.find(userId);
    const myCluster = this.dsu.getAllClusters().find(c => c.includes(userId)) || [userId];

    let totalVouchers = 0, totalOrders = 0, totalCancelled = 0;
    for (const u of myCluster) {
      const m = this.accountMetadata.get(u);
      if (m) {
        totalVouchers += m.vouchersClaimed;
        totalOrders += m.ordersCount;
        totalCancelled += m.cancelledCount;
      }
    }

    let riskScore = 0;
    if (clusterSize >= this.clusterSizeThreshold) riskScore += 40;
    if (clusterSize >= 5) riskScore += 30;
    if (totalVouchers >= clusterSize * 2) riskScore += 20;
    const cancelRate = totalOrders > 0 ? totalCancelled / totalOrders : 0;
    if (cancelRate >= 0.3) riskScore += 20;

    riskScore = Math.min(100, riskScore);
    const isSuspicious = riskScore >= 50;

    return {
      userId,
      rootRepresentative: root,
      clusterSize,
      clusterMembers: myCluster,
      riskScore,
      isSuspicious,
      recommendedAction: isSuspicious ? "LOCK_VOUCHER_PRIVILEGES_AND_REQUIRE_PREPAYMENT" : "ALLOW_NORMAL_ACCESS"
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 15: Trie Autocomplete with Fuzzy Typo Tolerance
// ------------------------------------------------------------------------------
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

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.originalText = "";
    this.payload = null;
    this.topSuggestions = [];
  }

  updateSuggestion(item, maxCapacity = 10) {
    const existing = this.topSuggestions.find(s => s.text === item.text);
    if (existing) {
      if (item.frequency > existing.frequency) existing.frequency = item.frequency;
    } else {
      this.topSuggestions.push(item);
    }
    this.topSuggestions.sort((a, b) => b.frequency - a.frequency);
    if (this.topSuggestions.length > maxCapacity) this.topSuggestions.pop();
  }
}

export class TrieAutocomplete {
  constructor({ maxSuggestionsPerNode = 10 } = {}) {
    this.root = new TrieNode();
    this.maxSuggestionsPerNode = maxSuggestionsPerNode;
  }

  insert(text, frequency = 1, payload = null) {
    if (!text || typeof text !== "string") return;
    const normalized = text.trim();
    const unaccented = removeVietnameseTones(normalized);
    const item = { text: normalized, unaccented, frequency: Number(frequency), payload };

    this._insertPath(normalized.toLowerCase(), item);
    if (unaccented !== normalized.toLowerCase()) {
      this._insertPath(unaccented, item);
    }
  }

  _insertPath(pathStr, item) {
    let curr = this.root;
    curr.updateSuggestion(item, this.maxSuggestionsPerNode);
    for (const char of pathStr) {
      if (!curr.children.has(char)) curr.children.set(char, new TrieNode());
      curr = curr.children.get(char);
      curr.updateSuggestion(item, this.maxSuggestionsPerNode);
    }
    curr.isEndOfWord = true;
    curr.frequency = Math.max(curr.frequency, item.frequency);
    curr.originalText = item.text;
    curr.payload = item.payload;
  }

  searchPrefix(prefix, limit = 5) {
    if (!prefix) return [];
    const norm = prefix.trim().toLowerCase();
    const unaccented = removeVietnameseTones(norm);
    let suggestions = this._findPathSuggestions(norm);
    if (suggestions.length === 0 && unaccented !== norm) {
      suggestions = this._findPathSuggestions(unaccented);
    }
    const unique = new Map();
    for (const item of suggestions) {
      if (!unique.has(item.text)) unique.set(item.text, item);
    }
    return Array.from(unique.values()).slice(0, limit);
  }

  _findPathSuggestions(pathStr) {
    let curr = this.root;
    for (const char of pathStr) {
      if (!curr.children.has(char)) return [];
      curr = curr.children.get(char);
    }
    return curr.topSuggestions;
  }

  fuzzySearch(query, maxDistance = 1, limit = 5) {
    if (!query) return [];
    const exact = this.searchPrefix(query, limit);
    if (exact.length > 0) return exact;

    const normQuery = removeVietnameseTones(query);
    const results = [];
    const currentRow = Array.from({ length: normQuery.length + 1 }, (_, i) => i);

    for (const [char, child] of this.root.children.entries()) {
      this._fuzzySearchRecursive(child, char, normQuery, currentRow, results, maxDistance);
    }

    results.sort((a, b) => (a.distance !== b.distance ? a.distance - b.distance : b.frequency - a.frequency));
    const unique = new Map();
    for (const r of results) {
      if (!unique.has(r.text)) unique.set(r.text, r);
    }
    return Array.from(unique.values()).slice(0, limit);
  }

  _fuzzySearchRecursive(node, char, query, previousRow, results, maxDistance) {
    const columns = query.length + 1;
    const currentRow = [previousRow[0] + 1];
    for (let col = 1; col < columns; col++) {
      const insertCost = currentRow[col - 1] + 1;
      const deleteCost = previousRow[col] + 1;
      const replaceCost = previousRow[col - 1] + (query[col - 1] === char ? 0 : 1);
      currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
    }
    if (currentRow[columns - 1] <= maxDistance) {
      for (const item of node.topSuggestions) {
        results.push({
          text: item.text,
          distance: currentRow[columns - 1],
          frequency: item.frequency,
          payload: item.payload
        });
      }
    }
    if (Math.min(...currentRow) <= maxDistance) {
      for (const [nextChar, child] of node.children.entries()) {
        this._fuzzySearchRecursive(child, nextChar, query, currentRow, results, maxDistance);
      }
    }
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 16: Double-Entry Bookkeeping Ledger & Cryptographic Merkle Tree
// ------------------------------------------------------------------------------
export function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  let currentBlock = 0;
  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    currentBlock = (currentBlock << 8) | (code & 0xff);
    if ((i % 4) === 3) {
      words.push(currentBlock >>> 0);
      currentBlock = 0;
    }
  }
  const remaining = ascii[lengthProperty] % 4;
  if (remaining !== 0) {
    currentBlock = (currentBlock << ((4 - remaining) * 8)) >>> 0;
    words.push(currentBlock);
  }
  const bitOffset = asciiBitLength % 32;
  const wordIndex = asciiBitLength >>> 5;
  if (words.length <= wordIndex) {
    words.push(0x80000000 >>> 0);
  } else {
    words[wordIndex] = (words[wordIndex] | (0x80 << (24 - bitOffset))) >>> 0;
  }
  while ((words.length % 16) !== 14) words.push(0);
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength >>> 0);

  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = i < 16 ? w[i] : (
        w[i] = (
          (w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0
        )
      );
      const s1 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const ch = (hash[0] & hash[1]) ^ ((~hash[0]) & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ((hash[4] & hash[5]) ^ ((~hash[4]) & hash[6])) + k[i] + w[i]) | 0;
      const temp2 = (s1 + ch) | 0;
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16 ? 0 : "") + b.toString(16));
    }
  }
  return result;
}

export class DoubleEntryLedger {
  constructor() {
    this.accounts = new Map();
    this.transactions = [];
    this._initAccount("ASSETS:ESCROW_BANK", "ASSET");
    this._initAccount("ASSETS:COD_RECEIVABLE", "ASSET");
    this._initAccount("LIABILITIES:MERCHANT_PAYABLE", "LIABILITY");
    this._initAccount("LIABILITIES:TAX_WITHHOLDING", "LIABILITY");
    this._initAccount("REVENUE:PLATFORM_COMMISSION", "REVENUE");
    this._initAccount("EXPENSES:VOUCHER_SUBSIDY", "EXPENSE");
  }

  _initAccount(name, type) {
    if (!this.accounts.has(name)) {
      this.accounts.set(name, { name, type, balance: 0, debitTotal: 0, creditTotal: 0 });
    }
  }

  recordTransaction({ id, description = "", entries = [], timestamp = null }) {
    if (!id || !Array.isArray(entries) || entries.length < 2) {
      throw new Error("Transaction must have an id and at least 2 ledger entries");
    }
    let totalDebit = 0, totalCredit = 0;
    for (const entry of entries) {
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);
      if (debit < 0 || credit < 0) throw new Error("Debit and credit amounts must be non-negative");
      totalDebit += debit;
      totalCredit += credit;
    }
    if (totalDebit !== totalCredit || totalDebit === 0) {
      throw new Error(`LEDGER_IMBALANCE_ERROR: Total Debits (${totalDebit}) must equal Total Credits (${totalCredit})`);
    }
    for (const entry of entries) {
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);
      this._initAccount(entry.account, entry.account.startsWith("ASSET") ? "ASSET" : "LIABILITY");
      const acc = this.accounts.get(entry.account);
      acc.debitTotal += debit;
      acc.creditTotal += credit;
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        acc.balance += (debit - credit);
      } else {
        acc.balance += (credit - debit);
      }
    }
    const txRecord = { id, description, entries, totalAmount: totalDebit, timestamp: timestamp || new Date().toISOString() };
    this.transactions.push(txRecord);
    return txRecord;
  }

  getBalance(accountName) {
    const acc = this.accounts.get(accountName);
    return acc ? acc.balance : 0;
  }

  getTrialBalance() {
    let grandTotalDebit = 0, grandTotalCredit = 0;
    const accountList = [];
    for (const acc of this.accounts.values()) {
      grandTotalDebit += acc.debitTotal;
      grandTotalCredit += acc.creditTotal;
      accountList.push({ name: acc.name, type: acc.type, debit: acc.debitTotal, credit: acc.creditTotal, balance: acc.balance });
    }
    return {
      isBalanced: grandTotalDebit === grandTotalCredit,
      totalDebit: grandTotalDebit,
      totalCredit: grandTotalCredit,
      discrepancy: Math.abs(grandTotalDebit - grandTotalCredit),
      accounts: accountList
    };
  }
}

export class MerkleTree {
  constructor(transactions = []) {
    this.leaves = [];
    this.layers = [];
    if (transactions.length > 0) this.buildTree(transactions);
  }

  buildTree(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      this.leaves = [];
      this.layers = [[]];
      return "";
    }
    this.leaves = transactions.map(tx => {
      const serialized = typeof tx === "string" ? tx : JSON.stringify(tx);
      return sha256(serialized);
    });
    this.layers = [this.leaves];
    let currentLayer = this.leaves;
    while (currentLayer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left;
        nextLayer.push(sha256(left + right));
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
    return this.getRoot();
  }

  getRoot() {
    if (this.layers.length === 0 || this.layers[this.layers.length - 1].length === 0) return "";
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leafIndex) {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) throw new Error(`Invalid leaf index: ${leafIndex}`);
    const proof = [];
    let currentIndex = leafIndex;
    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      const isRightSibling = currentIndex % 2 === 1;
      const siblingIndex = isRightSibling ? currentIndex - 1 : currentIndex + 1;
      if (siblingIndex < layer.length) {
        proof.push({ position: isRightSibling ? "left" : "right", hash: layer[siblingIndex] });
      } else {
        proof.push({ position: "right", hash: layer[currentIndex] });
      }
      currentIndex = Math.floor(currentIndex / 2);
    }
    return proof;
  }

  static verifyProof(transaction, proof, root) {
    if (!transaction || !proof || !root) return false;
    const serialized = typeof transaction === "string" ? transaction : JSON.stringify(transaction);
    let currentHash = sha256(serialized);
    for (const item of proof) {
      if (item.position === "left") {
        currentHash = sha256(item.hash + currentHash);
      } else {
        currentHash = sha256(currentHash + item.hash);
      }
    }
    return currentHash === root;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 17: Probabilistic Skiplist Range Query Index
// ------------------------------------------------------------------------------
class SkiplistNode {
  constructor(key, value, level) {
    this.key = key;
    this.value = value;
    this.forward = new Array(level).fill(null);
  }
}

export class SkiplistIndex {
  constructor({ maxLevel = 16, p = 0.5 } = {}) {
    this.maxLevel = maxLevel;
    this.p = p;
    this.level = 1;
    this.size = 0;
    this.header = new SkiplistNode(-Infinity, null, this.maxLevel);
  }

  _randomLevel() {
    let lvl = 1;
    while (Math.random() < this.p && lvl < this.maxLevel) lvl++;
    return lvl;
  }

  insert(key, value) {
    const numKey = Number(key);
    const update = new Array(this.maxLevel).fill(null);
    let curr = this.header;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < numKey) {
        curr = curr.forward[i];
      }
      update[i] = curr;
    }
    curr = curr.forward[0];
    const newLevel = this._randomLevel();
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) update[i] = this.header;
      this.level = newLevel;
    }
    const newNode = new SkiplistNode(numKey, value, newLevel);
    for (let i = 0; i < newLevel; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;
    }
    this.size++;
    return newNode;
  }

  search(key) {
    const numKey = Number(key);
    let curr = this.header;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < numKey) {
        curr = curr.forward[i];
      }
    }
    curr = curr.forward[0];
    return (curr !== null && curr.key === numKey) ? curr.value : null;
  }

  rangeQuery(minPrice = 0, maxPrice = Infinity, limit = 50) {
    const min = Number(minPrice);
    const max = Number(maxPrice);
    const results = [];
    let curr = this.header;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < min) {
        curr = curr.forward[i];
      }
    }
    curr = curr.forward[0];
    while (curr !== null && curr.key <= max && results.length < limit) {
      results.push({ price: curr.key, data: curr.value });
      curr = curr.forward[0];
    }
    return results;
  }

  delete(key) {
    const numKey = Number(key);
    const update = new Array(this.maxLevel).fill(null);
    let curr = this.header;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < numKey) {
        curr = curr.forward[i];
      }
      update[i] = curr;
    }
    curr = curr.forward[0];
    if (curr !== null && curr.key === numKey) {
      for (let i = 0; i < this.level; i++) {
        if (update[i].forward[i] !== curr) break;
        update[i].forward[i] = curr.forward[i];
      }
      while (this.level > 1 && this.header.forward[this.level - 1] === null) this.level--;
      this.size--;
      return true;
    }
    return false;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 18: Multi-Warehouse Optimal Fulfillment Dispatcher
// ------------------------------------------------------------------------------
export class MultiWarehouseDispatcher {
  constructor(warehouses = [], { basePackageFee = 15000, ratePerKm = 30 } = {}) {
    this.warehouses = new Map();
    this.basePackageFee = basePackageFee;
    this.ratePerKm = ratePerKm;
    for (const wh of warehouses) this.addWarehouse(wh);
  }

  addWarehouse({ id, name, location, inventory = {} }) {
    if (!id || !location) throw new Error("Warehouse must have an id and GPS location");
    const invMap = inventory instanceof Map ? inventory : new Map(Object.entries(inventory));
    this.warehouses.set(id, {
      id,
      name: name || id,
      location: { lat: Number(location.lat), lng: Number(location.lng) },
      inventory: invMap
    });
  }

  setStock(warehouseId, skuId, quantity) {
    const wh = this.warehouses.get(warehouseId);
    if (!wh) throw new Error(`Warehouse ${warehouseId} not found`);
    wh.inventory.set(skuId, Math.max(0, Number(quantity)));
  }

  getStock(warehouseId, skuId) {
    const wh = this.warehouses.get(warehouseId);
    return wh ? (wh.inventory.get(skuId) || 0) : 0;
  }

  calculateShippingCost(warehouse, buyerLocation) {
    const distanceKm = calculateHaversineDistance(
      warehouse.location,
      buyerLocation
    );
    const shippingFee = Math.round(this.basePackageFee + (distanceKm * this.ratePerKm));
    return { distanceKm: Number(distanceKm.toFixed(1)), shippingFee };
  }

  optimizeDispatch(orderItems = [], buyerLocation) {
    if (!Array.isArray(orderItems) || orderItems.length === 0 || !buyerLocation) {
      return { success: false, reason: "INVALID_DISPATCH_INPUT", packages: [], totalCost: 0 };
    }

    // 1. Kiểm tra Single Warehouse Fulfillment
    const fullyCapable = [];
    for (const wh of this.warehouses.values()) {
      let canFulfill = true;
      for (const item of orderItems) {
        if ((wh.inventory.get(item.skuId) || 0) < item.quantity) {
          canFulfill = false;
          break;
        }
      }
      if (canFulfill) {
        const { distanceKm, shippingFee } = this.calculateShippingCost(wh, buyerLocation);
        fullyCapable.push({ warehouse: wh, distanceKm, shippingFee });
      }
    }

    if (fullyCapable.length > 0) {
      fullyCapable.sort((a, b) => a.shippingFee - b.shippingFee);
      const chosen = fullyCapable[0];
      return {
        success: true,
        strategy: "SINGLE_WAREHOUSE_CONSOLIDATED",
        splitCount: 1,
        totalCost: chosen.shippingFee,
        packages: [{
          packageId: `PKG_${chosen.warehouse.id}_1`,
          warehouseId: chosen.warehouse.id,
          warehouseName: chosen.warehouse.name,
          items: orderItems.map(i => ({ skuId: i.skuId, quantity: i.quantity, name: i.name })),
          distanceKm: chosen.distanceKm,
          shippingFee: chosen.shippingFee
        }]
      };
    }

    // 2. Multi-Warehouse Split Fulfillment
    const needed = new Map();
    for (const item of orderItems) needed.set(item.skuId, item.quantity);

    const packages = [];
    let totalCost = 0;
    const sortedWarehouses = Array.from(this.warehouses.values()).map(wh => {
      const { distanceKm, shippingFee } = this.calculateShippingCost(wh, buyerLocation);
      return { warehouse: wh, distanceKm, shippingFee };
    }).sort((a, b) => a.shippingFee - b.shippingFee);

    for (const { warehouse, distanceKm, shippingFee } of sortedWarehouses) {
      const itemsToFulfill = [];
      for (const [skuId, requiredQty] of needed.entries()) {
        if (requiredQty <= 0) continue;
        const available = warehouse.inventory.get(skuId) || 0;
        if (available > 0) {
          const allocateQty = Math.min(requiredQty, available);
          itemsToFulfill.push({ skuId, quantity: allocateQty });
          needed.set(skuId, requiredQty - allocateQty);
        }
      }
      if (itemsToFulfill.length > 0) {
        packages.push({
          packageId: `PKG_${warehouse.id}_${packages.length + 1}`,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          items: itemsToFulfill,
          distanceKm,
          shippingFee
        });
        totalCost += shippingFee;
      }
      if (!Array.from(needed.values()).some(qty => qty > 0)) break;
    }

    const unfulfilled = Array.from(needed.entries())
      .filter(([_, qty]) => qty > 0)
      .map(([skuId, qty]) => ({ skuId, missingQuantity: qty }));

    if (unfulfilled.length > 0) {
      return { success: false, strategy: "INSUFFICIENT_STOCK", unfulfilledItems: unfulfilled, packages, totalCost };
    }

    return {
      success: true,
      strategy: "MULTI_WAREHOUSE_SPLIT",
      splitCount: packages.length,
      totalCost,
      packages
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 19: Locality-Sensitive Hashing (LSH) & MinHash Catalog Clone Detector
// ------------------------------------------------------------------------------
export const LSH_PRIME = 4294967311;

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
    this.theoreticalThreshold = Number(Math.pow(1 / this.bands, 1 / this.rowsPerBand).toFixed(4));
    this.minHashEngine = new MinHash({ numHashes: this.numHashes });
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

// ------------------------------------------------------------------------------
// ALGORITHM 20: Generalized Second Price (GSP) & VCG Sponsored Search Auction Engine
// ------------------------------------------------------------------------------
export class AuctionEngine {
  constructor(config = {}) {
    this.defaultReservePrice = Math.max(100, Number(config.defaultReservePrice) || 500);
    this.currency = config.currency || "VND";
    this.qualityScoreWeight = Number(config.qualityScoreWeight) || 1.0;
    this.positionCtrDecay = Array.isArray(config.positionCtrDecay)
      ? config.positionCtrDecay
      : [1.0, 0.7, 0.45, 0.3, 0.2];

    this.defaultSlots = Array.isArray(config.defaultSlots) && config.defaultSlots.length > 0
      ? config.defaultSlots
      : [
          { id: "slot_1", position: 1, name: "Top 1 Hero Sponsored", ctr: 0.15 },
          { id: "slot_2", position: 2, name: "Top 2 Sponsored Card", ctr: 0.09 },
          { id: "slot_3", position: 3, name: "Top 3 Sponsored Card", ctr: 0.05 },
        ];
  }

  calculateQualityScore(bidder = {}) {
    if (typeof bidder.qualityScore === "number" && !isNaN(bidder.qualityScore)) {
      return Math.min(10.0, Math.max(0.1, Number(bidder.qualityScore.toFixed(2))));
    }

    const rel = typeof bidder.relevanceScore === "number" ? bidder.relevanceScore : 7.0;
    const ctr = typeof bidder.ctr === "number" ? bidder.ctr : 0.045;
    const cvr = typeof bidder.cvr === "number" ? bidder.cvr : 0.030;
    const rating = typeof bidder.shopRating === "number" ? bidder.shopRating : 4.5;

    const score = (rel / 10.0) * 4.0 +
                  Math.min(1.0, ctr / 0.06) * 3.0 +
                  Math.min(1.0, cvr / 0.04) * 2.0 +
                  (rating / 5.0) * 1.0;

    return Math.min(10.0, Math.max(0.1, Number(score.toFixed(2))));
  }

  _normalizeInputs(slotsInput, biddersInput, reservePriceInput) {
    const reservePrice = typeof reservePriceInput === "number" ? reservePriceInput : this.defaultReservePrice;

    let slots = [];
    if (typeof slotsInput === "number" && slotsInput > 0) {
      const count = Math.min(10, Math.floor(slotsInput));
      for (let i = 1; i <= count; i++) {
        const ctr = Number((0.15 * Math.pow(0.65, i - 1)).toFixed(4));
        slots.push({ id: `slot_${i}`, position: i, name: `Vị trí tài trợ ${i}`, ctr });
      }
    } else if (Array.isArray(slotsInput) && slotsInput.length > 0) {
      slots = slotsInput.map((s, idx) => ({
        id: s.id || `slot_${idx + 1}`,
        position: s.position || idx + 1,
        name: s.name || `Vị trí tài trợ ${idx + 1}`,
        ctr: typeof s.ctr === "number" ? s.ctr : Number((0.15 * Math.pow(0.65, idx)).toFixed(4)),
      }));
    } else {
      slots = [...this.defaultSlots];
    }
    slots.sort((a, b) => b.ctr - a.ctr);

    const rawBidders = Array.isArray(biddersInput) ? biddersInput : [];
    const validBidders = [];
    const disqualifiedBidders = [];

    for (const b of rawBidders) {
      const bid = Number(b.bid) || 0;
      const qs = this.calculateQualityScore(b);
      const adRank = Number((bid * qs).toFixed(2));

      const normalized = {
        bidderId: String(b.bidderId || b.id || `bidder_${validBidders.length + 1}`),
        shopId: String(b.shopId || "unknown_shop"),
        productId: String(b.productId || "unknown_product"),
        bid,
        qualityScore: qs,
        adRank,
        ctr: typeof b.ctr === "number" ? b.ctr : 0.05,
      };

      if (bid < reservePrice) {
        disqualifiedBidders.push({ ...normalized, reason: `Bid ${bid}₫ dưới giá sàn ${reservePrice}₫` });
      } else {
        validBidders.push(normalized);
      }
    }

    validBidders.sort((a, b) => b.adRank - a.adRank || b.bid - a.bid);
    return { slots, validBidders, disqualifiedBidders, reservePrice };
  }

  runGspAuction({ slots = 3, bidders = [], reservePrice, impressions = 1000 } = {}) {
    const norm = this._normalizeInputs(slots, bidders, reservePrice);
    const { slots: slotList, validBidders, disqualifiedBidders, reservePrice: minPrice } = norm;

    const allocations = [];
    const unallocatedBidders = [];
    const totalSlots = slotList.length;
    let totalRevenue = 0;
    let totalClicks = 0;

    for (let i = 0; i < validBidders.length; i++) {
      const bidder = validBidders[i];

      if (i < totalSlots) {
        const slot = slotList[i];
        let nextRank = 0;
        if (i + 1 < validBidders.length) {
          nextRank = validBidders[i + 1].adRank;
        }

        let computedCpc = 0;
        if (nextRank > 0) {
          computedCpc = Math.floor(nextRank / bidder.qualityScore) + 1;
        } else {
          computedCpc = minPrice;
        }

        const finalCpc = Math.min(bidder.bid, Math.max(minPrice, computedCpc));

        const slotCtr = slot.ctr;
        const estClicks = Math.round(impressions * slotCtr);
        const estCost = estClicks * finalCpc;
        const savingsPerClick = bidder.bid - finalCpc;
        const savings = savingsPerClick * estClicks;

        totalRevenue += estCost;
        totalClicks += estClicks;

        allocations.push({
          rank: i + 1,
          position: slot.position,
          slotIndex: i,
          slotId: slot.id,
          slotName: slot.name,
          slotCtr,
          bidderId: bidder.bidderId,
          shopId: bidder.shopId,
          productId: bidder.productId,
          bid: bidder.bid,
          qualityScore: bidder.qualityScore,
          adRank: bidder.adRank,
          cpc: finalCpc,
          nextAdRank: nextRank,
          nextCompetitorRank: nextRank,
          expectedClicks: estClicks,
          expectedCost: estCost,
          savingsPerClick,
          savings,
          pricingRule: nextRank > 0 ? "SECOND_PRICE_COMPETITOR" : "RESERVE_PRICE_FLOOR",
        });
      } else {
        unallocatedBidders.push({
          ...bidder,
          reason: `AdRank ${bidder.adRank} không đủ cao để vào top ${totalSlots} vị trí`,
        });
      }
    }

    return {
      mechanism: "GSP",
      auctionType: "GSP",
      reservePrice: minPrice,
      totalSlots,
      slotsAllocated: allocations.length,
      allocatedCount: allocations.length,
      unallocatedCount: unallocatedBidders.length,
      disqualifiedCount: disqualifiedBidders.length,
      winners: allocations,
      allocations,
      unallocated: unallocatedBidders,
      unallocatedBidders,
      disqualifiedBidders,
      totalRevenue,
      summary: {
        totalRevenue,
        totalClicks,
        averageCpc: totalClicks > 0 ? Math.round(totalRevenue / totalClicks) : 0,
        currency: this.currency,
      },
    };
  }

  runVcgAuction({ slots = 3, bidders = [], reservePrice, impressions = 1000 } = {}) {
    const norm = this._normalizeInputs(slots, bidders, reservePrice);
    const { slots: slotList, validBidders, disqualifiedBidders, reservePrice: minPrice } = norm;

    const M = slotList.length;
    const N = validBidders.length;
    const allocatedCount = Math.min(M, N);

    const allocations = [];
    const unallocatedBidders = [];
    let totalWelfare = 0;
    let totalRevenue = 0;
    let totalClicks = 0;

    const alphas = slotList.map((s) => s.ctr);
    alphas.push(0);

    for (let i = 0; i < N; i++) {
      const bidder = validBidders[i];

      if (i < allocatedCount) {
        const slot = slotList[i];
        const alpha_i = alphas[i];

        let externalityTotal = 0;
        if (M === 1) {
          const secondBidder = validBidders[1];
          const secondVal = secondBidder ? secondBidder.bid : minPrice;
          externalityTotal = secondVal;
        } else {
          for (let k = i + 1; k <= Math.min(M, N); k++) {
            const competitor = validBidders[k];
            if (competitor) {
              const deltaAlpha = alphas[k - 1] - alphas[k];
              externalityTotal += competitor.bid * deltaAlpha;
            }
          }
        }

        let cpcVcg = M === 1
          ? Math.round(externalityTotal)
          : (alpha_i > 0 ? Math.round(externalityTotal / alpha_i) : minPrice);

        if (cpcVcg === 0 || isNaN(cpcVcg)) {
          cpcVcg = minPrice;
        }

        const finalCpc = Math.min(bidder.bid, Math.max(minPrice, cpcVcg));

        const estClicks = Math.round(impressions * alpha_i);
        const estCost = estClicks * finalCpc;
        const welfareContribution = Number((bidder.bid * alpha_i).toFixed(2));
        const savingsPerClick = bidder.bid - finalCpc;
        const savings = savingsPerClick * estClicks;

        totalWelfare += welfareContribution;
        totalRevenue += estCost;
        totalClicks += estClicks;

        allocations.push({
          rank: i + 1,
          position: slot.position,
          slotIndex: i,
          slotId: slot.id,
          slotName: slot.name,
          slotCtr: alpha_i,
          bidderId: bidder.bidderId,
          shopId: bidder.shopId,
          productId: bidder.productId,
          bid: bidder.bid,
          qualityScore: bidder.qualityScore,
          adRank: bidder.adRank,
          cpc: finalCpc,
          externalityTotal: Number(externalityTotal.toFixed(2)),
          welfareContribution,
          expectedClicks: estClicks,
          expectedCost: estCost,
          savingsPerClick,
          savings,
          pricingRule: M === 1 ? "VCG_EXCLUSIVE_SLOT_COLLAPSE" : "VCG_EXTERNALITY_HARMONIC",
        });
      } else {
        unallocatedBidders.push({
          ...bidder,
          reason: `Vượt quá giới hạn ${M} vị trí hiển thị VCG`,
        });
      }
    }

    return {
      mechanism: "VCG",
      auctionType: "VCG",
      reservePrice: minPrice,
      totalSlots: M,
      slotsAllocated: allocatedCount,
      allocatedCount,
      unallocatedCount: unallocatedBidders.length,
      disqualifiedCount: disqualifiedBidders.length,
      winners: allocations,
      allocations,
      unallocated: unallocatedBidders,
      unallocatedBidders,
      disqualifiedBidders,
      totalRevenue,
      totalSocialWelfare: Number(totalWelfare.toFixed(2)),
      externalityPayments: allocations.map((a) => a.externalityTotal),
      summary: {
        socialWelfare: Number(totalWelfare.toFixed(2)),
        totalRevenue,
        totalClicks,
        averageCpc: totalClicks > 0 ? Math.round(totalRevenue / totalClicks) : 0,
        currency: this.currency,
      },
    };
  }

  runAuction({ type = "GSP", mechanism = "GSP", slots, bidders, reservePrice, impressions } = {}) {
    const selectedType = String(type || mechanism).toUpperCase();
    if (selectedType === "VCG") {
      return this.runVcgAuction({ slots, bidders, reservePrice, impressions });
    }
    return this.runGspAuction({ slots, bidders, reservePrice, impressions });
  }

  simulateBiddingStrategy({
    targetBidderId,
    originalBid,
    testBids,
    targetBidder,
    trueValuation,
    alternativeBids = [],
    competitors = [],
    slots = null,
    mechanism = "VCG",
    auctionType = "VCG",
  } = {}) {
    const v_i = Number(trueValuation || originalBid || targetBidder?.bid || 2000);
    const bidsToTest = Array.isArray(testBids) && testBids.length > 0
      ? testBids
      : (Array.isArray(alternativeBids) && alternativeBids.length > 0
          ? alternativeBids
          : [v_i * 0.5, v_i * 0.8, v_i, v_i * 1.2, v_i * 1.5]);

    const activeMechanism = String(auctionType || mechanism).toUpperCase();
    const targetId = targetBidderId || targetBidder?.bidderId || "target_bidder";

    const results = [];
    let bestBid = null;
    let maxUtility = -Infinity;

    for (const testBid of bidsToTest) {
      const simulatedBidder = {
        ...targetBidder,
        bidderId: targetId,
        bid: Number(testBid),
        qualityScore: targetBidder?.qualityScore || 8.0,
      };

      const biddersPool = [simulatedBidder, ...competitors];
      const outcome = this.runAuction({
        type: activeMechanism,
        slots,
        bidders: biddersPool,
      });

      const myAllocation = outcome.allocations.find((a) => a.bidderId === simulatedBidder.bidderId);

      let slotPosition = null;
      let slotCtr = 0;
      let cpcPaid = 0;
      let won = false;
      let utility = 0;

      if (myAllocation) {
        won = true;
        slotPosition = myAllocation.position;
        slotCtr = myAllocation.slotCtr;
        cpcPaid = myAllocation.cpc;
        utility = Number((slotCtr * (v_i - cpcPaid)).toFixed(4));
      }

      if (utility > maxUtility) {
        maxUtility = utility;
        bestBid = testBid;
      }

      results.push({
        bid: testBid,
        won,
        slotPosition,
        slotCtr,
        cpcPaid,
        utility,
      });
    }

    const truthfulScenario = results.find((r) => Number(r.bid) === Number(v_i));
    const truthfulUtility = truthfulScenario ? truthfulScenario.utility : maxUtility;
    const isTruthfulOptimal = results.every((r) => r.utility <= truthfulUtility + 1e-4);

    return {
      auctionType: activeMechanism,
      mechanism: activeMechanism,
      trueValuation: v_i,
      bestBid,
      maxUtility,
      truthfulUtility,
      isTruthfulOptimal,
      scenarios: results,
    };
  }

  toJSON() {
    return {
      defaultReservePrice: this.defaultReservePrice,
      currency: this.currency,
      qualityScoreWeight: this.qualityScoreWeight,
      positionCtrDecay: this.positionCtrDecay,
      defaultSlots: this.defaultSlots,
    };
  }

  static fromJSON(data) {
    if (!data) throw new Error("Invalid AuctionEngine JSON");
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return new AuctionEngine(parsed);
  }
}

export class GspAuctionEngine extends AuctionEngine {
  run(params) {
    return this.runGspAuction(params);
  }
}

export class VcgAuctionEngine extends AuctionEngine {
  run(params) {
    return this.runVcgAuction(params);
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 21: Conflict-Free Replicated Data Types (CRDTs) Multi-Device Cart
// ------------------------------------------------------------------------------
export class PNCounter {
  constructor(initialState = {}) {
    this.p = {};
    this.n = {};

    const pInit = initialState.p || initialState.pVector || {};
    const nInit = initialState.n || initialState.nVector || {};

    for (const [k, v] of Object.entries(pInit)) {
      this.p[k] = Math.max(0, Number(v) || 0);
    }
    for (const [k, v] of Object.entries(nInit)) {
      this.n[k] = Math.max(0, Number(v) || 0);
    }
  }

  increment(deviceId, delta = 1) {
    const d = String(deviceId || "default");
    const val = Math.max(0, Number(delta) || 0);
    this.p[d] = (this.p[d] || 0) + val;
    return this.value;
  }

  decrement(deviceId, delta = 1) {
    const d = String(deviceId || "default");
    const val = Math.max(0, Number(delta) || 0);
    this.n[d] = (this.n[d] || 0) + val;
    return this.value;
  }

  get value() {
    let sumP = 0;
    let sumN = 0;
    for (const v of Object.values(this.p)) sumP += v;
    for (const v of Object.values(this.n)) sumN += v;
    return Math.max(0, sumP - sumN);
  }

  merge(other) {
    if (!other) return this;
    const otherP = other.p || other.pVector || {};
    const otherN = other.n || other.nVector || {};

    for (const [k, v] of Object.entries(otherP)) {
      this.p[k] = Math.max(this.p[k] || 0, Number(v) || 0);
    }
    for (const [k, v] of Object.entries(otherN)) {
      this.n[k] = Math.max(this.n[k] || 0, Number(v) || 0);
    }
    return this;
  }

  toJSON() {
    const sortedP = {};
    for (const k of Object.keys(this.p).sort()) sortedP[k] = this.p[k];
    const sortedN = {};
    for (const k of Object.keys(this.n).sort()) sortedN[k] = this.n[k];
    return {
      p: sortedP,
      n: sortedN,
    };
  }

  static fromJSON(data) {
    if (!data) return new PNCounter();
    return new PNCounter(data);
  }
}

export class LWWElementSet {
  constructor(initialState = {}) {
    this.addSet = {};
    this.removeSet = {};

    const aInit = initialState.addSet || initialState.a || {};
    const rInit = initialState.removeSet || initialState.r || {};

    for (const [k, v] of Object.entries(aInit)) {
      this.addSet[k] = Number(v) || 0;
    }
    for (const [k, v] of Object.entries(rInit)) {
      this.removeSet[k] = Number(v) || 0;
    }
  }

  add(element, timestamp = Date.now()) {
    const e = String(element);
    const ts = Number(timestamp) || Date.now();
    this.addSet[e] = Math.max(this.addSet[e] || 0, ts);
    return this;
  }

  remove(element, timestamp = Date.now()) {
    const e = String(element);
    const ts = Number(timestamp) || Date.now();
    this.removeSet[e] = Math.max(this.removeSet[e] || 0, ts);
    return this;
  }

  has(element) {
    const e = String(element);
    const tAdd = this.addSet[e] || 0;
    const tRemove = this.removeSet[e] || 0;
    return tAdd >= tRemove && tAdd > 0;
  }

  elements() {
    const result = [];
    for (const e of Object.keys(this.addSet).sort()) {
      if (this.has(e)) result.push(e);
    }
    return result;
  }

  merge(other) {
    if (!other) return this;
    const otherA = other.addSet || other.a || {};
    const otherR = other.removeSet || other.r || {};

    for (const [k, v] of Object.entries(otherA)) {
      this.addSet[k] = Math.max(this.addSet[k] || 0, Number(v) || 0);
    }
    for (const [k, v] of Object.entries(otherR)) {
      this.removeSet[k] = Math.max(this.removeSet[k] || 0, Number(v) || 0);
    }
    return this;
  }

  toJSON() {
    const sortedAdd = {};
    for (const k of Object.keys(this.addSet).sort()) sortedAdd[k] = this.addSet[k];
    const sortedRemove = {};
    for (const k of Object.keys(this.removeSet).sort()) sortedRemove[k] = this.removeSet[k];
    return {
      addSet: sortedAdd,
      removeSet: sortedRemove,
    };
  }

  static fromJSON(data) {
    if (!data) return new LWWElementSet();
    return new LWWElementSet(data);
  }
}

export class CrdtCart {
  constructor(options = {}) {
    this.cartId = String(options.cartId || "default_cart");
    this.userId = String(options.userId || "default_user");
    this.items = new Map();

    if (options.items) {
      if (Array.isArray(options.items)) {
        for (const item of options.items) {
          this._loadItemEntry(item);
        }
      } else if (typeof options.items === "object") {
        for (const [pId, item] of Object.entries(options.items)) {
          this._loadItemEntry({ productId: pId, ...item });
        }
      }
    }
  }

  _loadItemEntry(raw) {
    const pId = String(raw.productId || raw.id || raw._id);
    const pCounter = new PNCounter(raw.pCounter || { p: raw.pVector, n: raw.nVector });
    const lwwSet = new LWWElementSet(raw.lwwSet || { addSet: raw.addSet, removeSet: raw.removeSet });

    const addedAt = Math.max(
      Number(raw.addedAt) || 0,
      lwwSet.addSet[pId] || 0
    );
    const removedAt = Math.max(
      Number(raw.removedAt) || 0,
      lwwSet.removeSet[pId] || 0
    );

    if (addedAt > 0) lwwSet.addSet[pId] = addedAt;
    if (removedAt > 0) lwwSet.removeSet[pId] = removedAt;

    this.items.set(pId, {
      productId: pId,
      metadata: raw.metadata || {
        name: raw.name || "Sản phẩm",
        price: Number(raw.price) || 0,
        originalPrice: Number(raw.originalPrice) || Number(raw.price) || 0,
        image: raw.image || "",
        shopId: raw.shopId || "unknown_shop",
        shopName: raw.shopName || "",
      },
      pCounter,
      lwwSet,
      addedAt,
      removedAt,
      lastUpdatedDeviceId: raw.deviceId || raw.lastUpdatedDeviceId || "default",
    });
  }

  _getOrCreateItem(productId, productDetails = {}) {
    const pId = String(productId);
    if (!this.items.has(pId)) {
      this.items.set(pId, {
        productId: pId,
        metadata: {
          name: productDetails.name || "Sản phẩm",
          price: Number(productDetails.price) || 0,
          originalPrice: Number(productDetails.originalPrice) || Number(productDetails.price) || 0,
          image: productDetails.image || "",
          shopId: productDetails.shopId || "unknown_shop",
          shopName: productDetails.shopName || "",
          selectedColor: productDetails.selectedColor || null,
          selectedSize: productDetails.selectedSize || null,
        },
        pCounter: new PNCounter(),
        lwwSet: new LWWElementSet(),
        addedAt: 0,
        removedAt: 0,
        lastUpdatedDeviceId: "default",
      });
    }
    return this.items.get(pId);
  }

  addItem(deviceId, product, quantity = 1, timestamp = Date.now()) {
    const pId = String(typeof product === "object" && product !== null ? (product.id || product._id || product.productId) : product);
    const details = typeof product === "object" && product !== null ? product : {};
    const ts = Number(timestamp) || Date.now();
    const qty = Math.max(1, Number(quantity) || 1);
    const d = String(deviceId || "default");

    const item = this._getOrCreateItem(pId, details);
    if (details.name) item.metadata.name = details.name;
    if (typeof details.price === "number") item.metadata.price = details.price;
    if (details.image) item.metadata.image = details.image;
    if (details.shopId) item.metadata.shopId = details.shopId;
    if (details.shopName) item.metadata.shopName = details.shopName;

    // If re-adding an item that was previously removed, offset prior quantity
    if (item.removedAt >= item.addedAt && item.removedAt > 0 && item.pCounter.value > 0) {
      item.pCounter.decrement(d, item.pCounter.value);
    }

    item.pCounter.increment(d, qty);
    item.lwwSet.add(pId, ts);
    item.addedAt = Math.max(item.addedAt, ts);
    item.lastUpdatedDeviceId = d;
    return this;
  }

  removeItem(deviceId, productId, timestamp = Date.now()) {
    const pId = String(productId);
    const ts = Number(timestamp) || Date.now();
    const d = String(deviceId || "default");

    if (this.items.has(pId)) {
      const item = this.items.get(pId);
      item.lwwSet.remove(pId, ts);
      item.removedAt = Math.max(item.removedAt, ts);
      item.lastUpdatedDeviceId = d;
    }
    return this;
  }

  updateQuantity(deviceId, productId, delta, timestamp = Date.now()) {
    const pId = String(productId);
    const ts = Number(timestamp) || Date.now();
    const d = String(deviceId || "default");
    const dVal = Number(delta) || 0;

    const item = this._getOrCreateItem(pId);
    if (dVal > 0) {
      item.pCounter.increment(d, dVal);
      item.lwwSet.add(pId, ts);
      item.addedAt = Math.max(item.addedAt, ts);
    } else if (dVal < 0) {
      const decAmount = Math.min(Math.abs(dVal), item.pCounter.value);
      if (decAmount > 0) {
        item.pCounter.decrement(d, decAmount);
      }
      if (item.pCounter.value <= 0) {
        item.lwwSet.remove(pId, ts);
        item.removedAt = Math.max(item.removedAt, ts);
      } else {
        item.lwwSet.add(pId, ts);
        item.addedAt = Math.max(item.addedAt, ts);
      }
    }
    item.lastUpdatedDeviceId = d;
    return this;
  }

  setQuantity(deviceId, productId, targetQty, timestamp = Date.now()) {
    const pId = String(productId);
    const ts = Number(timestamp) || Date.now();
    const target = Number(targetQty) || 0;

    const item = this._getOrCreateItem(pId);
    const currentQty = item.pCounter.value;
    const delta = target - currentQty;

    if (delta !== 0) {
      this.updateQuantity(deviceId, pId, delta, ts);
    }
    if (target <= 0) {
      this.removeItem(deviceId, pId, ts);
    }
    return this;
  }

  merge(remoteCartState) {
    if (!remoteCartState) return this;

    let remoteItems = null;
    if (remoteCartState instanceof CrdtCart) {
      remoteItems = remoteCartState.items;
    } else if (remoteCartState.items) {
      if (Array.isArray(remoteCartState.items)) {
        remoteItems = new Map();
        for (const item of remoteCartState.items) {
          const pId = String(item.productId || item.id);
          remoteItems.set(pId, item);
        }
      } else if (typeof remoteCartState.items === "object") {
        remoteItems = new Map(Object.entries(remoteCartState.items));
      }
    }

    if (!remoteItems) return this;

    for (const [pId, remoteItem] of remoteItems.entries()) {
      const localItem = this._getOrCreateItem(pId, remoteItem.metadata);

      localItem.pCounter.merge(remoteItem.pCounter || {
        p: remoteItem.pVector || remoteItem.p,
        n: remoteItem.nVector || remoteItem.n,
      });

      // 2. Read Timestamps BEFORE merging LWWElementSet to avoid local AddedAt pollution
      const remoteAddedAt = Number(remoteItem.addedAt) || (remoteItem.lwwSet?.addSet?.[pId]) || 0;
      const remoteRemovedAt = Number(remoteItem.removedAt) || (remoteItem.lwwSet?.removeSet?.[pId]) || 0;
      const localAddedAt = Number(localItem.addedAt) || (localItem.lwwSet?.addSet?.[pId]) || 0;

      // 3. Merge LWWElementSet
      localItem.lwwSet.merge(remoteItem.lwwSet || {
        addSet: remoteItem.addSet,
        removeSet: remoteItem.removeSet,
      });

      const remoteDev = String(remoteItem.deviceId || remoteItem.lastUpdatedDeviceId || "");
      const localDev = String(localItem.lastUpdatedDeviceId || localItem.deviceId || "");

      // Deterministic 3-Tier LWW tie-breaker:
      // 1. Primary: compare logical timestamp (higher addedAt wins)
      // 2. Secondary: compare device ID (lexicographically greater deviceId wins)
      // 3. Tertiary: compare serialized metadata (guarantees commutativity even if same device mutated at same millisecond)
      const isRemoteNewer = (remoteAddedAt > localAddedAt) ||
        (remoteAddedAt === localAddedAt && remoteDev > localDev) ||
        (remoteAddedAt === localAddedAt && remoteDev === localDev &&
         JSON.stringify(remoteItem.metadata || {}) > JSON.stringify(localItem.metadata || {}));

      if (isRemoteNewer && remoteItem.metadata) {
        localItem.metadata = { ...localItem.metadata, ...remoteItem.metadata };
        localItem.lastUpdatedDeviceId = remoteDev || localDev;
      }

      localItem.addedAt = Math.max(localItem.addedAt, remoteAddedAt);
      localItem.removedAt = Math.max(localItem.removedAt, remoteRemovedAt);
      if (localItem.addedAt > 0) localItem.lwwSet.addSet[pId] = localItem.addedAt;
      if (localItem.removedAt > 0) localItem.lwwSet.removeSet[pId] = localItem.removedAt;
    }

    return this;
  }

  getCartItems() {
    const result = [];
    const sortedKeys = Array.from(this.items.keys()).sort();
    for (const pId of sortedKeys) {
      const item = this.items.get(pId);
      const isPresent = item.addedAt >= item.removedAt && item.addedAt > 0;
      const quantity = item.pCounter.value;

      if (isPresent && quantity > 0) {
        result.push({
          id: pId,
          productId: pId,
          name: item.metadata.name,
          price: item.metadata.price,
          originalPrice: item.metadata.originalPrice,
          image: item.metadata.image,
          shopId: item.metadata.shopId,
          shopName: item.metadata.shopName,
          selectedColor: item.metadata.selectedColor,
          selectedSize: item.metadata.selectedSize,
          quantity,
          subtotal: item.metadata.price * quantity,
          addedAt: item.addedAt,
          removedAt: item.removedAt,
          lastUpdated: Math.max(item.addedAt, item.removedAt),
          deviceId: item.lastUpdatedDeviceId,
        });
      }
    }
    return result;
  }

  getTotals() {
    const items = this.getCartItems();
    let totalItems = 0;
    let subtotal = 0;

    for (const it of items) {
      totalItems += it.quantity;
      subtotal += it.subtotal;
    }

    return {
      totalItems,
      itemCount: totalItems,
      subtotal,
      uniqueSkus: items.length,
      distinctItems: items.length,
    };
  }

  clear(deviceId, timestamp = Date.now()) {
    const ts = Number(timestamp) || Date.now();
    const d = String(deviceId || "default");
    for (const item of this.items.values()) {
      item.lwwSet.remove(item.productId, ts);
      item.removedAt = Math.max(item.removedAt, ts);
      item.lastUpdatedDeviceId = d;
    }
    return this;
  }

  toJSON() {
    const itemsObj = {};
    const sortedKeys = Array.from(this.items.keys()).sort();
    for (const pId of sortedKeys) {
      const item = this.items.get(pId);
      const pCountJson = item.pCounter.toJSON();
      itemsObj[pId] = {
        productId: pId,
        metadata: item.metadata,
        pCounter: pCountJson,
        pVector: pCountJson.p,
        nVector: pCountJson.n,
        lwwSet: item.lwwSet.toJSON(),
        addedAt: item.addedAt,
        removedAt: item.removedAt,
        deviceId: item.lastUpdatedDeviceId,
      };
    }

    return {
      cartId: this.cartId,
      userId: this.userId,
      items: itemsObj,
    };
  }

  static fromJSON(data) {
    if (!data) return new CrdtCart();
    return new CrdtCart(data);
  }
}

// ------------------------------------------------------------------------------
// PHASE 10 ALGORITHM 1: HNSW (Hierarchical Navigable Small World Graph)
// ------------------------------------------------------------------------------
export function cosineDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 1.0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = vecA.length;

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 1.0;
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  const clampedSim = Math.max(-1, Math.min(1, similarity));
  return 1 - clampedSim;
}

export function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return Infinity;
  }
  let sum = 0;
  const len = vecA.length;
  for (let i = 0; i < len; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export class PriorityQueue {
  constructor(comparator = (a, b) => a.dist - b.dist) {
    this.comparator = comparator;
    this.data = [];
  }

  push(item) {
    this.data.push(item);
    this.data.sort(this.comparator);
  }

  pop() {
    return this.data.shift();
  }

  peek() {
    return this.data[0];
  }

  get size() {
    return this.data.length;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  values() {
    return [...this.data];
  }
}

export class HNSWNode {
  constructor(id, vector, level, metadata = {}) {
    this.id = String(id);
    this.vector = Array.from(vector);
    this.level = level;
    this.metadata = metadata;
    this.neighborsByLevel = Array.from({ length: level + 1 }, () => new Set());
  }
}

export class HNSWIndex {
  constructor({
    dim = 128,
    M = 16,
    efConstruction = 64,
    efSearch = 32,
    metric = "cosine",
    randomSeed = null,
  } = {}) {
    this.dim = dim;
    this.M = Math.max(4, Number(M) || 16);
    this.M0 = 2 * this.M;
    this.efConstruction = Math.max(this.M, Number(efConstruction) || 64);
    this.efSearch = Math.max(1, Number(efSearch) || 32);
    this.metric = metric === "euclidean" ? "euclidean" : "cosine";
    this.distanceFn = this.metric === "euclidean" ? euclideanDistance : cosineDistance;
    this.mL = 1 / Math.log(this.M);

    this.nodes = new Map();
    this.entryPointId = null;
    this.maxLevel = -1;
    this._rng = this._createRng(randomSeed);
  }

  _createRng(seed) {
    if (seed == null) {
      return Math.random;
    }
    let s = Number(seed) || 1;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  _randomLevel() {
    const r = Math.max(1e-7, this._rng());
    const level = Math.floor(-Math.log(r) * this.mL);
    return Math.min(level, 16);
  }

  get size() {
    return this.nodes.size;
  }

  insert(id, vector, metadata = {}) {
    const strId = String(id);
    if (!vector || vector.length !== this.dim) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dim}, got ${vector ? vector.length : 0}`);
    }

    if (this.nodes.has(strId)) {
      this.remove(strId);
    }

    const nodeLevel = this._randomLevel();
    const newNode = new HNSWNode(strId, vector, nodeLevel, metadata);
    this.nodes.set(strId, newNode);

    if (this.entryPointId === null) {
      this.entryPointId = strId;
      this.maxLevel = nodeLevel;
      return newNode;
    }

    let currObj = this.nodes.get(this.entryPointId);
    let currDist = this.distanceFn(vector, currObj.vector);

    for (let l = this.maxLevel; l > nodeLevel; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.neighborsByLevel[l] || new Set();
        for (const neighborId of neighbors) {
          const neighborNode = this.nodes.get(neighborId);
          if (!neighborNode) continue;
          const d = this.distanceFn(vector, neighborNode.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighborNode;
            changed = true;
          }
        }
      }
    }

    let enterNodes = [currObj];
    const topLevel = Math.min(this.maxLevel, nodeLevel);

    for (let l = topLevel; l >= 0; l--) {
      const candidates = this._searchLayer(vector, enterNodes, this.efConstruction, l);
      const maxM = l === 0 ? this.M0 : this.M;
      const selectedNeighbors = this._selectNeighbors(candidates, maxM);

      for (const n of selectedNeighbors) {
        const neighborNode = this.nodes.get(n.id);
        if (!neighborNode) continue;

        newNode.neighborsByLevel[l].add(n.id);
        neighborNode.neighborsByLevel[l].add(strId);

        const nLimit = l === 0 ? this.M0 : this.M;
        if (neighborNode.neighborsByLevel[l].size > nLimit) {
          this._shrinkNeighbors(neighborNode, l, nLimit);
        }
      }

      enterNodes = selectedNeighbors.map((sn) => this.nodes.get(sn.id));
    }

    if (nodeLevel > this.maxLevel) {
      this.maxLevel = nodeLevel;
      this.entryPointId = strId;
    }

    return newNode;
  }

  _searchLayer(queryVector, enterNodes, ef, level) {
    const visited = new Set();
    const candidates = new PriorityQueue((a, b) => a.dist - b.dist);
    const w = new PriorityQueue((a, b) => b.dist - a.dist);

    for (const en of enterNodes) {
      if (!en) continue;
      const d = this.distanceFn(queryVector, en.vector);
      visited.add(en.id);
      candidates.push({ id: en.id, dist: d });
      w.push({ id: en.id, dist: d });
    }

    while (candidates.size > 0) {
      const current = candidates.pop();
      const furthestInW = w.peek();

      if (current.dist > furthestInW.dist) {
        break;
      }

      const currentNode = this.nodes.get(current.id);
      if (!currentNode) continue;

      const neighbors = currentNode.neighborsByLevel[level] || new Set();
      for (const nId of neighbors) {
        if (!visited.has(nId)) {
          visited.add(nId);
          const neighborNode = this.nodes.get(nId);
          if (!neighborNode) continue;

          const d = this.distanceFn(queryVector, neighborNode.vector);
          const worstW = w.peek();

          if (d < worstW.dist || w.size < ef) {
            candidates.push({ id: nId, dist: d });
            w.push({ id: nId, dist: d });

            if (w.size > ef) {
              w.pop();
            }
          }
        }
      }
    }

    return w.values().sort((a, b) => a.dist - b.dist);
  }

  _selectNeighbors(candidates, maxM) {
    return candidates.slice(0, maxM);
  }

  _shrinkNeighbors(node, level, maxM) {
    const neighbors = Array.from(node.neighborsByLevel[level]).map((nId) => {
      const nNode = this.nodes.get(nId);
      return {
        id: nId,
        dist: nNode ? this.distanceFn(node.vector, nNode.vector) : Infinity,
      };
    });

    neighbors.sort((a, b) => a.dist - b.dist);
    const kept = neighbors.slice(0, maxM);
    node.neighborsByLevel[level] = new Set(kept.map((k) => k.id));
  }

  searchKNN(queryVector, k = 10, efSearch = null) {
    if (this.nodes.size === 0 || !this.entryPointId) {
      return [];
    }

    if (!queryVector || queryVector.length !== this.dim) {
      throw new Error(`Query vector dimension mismatch. Expected ${this.dim}, got ${queryVector ? queryVector.length : 0}`);
    }

    const ef = Math.max(k, efSearch || this.efSearch);
    let currObj = this.nodes.get(this.entryPointId);
    let currDist = this.distanceFn(queryVector, currObj.vector);

    for (let l = this.maxLevel; l > 0; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.neighborsByLevel[l] || new Set();
        for (const nId of neighbors) {
          const nNode = this.nodes.get(nId);
          if (!nNode) continue;
          const d = this.distanceFn(queryVector, nNode.vector);
          if (d < currDist) {
            currDist = d;
            currObj = nNode;
            changed = true;
          }
        }
      }
    }

    const candidates = this._searchLayer(queryVector, [currObj], ef, 0);
    const topK = candidates.slice(0, k);

    return topK.map((item) => {
      const node = this.nodes.get(item.id);
      const similarity = this.metric === "cosine" ? Math.max(0, 1 - item.dist) : 1 / (1 + item.dist);
      return {
        id: item.id,
        distance: Number(item.dist.toFixed(6)),
        similarity: Number(similarity.toFixed(4)),
        metadata: node ? node.metadata : {},
      };
    });
  }

  remove(id) {
    const strId = String(id);
    const node = this.nodes.get(strId);
    if (!node) return false;

    for (let l = 0; l <= node.level; l++) {
      for (const nId of node.neighborsByLevel[l]) {
        const neighbor = this.nodes.get(nId);
        if (neighbor && neighbor.neighborsByLevel[l]) {
          neighbor.neighborsByLevel[l].delete(strId);
        }
      }
    }

    this.nodes.delete(strId);

    if (this.entryPointId === strId) {
      if (this.nodes.size === 0) {
        this.entryPointId = null;
        this.maxLevel = -1;
      } else {
        let highestLevel = -1;
        let newEntry = null;
        for (const [remId, remNode] of this.nodes.entries()) {
          if (remNode.level > highestLevel) {
            highestLevel = remNode.level;
            newEntry = remId;
          }
        }
        this.entryPointId = newEntry;
        this.maxLevel = highestLevel;
      }
    }

    return true;
  }

  toJSON() {
    const nodesData = [];
    for (const [id, node] of this.nodes.entries()) {
      nodesData.push({
        id,
        vector: node.vector,
        level: node.level,
        metadata: node.metadata,
        neighborsByLevel: node.neighborsByLevel.map((set) => Array.from(set)),
      });
    }

    return {
      dim: this.dim,
      M: this.M,
      M0: this.M0,
      efConstruction: this.efConstruction,
      efSearch: this.efSearch,
      metric: this.metric,
      maxLevel: this.maxLevel,
      entryPointId: this.entryPointId,
      nodes: nodesData,
    };
  }

  static fromJSON(data) {
    if (!data) return new HNSWIndex();
    const index = new HNSWIndex({
      dim: data.dim,
      M: data.M,
      efConstruction: data.efConstruction,
      efSearch: data.efSearch,
      metric: data.metric,
    });

    index.maxLevel = data.maxLevel;
    index.entryPointId = data.entryPointId;

    if (Array.isArray(data.nodes)) {
      for (const n of data.nodes) {
        const node = new HNSWNode(n.id, n.vector, n.level, n.metadata);
        if (Array.isArray(n.neighborsByLevel)) {
          node.neighborsByLevel = n.neighborsByLevel.map((arr) => new Set(arr));
        }
        index.nodes.set(n.id, node);
      }
    }

    return index;
  }
}

// ------------------------------------------------------------------------------
// PHASE 10 ALGORITHM 2: Hungarian Algorithm (Kuhn-Munkres) & SPX Courier Dispatch
// ------------------------------------------------------------------------------
export function solveHungarian(costMatrix) {
  if (!costMatrix || costMatrix.length === 0 || !costMatrix[0] || costMatrix[0].length === 0) {
    return { assignments: [], totalCost: 0, workerToTask: [], taskToWorker: [] };
  }

  const numRows = costMatrix.length;
  const numCols = costMatrix[0].length;
  const dim = Math.max(numRows, numCols);

  let maxVal = 0;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (Number.isFinite(costMatrix[r][c]) && costMatrix[r][c] > maxVal) {
        maxVal = costMatrix[r][c];
      }
    }
  }
  const dummyCost = maxVal * 10 + 10000;

  const matrix = Array.from({ length: dim }, (_, r) =>
    Array.from({ length: dim }, (_, c) => {
      if (r < numRows && c < numCols) {
        return Number.isFinite(costMatrix[r][c]) ? costMatrix[r][c] : dummyCost;
      }
      return dummyCost;
    })
  );

  const u = new Array(dim + 1).fill(0);
  const v = new Array(dim + 1).fill(0);
  const p = new Array(dim + 1).fill(0);
  const way = new Array(dim + 1).fill(0);

  for (let i = 1; i <= dim; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(dim + 1).fill(Infinity);
    const used = new Array(dim + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= dim; j++) {
        if (!used[j]) {
          const cur = matrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= dim; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const workerToTask = new Array(numRows).fill(-1);
  const taskToWorker = new Array(numCols).fill(-1);
  const assignments = [];
  let totalCost = 0;

  for (let j = 1; j <= dim; j++) {
    const r = p[j] - 1;
    const c = j - 1;
    if (r < numRows && c < numCols) {
      workerToTask[r] = c;
      taskToWorker[c] = r;
      const realCost = costMatrix[r][c];
      assignments.push({
        workerIndex: r,
        taskIndex: c,
        cost: realCost,
      });
      totalCost += realCost;
    }
  }

  assignments.sort((a, b) => a.workerIndex - b.workerIndex);

  return {
    assignments,
    totalCost: Number(totalCost.toFixed(2)),
    workerToTask,
    taskToWorker,
  };
}

export class SPXDispatchEngine {
  constructor({
    distanceWeight = 1.0,
    urgencyWeight = 2.5,
    capacityPenaltyWeight = 5000,
    ratingWeight = 200,
  } = {}) {
    this.distanceWeight = distanceWeight;
    this.urgencyWeight = urgencyWeight;
    this.capacityPenaltyWeight = capacityPenaltyWeight;
    this.ratingWeight = ratingWeight;
  }

  calculateAssignmentCost(courier, order) {
    const pickupDist = calculateHaversineDistance(
      courier.lat, courier.lng,
      order.shopLat, order.shopLng
    );
    const deliveryDist = calculateHaversineDistance(
      order.shopLat, order.shopLng,
      order.buyerLat, order.buyerLng
    );
    const totalDist = pickupDist + deliveryDist;
    const distanceCost = totalDist * this.distanceWeight * 5000;

    const slaRemaining = Math.max(1, Number(order.slaUrgencyMinutes) || 60);
    const estimatedPickupTimeMin = (pickupDist / 25) * 60;
    const urgencyRatio = estimatedPickupTimeMin / slaRemaining;
    const urgencyCost = urgencyRatio > 0.5
      ? (urgencyRatio - 0.5) * this.urgencyWeight * 10000
      : 0;

    const maxCap = courier.capacityKg || 30;
    const currentLoad = courier.currentLoadKg || 0;
    const orderWeight = order.weightKg || 1.0;
    const projectedLoad = currentLoad + orderWeight;
    const overloadKg = Math.max(0, projectedLoad - maxCap);
    const capacityCost = overloadKg * this.capacityPenaltyWeight;

    const rating = Math.max(1, Math.min(5, Number(courier.rating) || 4.5));
    const ratingDiscount = (rating - 3.0) * this.ratingWeight;

    const totalAssignmentCost = Math.max(
      1000,
      distanceCost + urgencyCost + capacityCost - ratingDiscount
    );

    return {
      totalCost: Math.round(totalAssignmentCost),
      details: {
        pickupDistKm: Number(pickupDist.toFixed(2)),
        deliveryDistKm: Number(deliveryDist.toFixed(2)),
        totalDistKm: Number(totalDist.toFixed(2)),
        urgencyCost: Math.round(urgencyCost),
        capacityCost: Math.round(capacityCost),
        ratingDiscount: Math.round(ratingDiscount),
        overloadKg: Number(overloadKg.toFixed(2)),
      },
    };
  }

  dispatch(couriers = [], orders = []) {
    if (!couriers || couriers.length === 0 || !orders || orders.length === 0) {
      return {
        matchedAssignments: [],
        totalDispatchCost: 0,
        unassignedOrders: orders || [],
        idleCouriers: couriers || [],
        dispatchSummary: {
          couriersCount: couriers ? couriers.length : 0,
          ordersCount: orders ? orders.length : 0,
          matchedCount: 0,
        },
      };
    }

    const costMatrix = [];
    const costDetailsMatrix = [];

    for (let r = 0; r < couriers.length; r++) {
      const row = [];
      const detailsRow = [];
      for (let c = 0; c < orders.length; c++) {
        const costObj = this.calculateAssignmentCost(couriers[r], orders[c]);
        row.push(costObj.totalCost);
        detailsRow.push(costObj.details);
      }
      costMatrix.push(row);
      costDetailsMatrix.push(detailsRow);
    }

    const hungarianResult = solveHungarian(costMatrix);

    const matchedAssignments = [];
    const assignedCourierIndices = new Set();
    const assignedOrderIndices = new Set();

    for (const a of hungarianResult.assignments) {
      const courier = couriers[a.workerIndex];
      const order = orders[a.taskIndex];
      const details = costDetailsMatrix[a.workerIndex][a.taskIndex];

      assignedCourierIndices.add(a.workerIndex);
      assignedOrderIndices.add(a.taskIndex);

      matchedAssignments.push({
        courierId: courier.id,
        courierName: courier.name,
        orderId: order.id,
        orderCode: order.orderCode || order.id,
        assignmentCost: a.cost,
        metrics: details,
      });
    }

    const unassignedOrders = orders.filter((_, idx) => !assignedOrderIndices.has(idx));
    const idleCouriers = couriers.filter((_, idx) => !assignedCourierIndices.has(idx));

    return {
      matchedAssignments,
      totalDispatchCost: hungarianResult.totalCost,
      unassignedOrders,
      idleCouriers,
      dispatchSummary: {
        couriersCount: couriers.length,
        ordersCount: orders.length,
        matchedCount: matchedAssignments.length,
        unassignedOrdersCount: unassignedOrders.length,
        idleCouriersCount: idleCouriers.length,
      },
    };
  }
}

// ------------------------------------------------------------------------------
// PHASE 10 ALGORITHM 3: Raft Distributed Consensus & Flash Sale Quorum State Machine
// ------------------------------------------------------------------------------
export const NodeRole = {
  FOLLOWER: "FOLLOWER",
  CANDIDATE: "CANDIDATE",
  LEADER: "LEADER",
};

export class FlashSaleStateMachine {
  constructor() {
    this.stocks = new Map();
    this.reservations = new Map();
    this.lastResult = null;
  }

  initStock(productId, initialStock) {
    this.stocks.set(String(productId), Math.max(0, Number(initialStock) || 0));
  }

  apply(command) {
    if (!command || !command.action) {
      this.lastResult = { error: "INVALID_COMMAND" };
      return this.lastResult;
    }

    const { action, productId, orderId, quantity = 1 } = command;
    const pId = String(productId);
    const oId = String(orderId);
    const qty = Math.max(1, Number(quantity) || 1);

    switch (action) {
      case "INIT_STOCK":
        this.initStock(pId, qty);
        this.lastResult = { action, productId: pId, stock: this.stocks.get(pId) };
        break;

      case "RESERVE_STOCK": {
        const currentStock = this.stocks.get(pId) || 0;
        if (currentStock >= qty) {
          this.stocks.set(pId, currentStock - qty);
          this.reservations.set(oId, {
            productId: pId,
            quantity: qty,
            status: "RESERVED",
          });
          this.lastResult = {
            success: true,
            action,
            orderId: oId,
            remainingStock: this.stocks.get(pId),
          };
        } else {
          this.lastResult = {
            success: false,
            action,
            error: "OUT_OF_STOCK",
            availableStock: currentStock,
            requested: qty,
          };
        }
        break;
      }

      case "RELEASE_STOCK": {
        const reservation = this.reservations.get(oId);
        if (reservation && reservation.status === "RESERVED") {
          reservation.status = "CANCELLED";
          const currentStock = this.stocks.get(reservation.productId) || 0;
          this.stocks.set(reservation.productId, currentStock + reservation.quantity);
          this.lastResult = {
            success: true,
            action,
            orderId: oId,
            restoredStock: this.stocks.get(reservation.productId),
          };
        } else {
          this.lastResult = { success: false, action, error: "NO_ACTIVE_RESERVATION" };
        }
        break;
      }

      default:
        this.lastResult = { error: `UNKNOWN_ACTION_${action}` };
    }

    return this.lastResult;
  }

  getLastResult() {
    return this.lastResult;
  }

  getStock(productId) {
    return this.stocks.get(String(productId)) || 0;
  }

  getState() {
    const stockObj = {};
    for (const [k, v] of this.stocks.entries()) {
      stockObj[k] = v;
    }
    return {
      stocks: stockObj,
      reservationsCount: this.reservations.size,
    };
  }
}

export class RaftNode {
  constructor({
    id,
    cluster = null,
    peers = [],
    stateMachine = null,
  } = {}) {
    this.id = String(id);
    this.cluster = cluster;
    this.peers = Array.from(peers).filter((p) => p !== this.id);

    this.currentTerm = 0;
    this.votedFor = null;
    this.log = [{ term: 0, index: 0, command: null }];

    this.role = NodeRole.FOLLOWER;
    this.commitIndex = 0;
    this.lastApplied = 0;
    this.leaderId = null;

    this.nextIndex = new Map();
    this.matchIndex = new Map();

    this.stateMachine = stateMachine || new FlashSaleStateMachine();
    this.appliedCommands = [];
  }

  get lastLogIndex() {
    return this.log.length - 1;
  }

  get lastLogTerm() {
    return this.log[this.lastLogIndex].term;
  }

  startElection() {
    this.role = NodeRole.CANDIDATE;
    this.currentTerm += 1;
    this.votedFor = this.id;
    this.leaderId = null;

    let votesGranted = 1;
    const quorum = Math.floor((this.peers.length + 1) / 2) + 1;

    for (const peerId of this.peers) {
      if (!this.cluster) continue;
      const peer = this.cluster.getNode(peerId);
      if (!peer || !this.cluster.canCommunicate(this.id, peerId)) continue;

      const reply = peer.handleRequestVote({
        term: this.currentTerm,
        candidateId: this.id,
        lastLogIndex: this.lastLogIndex,
        lastLogTerm: this.lastLogTerm,
      });

      if (reply.term > this.currentTerm) {
        this._stepDown(reply.term);
        return false;
      }

      if (reply.voteGranted) {
        votesGranted += 1;
      }
    }

    if (votesGranted >= quorum && this.role === NodeRole.CANDIDATE) {
      this.role = NodeRole.LEADER;
      this.leaderId = this.id;

      for (const peerId of this.peers) {
        this.nextIndex.set(peerId, this.lastLogIndex + 1);
        this.matchIndex.set(peerId, 0);
      }

      this.broadcastHeartbeat();
      return true;
    }

    return false;
  }

  handleRequestVote({ term, candidateId, lastLogIndex, lastLogTerm }) {
    if (term < this.currentTerm) {
      return { term: this.currentTerm, voteGranted: false };
    }

    if (term > this.currentTerm) {
      this._stepDown(term);
    }

    const isLogUpToDate =
      lastLogTerm > this.lastLogTerm ||
      (lastLogTerm === this.lastLogTerm && lastLogIndex >= this.lastLogIndex);

    const canVote =
      (this.votedFor === null || this.votedFor === candidateId) && isLogUpToDate;

    if (canVote) {
      this.votedFor = candidateId;
      return { term: this.currentTerm, voteGranted: true };
    }

    return { term: this.currentTerm, voteGranted: false };
  }

  propose(command) {
    if (this.role !== NodeRole.LEADER) {
      return {
        success: false,
        error: "NOT_LEADER",
        leaderId: this.leaderId,
      };
    }

    const entryIndex = this.log.length;
    const entry = {
      term: this.currentTerm,
      index: entryIndex,
      command,
    };
    this.log.push(entry);

    const quorum = Math.floor((this.peers.length + 1) / 2) + 1;
    let matchCount = 1;

    for (const peerId of this.peers) {
      if (!this.cluster) continue;
      const peer = this.cluster.getNode(peerId);
      if (!peer || !this.cluster.canCommunicate(this.id, peerId)) continue;

      const prevIndex = (this.nextIndex.get(peerId) || 1) - 1;
      const prevTerm = this.log[prevIndex] ? this.log[prevIndex].term : 0;
      const entriesToSend = this.log.slice(prevIndex + 1);

      const reply = peer.handleAppendEntries({
        term: this.currentTerm,
        leaderId: this.id,
        prevLogIndex: prevIndex,
        prevLogTerm: prevTerm,
        entries: entriesToSend,
        leaderCommit: this.commitIndex,
      });

      if (reply.term > this.currentTerm) {
        this._stepDown(reply.term);
        return { success: false, error: "STEPPED_DOWN" };
      }

      if (reply.success) {
        this.nextIndex.set(peerId, entryIndex + 1);
        this.matchIndex.set(peerId, entryIndex);
        matchCount += 1;
      } else {
        const curNext = this.nextIndex.get(peerId) || 1;
        this.nextIndex.set(peerId, Math.max(1, curNext - 1));
      }
    }

    if (matchCount >= quorum) {
      this.commitIndex = entryIndex;
      this._applyLogs();
      // Thông báo commitIndex đã cập nhật tới toàn bộ followers
      this.broadcastHeartbeat();
      return {
        success: true,
        committedIndex: this.commitIndex,
        commandResult: this.stateMachine.getLastResult(),
      };
    }

    return {
      success: false,
      error: "QUORUM_NOT_REACHED",
      replicatedNodes: matchCount,
      requiredQuorum: quorum,
    };
  }

  handleAppendEntries({
    term,
    leaderId,
    prevLogIndex,
    prevLogTerm,
    entries = [],
    leaderCommit = 0,
  }) {
    if (term < this.currentTerm) {
      return { term: this.currentTerm, success: false };
    }

    if (term > this.currentTerm || this.role === NodeRole.CANDIDATE) {
      this._stepDown(term);
    }
    this.leaderId = leaderId;

    if (prevLogIndex > 0) {
      if (prevLogIndex >= this.log.length) {
        return { term: this.currentTerm, success: false };
      }
      if (this.log[prevLogIndex].term !== prevLogTerm) {
        return { term: this.currentTerm, success: false };
      }
    }

    let insertIndex = prevLogIndex + 1;
    for (const newEntry of entries) {
      if (insertIndex < this.log.length) {
        if (this.log[insertIndex].term !== newEntry.term) {
          this.log = this.log.slice(0, insertIndex);
          this.log.push(newEntry);
        }
      } else {
        this.log.push(newEntry);
      }
      insertIndex += 1;
    }

    if (leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(leaderCommit, this.log.length - 1);
      this._applyLogs();
    }

    return { term: this.currentTerm, success: true };
  }

  broadcastHeartbeat() {
    if (this.role !== NodeRole.LEADER) return;
    for (const peerId of this.peers) {
      if (!this.cluster) continue;
      const peer = this.cluster.getNode(peerId);
      if (!peer || !this.cluster.canCommunicate(this.id, peerId)) continue;

      const prevIndex = (this.nextIndex.get(peerId) || 1) - 1;
      const prevTerm = this.log[prevIndex] ? this.log[prevIndex].term : 0;
      const entriesToSend = this.log.slice(prevIndex + 1);

      const reply = peer.handleAppendEntries({
        term: this.currentTerm,
        leaderId: this.id,
        prevLogIndex: prevIndex,
        prevLogTerm: prevTerm,
        entries: entriesToSend,
        leaderCommit: this.commitIndex,
      });

      if (reply.term > this.currentTerm) {
        this._stepDown(reply.term);
        return;
      }

      if (reply.success) {
        this.nextIndex.set(peerId, this.log.length);
        this.matchIndex.set(peerId, this.log.length - 1);
      }
    }
  }

  _stepDown(newTerm) {
    this.currentTerm = newTerm;
    this.role = NodeRole.FOLLOWER;
    this.votedFor = null;
    this.leaderId = null;
  }

  _applyLogs() {
    while (this.lastApplied < this.commitIndex) {
      this.lastApplied += 1;
      const entry = this.log[this.lastApplied];
      if (entry && entry.command) {
        const result = this.stateMachine.apply(entry.command);
        this.appliedCommands.push({
          index: this.lastApplied,
          term: entry.term,
          command: entry.command,
          result,
        });
      }
    }
  }

  getState() {
    return {
      id: this.id,
      role: this.role,
      currentTerm: this.currentTerm,
      votedFor: this.votedFor,
      leaderId: this.leaderId,
      commitIndex: this.commitIndex,
      lastApplied: this.lastApplied,
      logLength: this.log.length,
      lastLogIndex: this.lastLogIndex,
      lastLogTerm: this.lastLogTerm,
      stockState: this.stateMachine.getState(),
    };
  }
}

export class RaftCluster {
  constructor({ nodeCount = 3 } = {}) {
    this.nodes = new Map();
    this.partitions = [];

    const count = Math.max(3, Number(nodeCount) || 3);
    const nodeIds = Array.from({ length: count }, (_, i) => `node_${i + 1}`);

    for (const id of nodeIds) {
      const node = new RaftNode({
        id,
        cluster: this,
        peers: nodeIds.filter((nid) => nid !== id),
      });
      this.nodes.set(id, node);
    }
  }

  getNode(id) {
    return this.nodes.get(String(id));
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getLeader() {
    for (const node of this.nodes.values()) {
      if (node.role === NodeRole.LEADER) {
        return node;
      }
    }
    return null;
  }

  partition(groupA = [], groupB = []) {
    this.partitions = [new Set(groupA.map(String)), new Set(groupB.map(String))];
  }

  heal() {
    this.partitions = [];
  }

  canCommunicate(nodeAId, nodeBId) {
    if (this.partitions.length === 0) return true;
    for (const part of this.partitions) {
      if (part.has(nodeAId) && part.has(nodeBId)) {
        return true;
      }
    }
    return false;
  }

  initClusterStock(productId, stockQty) {
    for (const node of this.nodes.values()) {
      node.stateMachine.initStock(productId, stockQty);
    }
  }
}

// ------------------------------------------------------------------------------
// PHASE 11 ALGORITHM 1: FP-Growth (Frequent Pattern Growth) & Association Rules
// ------------------------------------------------------------------------------
export class FPNode {
  constructor(item, parent = null) {
    this.item = item;
    this.count = 1;
    this.parent = parent;
    this.children = new Map();
    this.nodeLink = null;
  }
}

export class FPTree {
  constructor() {
    this.root = new FPNode(null);
    this.headerTable = new Map();
  }

  addTransaction(items, count = 1) {
    let currentNode = this.root;

    for (const item of items) {
      if (currentNode.children.has(item)) {
        const child = currentNode.children.get(item);
        child.count += count;
        currentNode = child;
      } else {
        const newChild = new FPNode(item, currentNode);
        newChild.count = count;
        currentNode.children.set(item, newChild);

        if (!this.headerTable.has(item)) {
          this.headerTable.set(item, { count: newChild.count, headNode: newChild, tailNode: newChild });
        } else {
          const header = this.headerTable.get(item);
          header.tailNode.nodeLink = newChild;
          header.tailNode = newChild;
        }

        currentNode = newChild;
      }
    }
  }

  getPrefixPaths(item) {
    const paths = [];
    if (!this.headerTable.has(item)) return paths;

    let currNode = this.headerTable.get(item).headNode;
    while (currNode) {
      const count = currNode.count;
      const path = [];
      let parent = currNode.parent;
      while (parent && parent.item !== null) {
        path.push(parent.item);
        parent = parent.parent;
      }

      if (path.length > 0) {
        path.reverse();
        paths.push({ path, count });
      }

      currNode = currNode.nodeLink;
    }

    return paths;
  }
}

export class FPGrowthBundler {
  constructor({ minSupport = 0.05, minConfidence = 0.4, minLift = 0.0 } = {}) {
    this.minSupport = minSupport;
    this.minConfidence = minConfidence;
    this.minLift = typeof minLift === "number" ? minLift : 0.0;
    this.itemFrequency = new Map();
    this.totalTransactions = 0;
  }

  mine(transactions = []) {
    this.totalTransactions = transactions.length;
    if (this.totalTransactions === 0) {
      return { frequentItemsets: [], associationRules: [] };
    }

    const minSupportCount =
      this.minSupport >= 1
        ? Math.floor(this.minSupport)
        : Math.max(1, Math.ceil(this.minSupport * this.totalTransactions));

    this.itemFrequency.clear();
    for (const tx of transactions) {
      const uniqueItems = new Set(tx);
      for (const item of uniqueItems) {
        this.itemFrequency.set(item, (this.itemFrequency.get(item) || 0) + 1);
      }
    }

    const frequentItems = new Map();
    for (const [item, count] of this.itemFrequency.entries()) {
      if (count >= minSupportCount) {
        frequentItems.set(item, count);
      }
    }

    const tree = new FPTree();
    for (const tx of transactions) {
      const filteredSorted = tx
        .filter((item) => frequentItems.has(item))
        .sort((a, b) => {
          const freqA = frequentItems.get(a);
          const freqB = frequentItems.get(b);
          if (freqB !== freqA) return freqB - freqA;
          return String(a).localeCompare(String(b));
        });

      if (filteredSorted.length > 0) {
        tree.addTransaction(filteredSorted, 1);
      }
    }

    const frequentItemsets = [];
    this._mineFPTree(tree, [], minSupportCount, frequentItemsets);

    const associationRules = this._generateAssociationRules(frequentItemsets);

    return {
      frequentItemsets,
      associationRules,
      metrics: {
        totalTransactions: this.totalTransactions,
        minSupportCount,
        frequentItemsetsCount: frequentItemsets.length,
        rulesCount: associationRules.length,
      },
    };
  }

  _mineFPTree(tree, prefix, minSupportCount, results) {
    const sortedItems = Array.from(tree.headerTable.keys()).sort((a, b) => {
      return (tree.headerTable.get(a).count || 0) - (tree.headerTable.get(b).count || 0);
    });

    for (const item of sortedItems) {
      const header = tree.headerTable.get(item);
      let totalCount = 0;
      let curr = header.headNode;
      while (curr) {
        totalCount += curr.count;
        curr = curr.nodeLink;
      }

      if (totalCount < minSupportCount) continue;

      const newPattern = [...prefix, item];
      results.push({
        items: newPattern,
        count: totalCount,
        support: totalCount,
        supportRatio: Number((totalCount / this.totalTransactions).toFixed(4)),
      });

      const prefixPaths = tree.getPrefixPaths(item);
      if (prefixPaths.length > 0) {
        const condItemFreq = new Map();
        for (const pp of prefixPaths) {
          for (const it of pp.path) {
            condItemFreq.set(it, (condItemFreq.get(it) || 0) + pp.count);
          }
        }

        const condTree = new FPTree();
        for (const pp of prefixPaths) {
          const filteredPath = pp.path
            .filter((it) => (condItemFreq.get(it) || 0) >= minSupportCount)
            .sort((a, b) => (condItemFreq.get(b) || 0) - (condItemFreq.get(a) || 0));

          if (filteredPath.length > 0) {
            condTree.addTransaction(filteredPath, pp.count);
          }
        }

        if (condTree.headerTable.size > 0) {
          this._mineFPTree(condTree, newPattern, minSupportCount, results);
        }
      }
    }
  }

  _generateAssociationRules(frequentItemsets) {
    const rules = [];
    const multiItemSets = frequentItemsets.filter((s) => s.items.length >= 2);
    const supportMap = new Map();
    for (const fis of frequentItemsets) {
      const key = [...fis.items].sort().join("|||");
      supportMap.set(key, fis.count || fis.support);
    }

    for (const itemset of multiItemSets) {
      const items = itemset.items;
      const setCount = itemset.count || itemset.support;

      const subsets = this._getSubsets(items);
      for (const antecedent of subsets) {
        if (antecedent.length === 0 || antecedent.length === items.length) continue;

        const antecedentKey = [...antecedent].sort().join("|||");
        const antecedentCount = supportMap.get(antecedentKey) || 0;
        if (antecedentCount <= 0) continue;

        const consequent = items.filter((it) => !antecedent.includes(it));
        const consequentKey = [...consequent].sort().join("|||");
        const consequentCount = supportMap.get(consequentKey) || 0;
        if (consequentCount <= 0) continue;

        const confidence = setCount / antecedentCount;
        const consequentSupportRatio = consequentCount / this.totalTransactions;
        const lift = consequentSupportRatio > 0 ? confidence / consequentSupportRatio : 1.0;

        if (confidence >= this.minConfidence && lift >= this.minLift) {
          rules.push({
            antecedent,
            consequent,
            support: setCount,
            supportRatio: Number((setCount / this.totalTransactions).toFixed(4)),
            confidence: Number(confidence.toFixed(4)),
            lift: Number(lift.toFixed(2)),
            recommendationType: lift >= 2.0 ? "COMBO_DEAL_SHOCK" : "FREQUENTLY_BOUGHT_TOGETHER",
          });
        }
      }
    }

    rules.sort((a, b) => b.lift - a.lift);
    return rules;
  }

  _getSubsets(array) {
    const result = [[]];
    for (const val of array) {
      const len = result.length;
      for (let i = 0; i < len; i++) {
        result.push([...result[i], val]);
      }
    }
    return result;
  }

  recommendAddons(cartItems = [], rules = []) {
    const cartSet = new Set(cartItems);
    const recommendations = new Map();

    for (const rule of rules) {
      const matchesAntecedent = rule.antecedent.every((item) => cartSet.has(item));
      if (matchesAntecedent) {
        for (const target of rule.consequent) {
          if (!cartSet.has(target)) {
            if (!recommendations.has(target) || recommendations.get(target).lift < rule.lift) {
              recommendations.set(target, {
                item: target,
                confidence: rule.confidence,
                lift: rule.lift,
                type: rule.recommendationType,
              });
            }
          }
        }
      }
    }

    return Array.from(recommendations.values()).sort((a, b) => b.lift - a.lift);
  }

  fit(transactions = []) {
    const mined = this.mine(transactions);
    this.lastResult = mined;
    return {
      totalTransactions: mined.metrics?.totalTransactions || transactions.length,
      frequentItemsets: mined.frequentItemsets,
      rules: mined.associationRules,
    };
  }

  getDealSocCombos({ minLift = 1.0, limit = 5 } = {}) {
    const rules = this.lastResult?.associationRules || [];
    return rules
      .filter((r) => r.lift >= minLift)
      .slice(0, limit)
      .map((r, idx) => ({
        id: `bundle_${idx + 1}`,
        bundleName: `Combo Mua Kèm: ${r.antecedent.join(" + ")} tặng Deal Sốc ${r.consequent.join(" + ")}`,
        items: [...r.antecedent, ...r.consequent],
        mainItems: r.antecedent,
        addonItems: r.consequent,
        support: r.support,
        confidence: r.confidence,
        lift: r.lift,
        discountPct: Math.min(30, Math.round(r.lift * 10)),
      }));
  }

  recommendAddons(itemOrCart = [], options = {}) {
    const cart = Array.isArray(itemOrCart) ? itemOrCart : [itemOrCart];
    const minLift = options.minLift ?? 1.0;
    const limit = options.limit ?? 5;
    const rules = this.lastResult?.associationRules || [];
    const recs = [];

    for (const r of rules) {
      const match = r.antecedent.some((it) => cart.includes(it));
      if (match && r.lift >= minLift) {
        for (const target of r.consequent) {
          if (!cart.includes(target) && !recs.some((rc) => rc.recommendedItem === target)) {
            recs.push({
              recommendedItem: target,
              confidence: r.confidence,
              lift: r.lift,
            });
          }
        }
      }
    }
    return recs.slice(0, limit);
  }
}

// ------------------------------------------------------------------------------
// PHASE 11 ALGORITHM 2: 2D/3D Maximal Rectangles Bin Packing & SPX Volumetric Optimizer
// ------------------------------------------------------------------------------
export const SPX_STANDARD_BOXES = [
  { id: "BOX_XS", name: "Hộp XS (Phụ kiện, son, củ sạc)", width: 15, length: 10, height: 10, maxWeightKg: 1.0, boxCostVnd: 2000 },
  { id: "BOX_S",  name: "Hộp S (Áo thun, mỹ phẩm, điện thoại)", width: 20, length: 15, height: 10, maxWeightKg: 3.0, boxCostVnd: 3500 },
  { id: "BOX_M",  name: "Hộp M (Giày dép, nồi cơm, áo khoác)", width: 30, length: 20, height: 15, maxWeightKg: 5.0, boxCostVnd: 5000 },
  { id: "BOX_L",  name: "Hộp L (Đồ gia dụng, máy hút bụi, balo)", width: 40, length: 30, height: 20, maxWeightKg: 10.0, boxCostVnd: 8000 },
  { id: "BOX_XL", name: "Hộp XL (Đại tiện tích, màn hình, quạt đứng)", width: 60, length: 40, height: 30, maxWeightKg: 20.0, boxCostVnd: 15000 },
];

export function calculateVolumetricWeight(widthCm, lengthCm, heightCm) {
  const vol = (Number(widthCm) || 0) * (Number(lengthCm) || 0) * (Number(heightCm) || 0);
  return Number((vol / 5000).toFixed(2));
}

export class MaximalRectanglesPacker {
  constructor(binWidth, binLength) {
    this.binWidth = binWidth;
    this.binLength = binLength;
    this.usedRectangles = [];
    this.freeRectangles = [{ x: 0, y: 0, width: binWidth, length: binLength }];
  }

  insert(item) {
    const w = Number(item.width) || 0;
    const l = Number(item.length ?? item.height) || 0;
    const allowRotation = item.allowRotation !== false;

    let bestRect = null;
    let bestAreaFit = Infinity;
    let bestRotated = false;

    for (const free of this.freeRectangles) {
      if (free.width >= w && free.length >= l) {
        const leftoverArea = free.width * free.length - w * l;
        if (leftoverArea < bestAreaFit) {
          bestAreaFit = leftoverArea;
          bestRect = free;
          bestRotated = false;
        }
      }

      if (allowRotation && free.width >= l && free.length >= w) {
        const leftoverArea = free.width * free.length - l * w;
        if (leftoverArea < bestAreaFit) {
          bestAreaFit = leftoverArea;
          bestRect = free;
          bestRotated = true;
        }
      }
    }

    if (!bestRect) {
      return null;
    }

    const placedW = bestRotated ? l : w;
    const placedL = bestRotated ? w : l;
    const placement = {
      id: item.id,
      name: item.name || item.id,
      x: bestRect.x,
      y: bestRect.y,
      width: placedW,
      length: placedL,
      rotated: bestRotated,
    };

    this._splitFreeRectangles(placement);
    this._pruneFreeRectangles();

    this.usedRectangles.push(placement);
    return placement;
  }

  _splitFreeRectangles(placed) {
    const newFree = [];

    for (const free of this.freeRectangles) {
      const overlaps =
        placed.x < free.x + free.width &&
        placed.x + placed.width > free.x &&
        placed.y < free.y + free.length &&
        placed.y + placed.length > free.y;

      if (!overlaps) {
        newFree.push(free);
        continue;
      }

      if (placed.y > free.y && placed.y < free.y + free.length) {
        newFree.push({
          x: free.x,
          y: free.y,
          width: free.width,
          length: placed.y - free.y,
        });
      }
      if (placed.y + placed.length < free.y + free.length) {
        newFree.push({
          x: free.x,
          y: placed.y + placed.length,
          width: free.width,
          length: free.y + free.length - (placed.y + placed.length),
        });
      }
      if (placed.x > free.x && placed.x < free.x + free.width) {
        newFree.push({
          x: free.x,
          y: free.y,
          width: placed.x - free.x,
          length: free.length,
        });
      }
      if (placed.x + placed.width < free.x + free.width) {
        newFree.push({
          x: placed.x + placed.width,
          y: free.y,
          width: free.x + free.width - (placed.x + placed.width),
          length: free.length,
        });
      }
    }

    this.freeRectangles = newFree;
  }

  _pruneFreeRectangles() {
    for (let i = 0; i < this.freeRectangles.length; i++) {
      for (let j = i + 1; j < this.freeRectangles.length; j++) {
        const r1 = this.freeRectangles[i];
        const r2 = this.freeRectangles[j];

        if (
          r1.x >= r2.x &&
          r1.y >= r2.y &&
          r1.x + r1.width <= r2.x + r2.width &&
          r1.y + r1.length <= r2.y + r2.length
        ) {
          this.freeRectangles.splice(i, 1);
          i--;
          break;
        }

        if (
          r2.x >= r1.x &&
          r2.y >= r1.y &&
          r2.x + r2.width <= r1.x + r1.width &&
          r2.y + r2.length <= r1.y + r1.length
        ) {
          this.freeRectangles.splice(j, 1);
          j--;
        }
      }
    }
  }

  getEfficiency() {
    const totalBinArea = this.binWidth * this.binLength;
    if (totalBinArea === 0) return 0;
    const usedArea = this.usedRectangles.reduce((sum, r) => sum + r.width * r.length, 0);
    return Number(((usedArea / totalBinArea) * 100).toFixed(2));
  }

  pack(items = []) {
    const packed = [];
    const unpacked = [];
    for (const item of items) {
      const placed = this.insert(item);
      if (placed) {
        packed.push(placed);
      } else {
        unpacked.push(item);
      }
    }
    return {
      packed,
      unpacked,
      occupancyRate: Number((this.getEfficiency() / 100).toFixed(4)),
    };
  }
}

export class SPXBoxOptimizer {
  constructor(customBoxes = null) {
    this.standardBoxes = customBoxes || SPX_STANDARD_BOXES;
  }

  optimizeBoxForOrder(items = []) {
    if (!items || items.length === 0) {
      return {
        bestBox: null,
        packings: [],
        fits: false,
        actualWeightTotal: 0,
        volumetricWeightTotal: 0,
        efficiencyPct: 0,
      };
    }

    const expandedItems = [];
    let totalActualWeight = 0;
    let maxItemHeight = 0;

    for (const it of items) {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const w = Math.max(1, Number(it.width) || 5);
      const l = Math.max(1, Number(it.length) || 5);
      const h = Math.max(1, Number(it.height) || 5);
      const weight = Math.max(0.1, Number(it.weightKg || it.weight) || 0.5);

      if (h > maxItemHeight) maxItemHeight = h;

      for (let q = 0; q < qty; q++) {
        expandedItems.push({
          id: `${it.id || "item"}_${q + 1}`,
          name: it.name || it.id,
          width: w,
          length: l,
          height: h,
          weightKg: weight,
          area: w * l,
          volume: w * l * h,
        });
        totalActualWeight += weight;
      }
    }

    expandedItems.sort((a, b) => b.area - a.area);

    const sortedBoxes = [...this.standardBoxes].sort((a, b) => {
      const volA = a.width * a.length * a.height;
      const volB = b.width * b.length * b.height;
      return volA - volB;
    });

    for (const box of sortedBoxes) {
      if (box.height < maxItemHeight) continue;
      if (totalActualWeight > box.maxWeightKg) continue;

      const packer = new MaximalRectanglesPacker(box.width, box.length);
      let allFit = true;
      const placements = [];

      for (const item of expandedItems) {
        const placed = packer.insert(item);
        if (!placed) {
          allFit = false;
          break;
        }
        placements.push({
          ...placed,
          height: item.height,
          weightKg: item.weightKg,
        });
      }

      if (allFit) {
        const volumetricWeight = calculateVolumetricWeight(box.width, box.length, box.height);
        const chargeableWeight = Math.max(Number(totalActualWeight.toFixed(2)), volumetricWeight);
        const efficiency = packer.getEfficiency();

        return {
          bestBox: box,
          packings: placements,
          fits: true,
          actualWeightTotal: Number(totalActualWeight.toFixed(2)),
          volumetricWeightTotal: volumetricWeight,
          chargeableWeight,
          efficiencyPct: efficiency,
          unpackedCount: 0,
          recommendation: `Đã chọn ${box.name} (${box.width}x${box.length}x${box.height}cm). Đạt mật độ đáy ${efficiency}%, cước tính theo ${chargeableWeight}kg.`,
        };
      }
    }

    return {
      bestBox: null,
      packings: [],
      fits: false,
      actualWeightTotal: Number(totalActualWeight.toFixed(2)),
      volumetricWeightTotal: 0,
      chargeableWeight: Number(totalActualWeight.toFixed(2)),
      efficiencyPct: 0,
      unpackedCount: expandedItems.length,
      recommendation: "Đơn hàng vượt quá kích thước hộp chuẩn XL. Vui lòng chia làm 2 kiện hàng SPX riêng biệt.",
    };
  }

  optimizePacking(items = []) {
    const res = this.optimizeBoxForOrder(items);
    return {
      success: res.fits,
      selectedBox: res.bestBox
        ? {
            code: res.bestBox.id.replace("BOX_", "SPX_BOX_"),
            name: res.bestBox.name,
            width: res.bestBox.width,
            length: res.bestBox.length,
            height: res.bestBox.height,
          }
        : null,
      unpackedItems: res.fits ? [] : items,
      volumetricWeightKg: res.volumetricWeightTotal,
      chargeableWeightKg: res.chargeableWeight,
      efficiencyPct: res.efficiencyPct,
      manifest: res.packings.map((p, idx) => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        width: p.width,
        length: p.length,
        layer: Math.floor(idx / 4),
      })),
    };
  }
}

// ------------------------------------------------------------------------------
// PHASE 11 ALGORITHM 3: SWIM Gossip Protocol & Failure Detector
// ------------------------------------------------------------------------------
export const MemberStatus = {
  ALIVE: "ALIVE",
  SUSPECT: "SUSPECT",
  DEAD: "DEAD",
};

export class ClusterMember {
  constructor(id, address = "127.0.0.1", port = 8000) {
    this.id = String(id);
    this.address = address;
    this.port = port;
    this.status = MemberStatus.ALIVE;
    this.incarnation = 0;
    this.lastObservedAt = Date.now();
    this.suspectTimer = null;
  }
}

export class SwimNode {
  constructor({
    id,
    cluster = null,
    pingTimeoutMs = 200,
    indirectPingCount = 2,
    suspicionTimeoutTicks = 3,
  } = {}) {
    this.id = String(id);
    this.cluster = cluster;
    this.status = MemberStatus.ALIVE;
    this.incarnation = 0;
    this.pingTimeoutMs = pingTimeoutMs;
    this.indirectPingCount = indirectPingCount;
    this.suspicionTimeoutTicks = suspicionTimeoutTicks;

    this.members = new Map();
    const selfMember = new ClusterMember(this.id);
    this.members.set(this.id, selfMember);

    this.disseminationBuffer = [];
    this.probeIndex = 0;
  }

  get memberList() {
    return this.members;
  }

  get memberListArray() {
    return Array.from(this.members.values());
  }

  joinMember(memberId, address = "127.0.0.1", port = 8000) {
    this.addMember(memberId, address, port);
  }

  refuteSuspicion(suspectIncarnation = 0) {
    this.incarnation = Math.max(this.incarnation, Number(suspectIncarnation) || 0) + 1;
    this.status = MemberStatus.ALIVE;
    const self = this.members.get(this.id);
    if (self) {
      self.status = MemberStatus.ALIVE;
      self.incarnation = this.incarnation;
    }
    this._enqueueUpdate(this.id, MemberStatus.ALIVE, this.incarnation);
  }

  applyMemberUpdate(update) {
    if (!update) return;
    this.applyUpdates([update]);
  }

  checkSuspicionTimeouts() {
    for (const [mId, mem] of this.members.entries()) {
      if (mId === this.id) continue;
      if (mem.status === MemberStatus.SUSPECT) {
        mem.suspectTicks = (mem.suspectTicks || 0) + 1;
        if (mem.suspectTicks >= this.suspicionTimeoutTicks) {
          mem.status = MemberStatus.DEAD;
          this._enqueueUpdate(mId, MemberStatus.DEAD, mem.incarnation);
        }
      }
    }
  }

  addMember(memberId, address = "127.0.0.1", port = 8000) {
    const strId = String(memberId);
    if (!this.members.has(strId)) {
      const newMem = new ClusterMember(strId, address, port);
      this.members.set(strId, newMem);
      this._enqueueUpdate(strId, MemberStatus.ALIVE, 0);
    }
  }

  getAliveMembers() {
    return Array.from(this.members.values()).filter((m) => m.status === MemberStatus.ALIVE);
  }

  getActiveMembers() {
    return Array.from(this.members.values()).filter((m) => m.status !== MemberStatus.DEAD);
  }

  _enqueueUpdate(memberId, status, incarnation) {
    const existing = this.disseminationBuffer.find((u) => u.memberId === memberId);
    if (existing) {
      if (incarnation >= existing.incarnation) {
        existing.status = status;
        existing.incarnation = incarnation;
        existing.transmitsLeft = 8;
      }
    } else {
      this.disseminationBuffer.push({
        memberId,
        status,
        incarnation,
        transmitsLeft: 8,
      });
    }
  }

  _getPiggybackedUpdates() {
    const updates = [];
    for (const u of this.disseminationBuffer) {
      if (u.transmitsLeft > 0) {
        updates.push({
          memberId: u.memberId,
          id: u.memberId,
          status: u.status,
          incarnation: u.incarnation,
        });
        u.transmitsLeft -= 1;
      }
    }
    this.disseminationBuffer = this.disseminationBuffer.filter((u) => u.transmitsLeft > 0);
    return updates;
  }

  applyUpdates(updates = []) {
    for (const u of updates) {
      const targetId = String(u.memberId || u.id || "");
      if (!targetId) continue;

      if (targetId === this.id) {
        if (u.status === MemberStatus.SUSPECT || u.status === MemberStatus.DEAD) {
          if (u.incarnation >= this.incarnation) {
            this.incarnation = u.incarnation + 1;
            const self = this.members.get(this.id);
            if (self) {
              self.status = MemberStatus.ALIVE;
              self.incarnation = this.incarnation;
            }
            this._enqueueUpdate(this.id, MemberStatus.ALIVE, this.incarnation);
          }
        }
        continue;
      }

      if (!this.members.has(targetId)) {
        this.members.set(targetId, new ClusterMember(targetId));
        this._enqueueUpdate(targetId, u.status || MemberStatus.ALIVE, u.incarnation || 0);
      }

      const member = this.members.get(targetId);

      if (u.incarnation > member.incarnation) {
        member.incarnation = u.incarnation;
        member.status = u.status;
        member.lastObservedAt = Date.now();
        this._enqueueUpdate(targetId, u.status, u.incarnation);
      } else if (u.incarnation === member.incarnation) {
        if (member.status === MemberStatus.ALIVE && (u.status === MemberStatus.SUSPECT || u.status === MemberStatus.DEAD)) {
          member.status = u.status;
          this._enqueueUpdate(targetId, u.status, u.incarnation);
        } else if (member.status === MemberStatus.SUSPECT && u.status === MemberStatus.DEAD) {
          member.status = MemberStatus.DEAD;
          this._enqueueUpdate(targetId, MemberStatus.DEAD, u.incarnation);
        }
      }
    }
  }

  stepProtocol() {
    if (this.status === MemberStatus.DEAD) return null;

    for (const [mId, mem] of this.members.entries()) {
      if (mId === this.id) continue;
      if (mem.status === MemberStatus.SUSPECT) {
        mem.suspectTicks = (mem.suspectTicks || 0) + 1;
        if (mem.suspectTicks >= this.suspicionTimeoutTicks) {
          mem.status = MemberStatus.DEAD;
          this._enqueueUpdate(mId, MemberStatus.DEAD, mem.incarnation);
        }
      }
    }

    const candidates = Array.from(this.members.values()).filter(
      (m) => m.id !== this.id && m.status !== MemberStatus.DEAD
    );

    if (candidates.length === 0) return null;
    let target = null;
    if (typeof this.probeIndex === "number" && this.probeIndex >= 0) {
      const probeCandidate = this.memberListArray[this.probeIndex];
      if (probeCandidate && probeCandidate.id !== this.id && probeCandidate.status !== MemberStatus.DEAD) {
        target = probeCandidate;
      } else if (this.probeIndex < candidates.length) {
        target = candidates[this.probeIndex];
      }
    }
    if (!target) {
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const piggyback = this._getPiggybackedUpdates();
    let directSuccess = false;

    if (this.cluster && this.cluster.canDeliver(this.id, target.id)) {
      const targetNode = this.cluster.getNode(target.id);
      if (targetNode && targetNode.status !== MemberStatus.DEAD) {
        const reply = targetNode.receivePing(this.id, piggyback);
        if (reply && reply.updates && reply.updates.length > 0) {
          this.applyUpdates(reply.updates);
        }
        directSuccess = true;
      }
    }

    if (directSuccess) {
      target.status = MemberStatus.ALIVE;
      target.suspectTicks = 0;
      return {
        type: "DIRECT_PING",
        targetId: target.id,
        directSuccess: true,
        success: true,
      };
    }

    const intermediaries = candidates.filter((m) => m.id !== target.id);
    let indirectSuccess = false;

    if (intermediaries.length > 0 && this.cluster) {
      const selectedIntermediaries = intermediaries.slice(0, this.indirectPingCount);
      for (const inter of selectedIntermediaries) {
        if (this.cluster.canDeliver(this.id, inter.id) && this.cluster.canDeliver(inter.id, target.id)) {
          const interNode = this.cluster.getNode(inter.id);
          const targetNode = this.cluster.getNode(target.id);
          if (interNode && targetNode && targetNode.status !== MemberStatus.DEAD) {
            indirectSuccess = true;
            break;
          }
        }
      }
    }

    if (!indirectSuccess) {
      if (target.status === MemberStatus.ALIVE) {
        target.status = MemberStatus.SUSPECT;
        target.suspectTicks = 0;
        this._enqueueUpdate(target.id, MemberStatus.SUSPECT, target.incarnation);
      }
      return {
        type: "INDIRECT_PING_REQ",
        targetId: target.id,
        directSuccess: false,
        indirectSuccess: false,
        success: false,
        newStatus: MemberStatus.SUSPECT,
        status: MemberStatus.SUSPECT,
      };
    }

    return {
      type: "INDIRECT_PING_REQ",
      targetId: target.id,
      directSuccess: false,
      indirectSuccess: true,
      success: true,
    };
  }

  receivePing(fromId, updates = []) {
    this.applyUpdates(updates);
    const piggyback = this._getPiggybackedUpdates();
    return { ack: true, incarnation: this.incarnation, updates: piggyback };
  }
}

export class SwimCluster {
  constructor({ nodeCount = 5, suspicionTimeoutRounds = 3 } = {}) {
    this.nodes = new Map();
    this.partitions = [];
    this.droppedLinks = new Set();

    const count = Math.max(2, Number(nodeCount) || 5);
    const nodeIds = Array.from({ length: count }, (_, i) => `swim_node_${i + 1}`);

    for (const id of nodeIds) {
      const node = new SwimNode({
        id,
        cluster: this,
        suspicionTimeoutTicks: suspicionTimeoutRounds,
      });
      this.nodes.set(id, node);
    }

    for (const node of this.nodes.values()) {
      for (const otherId of nodeIds) {
        node.addMember(otherId);
      }
    }
  }

  getNode(id) {
    const sId = String(id);
    if (this.nodes.has(sId)) return this.nodes.get(sId);
    for (const [k, v] of this.nodes.entries()) {
      if (k.replace(/^swim_/, "") === sId.replace(/^swim_/, "")) {
        return v;
      }
    }
    return undefined;
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  setDroppedLink(fromId, toId, isDropped = true) {
    const key = `${fromId}->${toId}`;
    if (isDropped) {
      this.droppedLinks.add(key);
    } else {
      this.droppedLinks.delete(key);
    }
  }

  isolateNode(id) {
    const strId = String(id);
    for (const node of this.nodes.values()) {
      this.droppedLinks.add(`${strId}->${node.id}`);
      this.droppedLinks.add(`${node.id}->${strId}`);
    }
  }

  healNetwork() {
    this.droppedLinks.clear();
    this.partitions = [];
  }

  canDeliver(fromId, toId) {
    if (this.droppedLinks.has(`${fromId}->${toId}`)) {
      return false;
    }
    return true;
  }

  runRounds(rounds = 5) {
    const results = [];
    for (let r = 0; r < rounds; r++) {
      for (const node of this.nodes.values()) {
        const step = node.stepProtocol();
        if (step) results.push({ round: r + 1, nodeId: node.id, ...step });
      }
    }
    return results;
  }
}

// ==========================================
// PHASE 12: SPX GRAPH ROUTING, ROARING BITMAPS, RFM SEGMENTATION
// ==========================================

export const SPX_DEFAULT_HUBS = [
  { id: "HUB_HN", name: "SPX Hà Nội First-Mile Hub", city: "Hà Nội", lat: 21.0285, lng: 105.8542, type: "FIRST_MILE" },
  { id: "SOC_BN", name: "SPX Bắc Ninh Mega SOC", city: "Bắc Ninh", lat: 21.1861, lng: 106.0763, type: "MEGA_SOC" },
  { id: "SOC_VINH", name: "SPX Vinh Regional SOC", city: "Nghệ An", lat: 18.6734, lng: 105.6923, type: "REGIONAL_SOC" },
  { id: "SOC_DNG", name: "SPX Đà Nẵng Central SOC", city: "Đà Nẵng", lat: 16.0544, lng: 108.2022, type: "REGIONAL_SOC" },
  { id: "SOC_NTR", name: "SPX Nha Trang Coastal SOC", city: "Khánh Hòa", lat: 12.2388, lng: 109.1967, type: "REGIONAL_SOC" },
  { id: "SOC_CUCHI", name: "SPX Củ Chi Mega SOC", city: "TP. Hồ Chí Minh", lat: 11.0067, lng: 106.5133, type: "MEGA_SOC" },
  { id: "HUB_SG", name: "SPX Sài Gòn Hub", city: "TP. Hồ Chí Minh", lat: 10.7769, lng: 106.7009, type: "LAST_MILE" },
  { id: "SOC_CT", name: "SPX Cần Thơ Mekong SOC", city: "Cần Thơ", lat: 10.0452, lng: 105.7469, type: "REGIONAL_SOC" },
];

export const SPX_DEFAULT_ROUTES = [
  { from: "HUB_HN", to: "SOC_BN", distanceKm: 35, transitHours: 1.5, baseCostVnd: 5000 },
  { from: "SOC_BN", to: "SOC_VINH", distanceKm: 310, transitHours: 6.0, baseCostVnd: 12000 },
  { from: "SOC_BN", to: "SOC_DNG", distanceKm: 760, transitHours: 14.0, baseCostVnd: 22000 },
  { from: "SOC_VINH", to: "SOC_DNG", distanceKm: 470, transitHours: 9.0, baseCostVnd: 15000 },
  { from: "SOC_DNG", to: "SOC_NTR", distanceKm: 530, transitHours: 10.0, baseCostVnd: 16000 },
  { from: "SOC_DNG", to: "SOC_CUCHI", distanceKm: 940, transitHours: 17.0, baseCostVnd: 25000 },
  { from: "SOC_NTR", to: "SOC_CUCHI", distanceKm: 420, transitHours: 8.0, baseCostVnd: 14000 },
  { from: "SOC_CUCHI", to: "HUB_SG", distanceKm: 40, transitHours: 2.0, baseCostVnd: 6000 },
  { from: "HUB_SG", to: "SOC_CT", distanceKm: 170, transitHours: 4.0, baseCostVnd: 10000 },
  { from: "SOC_BN", to: "HUB_HN", distanceKm: 35, transitHours: 1.5, baseCostVnd: 5000 },
  { from: "SOC_VINH", to: "SOC_BN", distanceKm: 310, transitHours: 6.0, baseCostVnd: 12000 },
  { from: "SOC_DNG", to: "SOC_BN", distanceKm: 760, transitHours: 14.0, baseCostVnd: 22000 },
  { from: "SOC_DNG", to: "SOC_VINH", distanceKm: 470, transitHours: 9.0, baseCostVnd: 15000 },
  { from: "SOC_NTR", to: "SOC_DNG", distanceKm: 530, transitHours: 10.0, baseCostVnd: 16000 },
  { from: "SOC_CUCHI", to: "SOC_DNG", distanceKm: 940, transitHours: 17.0, baseCostVnd: 25000 },
  { from: "SOC_CUCHI", to: "SOC_NTR", distanceKm: 420, transitHours: 8.0, baseCostVnd: 14000 },
  { from: "HUB_SG", to: "SOC_CUCHI", distanceKm: 40, transitHours: 2.0, baseCostVnd: 6000 },
  { from: "SOC_CT", to: "HUB_SG", distanceKm: 170, transitHours: 4.0, baseCostVnd: 10000 },
];

export class SPXHubGraphRouter {
  constructor(hubs = SPX_DEFAULT_HUBS, routes = SPX_DEFAULT_ROUTES) {
    this.hubs = new Map();
    this.adjacencyList = new Map();

    for (const h of hubs) {
      this.addHub(h);
    }
    for (const r of routes) {
      this.addRoute(r);
    }
  }

  addHub(hub) {
    this.hubs.set(hub.id, { ...hub });
    if (!this.adjacencyList.has(hub.id)) {
      this.adjacencyList.set(hub.id, []);
    }
  }

  addRoute(route) {
    if (!this.adjacencyList.has(route.from)) {
      this.adjacencyList.set(route.from, []);
    }
    this.adjacencyList.get(route.from).push({
      to: route.to,
      distanceKm: Number(route.distanceKm) || 0,
      transitHours: Number(route.transitHours) || 1,
      baseCostVnd: Number(route.baseCostVnd) || 0,
    });
  }

  findOptimalPath(sourceId, targetId, criterion = "time") {
    if (!this.hubs.has(sourceId) || !this.hubs.has(targetId)) {
      return {
        found: false,
        reason: `Trạm nguồn ${sourceId} hoặc trạm đích ${targetId} không tồn tại trên đồ thị.`,
      };
    }

    if (sourceId === targetId) {
      const hub = this.hubs.get(sourceId);
      return {
        found: true,
        criterion,
        source: hub,
        target: hub,
        path: [hub],
        totalDistanceKm: 0,
        totalTransitHours: 0,
        totalBaseCostVnd: 0,
        segments: [],
      };
    }

    const distances = new Map();
    const previous = new Map();
    const edgeUsed = new Map();
    const pq = new PriorityQueue((a, b) => a.priority - b.priority);

    for (const [id] of this.hubs) {
      distances.set(id, Infinity);
    }
    distances.set(sourceId, 0);
    pq.push({ id: sourceId, priority: 0 });

    while (!pq.isEmpty()) {
      const { id: u, priority: currentDist } = pq.pop();

      if (u === targetId) break;
      if (currentDist > distances.get(u)) continue;

      const neighbors = this.adjacencyList.get(u) || [];
      for (const edge of neighbors) {
        let weight = edge.transitHours;
        if (criterion === "distance") weight = edge.distanceKm;
        else if (criterion === "cost") weight = edge.baseCostVnd;

        const newDist = currentDist + weight;
        if (newDist < distances.get(edge.to)) {
          distances.set(edge.to, newDist);
          previous.set(edge.to, u);
          edgeUsed.set(edge.to, edge);
          pq.push({ id: edge.to, priority: newDist });
        }
      }
    }

    if (!previous.has(targetId)) {
      return {
        found: false,
        reason: `Không tìm thấy tuyến đường kết nối khả dụng từ ${sourceId} đến ${targetId}.`,
      };
    }

    const pathIds = [];
    const segments = [];
    let curr = targetId;

    while (curr !== sourceId) {
      pathIds.unshift(curr);
      segments.unshift(edgeUsed.get(curr));
      curr = previous.get(curr);
    }
    pathIds.unshift(sourceId);

    const fullPath = pathIds.map((id) => this.hubs.get(id));
    const totalDistanceKm = segments.reduce((acc, s) => acc + s.distanceKm, 0);
    const totalTransitHours = segments.reduce((acc, s) => acc + s.transitHours, 0);
    const totalBaseCostVnd = segments.reduce((acc, s) => acc + s.baseCostVnd, 0);

    return {
      found: true,
      criterion,
      source: this.hubs.get(sourceId),
      target: this.hubs.get(targetId),
      path: fullPath,
      segments,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalTransitHours: Number(totalTransitHours.toFixed(1)),
      totalBaseCostVnd,
      estimatedDays: Number((totalTransitHours / 24).toFixed(1)),
    };
  }

  findAStarPath(sourceId, targetId, averageSpeedKmh = 60) {
    if (!this.hubs.has(sourceId) || !this.hubs.has(targetId)) {
      return { found: false, reason: "Trạm nguồn hoặc trạm đích không tồn tại." };
    }

    const targetHub = this.hubs.get(targetId);
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();
    const edgeUsed = new Map();

    for (const [id] of this.hubs) {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    }

    const heuristic = (hubId) => {
      const hub = this.hubs.get(hubId);
      if (!hub || !targetHub) return 0;
      const distKm = calculateHaversineDistance(hub.lat, hub.lng, targetHub.lat, targetHub.lng);
      return distKm / averageSpeedKmh;
    };

    gScore.set(sourceId, 0);
    fScore.set(sourceId, heuristic(sourceId));

    const pq = new PriorityQueue((a, b) => a.f - b.f);
    pq.push({ id: sourceId, f: fScore.get(sourceId) });

    while (!pq.isEmpty()) {
      const { id: current } = pq.pop();

      if (current === targetId) {
        const path = [];
        const segments = [];
        let curr = targetId;

        while (curr !== sourceId) {
          path.unshift(this.hubs.get(curr));
          segments.unshift(edgeUsed.get(curr));
          curr = cameFrom.get(curr);
        }
        path.unshift(this.hubs.get(sourceId));

        const totalDist = segments.reduce((acc, s) => acc + s.distanceKm, 0);
        const totalHours = segments.reduce((acc, s) => acc + s.transitHours, 0);
        const totalCost = segments.reduce((acc, s) => acc + s.baseCostVnd, 0);

        return {
          found: true,
          source: this.hubs.get(sourceId),
          target: targetHub,
          path,
          segments,
          totalDistanceKm: Number(totalDist.toFixed(1)),
          totalTransitHours: Number(totalHours.toFixed(1)),
          totalBaseCostVnd: totalCost,
        };
      }

      const neighbors = this.adjacencyList.get(current) || [];
      for (const edge of neighbors) {
        const tentativeG = gScore.get(current) + edge.transitHours;
        if (tentativeG < gScore.get(edge.to)) {
          cameFrom.set(edge.to, current);
          edgeUsed.set(edge.to, edge);
          gScore.set(edge.to, tentativeG);
          const f = tentativeG + heuristic(edge.to);
          fScore.set(edge.to, f);
          pq.push({ id: edge.to, f });
        }
      }
    }

    return { found: false, reason: "Không tìm thấy đường đi tới đích bằng A*." };
  }

  generateLiveTrackingSchedule(routePlan, startTime = new Date()) {
    if (!routePlan || !routePlan.found || !routePlan.path) {
      return [];
    }

    const steps = [];
    let currentTimestamp = new Date(startTime).getTime();

    for (let i = 0; i < routePlan.path.length; i++) {
      const hub = routePlan.path[i];
      let status = "COMPLETED";
      let description = "";

      if (i === 0) {
        description = `Đơn hàng đã nhập kho phát hành tại ${hub.name} (${hub.city})`;
      } else if (i === routePlan.path.length - 1) {
        description = `Đơn hàng đã đến trạm giao chặng cuối tại ${hub.name} (${hub.city}). Đang chuẩn bị phân phối bưu tá.`;
        status = "PENDING";
      } else {
        description = `Gói hàng đang được điều phối trung chuyển tại ${hub.name} (${hub.city})`;
      }

      steps.push({
        stepIndex: i + 1,
        hubId: hub.id,
        hubName: hub.name,
        city: hub.city,
        type: hub.type,
        timestamp: new Date(currentTimestamp).toISOString(),
        status,
        description,
      });

      if (i < routePlan.segments.length) {
        const seg = routePlan.segments[i];
        currentTimestamp += seg.transitHours * 3600 * 1000;
      }
    }

    return steps;
  }
}

// Roaring Bitmaps Faceted Filter
const MAX_ARRAY_CARDINALITY = 4096;

function getHighBits(val) {
  return (val >>> 16) & 0xffff;
}

function getLowBits(val) {
  return val & 0xffff;
}

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
      if (midVal === val) return;
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

export class RoaringBitmap {
  constructor(initialIds = []) {
    this.containers = new Map();
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

export class FacetedCatalogIndex {
  constructor() {
    this.indexes = new Map();
    this.allProducts = new RoaringBitmap();
    this.productDetails = new Map();
    this.codeToIdMap = new Map();
    this.nextNumericId = 1;
  }

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

    if (item.category) {
      this._addToFacet("category", String(item.category).toLowerCase(), numericId);
    }

    if (item.brand) {
      this._addToFacet("brand", String(item.brand).toLowerCase(), numericId);
    }

    const price = Number(item.price) || 0;
    if (price < 100000) this._addToFacet("priceTier", "UNDER_100K", numericId);
    else if (price <= 300000) this._addToFacet("priceTier", "100K_300K", numericId);
    else if (price <= 1000000) this._addToFacet("priceTier", "300K_1M", numericId);
    else this._addToFacet("priceTier", "OVER_1M", numericId);

    const rating = Math.floor(Number(item.rating) || 5);
    for (let r = 1; r <= rating; r++) {
      this._addToFacet("minRating", `${r}_STAR`, numericId);
    }

    if (item.location) {
      this._addToFacet("location", String(item.location).toLowerCase(), numericId);
    }

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

// RFM Segmentation & Customer Lifetime Value (CLV)
export const RFM_SEGMENT_RULES = [
  {
    code: "CHAMPIONS",
    title: "Khách Hàng Thượng Khách (Champions)",
    description: "Khách hàng mua thường xuyên nhất, chi tiêu lớn nhất và vừa đặt hàng gần đây.",
    action: "Tri ân quà tặng đặc biệt, cấp huy hiệu VIP Shopee Mall, quyền lợi miễn phí vận chuyển trọn đời.",
    match: (r, f, m) => r >= 4 && f >= 4 && m >= 4,
  },
  {
    code: "LOYAL_CUSTOMERS",
    title: "Khách Hàng Trung Thành (Loyal Customers)",
    description: "Mua sắm đều đặn, phản hồi tích cực và có giá trị đơn hàng ổn định.",
    action: "Upsell các sản phẩm phân khúc cao hơn, tích điểm Mini Xu x2, mời đánh giá sản phẩm có quà.",
    match: (r, f, m) => r >= 3 && f >= 3 && m >= 3,
  },
  {
    code: "POTENTIAL_LOYALISTS",
    title: "Khách Hàng Tiềm Năng (Potential Loyalists)",
    description: "Khách hàng mới mua 2-3 đơn gần đây với số tiền khá tốt.",
    action: "Gợi ý gói combo Mua Kèm Deal Sốc, tặng voucher bậc thang cho đơn kế tiếp.",
    match: (r, f, m) => r >= 4 && f >= 2 && f <= 3,
  },
  {
    code: "NEW_CUSTOMERS",
    title: "Khách Hàng Mới (New Customers)",
    description: "Vừa có đơn hàng đầu tiên gần đây, đang trải nghiệm sàn.",
    action: "Hỗ trợ hướng dẫn sử dụng, gửi voucher tân thủ giảm 15% cho đơn thứ hai.",
    match: (r, f, m) => r >= 4 && f === 1,
  },
  {
    code: "PROMISING",
    title: "Khách Hàng Triển Vọng (Promising)",
    description: "Đã mua đơn hàng cách đây không lâu, giá trị đơn hàng trung bình.",
    action: "Tặng voucher Freeship Max và thông báo Flash Sale hàng ngày để tạo thói quen mở app.",
    match: (r, f, m) => r === 3 && f <= 2,
  },
  {
    code: "NEED_ATTENTION",
    title: "Khách Hàng Cần Chú Ý (Need Attention)",
    description: "Đã từng mua nhiều đơn nhưng tần suất đang chậm lại hơn 1 tháng qua.",
    action: "Gửi thông báo đẩy về các sản phẩm mới trong danh mục yêu thích, ưu đãi có thời hạn 48h.",
    match: (r, f, m) => r === 3 && f >= 3,
  },
  {
    code: "ABOUT_TO_SLEEP",
    title: "Khách Hàng Sắp Ngủ Đông (About to Sleep)",
    description: "Đã hơn 2 tháng chưa phát sinh đơn mới, nguy cơ quên mất sàn.",
    action: "Gửi thông báo 'Mini Shopee nhớ bạn' kèm voucher độc quyền giảm 20k.",
    match: (r, f, m) => r === 2 && f <= 2,
  },
  {
    code: "AT_RISK",
    title: "Khách Hàng Nguy Cơ Rời Bỏ (At Risk)",
    description: "Từng mua rất nhiều đơn và chi nhiều tiền, nhưng đã lâu không quay lại.",
    action: "Cảnh báo khẩn cấp: Gửi voucher chiết khấu sâu 30-50k, nhân viên CSKH liên hệ chăm sóc.",
    match: (r, f, m) => r <= 2 && f >= 3 && m >= 3,
  },
  {
    code: "CANT_LOSE_THEM",
    title: "Khách VIP Không Thể Mất (Can't Lose Them)",
    description: "Từng là khách hàng chi tiêu lớn nhất sàn, nhưng thời gian qua hoàn toàn vắng bóng.",
    action: "Kích hoạt chiến dịch Re-engagement đặc quyền: Tặng combo quà tặng trực tiếp từ sàn.",
    match: (r, f, m) => r === 1 && f >= 4 && m >= 4,
  },
  {
    code: "HIBERNATING",
    title: "Khách Hàng Ngủ Đông (Hibernating)",
    description: "Lần mua cuối cách đây nhiều tháng, tần suất mua ít và chi tiêu thấp.",
    action: "Chỉ gửi thông báo các chiến dịch Mega Sale lớn (11.11, 12.12), sản phẩm xả kho giá sốc.",
    match: (r, f, m) => r <= 2 && f <= 2,
  },
  {
    code: "LOST",
    title: "Khách Hàng Đã Mất (Lost)",
    description: "Chỉ mua 1 đơn cách đây rất lâu với giá trị thấp và không bao giờ quay lại.",
    action: "Không lãng phí ngân sách quảng cáo cá nhân hóa. Chỉ tiếp cận qua chiến dịch tiếp thị đại trà.",
    match: (r, f, m) => true,
  },
];

export class RFMSegmentationEngine {
  constructor(referenceDate = new Date()) {
    this.referenceDate = new Date(referenceDate);
  }

  calculateRecencyScore(daysSinceLastPurchase) {
    const days = Math.max(0, Number(daysSinceLastPurchase) || 0);
    if (days <= 14) return 5;
    if (days <= 30) return 4;
    if (days <= 60) return 3;
    if (days <= 90) return 2;
    return 1;
  }

  calculateFrequencyScore(orderCount) {
    const count = Math.max(0, Number(orderCount) || 0);
    if (count >= 15) return 5;
    if (count >= 8) return 4;
    if (count >= 4) return 3;
    if (count >= 2) return 2;
    if (count === 1) return 1;
    return 1;
  }

  calculateMonetaryScore(totalSpentVnd) {
    const spent = Math.max(0, Number(totalSpentVnd) || 0);
    if (spent >= 5000000) return 5;
    if (spent >= 2000000) return 4;
    if (spent >= 800000) return 3;
    if (spent >= 300000) return 2;
    return 1;
  }

  analyzeCustomer(customer) {
    const customerId = customer.id || customer._id || "anon";
    const customerName = customer.name || customer.fullName || "Khách Hàng";
    const orders = (customer.orders || []).filter(
      (o) => o.status === "DELIVERED" || o.status === "COMPLETED" || !o.status
    );

    if (orders.length === 0) {
      return {
        customerId,
        customerName,
        recencyDays: Infinity,
        orderCount: 0,
        totalSpentVnd: 0,
        averageOrderValue: 0,
        rScore: 1,
        fScore: 1,
        mScore: 1,
        rfmCode: "111",
        rfmScore: 3,
        segment: RFM_SEGMENT_RULES.find((s) => s.code === "LOST"),
        projectedCLV: 0,
      };
    }

    let latestOrderDate = new Date(0);
    let totalSpent = 0;

    for (const o of orders) {
      const orderDate = new Date(o.createdAt || o.date || this.referenceDate);
      if (orderDate > latestOrderDate) {
        latestOrderDate = orderDate;
      }
      totalSpent += Number(o.totalAmount || o.total || 0);
    }

    const diffTime = Math.max(0, this.referenceDate.getTime() - latestOrderDate.getTime());
    const recencyDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const orderCount = orders.length;
    const averageOrderValue = Math.round(totalSpent / orderCount);

    const rScore = this.calculateRecencyScore(recencyDays);
    const fScore = this.calculateFrequencyScore(orderCount);
    const mScore = this.calculateMonetaryScore(totalSpent);

    let matchedSegment = RFM_SEGMENT_RULES.find((rule) => rule.match(rScore, fScore, mScore));
    if (!matchedSegment) {
      matchedSegment = RFM_SEGMENT_RULES[RFM_SEGMENT_RULES.length - 1];
    }

    const retentionMultipliers = {
      CHAMPIONS: 1.8,
      LOYAL_CUSTOMERS: 1.5,
      POTENTIAL_LOYALISTS: 1.3,
      NEW_CUSTOMERS: 1.1,
      PROMISING: 1.0,
      NEED_ATTENTION: 0.7,
      ABOUT_TO_SLEEP: 0.4,
      AT_RISK: 0.3,
      CANT_LOSE_THEM: 0.2,
      HIBERNATING: 0.1,
      LOST: 0.05,
    };

    const multiplier = retentionMultipliers[matchedSegment.code] || 1.0;
    const projectedAnnualOrders = Math.max(1, Math.round(orderCount * multiplier));
    const projectedCLV = averageOrderValue * projectedAnnualOrders;

    return {
      customerId,
      customerName,
      recencyDays,
      orderCount,
      totalSpentVnd: totalSpent,
      averageOrderValue,
      rScore,
      fScore,
      mScore,
      rfmCode: `${rScore}${fScore}${mScore}`,
      rfmScore: rScore + fScore + mScore,
      segment: {
        code: matchedSegment.code,
        title: matchedSegment.title,
        description: matchedSegment.description,
        recommendedAction: matchedSegment.action,
      },
      projectedCLV,
    };
  }

  analyzeBatch(customers = []) {
    const analysisList = customers.map((c) => this.analyzeCustomer(c));
    const segmentCounts = {};
    let totalGMV = 0;
    let totalProjectedCLV = 0;

    for (const rule of RFM_SEGMENT_RULES) {
      segmentCounts[rule.code] = 0;
    }

    for (const a of analysisList) {
      segmentCounts[a.segment.code] = (segmentCounts[a.segment.code] || 0) + 1;
      totalGMV += a.totalSpentVnd;
      totalProjectedCLV += a.projectedCLV;
    }

    const totalCustomers = analysisList.length;
    const segmentBreakdown = Object.keys(segmentCounts).map((code) => {
      const rule = RFM_SEGMENT_RULES.find((r) => r.code === code);
      const count = segmentCounts[code];
      const pct = totalCustomers > 0 ? Number(((count / totalCustomers) * 100).toFixed(1)) : 0;
      return {
        code,
        title: rule ? rule.title : code,
        count,
        percentage: pct,
        recommendedAction: rule ? rule.action : "",
      };
    });

    return {
      totalCustomers,
      totalHistoricalGMV: totalGMV,
      totalProjectedCLV,
      averageCLV: totalCustomers > 0 ? Math.round(totalProjectedCLV / totalCustomers) : 0,
      segmentBreakdown,
      customers: analysisList,
    };
  }
}

// ==========================================
// PHASE 13: INVENTORY CLEARANCE, GEOHASH SPATIAL, LINUCB BANDIT
// ==========================================

export const INVENTORY_AGE_TIERS = [
  { code: "FRESH", minDays: 0, maxDays: 30, discountRate: 0.0, label: "Hàng Mới Nhập", recommendation: "Duy trì giá bán chuẩn và tập trung đẩy Shopee Ads." },
  { code: "MODERATE", minDays: 31, maxDays: 60, discountRate: 0.1, label: "Tồn Kho 1-2 Tháng", recommendation: "Tham gia Flash Sale khung giờ phụ, giảm nhẹ 10% để kích cầu." },
  { code: "SLOW", minDays: 61, maxDays: 90, discountRate: 0.25, label: "Chậm Luân Chuyển", recommendation: "Thiết lập gói Mua Kèm Deal Sốc bằng FP-Growth, chiết khấu 25%." },
  { code: "DEADSTOCK", minDays: 91, maxDays: Infinity, discountRate: 0.4, label: "Tồn Kho Báo Động (>3 Tháng)", recommendation: "Kích hoạt chiến dịch Xả Hàng Tồn Kho, giảm 40% về sát giá sàn hòa vốn để giải phóng mặt bằng kho." },
];

export class InventoryDecayOptimizer {
  constructor({
    decayConstant = 0.005,
    platformFeeRate = 0.05,
    taxRate = 0.025,
    referenceDate = new Date(),
  } = {}) {
    this.decayConstant = decayConstant;
    this.platformFeeRate = platformFeeRate;
    this.taxRate = taxRate;
    this.referenceDate = new Date(referenceDate);
  }

  calculateFloorPrice(cogs) {
    const cost = Math.max(0, Number(cogs) || 0);
    const marginDivisor = 1 - (this.platformFeeRate + this.taxRate);
    return Math.ceil(cost / marginDivisor);
  }

  evaluateProduct(product) {
    const originalPrice = Number(product.price) || 0;
    const cogs = Number(product.cogs || originalPrice * 0.5);
    const stock = Number(product.stock) || 0;
    const receivedDate = new Date(product.receivedDate || this.referenceDate);

    const diffDays = Math.max(
      0,
      Math.floor((this.referenceDate.getTime() - receivedDate.getTime()) / (1000 * 3600 * 24))
    );

    let matchedTier = INVENTORY_AGE_TIERS.find(
      (tier) => diffDays >= tier.minDays && diffDays <= tier.maxDays
    ) || INVENTORY_AGE_TIERS[INVENTORY_AGE_TIERS.length - 1];

    const floorPrice = this.calculateFloorPrice(cogs);

    let suggestedPrice = originalPrice;
    if (matchedTier.code !== "FRESH") {
      const tierDiscountPrice = Math.round(originalPrice * (1 - matchedTier.discountRate));
      suggestedPrice = Math.max(floorPrice, tierDiscountPrice);
    }
    const effectiveDiscountPct = originalPrice > 0
      ? Number((((originalPrice - suggestedPrice) / originalPrice) * 100).toFixed(1))
      : 0;

    const lockedCapital = stock * cogs;
    const projectedRecoveryRevenue = stock * suggestedPrice;

    return {
      productId: product.id,
      productName: product.name,
      stock,
      daysInInventory: diffDays,
      ageTier: matchedTier.code,
      tierLabel: matchedTier.label,
      originalPrice,
      cogs,
      floorPrice,
      suggestedPrice,
      effectiveDiscountPct,
      isAtFloorPrice: suggestedPrice <= floorPrice,
      lockedCapital,
      projectedRecoveryRevenue,
      recommendation: matchedTier.recommendation,
    };
  }

  evaluateCatalog(products = []) {
    const evaluations = products.map((p) => this.evaluateProduct(p));
    let totalStock = 0;
    let totalLockedCapital = 0;
    let totalRecoveryRevenue = 0;
    const tierCounts = { FRESH: 0, MODERATE: 0, SLOW: 0, DEADSTOCK: 0 };

    for (const e of evaluations) {
      totalStock += e.stock;
      totalLockedCapital += e.lockedCapital;
      totalRecoveryRevenue += e.projectedRecoveryRevenue;
      tierCounts[e.ageTier] = (tierCounts[e.ageTier] || 0) + 1;
    }

    const deadstockItems = evaluations.filter((e) => e.ageTier === "SLOW" || e.ageTier === "DEADSTOCK");

    return {
      totalProducts: evaluations.length,
      totalUnitsInStock: totalStock,
      totalLockedCapital,
      projectedRecoveryRevenue: totalRecoveryRevenue,
      tierDistribution: tierCounts,
      deadstockCount: deadstockItems.length,
      deadstockAlert: deadstockItems.length > 0,
      evaluations,
    };
  }
}

// Geohash Spatial Index
const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const GEOHASH_BITS = [16, 8, 4, 2, 1];

export function encodeGeohash(latitude, longitude, precision = 6) {
  let lat = Number(latitude);
  let lon = Number(longitude);

  let isEven = true;
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;
  let bit = 0;
  let ch = 0;
  let geohash = "";

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        ch |= GEOHASH_BITS[bit];
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= GEOHASH_BITS[bit];
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += GEOHASH_BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

export function decodeGeohash(geohash) {
  let isEven = true;
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = GEOHASH_BASE32.indexOf(c);
    if (cd === -1) continue;

    for (let j = 0; j < 5; j++) {
      const mask = GEOHASH_BITS[j];
      if (isEven) {
        const lonMid = (lonMin + lonMax) / 2;
        if ((cd & mask) !== 0) lonMin = lonMid;
        else lonMax = lonMid;
      } else {
        const latMid = (latMin + latMax) / 2;
        if ((cd & mask) !== 0) latMin = latMid;
        else latMax = latMid;
      }
      isEven = !isEven;
    }
  }

  const lat = (latMin + latMax) / 2;
  const lon = (lonMin + lonMax) / 2;
  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    latError: (latMax - latMin) / 2,
    lonError: (lonMax - lonMin) / 2,
  };
}

export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function getGeohashNeighbors(geohash) {
  const decoded = decodeGeohash(geohash);
  const latDelta = decoded.latError * 2;
  const lonDelta = decoded.lonError * 2;
  const prec = geohash.length;

  return {
    center: geohash,
    north: encodeGeohash(decoded.latitude + latDelta, decoded.longitude, prec),
    south: encodeGeohash(decoded.latitude - latDelta, decoded.longitude, prec),
    east: encodeGeohash(decoded.latitude, decoded.longitude + lonDelta, prec),
    west: encodeGeohash(decoded.latitude, decoded.longitude - lonDelta, prec),
    northEast: encodeGeohash(decoded.latitude + latDelta, decoded.longitude + lonDelta, prec),
    northWest: encodeGeohash(decoded.latitude + latDelta, decoded.longitude - lonDelta, prec),
    southEast: encodeGeohash(decoded.latitude - latDelta, decoded.longitude + lonDelta, prec),
    southWest: encodeGeohash(decoded.latitude - latDelta, decoded.longitude - lonDelta, prec),
  };
}

export class GeohashSpatialIndex {
  constructor(defaultPrecision = 6) {
    this.defaultPrecision = defaultPrecision;
    this.buckets = new Map();
    this.items = new Map();
  }

  addLocation(id, latitude, longitude, metadata = {}) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const geohash = encodeGeohash(lat, lon, this.defaultPrecision);

    const record = {
      id: String(id),
      latitude: lat,
      longitude: lon,
      geohash,
      metadata,
    };

    this.items.set(record.id, record);

    if (!this.buckets.has(geohash)) {
      this.buckets.set(geohash, []);
    }
    this.buckets.get(geohash).push(record);

    return geohash;
  }

  findNearby(latitude, longitude, radiusKm = 5.0, limit = 10) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const centerGeohash = encodeGeohash(lat, lon, this.defaultPrecision);

    const neighbors = getGeohashNeighbors(centerGeohash);
    const searchHashes = [
      neighbors.center,
      neighbors.north,
      neighbors.south,
      neighbors.east,
      neighbors.west,
      neighbors.northEast,
      neighbors.northWest,
      neighbors.southEast,
      neighbors.southWest,
    ];

    const candidates = [];
    const seenIds = new Set();

    for (const h of searchHashes) {
      const list = this.buckets.get(h) || [];
      for (const item of list) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const distance = calculateHaversineKm(lat, lon, item.latitude, item.longitude);
          if (distance <= radiusKm) {
            candidates.push({
              ...item,
              distanceKm: distance,
            });
          }
        }
      }
    }

    candidates.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      query: { latitude: lat, longitude: lon, radiusKm, centerGeohash },
      totalFound: candidates.length,
      locations: candidates.slice(0, limit),
    };
  }
}

// Contextual Bandit LinUCB Recommender
export function invertMatrix(A) {
  const n = A.length;
  const M = A.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1;
    return [...row, ...identityRow];
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }

    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
    }

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-9) {
      M[i][i] += 1e-5;
    }

    const currentPivot = M[i][i];
    for (let j = 0; j < 2 * n; j++) {
      M[i][j] /= currentPivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = 0; j < 2 * n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row.slice(n));
}

export function matrixVectorMultiply(A, x) {
  return A.map((row) => row.reduce((sum, val, idx) => sum + val * x[idx], 0));
}

export function dotProduct(x, y) {
  return x.reduce((sum, val, idx) => sum + val * y[idx], 0);
}

export class LinUCBRecommender {
  constructor({ dimension = 4, alpha = 0.5 } = {}) {
    this.d = dimension;
    this.alpha = alpha;
    this.arms = new Map();
  }

  addArm(armId, metadata = {}) {
    const id = String(armId);
    if (!this.arms.has(id)) {
      const A = Array.from({ length: this.d }, (_, i) =>
        Array.from({ length: this.d }, (_, j) => (i === j ? 1.0 : 0.0))
      );
      const b = new Array(this.d).fill(0.0);
      this.arms.set(id, { A, b, metadata, pullCount: 0, rewardSum: 0 });
    }
  }

  extractContextVector(context = {}) {
    const isMobile = context.isMobile !== undefined ? (context.isMobile ? 1.0 : 0.0) : 0.8;
    const hour = context.hourOfDay !== undefined ? Number(context.hourOfDay) : new Date().getHours();
    const isPeakHour = (hour >= 11 && hour <= 13) || (hour >= 19 && hour <= 22) ? 1.0 : 0.2;
    const priceSensitive = context.priceSensitivity !== undefined ? Number(context.priceSensitivity) : 0.5;

    return [1.0, isMobile, isPeakHour, priceSensitive];
  }

  recommend(contextVector, topK = 3) {
    const x = contextVector || new Array(this.d).fill(1.0);
    const scoredArms = [];

    for (const [armId, armData] of this.arms.entries()) {
      const A_inv = invertMatrix(armData.A);
      const thetaHat = matrixVectorMultiply(A_inv, armData.b);
      const expectedPayoff = dotProduct(x, thetaHat);

      const A_inv_x = matrixVectorMultiply(A_inv, x);
      const variance = Math.max(0, dotProduct(x, A_inv_x));
      const confidenceBound = this.alpha * Math.sqrt(variance);

      const ucbScore = expectedPayoff + confidenceBound;

      scoredArms.push({
        armId,
        score: Number(ucbScore.toFixed(4)),
        expectedPayoff: Number(expectedPayoff.toFixed(4)),
        confidenceBound: Number(confidenceBound.toFixed(4)),
        pullCount: armData.pullCount,
        metadata: armData.metadata,
      });
    }

    scoredArms.sort((a, b) => b.score - a.score);
    return scoredArms.slice(0, topK);
  }

  update(armId, contextVector, reward = 1.0) {
    const id = String(armId);
    if (!this.arms.has(id)) {
      this.addArm(id);
    }

    const arm = this.arms.get(id);
    const x = contextVector;
    const r = Number(reward);

    for (let i = 0; i < this.d; i++) {
      for (let j = 0; j < this.d; j++) {
        arm.A[i][j] += x[i] * x[j];
      }
    }

    for (let i = 0; i < this.d; i++) {
      arm.b[i] += r * x[i];
    }

    arm.pullCount++;
    arm.rewardSum += r;
  }
}

// ==========================================
// Phase 14: Enterprise Bidding, Logistics Flow & Image Copyright Suite
// ==========================================

export class PidBiddingController {
  constructor({
    kp = 0.5,
    ki = 0.05,
    kd = 0.1,
    targetRoas = 3.5,
    minBid = 500,
    maxBid = 20000,
    antiWindupLimit = 50
  } = {}) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.targetRoas = targetRoas;
    this.minBid = minBid;
    this.maxBid = maxBid;
    this.antiWindupLimit = antiWindupLimit;

    this.integral = 0;
    this.previousError = 0;
    this.lastTimestamp = null;
  }

  reset() {
    this.integral = 0;
    this.previousError = 0;
    this.lastTimestamp = null;
  }

  computeBidAdjustment(currentRoas, currentBid, dt = 1.0) {
    if (dt <= 0) dt = 1.0;

    const rawError = currentRoas - this.targetRoas;
    const normalizedError = rawError / Math.max(1, this.targetRoas);

    const pTerm = this.kp * normalizedError;

    this.integral += normalizedError * dt;
    if (this.integral > this.antiWindupLimit) this.integral = this.antiWindupLimit;
    if (this.integral < -this.antiWindupLimit) this.integral = -this.antiWindupLimit;
    const iTerm = this.ki * this.integral;

    const derivative = (normalizedError - this.previousError) / dt;
    const dTerm = this.kd * derivative;

    this.previousError = normalizedError;

    const controlEffort = pTerm + iTerm + dTerm;
    const deltaBid = currentBid * controlEffort;
    let proposedBid = Math.round(currentBid + deltaBid);

    const clampedBid = Math.max(this.minBid, Math.min(this.maxBid, proposedBid));

    return {
      currentRoas,
      targetRoas: this.targetRoas,
      error: Number(normalizedError.toFixed(4)),
      pTerm: Number(pTerm.toFixed(4)),
      iTerm: Number(iTerm.toFixed(4)),
      dTerm: Number(dTerm.toFixed(4)),
      controlEffort: Number(controlEffort.toFixed(4)),
      currentBid,
      proposedBid: clampedBid,
      isClamped: clampedBid !== proposedBid,
      action: clampedBid > currentBid ? 'INCREASE' : clampedBid < currentBid ? 'DECREASE' : 'HOLD'
    };
  }

  computeBudgetPacingAdjustment(dailyBudget, spentBudget, currentHour, currentBid) {
    if (dailyBudget <= 0) {
      return { action: 'PAUSE', proposedBid: 0, reason: 'Ngân sách không hợp lệ' };
    }

    if (spentBudget >= dailyBudget) {
      return { action: 'PAUSE', proposedBid: 0, reason: 'Đã cạn kiệt ngân sách ngày' };
    }

    const timeFraction = Math.max(0.01, Math.min(1.0, (currentHour + 1) / 24));
    const expectedSpend = dailyBudget * timeFraction;
    const spendPacingRatio = spentBudget / expectedSpend;

    let multiplier = 1.0;
    let pacingStatus = 'ON_TRACK';

    if (spendPacingRatio > 1.25) {
      multiplier = Math.max(0.7, 1 - (spendPacingRatio - 1) * 0.5);
      pacingStatus = 'SPENDING_TOO_FAST';
    } else if (spendPacingRatio < 0.75) {
      multiplier = Math.min(1.4, 1 + (1 - spendPacingRatio) * 0.4);
      pacingStatus = 'SPENDING_TOO_SLOW';
    }

    const proposedBid = Math.max(this.minBid, Math.min(this.maxBid, Math.round(currentBid * multiplier)));

    return {
      dailyBudget,
      spentBudget,
      currentHour,
      timeFraction: Number(timeFraction.toFixed(2)),
      expectedSpend: Math.round(expectedSpend),
      spendPacingRatio: Number(spendPacingRatio.toFixed(3)),
      pacingStatus,
      currentBid,
      proposedBid,
      multiplier: Number(multiplier.toFixed(3))
    };
  }
}

export class EdmondsKarpMaxFlow {
  constructor() {
    this.nodes = new Map();
    this.capacities = new Map();
    this.adjList = new Map();
  }

  addNode(id, label = id, type = 'hub') {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, label, type });
      this.capacities.set(id, new Map());
      this.adjList.set(id, new Set());
    }
    return this;
  }

  addEdge(from, to, capacity) {
    if (capacity <= 0) return this;

    this.addNode(from);
    this.addNode(to);

    const currentCap = this.capacities.get(from).get(to) || 0;
    this.capacities.get(from).set(to, currentCap + capacity);

    this.adjList.get(from).add(to);
    this.adjList.get(to).add(from);

    if (!this.capacities.get(to).has(from)) {
      this.capacities.get(to).set(from, 0);
    }

    return this;
  }

  _bfsAugmentingPath(source, sink, residual) {
    const parent = new Map();
    const visited = new Set();
    const queue = [source];
    visited.add(source);

    while (queue.length > 0) {
      const u = queue.shift();
      if (u === sink) break;

      const neighbors = this.adjList.get(u) || new Set();
      for (const v of neighbors) {
        const resCap = (residual.get(u) && residual.get(u).get(v)) || 0;
        if (!visited.has(v) && resCap > 0) {
          visited.add(v);
          parent.set(v, u);
          queue.push(v);
        }
      }
    }

    if (!visited.has(sink)) {
      return null;
    }

    const path = [];
    let curr = sink;
    let bottleneck = Infinity;

    while (curr !== source) {
      const prev = parent.get(curr);
      const cap = residual.get(prev).get(curr);
      bottleneck = Math.min(bottleneck, cap);
      path.unshift({ from: prev, to: curr });
      curr = prev;
    }

    return { path, bottleneck };
  }

  computeMaxFlow(source, sink) {
    if (!this.nodes.has(source) || !this.nodes.has(sink)) {
      throw new Error(`Điểm nguồn (${source}) hoặc điểm đích (${sink}) không tồn tại trong mạng lưới.`);
    }

    const residual = new Map();
    for (const [u, map] of this.capacities.entries()) {
      residual.set(u, new Map(map));
    }

    const flows = new Map();
    for (const [u, map] of this.capacities.entries()) {
      flows.set(u, new Map());
      for (const [v, cap] of map.entries()) {
        if (cap > 0) flows.get(u).set(v, 0);
      }
    }

    let maxFlow = 0;
    const augmentedPaths = [];

    while (true) {
      const result = this._bfsAugmentingPath(source, sink, residual);
      if (!result) break;

      const { path, bottleneck } = result;
      maxFlow += bottleneck;
      augmentedPaths.push({ path, flowAdded: bottleneck });

      for (const edge of path) {
        const { from, to } = edge;
        const forwardCap = residual.get(from).get(to);
        residual.get(from).set(to, forwardCap - bottleneck);

        const backwardCap = residual.get(to).get(from) || 0;
        residual.get(to).set(from, backwardCap + bottleneck);

        if (this.capacities.get(from) && this.capacities.get(from).get(to) > 0) {
          flows.get(from).set(to, (flows.get(from).get(to) || 0) + bottleneck);
        } else {
          flows.get(to).set(from, (flows.get(to).get(from) || 0) - bottleneck);
        }
      }
    }

    const edgeDetails = [];
    for (const [from, map] of this.capacities.entries()) {
      for (const [to, originalCap] of map.entries()) {
        if (originalCap > 0) {
          const usedFlow = Math.max(0, flows.get(from).get(to) || 0);
          const utilizationRate = originalCap > 0 ? Number((usedFlow / originalCap).toFixed(3)) : 0;
          edgeDetails.push({
            from,
            to,
            capacity: originalCap,
            flow: usedFlow,
            utilizationRate,
            isSaturated: usedFlow === originalCap
          });
        }
      }
    }

    return {
      source,
      sink,
      maxFlow,
      totalPathsFound: augmentedPaths.length,
      edgeDetails,
      residual
    };
  }

  findBottlenecks(source, sink) {
    const flowResult = this.computeMaxFlow(source, sink);
    const { residual, maxFlow } = flowResult;

    const reachable = new Set();
    const queue = [source];
    reachable.add(source);

    while (queue.length > 0) {
      const u = queue.shift();
      const neighbors = this.adjList.get(u) || new Set();
      for (const v of neighbors) {
        const resCap = (residual.get(u) && residual.get(u).get(v)) || 0;
        if (!reachable.has(v) && resCap > 0) {
          reachable.add(v);
          queue.push(v);
        }
      }
    }

    const bottlenecks = [];
    let cutCapacity = 0;

    for (const u of reachable) {
      const capMap = this.capacities.get(u) || new Map();
      for (const [v, originalCap] of capMap.entries()) {
        if (originalCap > 0 && !reachable.has(v)) {
          bottlenecks.push({
            from: u,
            fromLabel: (this.nodes.get(u) && this.nodes.get(u).label) || u,
            to: v,
            toLabel: (this.nodes.get(v) && this.nodes.get(v).label) || v,
            capacity: originalCap,
            recommendation: `Tăng công suất xe tải/bưu tá thêm tối thiểu 30-50% cho tuyến ${u} -> ${v} để giải phóng nút thắt.`
          });
          cutCapacity += originalCap;
        }
      }
    }

    return {
      source,
      sink,
      maxFlow,
      cutCapacity,
      isMinCutVerified: maxFlow === cutCapacity,
      bottleneckCount: bottlenecks.length,
      bottlenecks
    };
  }
}

export class PerceptualImageHash {
  static popcount32(n) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return (((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }

  static hammingDistance(hashA, hashB) {
    if (!hashA || !hashB || typeof hashA !== 'string' || typeof hashB !== 'string') {
      return 64;
    }

    const cleanA = hashA.trim().toLowerCase().padStart(16, '0').slice(-16);
    const cleanB = hashB.trim().toLowerCase().padStart(16, '0').slice(-16);

    const highA = parseInt(cleanA.slice(0, 8), 16) || 0;
    const lowA = parseInt(cleanA.slice(8, 16), 16) || 0;

    const highB = parseInt(cleanB.slice(0, 8), 16) || 0;
    const lowB = parseInt(cleanB.slice(8, 16), 16) || 0;

    const xorHigh = (highA ^ highB) >>> 0;
    const xorLow = (lowA ^ lowB) >>> 0;

    return this.popcount32(xorHigh) + this.popcount32(xorLow);
  }

  static computeSimilarity(hashA, hashB) {
    const dist = this.hammingDistance(hashA, hashB);
    return Number(Math.max(0, (64 - dist) / 64).toFixed(4));
  }

  static computeDHash(input) {
    if (typeof input === 'string') {
      return this._generateHashFromString(input);
    }

    let bits = '';
    if (Array.isArray(input)) {
      if (Array.isArray(input[0]) && input.length >= 8 && input[0].length >= 9) {
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const left = input[row][col];
            const right = input[row][col + 1];
            bits += left < right ? '1' : '0';
          }
        }
      } else {
        for (let i = 0; i < 64; i++) {
          const val = input[i] || 0;
          const nextVal = input[i + 1] || 0;
          bits += val < nextVal ? '1' : '0';
        }
      }
    }

    if (bits.length < 64) {
      bits = bits.padEnd(64, '0');
    }

    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = parseInt(bits.substring(i, i + 4), 2);
      hex += nibble.toString(16);
    }

    return hex.padStart(16, '0');
  }

  static _generateHashFromString(str) {
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)) >>> 0;
    return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 16);
  }
}

export class ImageHashIndex {
  constructor() {
    this.images = new Map();
  }

  registerImage({ imageId, productId, shopId, isMall = false, hashHex }) {
    if (!imageId || !hashHex) return;
    this.images.set(imageId, {
      imageId,
      productId,
      shopId,
      isMall,
      hashHex: hashHex.trim().toLowerCase()
    });
  }

  findMatches(queryHashHex, maxHammingDistance = 5) {
    const matches = [];

    for (const record of this.images.values()) {
      const dist = PerceptualImageHash.hammingDistance(queryHashHex, record.hashHex);
      if (dist <= maxHammingDistance) {
        const similarity = PerceptualImageHash.computeSimilarity(queryHashHex, record.hashHex);
        let matchType = 'DISTINCT';
        if (dist === 0) matchType = 'EXACT_DUPLICATE';
        else if (dist <= 3) matchType = 'NEAR_DUPLICATE_WATERMARKED';
        else if (dist <= maxHammingDistance) matchType = 'HIGHLY_SIMILAR';

        matches.push({
          ...record,
          hammingDistance: dist,
          similarity,
          matchType
        });
      }
    }

    return matches.sort((a, b) => a.hammingDistance - b.hammingDistance);
  }

  auditCopyrightInfringement(candidate) {
    const { shopId, productId, hashHex } = candidate;
    const matches = this.findMatches(hashHex, 5);

    const mallViolations = matches.filter(m => m.shopId !== shopId && m.isMall);
    const regularViolations = matches.filter(m => m.shopId !== shopId && !m.isMall);

    const isInfringing = mallViolations.length > 0 || regularViolations.length > 0;
    const highestRiskMatch = mallViolations[0] || regularViolations[0] || null;

    let actionRequired = 'ALLOW';
    let riskLevel = 'LOW';

    if (mallViolations.length > 0) {
      actionRequired = 'FLAG_FOR_TAKEDOWN';
      riskLevel = 'CRITICAL';
    } else if (regularViolations.length > 0) {
      actionRequired = 'WARN_DUPLICATE_CATALOG';
      riskLevel = 'MEDIUM';
    }

    return {
      shopId,
      productId,
      hashHex,
      isInfringing,
      riskLevel,
      actionRequired,
      mallViolationsCount: mallViolations.length,
      regularViolationsCount: regularViolations.length,
      highestRiskMatch
    };
  }
}

// ==========================================
// Phase 15: Price Elasticity, Hopcroft-Karp Matching & LSM-Tree Suite
// ==========================================

export class PriceElasticitySimulator {
  static calculateElasticity(p1, q1, p2, q2) {
    if (p1 <= 0 || p2 <= 0 || q1 < 0 || q2 < 0) {
      throw new Error("Giá và sản lượng phải là số dương hợp lệ.");
    }

    if (p1 === p2) {
      return { elasticity: 0, type: "PERFECTLY_INELASTIC", description: "Giá không đổi" };
    }

    const deltaQ = q2 - q1;
    const avgQ = (q1 + q2) / 2;
    const pctChangeQ = avgQ > 0 ? deltaQ / avgQ : 0;

    const deltaP = p2 - p1;
    const avgP = (p1 + p2) / 2;
    const pctChangeP = deltaP / avgP;

    const elasticity = Number((pctChangeQ / pctChangeP).toFixed(3));
    const absElasticity = Math.abs(elasticity);

    let type = "UNITARY";
    let advice = "";

    if (absElasticity > 1.2) {
      type = "ELASTIC";
      advice = "Nhu cầu rất nhạy cảm với giá. Giảm giá trong Flash Sale sẽ kích thích sức mua mạnh và làm tăng tổng doanh số.";
    } else if (absElasticity < 0.8) {
      type = "INELASTIC";
      advice = "Nhu cầu ít co giãn theo giá (khách hàng có lòng trung thành cao hoặc sản phẩm độc quyền). Không nên giảm giá sâu vì sẽ bào mòn lợi nhuận.";
    } else {
      type = "UNITARY";
      advice = "Độ co giãn xấp xỉ đơn vị (|ε| ≈ 1.0). Đây là điểm cân bằng hoàn hảo, tối đa hóa tổng doanh thu!";
    }

    return {
      p1,
      q1,
      p2,
      q2,
      pctChangeP: Number((pctChangeP * 100).toFixed(2)),
      pctChangeQ: Number((pctChangeQ * 100).toFixed(2)),
      elasticity,
      absElasticity,
      type,
      advice
    };
  }

  static simulateDiscounts({
    basePrice,
    baseVolume,
    cogs = 0,
    assumedElasticity = -1.6,
    discountRates = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]
  }) {
    if (basePrice <= 0 || baseVolume <= 0) {
      throw new Error("Giá gốc và sản lượng cơ sở phải lớn hơn 0.");
    }

    const scenarios = [];
    let bestScenario = null;
    let maxGrossProfit = -Infinity;

    for (const rate of discountRates) {
      const discountedPrice = Math.round(basePrice * (1 - rate));
      const pctChangeQ = assumedElasticity * (-rate);
      const projectedVolume = Math.round(baseVolume * (1 + pctChangeQ));
      
      const projectedRevenue = discountedPrice * projectedVolume;
      const totalCogs = cogs * projectedVolume;
      const platformFee = Math.round(projectedRevenue * 0.05);
      const grossProfit = projectedRevenue - totalCogs - platformFee;

      const scenario = {
        discountRate: rate,
        discountPercent: `${Math.round(rate * 100)}%`,
        price: discountedPrice,
        volume: projectedVolume,
        projectedRevenue,
        projectedGrossProfit: grossProfit,
        profitMargin: Number(((grossProfit / projectedRevenue) * 100).toFixed(1))
      };

      scenarios.push(scenario);

      if (grossProfit > maxGrossProfit) {
        maxGrossProfit = grossProfit;
        bestScenario = scenario;
      }
    }

    return {
      basePrice,
      baseVolume,
      cogs,
      assumedElasticity,
      scenarios,
      optimalScenario: bestScenario,
      recommendation: `Mức chiết khấu ${bestScenario.discountPercent} mang lại lợi nhuận gộp cao nhất (${bestScenario.projectedGrossProfit.toLocaleString('vi-VN')}₫) với sản lượng dự kiến ${bestScenario.volume} đơn hàng.`
    };
  }
}

export class HopcroftKarpMatching {
  constructor() {
    this.shippers = new Set();
    this.orders = new Set();
    this.adj = new Map();
    this.pairU = new Map();
    this.pairV = new Map();
    this.dist = new Map();
  }

  addShipper(shipperId) {
    if (!this.shippers.has(shipperId)) {
      this.shippers.add(shipperId);
      this.adj.set(shipperId, []);
      this.pairU.set(shipperId, null);
    }
    return this;
  }

  addOrder(orderId) {
    if (!this.orders.has(orderId)) {
      this.orders.add(orderId);
      this.pairV.set(orderId, null);
    }
    return this;
  }

  addEdge(shipperId, orderId) {
    this.addShipper(shipperId);
    this.addOrder(orderId);
    this.adj.get(shipperId).push(orderId);
    return this;
  }

  _bfs() {
    const queue = [];
    for (const u of this.shippers) {
      if (this.pairU.get(u) === null) {
        this.dist.set(u, 0);
        queue.push(u);
      } else {
        this.dist.set(u, Infinity);
      }
    }

    this.dist.set(null, Infinity);

    while (queue.length > 0) {
      const u = queue.shift();
      if (this.dist.get(u) < this.dist.get(null)) {
        const neighbors = this.adj.get(u) || [];
        for (const v of neighbors) {
          const nextU = this.pairV.get(v);
          if (this.dist.get(nextU) === Infinity) {
            this.dist.set(nextU, this.dist.get(u) + 1);
            queue.push(nextU);
          }
        }
      }
    }

    return this.dist.get(null) !== Infinity;
  }

  _dfs(u) {
    if (u !== null) {
      const neighbors = this.adj.get(u) || [];
      for (const v of neighbors) {
        const nextU = this.pairV.get(v);
        if (this.dist.get(nextU) === this.dist.get(u) + 1) {
          if (this._dfs(nextU)) {
            this.pairV.set(v, u);
            this.pairU.set(u, v);
            return true;
          }
        }
      }
      this.dist.set(u, Infinity);
      return false;
    }
    return true;
  }

  computeMaxMatching() {
    for (const u of this.shippers) this.pairU.set(u, null);
    for (const v of this.orders) this.pairV.set(v, null);

    let matchingSize = 0;

    while (this._bfs()) {
      for (const u of this.shippers) {
        if (this.pairU.get(u) === null) {
          if (this._dfs(u)) {
            matchingSize++;
          }
        }
      }
    }

    const assignments = [];
    for (const [u, v] of this.pairU.entries()) {
      if (v !== null) {
        assignments.push({ shipperId: u, orderId: v });
      }
    }

    const unassignedOrders = [];
    for (const [v, u] of this.pairV.entries()) {
      if (u === null) {
        unassignedOrders.push(v);
      }
    }

    const totalOrders = this.orders.size;
    const fulfillmentRate = totalOrders > 0 ? Number(((matchingSize / totalOrders) * 100).toFixed(1)) : 100;

    return {
      matchingSize,
      totalShippers: this.shippers.size,
      totalOrders,
      fulfillmentRate,
      assignments,
      unassignedOrders
    };
  }
}

export class LSMTreeClickstream {
  constructor({ maxMemTableSize = 100, bloomFilterBits = 1024 } = {}) {
    this.maxMemTableSize = maxMemTableSize;
    this.bloomFilterBits = bloomFilterBits;
    this.memTable = new Map();
    this.sstables = [];
    this.sstableCounter = 0;
  }

  _hashKey(key, seed = 0) {
    let hash = seed;
    for (let i = 0; i < key.length; i++) {
      hash = (Math.imul(31, hash) + key.charCodeAt(i)) >>> 0;
    }
    return hash % this.bloomFilterBits;
  }

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

  get(key) {
    if (!key) return null;

    if (this.memTable.has(key)) {
      const entry = this.memTable.get(key);
      if (entry.isDeleted) return null;
      return entry.value;
    }

    for (let i = this.sstables.length - 1; i >= 0; i--) {
      const sstable = this.sstables[i];

      if (key < sstable.minKey || key > sstable.maxKey) {
        continue;
      }

      if (!sstable.bloomFilter.mayContain(key)) {
        continue;
      }

      const record = this._binarySearchRecord(sstable.records, key);
      if (record) {
        if (record.isDeleted) return null;
        return record.value;
      }
    }

    return null;
  }

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

  flushMemTable() {
    if (this.memTable.size === 0) return null;

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

  compact() {
    if (this.sstables.length <= 1) {
      return { compactedCount: this.sstables.length, totalRecords: this.sstables[0]?.records.length || 0 };
    }

    const mergedMap = new Map();

    for (const sstable of this.sstables) {
      for (const record of sstable.records) {
        const existing = mergedMap.get(record.key);
        if (!existing || record.timestamp >= existing.timestamp) {
          mergedMap.set(record.key, record);
        }
      }
    }

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

// ==========================================
// Phase 16: DTW Cycles, K-Means Clustering & Reservoir Sampling Suite
// ==========================================

export class DynamicTimeWarping {
  static computeDistance(seriesA, seriesB, distFn = (x, y) => Math.abs(x - y)) {
    if (!Array.isArray(seriesA) || !Array.isArray(seriesB) || seriesA.length === 0 || seriesB.length === 0) {
      throw new Error("Chuỗi dữ liệu phải là mảng không rỗng.");
    }

    const n = seriesA.length;
    const m = seriesB.length;

    const dtw = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = distFn(seriesA[i - 1], seriesB[j - 1]);
        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j],
          dtw[i][j - 1],
          dtw[i - 1][j - 1]
        );
      }
    }

    const totalDistance = Number(dtw[n][m].toFixed(4));
    const normalizedDistance = Number((totalDistance / (n + m)).toFixed(4));

    const path = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
      path.unshift({ aIndex: i - 1, bIndex: j - 1 });
      if (i === 0) {
        j--;
      } else if (j === 0) {
        i--;
      } else {
        const minVal = Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
        if (minVal === dtw[i - 1][j - 1]) {
          i--;
          j--;
        } else if (minVal === dtw[i - 1][j]) {
          i--;
        } else {
          j--;
        }
      }
    }

    return {
      distance: totalDistance,
      normalizedDistance,
      pathLength: path.length,
      path
    };
  }

  static classifyPurchasingPattern(intervalsDays) {
    if (!intervalsDays || intervalsDays.length === 0) {
      return { pattern: "NEW_CUSTOMER", riskScore: 0, recommendation: "Khách hàng mới, cần tặng voucher tân thủ 15%." };
    }

    const templates = {
      LOYAL_ROUTINE: [5, 7, 6, 7, 5, 6],
      CHURNING_RISK: [7, 10, 18, 28, 45, 60],
      FLASH_SALE_HUNTER: [30, 1, 1, 29, 1, 30]
    };

    let bestPattern = "UNKNOWN";
    let minNormalizedDist = Infinity;

    for (const [name, template] of Object.entries(templates)) {
      const { normalizedDistance } = this.computeDistance(intervalsDays, template);
      if (normalizedDistance < minNormalizedDist) {
        minNormalizedDist = normalizedDistance;
        bestPattern = name;
      }
    }

    let riskLevel = "LOW";
    let recommendation = "";

    if (bestPattern === "CHURNING_RISK") {
      riskLevel = "HIGH";
      recommendation = "Cảnh báo: Chu kỳ mua sắm thưa dần! Kích hoạt ngay voucher giảm 30k để tái thu hút.";
    } else if (bestPattern === "LOYAL_ROUTINE") {
      riskLevel = "LOW";
      recommendation = "Khách hàng VIP mua sắm đều đặn. Thưởng Mini Xu x2 và cấp quyền Freeship không giới hạn.";
    } else {
      riskLevel = "MEDIUM";
      recommendation = "Khách hàng săn sale. Gửi thông báo nhắc hẹn trước 2 giờ khi chiến dịch Flash Sale mở màn.";
    }

    return {
      intervalsDays,
      detectedPattern: bestPattern,
      similarityScore: Number(Math.max(0, 100 - minNormalizedDist * 10).toFixed(1)),
      riskLevel,
      recommendation
    };
  }
}

export class HierarchicalKMeans {
  static computeSilhouetteScore(data, clusterAssignments, k) {
    const n = data.length;
    if (n <= k || k <= 1) return 0;

    const clusters = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) {
      clusters[clusterAssignments[i]].push({ val: data[i], idx: i });
    }

    let totalScore = 0;

    for (let i = 0; i < n; i++) {
      const myClusterIdx = clusterAssignments[i];
      const myCluster = clusters[myClusterIdx];
      const val = data[i];

      let a = 0;
      if (myCluster.length > 1) {
        let distSum = 0;
        for (const other of myCluster) {
          if (other.idx !== i) {
            distSum += Math.abs(val - other.val);
          }
        }
        a = distSum / (myCluster.length - 1);
      }

      let b = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === myClusterIdx || clusters[c].length === 0) continue;
        let otherClusterDistSum = 0;
        for (const other of clusters[c]) {
          otherClusterDistSum += Math.abs(val - other.val);
        }
        const avgDist = otherClusterDistSum / clusters[c].length;
        if (avgDist < b) {
          b = avgDist;
        }
      }

      const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
      totalScore += s;
    }

    return Number((totalScore / n).toFixed(4));
  }

  static initKMeansPlusPlus(values, k) {
    if (!values || values.length === 0) return [];
    const n = values.length;
    k = Math.min(k, n);
    const sortedVals = [...values].sort((a, b) => a - b);
    const centroids = [];
    const step = Math.floor(n / k);
    for (let i = 0; i < k; i++) {
      centroids.push(sortedVals[Math.min(n - 1, Math.floor(i * step + step / 2))]);
    }
    return centroids;
  }

  static cluster(values, k, maxIterations = 50) {
    if (!values || values.length === 0) throw new Error("Mảng dữ liệu không được rỗng.");
    const n = values.length;
    k = Math.min(k, n);

    if (k === 1) {
      return {
        k: 1,
        centroids: [values.reduce((s, v) => s + v, 0) / n],
        assignments: Array(n).fill(0),
        silhouetteScore: 0,
        iterations: 1
      };
    }

    let centroids = this.initKMeansPlusPlus(values, k);

    let assignments = new Array(n).fill(0);
    let iterations = 0;
    let converged = false;

    while (iterations < maxIterations && !converged) {
      iterations++;
      let changed = false;

      for (let i = 0; i < n; i++) {
        const val = values[i];
        let minDist = Infinity;
        let bestCluster = 0;

        for (let c = 0; c < k; c++) {
          const dist = Math.abs(val - centroids[c]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = c;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      const newCentroids = new Array(k).fill(0);
      const counts = new Array(k).fill(0);

      for (let i = 0; i < n; i++) {
        newCentroids[assignments[i]] += values[i];
        counts[assignments[i]]++;
      }

      for (let c = 0; c < k; c++) {
        if (counts[c] > 0) {
          newCentroids[c] = Number((newCentroids[c] / counts[c]).toFixed(2));
        } else {
          newCentroids[c] = centroids[c];
        }
      }

      let maxShift = 0;
      for (let c = 0; c < k; c++) {
        maxShift = Math.max(maxShift, Math.abs(centroids[c] - newCentroids[c]));
      }

      centroids = newCentroids;
      if (!changed || maxShift < 0.01) {
        converged = true;
      }
    }

    const silhouetteScore = this.computeSilhouetteScore(values, assignments, k);

    return {
      k,
      centroids,
      assignments,
      iterations,
      silhouetteScore
    };
  }

  static autoClusterPriceTiers(products, kRange = [2, 3, 4]) {
    if (!products || products.length === 0) {
      return { optimalK: 0, clusters: [], bestSilhouette: 0, priceTiers: [] };
    }

    if (products.length === 1) {
      return {
        optimalK: 1,
        bestSilhouette: 1.0,
        iterations: 1,
        priceTiers: [{
          tierRank: 1,
          tierCode: "BUDGET",
          label: "TIẾT KIỆM (BUDGET)",
          centroidPrice: Math.round(Number(products[0].price || 0)),
          productCount: 1,
          products: [products[0]]
        }]
      };
    }

    const prices = products.map(p => Number(p.price || 0));
    let bestResult = null;
    let maxSilhouette = -Infinity;

    for (const k of kRange) {
      if (k > prices.length) continue;
      const res = this.cluster(prices, k);
      if (res.silhouetteScore > maxSilhouette) {
        maxSilhouette = res.silhouetteScore;
        bestResult = res;
      }
    }

    if (!bestResult) {
      bestResult = this.cluster(prices, Math.min(3, prices.length));
    }

    const sortedCentroidIndices = bestResult.centroids
      .map((c, idx) => ({ c, idx }))
      .sort((a, b) => a.c - b.c)
      .map(item => item.idx);

    const labels = ["TIẾT KIỆM (BUDGET)", "PHỔ THÔNG (MID-RANGE)", "CAO CẤP (PREMIUM MALL)", "SIÊU SANG (ULTRA LUXURY)"];

    const clusterGroups = [];
    for (let rank = 0; rank < sortedCentroidIndices.length; rank++) {
      const origClusterIdx = sortedCentroidIndices[rank];
      const groupProducts = [];

      for (let i = 0; i < products.length; i++) {
        if (bestResult.assignments[i] === origClusterIdx) {
          groupProducts.push(products[i]);
        }
      }

      clusterGroups.push({
        tierRank: rank + 1,
        tierCode: rank === 0 ? "BUDGET" : rank === 1 ? "MID_RANGE" : "PREMIUM",
        label: labels[rank] || `TẦNG GIÁ ${rank + 1}`,
        centroidPrice: Math.round(bestResult.centroids[origClusterIdx]),
        productCount: groupProducts.length,
        products: groupProducts
      });
    }

    return {
      optimalK: bestResult.k,
      bestSilhouette: bestResult.silhouetteScore,
      iterations: bestResult.iterations,
      priceTiers: clusterGroups
    };
  }
}

export class ReservoirSampling {
  constructor(capacity = 100, randomFn = Math.random) {
    if (capacity <= 0) throw new Error("Dung lượng hồ chứa phải lớn hơn 0.");
    this.capacity = capacity;
    this.randomFn = randomFn;
    this.reservoir = [];
    this.totalStreamCount = 0;
  }

  add(item) {
    this.totalStreamCount++;

    if (this.reservoir.length < this.capacity) {
      this.reservoir.push(item);
      return true;
    }

    const j = Math.floor(this.randomFn() * this.totalStreamCount);
    if (j < this.capacity) {
      this.reservoir[j] = item;
      return true;
    }

    return false;
  }

  addBatch(items) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.add(item);
    }
  }

  getSample() {
    return [...this.reservoir];
  }

  computeSampleStats(valueExtractor = (item) => Number(item.total || item.amount || item)) {
    const sampleSize = this.reservoir.length;
    if (sampleSize === 0) {
      return {
        sampleSize: 0,
        totalStreamCount: this.totalStreamCount,
        samplingRate: 0,
        mean: 0,
        min: 0,
        max: 0,
        stdDev: 0
      };
    }

    const values = this.reservoir.map(valueExtractor).filter(v => !isNaN(v));
    const count = values.length;
    if (count === 0) {
      return { sampleSize, totalStreamCount: this.totalStreamCount, mean: 0 };
    }

    const sum = values.reduce((s, v) => s + v, 0);
    const mean = Number((sum / count).toFixed(2));
    const min = Math.min(...values);
    const max = Math.max(...values);

    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));
    const samplingRate = Number(((sampleSize / this.totalStreamCount) * 100).toFixed(2));

    return {
      sampleSize,
      totalStreamCount: this.totalStreamCount,
      samplingRate: `${samplingRate}%`,
      mean,
      min,
      max,
      stdDev
    };
  }

  reset() {
    this.reservoir = [];
    this.totalStreamCount = 0;
  }
}

// ==========================================
// Phase 17: SimHash Review Spam, Aho-Corasick Moderator & Bellman-Ford Arbitrage Suite
// ==========================================

export class SimHashReviewSpam {
  static hash64(str) {
    let h1 = 0x811c9dc5;
    let h2 = 0x811c9dc5 ^ 0x5bd1e995;

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);

      h2 ^= (code * 31 + (code >> 2));
      h2 = Math.imul(h2, 0x01000193);
    }

    const bits = new Array(64).fill(0);
    for (let i = 0; i < 32; i++) {
      bits[i] = (h1 >>> (31 - i)) & 1;
      bits[i + 32] = (h2 >>> (31 - i)) & 1;
    }
    return bits;
  }

  static computeSimHash(text) {
    if (!text || typeof text !== "string") return "0".repeat(64);

    const tokens = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (tokens.length === 0) return "0".repeat(64);

    const tokenFreq = new Map();
    for (const token of tokens) {
      tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
    }

    const v = new Array(64).fill(0);
    for (const [token, weight] of tokenFreq.entries()) {
      const tokenBits = this.hash64(token);
      for (let i = 0; i < 64; i++) {
        if (tokenBits[i] === 1) v[i] += weight;
        else v[i] -= weight;
      }
    }

    let fingerprint = "";
    for (let i = 0; i < 64; i++) {
      fingerprint += v[i] > 0 ? "1" : "0";
    }
    return fingerprint;
  }

  static hammingDistance(hashA, hashB) {
    if (!hashA || !hashB || hashA.length !== 64 || hashB.length !== 64) {
      throw new Error("Mã SimHash phải là chuỗi nhị phân 64 bit.");
    }
    let diff = 0;
    for (let i = 0; i < 64; i++) {
      if (hashA[i] !== hashB[i]) diff++;
    }
    return diff;
  }

  static compareReviews(textA, textB, threshold = 3) {
    const hashA = this.computeSimHash(textA);
    const hashB = this.computeSimHash(textB);
    const distance = this.hammingDistance(hashA, hashB);
    return {
      distance,
      isDuplicate: distance <= threshold,
      similarityScore: Number((((64 - distance) / 64) * 100).toFixed(1)),
      hashA,
      hashB
    };
  }

  constructor(threshold = 3) {
    this.threshold = threshold;
    this.indexedReviews = new Map();
  }

  addAndCheckReview(review) {
    if (!review || !review.id || !review.text) {
      throw new Error("Review phải có đầy đủ id và text.");
    }
    const hash = SimHashReviewSpam.computeSimHash(review.text);
    const duplicates = [];

    for (const [existingId, item] of this.indexedReviews.entries()) {
      const dist = SimHashReviewSpam.hammingDistance(hash, item.hash);
      if (dist <= this.threshold) {
        duplicates.push({
          existingReviewId: existingId,
          authorId: item.authorId,
          productId: item.productId,
          distance: dist,
          similarityScore: Number((((64 - dist) / 64) * 100).toFixed(1))
        });
      }
    }

    const isSpam = duplicates.length > 0;
    this.indexedReviews.set(review.id, { ...review, hash });

    return {
      reviewId: review.id,
      hash,
      isSpam,
      duplicateCount: duplicates.length,
      duplicates,
      recommendation: isSpam
        ? "CẢNH BÁO SPAM SEEDING: Phát hiện nội dung đánh giá trùng lặp cao với đánh giá trước đó. Tạm hoãn thưởng Mini Xu và gắn cờ kiểm duyệt!"
        : "Đánh giá tự nhiên, hợp lệ."
    };
  }
}

export class AhoCorasickNode {
  constructor(char = "") {
    this.char = char;
    this.children = new Map();
    this.fail = null;
    this.outputs = [];
  }
}

export class AhoCorasickModerator {
  constructor(patterns = []) {
    this.root = new AhoCorasickNode();
    this.totalPatterns = 0;
    if (Array.isArray(patterns) && patterns.length > 0) {
      this.buildAutomaton(patterns);
    }
  }

  buildAutomaton(patterns) {
    this.root = new AhoCorasickNode();
    this.totalPatterns = patterns.length;

    for (const item of patterns) {
      const patternText = (typeof item === "string" ? item : item.pattern || "").toLowerCase().trim();
      if (!patternText) continue;

      const meta = typeof item === "string"
        ? { pattern: patternText, category: "GENERAL_SENSITIVE", severity: "MEDIUM" }
        : {
            pattern: patternText,
            category: item.category || "GENERAL_SENSITIVE",
            severity: item.severity || "MEDIUM"
          };

      let curr = this.root;
      for (const char of patternText) {
        if (!curr.children.has(char)) {
          curr.children.set(char, new AhoCorasickNode(char));
        }
        curr = curr.children.get(char);
      }
      curr.outputs.push(meta);
    }

    const queue = [];
    for (const child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const curr = queue.shift();
      for (const [char, child] of curr.children.entries()) {
        let failureNode = curr.fail;
        while (failureNode !== null && !failureNode.children.has(char)) {
          failureNode = failureNode.fail;
        }
        child.fail = failureNode ? failureNode.children.get(char) : this.root;
        if (child.fail.outputs.length > 0) {
          child.outputs = [...child.outputs, ...child.fail.outputs];
        }
        queue.push(child);
      }
    }
  }

  scan(text) {
    if (!text || typeof text !== "string") {
      return { isClean: true, matchCount: 0, matches: [], categoriesFound: [] };
    }

    const lowerText = text.toLowerCase();
    let curr = this.root;
    const matches = [];

    for (let i = 0; i < lowerText.length; i++) {
      const char = lowerText[i];
      while (curr !== this.root && !curr.children.has(char)) {
        curr = curr.fail;
      }
      curr = curr.children.has(char) ? curr.children.get(char) : this.root;

      if (curr.outputs.length > 0) {
        for (const out of curr.outputs) {
          const startIndex = i - out.pattern.length + 1;
          matches.push({
            pattern: out.pattern,
            category: out.category,
            severity: out.severity,
            startIndex,
            endIndex: i
          });
        }
      }
    }

    const categoriesFound = Array.from(new Set(matches.map(m => m.category)));
    const hasHighSeverity = matches.some(m => m.severity === "HIGH");

    return {
      isClean: matches.length === 0,
      matchCount: matches.length,
      hasHighSeverity,
      matches,
      categoriesFound
    };
  }

  maskText(text, maskChar = "*") {
    if (!text || typeof text !== "string") return text;
    const { matches } = this.scan(text);
    if (matches.length === 0) return text;

    const chars = text.split("");
    for (const m of matches) {
      for (let i = m.startIndex; i <= m.endIndex; i++) {
        chars[i] = maskChar;
      }
    }
    return chars.join("");
  }
}

export class BellmanFordArbitrage {
  constructor() {
    this.vertices = new Set();
    this.edges = [];
  }

  addVertex(vertexId) {
    if (vertexId) this.vertices.add(String(vertexId));
  }

  addEdge(from, to, weight, transactionType = "TRANSFER", meta = {}) {
    const u = String(from);
    const v = String(to);
    this.vertices.add(u);
    this.vertices.add(v);
    this.edges.push({
      u,
      v,
      weight: Number(weight),
      transactionType,
      meta
    });
  }

  detectNegativeCycle(source = null) {
    const vertexList = Array.from(this.vertices);
    const n = vertexList.length;

    if (n === 0) {
      return { hasNegativeCycle: false, cycle: [], distances: {} };
    }

    const dist = {};
    const predecessor = {};

    for (const v of vertexList) {
      dist[v] = Infinity;
      predecessor[v] = null;
    }

    const startNode = source && this.vertices.has(String(source)) ? String(source) : vertexList[0];
    dist[startNode] = 0;

    if (!source) {
      for (const v of vertexList) {
        dist[v] = 0;
      }
    }

    for (let i = 1; i <= n - 1; i++) {
      let anyRelaxation = false;
      for (const edge of this.edges) {
        if (dist[edge.u] !== Infinity && dist[edge.u] + edge.weight < dist[edge.v]) {
          dist[edge.v] = dist[edge.u] + edge.weight;
          predecessor[edge.v] = edge.u;
          anyRelaxation = true;
        }
      }
      if (!anyRelaxation) break;
    }

    let cycleStartNode = null;
    for (const edge of this.edges) {
      if (dist[edge.u] !== Infinity && dist[edge.u] + edge.weight < dist[edge.v]) {
        dist[edge.v] = dist[edge.u] + edge.weight;
        predecessor[edge.v] = edge.u;
        cycleStartNode = edge.v;
        break;
      }
    }

    if (!cycleStartNode) {
      return {
        hasNegativeCycle: false,
        cycle: [],
        distances: dist,
        status: "SAFE",
        message: "Không phát hiện vòng lặp hoàn tiền hoặc chênh lệch tài chính gian lận."
      };
    }

    let curr = cycleStartNode;
    for (let i = 0; i < n; i++) {
      curr = predecessor[curr];
    }

    const cycle = [];
    let p = curr;
    while (true) {
      cycle.push(p);
      if (p === curr && cycle.length > 1) break;
      p = predecessor[p];
      if (!p || cycle.length > n + 1) break;
    }

    cycle.reverse();

    return {
      hasNegativeCycle: true,
      cycleStartNode,
      cycle,
      status: "CRITICAL_FRAUD_DETECTED",
      message: `CẢNH BÁO BẢO MẬT: Phát hiện chu trình hoàn tiền âm khép kín [${cycle.join(" -> ")}]. Đóng băng tự động các ví liên đới!`,
      involvedAccountsCount: new Set(cycle).size
    };
  }
}

// ==========================================
// Phase 18: Johnson Routing, Suffix Automaton Deduplication & Cuckoo Filter Revocation Suite
// ==========================================

export class JohnsonGraphRouting {
  constructor() {
    this.vertices = new Set();
    this.edges = [];
  }

  addHub(hubId) {
    if (hubId) this.vertices.add(String(hubId));
  }

  addRoute(from, to, weight, meta = {}) {
    const u = String(from);
    const v = String(to);
    this.vertices.add(u);
    this.vertices.add(v);
    this.edges.push({ u, v, weight: Number(weight), meta });
  }

  computeAllPairsShortestPaths() {
    const vertexList = Array.from(this.vertices);
    const n = vertexList.length;
    if (n === 0) return { distances: {}, hasNegativeCycle: false, hubCount: 0 };

    const q = "__VIRTUAL_SOURCE_Q__";
    const augmentedEdges = [...this.edges];
    for (const v of vertexList) {
      augmentedEdges.push({ u: q, v, weight: 0 });
    }

    const allVerticesWithQ = [...vertexList, q];
    const h = {};
    for (const v of allVerticesWithQ) h[v] = Infinity;
    h[q] = 0;

    for (let i = 1; i <= allVerticesWithQ.length - 1; i++) {
      let changed = false;
      for (const edge of augmentedEdges) {
        if (h[edge.u] !== Infinity && h[edge.u] + edge.weight < h[edge.v]) {
          h[edge.v] = h[edge.u] + edge.weight;
          changed = true;
        }
      }
      if (!changed) break;
    }

    for (const edge of augmentedEdges) {
      if (h[edge.u] !== Infinity && h[edge.u] + edge.weight < h[edge.v]) {
        return {
          distances: {},
          hasNegativeCycle: true,
          message: "LỖI: Phát hiện chu trình âm trong mạng lưới giao vận. Không thể tính toán đường đi tối ưu!"
        };
      }
    }

    const adj = new Map();
    for (const v of vertexList) adj.set(v, []);

    for (const edge of this.edges) {
      const reweighted = edge.weight + h[edge.u] - h[edge.v];
      adj.get(edge.u).push({
        to: edge.v,
        weight: Math.max(0, reweighted),
        originalWeight: edge.weight
      });
    }

    const allPairsDist = {};
    for (const u of vertexList) {
      allPairsDist[u] = {};
      const dHat = {};
      const visited = new Set();
      for (const v of vertexList) dHat[v] = Infinity;
      dHat[u] = 0;

      for (let iter = 0; iter < n; iter++) {
        let minNode = null;
        let minDist = Infinity;
        for (const v of vertexList) {
          if (!visited.has(v) && dHat[v] < minDist) {
            minDist = dHat[v];
            minNode = v;
          }
        }
        if (minNode === null || minDist === Infinity) break;
        visited.add(minNode);

        for (const neighbor of adj.get(minNode)) {
          if (!visited.has(neighbor.to)) {
            const newDist = dHat[minNode] + neighbor.weight;
            if (newDist < dHat[neighbor.to]) {
              dHat[neighbor.to] = newDist;
            }
          }
        }
      }

      for (const v of vertexList) {
        if (dHat[v] === Infinity) {
          allPairsDist[u][v] = Infinity;
        } else {
          allPairsDist[u][v] = Number((dHat[v] - h[u] + h[v]).toFixed(2));
        }
      }
    }

    return {
      distances: allPairsDist,
      hasNegativeCycle: false,
      hubCount: n,
      hValues: h
    };
  }

  getShortestDistance(fromHub, toHub) {
    const result = this.computeAllPairsShortestPaths();
    if (result.hasNegativeCycle) return Infinity;
    return result.distances[fromHub]?.[toHub] ?? Infinity;
  }
}

export class SAMState {
  constructor(len = 0, link = -1) {
    this.len = len;
    this.link = link;
    this.next = new Map();
  }
}

export class SuffixAutomatonDeduplicator {
  constructor(baseText = "") {
    this.st = [];
    this.sz = 0;
    this.last = 0;
    this._init();
    if (baseText) this.build(baseText);
  }

  _init() {
    this.st = [new SAMState(0, -1)];
    this.sz = 1;
    this.last = 0;
  }

  extend(c) {
    const cur = this.sz++;
    this.st.push(new SAMState(this.st[this.last].len + 1));
    let p = this.last;

    while (p !== -1 && !this.st[p].next.has(c)) {
      this.st[p].next.set(c, cur);
      p = this.st[p].link;
    }

    if (p === -1) {
      this.st[cur].link = 0;
    } else {
      const q = this.st[p].next.get(c);
      if (this.st[p].len + 1 === this.st[q].len) {
        this.st[cur].link = q;
      } else {
        const clone = this.sz++;
        this.st.push(new SAMState(this.st[p].len + 1, this.st[q].link));
        for (const [ch, nxt] of this.st[q].next.entries()) {
          this.st[clone].next.set(ch, nxt);
        }
        while (p !== -1 && this.st[p].next.get(c) === q) {
          this.st[p].next.set(c, clone);
          p = this.st[p].link;
        }
        this.st[q].link = clone;
        this.st[cur].link = clone;
      }
    }
    this.last = cur;
  }

  build(text) {
    this._init();
    if (!text || typeof text !== "string") return;
    for (let i = 0; i < text.length; i++) this.extend(text[i]);
  }

  contains(sub) {
    if (!sub) return true;
    let curr = 0;
    for (let i = 0; i < sub.length; i++) {
      const c = sub[i];
      if (!this.st[curr].next.has(c)) return false;
      curr = this.st[curr].next.get(c);
    }
    return true;
  }

  findLongestCommonSubstring(targetText) {
    if (!targetText || typeof targetText !== "string" || this.sz <= 1) {
      return { lcsLength: 0, lcsString: "", similarityRatio: 0 };
    }
    let v = 0, l = 0, best = 0, bestpos = 0;
    for (let i = 0; i < targetText.length; i++) {
      const c = targetText[i];
      while (v > 0 && !this.st[v].next.has(c)) {
        v = this.st[v].link;
        l = this.st[v].len;
      }
      if (this.st[v].next.has(c)) {
        v = this.st[v].next.get(c);
        l++;
      }
      if (l > best) {
        best = l;
        bestpos = i;
      }
    }
    const lcsString = targetText.substring(bestpos - best + 1, bestpos + 1);
    const similarityRatio = Number(((best / Math.max(1, targetText.length)) * 100).toFixed(1));
    return {
      lcsLength: best,
      lcsString,
      similarityRatio,
      isPlagiarized: best >= 30 || similarityRatio >= 50
    };
  }

  static detectKeywordStuffing(text, keyword, maxThreshold = 5) {
    if (!text || !keyword) return { count: 0, isStuffed: false };
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    return {
      keyword,
      occurrences: count,
      isStuffed: count > maxThreshold,
      recommendation: count > maxThreshold
        ? `CẢNH BÁO SEO STUFFING: Từ khóa "${keyword}" lặp lại ${count} lần bất thường! Vui lòng viết tự nhiên để tránh bị hạ điểm hiển thị.`
        : "Mật độ từ khóa đạt chuẩn tự nhiên."
    };
  }
}

export class CuckooFilterRevocation {
  constructor(bucketCount = 128, bucketSize = 4, maxKicks = 50) {
    this.bucketCount = bucketCount;
    this.bucketSize = bucketSize;
    this.maxKicks = maxKicks;
    this.buckets = Array.from({ length: bucketCount }, () => []);
    this.count = 0;
  }

  _fingerprint(item) {
    const str = String(item);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (Math.abs(h) % 255) + 1;
  }

  _hashIndex(item) {
    const str = String(item);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h) % this.bucketCount;
  }

  _altIndex(index, fp) {
    let h = Math.imul(fp, 0x5bd1e995);
    h ^= h >>> 15;
    const hashFp = Math.abs(h) % this.bucketCount;
    return (index ^ hashFp) % this.bucketCount;
  }

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

    let currIndex = Math.random() < 0.5 ? i1 : i2;
    let currFp = fp;

    for (let k = 0; k < this.maxKicks; k++) {
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
    return false;
  }

  lookup(item) {
    const fp = this._fingerprint(item);
    const i1 = this._hashIndex(item);
    const i2 = this._altIndex(i1, fp);
    return this.buckets[i1].includes(fp) || this.buckets[i2].includes(fp);
  }

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

  getLoadFactor() {
    const totalCapacity = this.bucketCount * this.bucketSize;
    return Number((this.count / totalCapacity).toFixed(4));
  }
}

// =========================================================================
// PHASE 19: ENTERPRISE EXACT COVER, HEAVY HITTERS & DHT ROUTING SUITE
// =========================================================================

export class DLXNode {
  constructor(colHeader = null) {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.col = colHeader || this;
    this.rowId = -1;
    this.size = 0;
    this.name = "";
  }
}

export class DancingLinksExactCover {
  constructor() {
    this.root = new DLXNode();
    this.columns = [];
    this.columnMap = new Map();
    this.solutions = [];
    this.rows = [];
  }

  initColumns(items = []) {
    this.root = new DLXNode();
    this.columns = [];
    this.columnMap.clear();
    this.solutions = [];
    this.rows = [];

    let prev = this.root;
    for (const item of items) {
      const col = new DLXNode();
      col.name = String(item);
      col.size = 0;

      col.left = prev;
      col.right = this.root;
      prev.right = col;
      this.root.left = col;

      prev = col;
      this.columns.push(col);
      this.columnMap.set(String(item), col);
    }
  }

  addRow(rowId, coveredItems = [], meta = {}) {
    const validItems = coveredItems.filter(item => this.columnMap.has(String(item)));
    if (validItems.length === 0) return;

    const rowIndex = this.rows.length;
    this.rows.push({ rowId, coveredItems: validItems, meta });

    let firstNode = null;
    let prevNode = null;

    for (const item of validItems) {
      const col = this.columnMap.get(String(item));
      const newNode = new DLXNode(col);
      newNode.rowId = rowIndex;

      newNode.up = col.up;
      newNode.down = col;
      col.up.down = newNode;
      col.up = newNode;
      col.size++;

      if (!firstNode) {
        firstNode = newNode;
        prevNode = newNode;
      } else {
        newNode.left = prevNode;
        newNode.right = firstNode;
        prevNode.right = newNode;
        firstNode.left = newNode;
        prevNode = newNode;
      }
    }
  }

  cover(col) {
    col.right.left = col.left;
    col.left.right = col.right;

    for (let row = col.down; row !== col; row = row.down) {
      for (let node = row.right; node !== row; node = node.right) {
        node.down.up = node.up;
        node.up.down = node.down;
        node.col.size--;
      }
    }
  }

  uncover(col) {
    for (let row = col.up; row !== col; row = row.up) {
      for (let node = row.left; node !== row; node = node.left) {
        node.col.size++;
        node.down.up = node;
        node.up.down = node;
      }
    }
    col.right.left = col;
    col.left.right = col;
  }

  solve(maxSolutions = 10) {
    this.solutions = [];
    if (this.columns.length === 0) return [];
    const currentSolution = [];

    const search = () => {
      if (this.solutions.length >= maxSolutions) return;

      if (this.root.right === this.root) {
        const solRows = currentSolution.map(node => this.rows[node.rowId]);
        this.solutions.push(solRows);
        return;
      }

      let minCol = this.root.right;
      let minSize = minCol.size;

      for (let col = minCol.right; col !== this.root; col = col.right) {
        if (col.size < minSize) {
          minSize = col.size;
          minCol = col;
        }
      }

      if (minSize === 0) return;

      this.cover(minCol);

      for (let row = minCol.down; row !== minCol; row = row.down) {
        currentSolution.push(row);

        for (let node = row.right; node !== row; node = node.right) {
          this.cover(node.col);
        }

        search();

        currentSolution.pop();
        for (let node = row.left; node !== row; node = node.left) {
          this.uncover(node.col);
        }
      }

      this.uncover(minCol);
    };

    search();
    return this.solutions;
  }

  findOptimalVoucherCombination() {
    const allSolutions = this.solve(20);
    if (allSolutions.length === 0) return null;

    let bestSolution = null;
    let maxDiscount = -1;

    for (const sol of allSolutions) {
      const totalDiscount = sol.reduce((sum, item) => sum + (Number(item.meta?.discountAmount) || 0), 0);
      if (totalDiscount > maxDiscount) {
        maxDiscount = totalDiscount;
        bestSolution = {
          vouchers: sol,
          totalDiscount,
          coveredItemsCount: sol.reduce((acc, v) => acc + v.coveredItems.length, 0)
        };
      }
    }

    return bestSolution;
  }
}

export class StreamEntry {
  constructor(item, count = 1, error = 0) {
    this.item = String(item);
    this.count = count;
    this.error = error;
    this.lastUpdated = Date.now();
  }
}

export class SpaceSavingHeavyHitters {
  constructor(capacity = 20) {
    this.capacity = Math.max(1, capacity);
    this.entries = new Map();
    this.totalStreamCount = 0;
  }

  update(item, weight = 1) {
    const key = String(item);
    const w = Math.max(1, Number(weight) || 1);
    this.totalStreamCount += w;

    if (this.entries.has(key)) {
      const entry = this.entries.get(key);
      entry.count += w;
      entry.lastUpdated = Date.now();
      return entry;
    }

    if (this.entries.size < this.capacity) {
      const entry = new StreamEntry(key, w, 0);
      this.entries.set(key, entry);
      return entry;
    }

    let minKey = null;
    let minCount = Infinity;

    for (const [k, entry] of this.entries.entries()) {
      if (entry.count < minCount) {
        minCount = entry.count;
        minKey = k;
      }
    }

    this.entries.delete(minKey);
    const newEntry = new StreamEntry(key, minCount + w, minCount);
    this.entries.set(key, newEntry);
    return newEntry;
  }

  getTopK(limit = 10) {
    const list = Array.from(this.entries.values()).map(e => ({
      item: e.item,
      estimatedCount: e.count,
      maxError: e.error,
      minGuaranteedCount: Math.max(1, e.count - e.error),
      relativeFrequency: Number((e.count / Math.max(1, this.totalStreamCount)).toFixed(4))
    }));

    list.sort((a, b) => b.estimatedCount - a.estimatedCount);
    return list.slice(0, limit);
  }

  estimateFrequency(item) {
    const key = String(item);
    if (this.entries.has(key)) {
      const e = this.entries.get(key);
      return {
        item: key,
        isInTopK: true,
        estimatedCount: e.count,
        maxError: e.error,
        lowerBound: Math.max(1, e.count - e.error),
        upperBound: e.count
      };
    }

    let minCount = 0;
    if (this.entries.size > 0) {
      minCount = Math.min(...Array.from(this.entries.values()).map(e => e.count));
    }

    return {
      item: key,
      isInTopK: false,
      estimatedCount: 0,
      maxError: minCount,
      lowerBound: 0,
      upperBound: minCount
    };
  }

  getTotalStreamCount() {
    return this.totalStreamCount;
  }

  reset() {
    this.entries.clear();
    this.totalStreamCount = 0;
  }
}

export class KademliaContact {
  constructor(nodeId, metadata = {}) {
    this.nodeId = String(nodeId);
    this.numericId = KademliaDhtRouting.hashToId(this.nodeId);
    this.metadata = metadata;
    this.lastSeen = Date.now();
  }
}

export class KademliaDhtRouting {
  constructor(localNodeId, k = 8, idBits = 32) {
    this.localNodeId = String(localNodeId);
    this.localNumericId = KademliaDhtRouting.hashToId(this.localNodeId);
    this.k = Math.max(2, k);
    this.idBits = idBits;

    this.buckets = Array.from({ length: this.idBits }, () => []);
    this.storage = new Map();
  }

  static hashToId(str) {
    let hash = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  static xorDistance(id1, id2) {
    const n1 = typeof id1 === "number" ? id1 : KademliaDhtRouting.hashToId(id1);
    const n2 = typeof id2 === "number" ? id2 : KademliaDhtRouting.hashToId(id2);
    return (n1 ^ n2) >>> 0;
  }

  _getBucketIndex(dist) {
    if (dist === 0) return 0;
    const idx = 31 - Math.clz32(dist);
    return Math.min(this.idBits - 1, Math.max(0, idx));
  }

  addNode(nodeId, meta = {}) {
    if (String(nodeId) === this.localNodeId) return false;

    const contact = new KademliaContact(nodeId, meta);
    const dist = KademliaDhtRouting.xorDistance(this.localNumericId, contact.numericId);
    const bIndex = this._getBucketIndex(dist);
    const bucket = this.buckets[bIndex];

    const existingIdx = bucket.findIndex(c => c.nodeId === contact.nodeId);
    if (existingIdx !== -1) {
      bucket.splice(existingIdx, 1);
      contact.lastSeen = Date.now();
      bucket.push(contact);
      return true;
    }

    if (bucket.length < this.k) {
      bucket.push(contact);
      return true;
    }

    return false;
  }

  removeNode(nodeId) {
    const numeric = KademliaDhtRouting.hashToId(nodeId);
    const dist = KademliaDhtRouting.xorDistance(this.localNumericId, numeric);
    const bIndex = this._getBucketIndex(dist);
    const bucket = this.buckets[bIndex];

    const idx = bucket.findIndex(c => c.nodeId === String(nodeId));
    if (idx !== -1) {
      bucket.splice(idx, 1);
      return true;
    }
    return false;
  }

  findClosestNodes(targetKey, count = this.k) {
    const targetNumeric = typeof targetKey === "number" ? targetKey : KademliaDhtRouting.hashToId(targetKey);
    const allContacts = [];

    allContacts.push({
      nodeId: this.localNodeId,
      numericId: this.localNumericId,
      metadata: { isLocal: true },
      distance: KademliaDhtRouting.xorDistance(this.localNumericId, targetNumeric)
    });

    for (const bucket of this.buckets) {
      for (const contact of bucket) {
        allContacts.push({
          nodeId: contact.nodeId,
          numericId: contact.numericId,
          metadata: contact.metadata,
          distance: KademliaDhtRouting.xorDistance(contact.numericId, targetNumeric)
        });
      }
    }

    allContacts.sort((a, b) => a.distance - b.distance);
    return allContacts.slice(0, count);
  }

  store(key, value) {
    const k = String(key);
    this.storage.set(k, {
      value,
      publisher: this.localNodeId,
      timestamp: Date.now()
    });
    return true;
  }

  lookup(key) {
    const k = String(key);
    if (this.storage.has(k)) {
      return this.storage.get(k).value;
    }
    return null;
  }

  getTotalKnownNodes() {
    return this.buckets.reduce((acc, b) => acc + b.length, 0);
  }
}

// =========================================================================
// PHASE 20: FAIR RAFFLE, SEQUENTIAL MINING & RETE RULE ENGINE SUITE
// =========================================================================

export class FisherYatesFairRaffle {
  constructor(serverSeed = "") {
    this.serverSeed = serverSeed || (Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2));
    this.serverSeedHash = sha256(this.serverSeed);
    this.nonce = 0;
  }

  getCommitmentHash() {
    return this.serverSeedHash;
  }

  _pseudoRandom(clientSeed = "DEFAULT_CLIENT_SEED", specificNonce = null) {
    const currentNonce = specificNonce !== null ? specificNonce : ++this.nonce;
    const message = `${this.serverSeed}:${clientSeed}:${currentNonce}`;
    const hashHex = sha256(message);
    const intVal = parseInt(hashHex.substring(0, 8), 16);
    return (intVal >>> 0) / 0xffffffff;
  }

  shuffle(array = [], clientSeed = "MINI_SHOPEE_BUYER") {
    if (!Array.isArray(array) || array.length <= 1) {
      return {
        shuffled: [...(array || [])],
        commitmentHash: this.serverSeedHash,
        serverSeed: this.serverSeed,
        nonce: this.nonce
      };
    }

    const shuffled = [...array];
    const n = shuffled.length;

    for (let i = n - 1; i > 0; i--) {
      const randFloat = this._pseudoRandom(clientSeed);
      const j = Math.floor(randFloat * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    return {
      shuffled,
      commitmentHash: this.serverSeedHash,
      serverSeed: this.serverSeed,
      nonce: this.nonce
    };
  }

  weightedDraw(candidates = [], clientSeed = "MINI_SHOPEE_DRAW") {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    const totalWeight = candidates.reduce((sum, c) => sum + Math.max(0, Number(c.weight) || 0), 0);
    if (totalWeight <= 0) return candidates[0];

    const randFloat = this._pseudoRandom(clientSeed);
    let randomThreshold = randFloat * totalWeight;

    for (const c of candidates) {
      const w = Math.max(0, Number(c.weight) || 0);
      if (randomThreshold < w) {
        return {
          winner: c,
          rollValue: randFloat,
          commitmentHash: this.serverSeedHash,
          serverSeed: this.serverSeed,
          nonce: this.nonce
        };
      }
      randomThreshold -= w;
    }

    return {
      winner: candidates[candidates.length - 1],
      rollValue: randFloat,
      commitmentHash: this.serverSeedHash,
      serverSeed: this.serverSeed,
      nonce: this.nonce
    };
  }

  static verifyFairness(serverSeed, clientSeed, nonce, expectedCommitmentHash) {
    const computedHash = sha256(serverSeed);
    if (computedHash !== expectedCommitmentHash) return false;
    const message = `${serverSeed}:${clientSeed}:${nonce}`;
    const h = sha256(message);
    return typeof h === "string" && h.length === 64;
  }
}

export class PrefixSpanSequentialMining {
  constructor(minSupport = 2, maxPatternLength = 5) {
    this.minSupport = Math.max(1, minSupport);
    this.maxPatternLength = Math.max(1, maxPatternLength);
    this.patterns = [];
  }

  minePatterns(sequences = [], minSupport = this.minSupport) {
    this.minSupport = Math.max(1, minSupport);
    this.patterns = [];

    if (!Array.isArray(sequences) || sequences.length === 0) {
      return [];
    }

    this._prefixSpan([], sequences);
    this.patterns.sort((a, b) => b.support - a.support || b.pattern.length - a.pattern.length);
    return this.patterns;
  }

  _prefixSpan(prefix, projectedDb) {
    if (prefix.length >= this.maxPatternLength) return;

    const itemCounts = new Map();
    for (const seq of projectedDb) {
      const seenInThisSeq = new Set();
      for (const item of seq) {
        if (!seenInThisSeq.has(item)) {
          seenInThisSeq.add(item);
          itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
        }
      }
    }

    for (const [item, count] of itemCounts.entries()) {
      if (count >= this.minSupport) {
        const newPrefix = [...prefix, item];
        this.patterns.push({
          pattern: newPrefix,
          support: count
        });

        const newProjectedDb = [];
        for (const seq of projectedDb) {
          const idx = seq.indexOf(item);
          if (idx !== -1 && idx + 1 < seq.length) {
            newProjectedDb.push(seq.slice(idx + 1));
          }
        }

        if (newProjectedDb.length >= this.minSupport) {
          this._prefixSpan(newPrefix, newProjectedDb);
        }
      }
    }
  }

  predictNextItem(recentHistory = [], minConfidence = 0.3) {
    if (!Array.isArray(recentHistory) || recentHistory.length === 0 || this.patterns.length === 0) {
      return null;
    }

    const n = recentHistory.length;
    let bestCandidate = null;
    let maxScore = -1;

    for (let len = Math.min(n, this.maxPatternLength - 1); len >= 1; len--) {
      const queryPrefix = recentHistory.slice(n - len);

      const prefixMatch = this.patterns.find(p =>
        p.pattern.length === queryPrefix.length &&
        p.pattern.every((val, idx) => val === queryPrefix[idx])
      );

      const prefixSupport = prefixMatch ? prefixMatch.support : 0;
      if (prefixSupport === 0) continue;

      for (const p of this.patterns) {
        if (p.pattern.length === queryPrefix.length + 1) {
          const startsWithPrefix = queryPrefix.every((val, idx) => val === p.pattern[idx]);
          if (startsWithPrefix) {
            const nextItem = p.pattern[p.pattern.length - 1];
            const confidence = Number((p.support / prefixSupport).toFixed(3));

            if (confidence >= minConfidence && p.support > maxScore) {
              maxScore = p.support;
              bestCandidate = {
                matchedHistory: queryPrefix,
                predictedItem: nextItem,
                confidence,
                support: p.support
              };
            }
          }
        }
      }

      if (bestCandidate) break;
    }

    return bestCandidate;
  }

  getTopJourneys(topK = 5) {
    const multiStep = this.patterns.filter(p => p.pattern.length >= 2);
    return multiStep.slice(0, topK).map(p => ({
      journey: p.pattern.join(" ➔ "),
      steps: p.pattern,
      frequency: p.support
    }));
  }
}

export class AlphaNode {
  constructor(field, operator, expectedValue) {
    this.field = field;
    this.operator = operator;
    this.expectedValue = expectedValue;
    this.memory = new Map();
  }

  evaluate(fact) {
    const val = fact[this.field];
    switch (this.operator) {
      case "===": return val === this.expectedValue;
      case "!==": return val !== this.expectedValue;
      case ">=": return Number(val) >= Number(this.expectedValue);
      case "<=": return Number(val) <= Number(this.expectedValue);
      case ">": return Number(val) > Number(this.expectedValue);
      case "<": return Number(val) < Number(this.expectedValue);
      case "includes": return Array.isArray(val) && val.includes(this.expectedValue);
      case "in": return Array.isArray(this.expectedValue) && this.expectedValue.includes(val);
      default: return false;
    }
  }
}

export class PromotionRule {
  constructor({ id, name = "", conditions = [], actions = {}, priority = 1 }) {
    this.id = String(id);
    this.name = name || this.id;
    this.conditions = conditions;
    this.actions = actions;
    this.priority = priority;
  }
}

export class RetePromotionEngine {
  constructor() {
    this.rules = new Map();
    this.workingMemory = new Map();
    this.alphaNodes = new Map();
    this.ruleActivations = new Set();
  }

  addRule(ruleDef) {
    const rule = new PromotionRule(ruleDef);
    this.rules.set(rule.id, rule);

    for (const cond of rule.conditions) {
      const key = `${cond.factType}:${cond.field}:${cond.operator}:${cond.value}`;
      if (!this.alphaNodes.has(key)) {
        this.alphaNodes.set(key, new AlphaNode(cond.field, cond.operator, cond.value));
      }
    }
  }

  assertFact(factType, factData = {}) {
    const factId = factData.id || `${factType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fact = { ...factData, id: factId, __type: factType };
    this.workingMemory.set(factId, fact);

    for (const [key, node] of this.alphaNodes.entries()) {
      if (key.startsWith(`${factType}:`)) {
        if (node.evaluate(fact)) {
          node.memory.set(factId, fact);
        }
      }
    }

    return factId;
  }

  retractFact(factId) {
    if (!this.workingMemory.has(factId)) return false;
    this.workingMemory.delete(factId);

    for (const node of this.alphaNodes.values()) {
      node.memory.delete(factId);
    }
    return true;
  }

  fireAllRules() {
    const triggered = [];

    for (const rule of this.rules.values()) {
      let isSatisfied = true;

      for (const cond of rule.conditions) {
        const key = `${cond.factType}:${cond.field}:${cond.operator}:${cond.value}`;
        const alpha = this.alphaNodes.get(key);

        if (!alpha || alpha.memory.size === 0) {
          isSatisfied = false;
          break;
        }
      }

      if (isSatisfied) {
        triggered.push(rule);
      }
    }

    triggered.sort((a, b) => b.priority - a.priority);

    let totalDiscount = 0;
    let totalCoins = 0;
    const actionsApplied = [];

    for (const rule of triggered) {
      if (rule.actions.discountAmount) totalDiscount += Number(rule.actions.discountAmount) || 0;
      if (rule.actions.bonusCoins) totalCoins += Number(rule.actions.bonusCoins) || 0;
      actionsApplied.push({
        ruleId: rule.id,
        ruleName: rule.name,
        actions: rule.actions
      });
    }

    return {
      triggeredCount: triggered.length,
      triggeredRules: triggered.map(r => ({ id: r.id, name: r.name, priority: r.priority })),
      totalDiscountAmount: totalDiscount,
      totalBonusCoins: totalCoins,
      appliedActions: actionsApplied
    };
  }

  reset() {
    this.workingMemory.clear();
    for (const node of this.alphaNodes.values()) {
      node.memory.clear();
    }
    this.ruleActivations.clear();
  }
}

// =========================================================================
// PHASE 21 ENTERPRISE ALGORITHMS SUITE (Feature 168)
// 1. Hierarchical Navigable Small World (HNSW) Dynamic Multi-Layer Re-ranking
// 2. Tarjan's Strongly Connected Components (SCC) Wash-Trading Fraud Detector
// 3. Timsort Adaptive Hybrid Sorting Algorithm (Partially Ordered Catalog Sorter)
// =========================================================================

export class HNSWVectorReranker {
  constructor({ maxLayers = 4, m = 6, efConstruction = 16, mL = 0.62 } = {}) {
    this.maxLayers = maxLayers;
    this.m = m;
    this.efConstruction = efConstruction;
    this.mL = mL;
    this.nodes = new Map();
    this.entryPoint = null;
    this.maxLevel = -1;
  }

  static cosineSimilarity(v1 = [], v2 = []) {
    if (!v1.length || !v2.length || v1.length !== v2.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static cosineDistance(v1 = [], v2 = []) {
    return 1 - HNSWVectorReranker.cosineSimilarity(v1, v2);
  }

  _getRandomLevel() {
    let r = Math.random();
    if (r === 0) r = 0.0000001;
    const level = Math.floor(-Math.log(r) * this.mL);
    return Math.min(level, this.maxLayers - 1);
  }

  addNode(id, vector, metadata = {}) {
    if (!id || !Array.isArray(vector) || vector.length === 0) {
      throw new Error("Invalid id or vector for HNSW node");
    }

    const nodeLevel = this._getRandomLevel();
    const nodeLayers = [];
    for (let l = 0; l <= nodeLevel; l++) {
      nodeLayers.push(new Set());
    }

    const newNode = {
      id,
      vector,
      metadata: { ...metadata },
      level: nodeLevel,
      layers: nodeLayers
    };

    this.nodes.set(id, newNode);

    if (this.entryPoint === null) {
      this.entryPoint = id;
      this.maxLevel = nodeLevel;
      return newNode;
    }

    let currObj = this.nodes.get(this.entryPoint);
    let currDist = HNSWVectorReranker.cosineDistance(vector, currObj.vector);

    for (let level = this.maxLevel; level > nodeLevel; level--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.layers[level] ? Array.from(currObj.layers[level]) : [];
        for (const neighborId of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (!neighbor) continue;
          const d = HNSWVectorReranker.cosineDistance(vector, neighbor.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighbor;
            changed = true;
          }
        }
      }
    }

    const topConnectLevel = Math.min(nodeLevel, this.maxLevel);
    for (let level = topConnectLevel; level >= 0; level--) {
      const candidates = this._searchLayer(currObj, vector, this.efConstruction, level);
      const neighborsToConnect = candidates.slice(0, this.m);

      for (const { id: candId } of neighborsToConnect) {
        if (candId === id) continue;
        const candNode = this.nodes.get(candId);
        if (candNode && candNode.layers[level]) {
          newNode.layers[level].add(candId);
          candNode.layers[level].add(id);

          if (candNode.layers[level].size > this.m) {
            this._pruneNeighbors(candNode, level);
          }
        }
      }
      if (neighborsToConnect.length > 0) {
        currObj = this.nodes.get(neighborsToConnect[0].id) || currObj;
      }
    }

    if (nodeLevel > this.maxLevel) {
      this.maxLevel = nodeLevel;
      this.entryPoint = id;
    }

    return newNode;
  }

  _searchLayer(entryNode, queryVector, ef, level) {
    const vEntry = entryNode.vector;
    const dEntry = HNSWVectorReranker.cosineDistance(queryVector, vEntry);

    const visited = new Set([entryNode.id]);
    let candidates = [{ id: entryNode.id, dist: dEntry }];
    let results = [{ id: entryNode.id, dist: dEntry }];

    while (candidates.length > 0) {
      const current = candidates.shift();
      const furthestResult = results[results.length - 1];

      if (current.dist > furthestResult.dist && results.length >= ef) {
        break;
      }

      const currNode = this.nodes.get(current.id);
      if (!currNode || !currNode.layers[level]) continue;

      const neighbors = Array.from(currNode.layers[level]);
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const neighborNode = this.nodes.get(neighborId);
        if (!neighborNode) continue;

        const d = HNSWVectorReranker.cosineDistance(queryVector, neighborNode.vector);
        if (d < furthestResult.dist || results.length < ef) {
          candidates.push({ id: neighborId, dist: d });
          candidates.sort((a, b) => a.dist - b.dist);

          results.push({ id: neighborId, dist: d });
          results.sort((a, b) => a.dist - b.dist);

          if (results.length > ef) {
            results.pop();
          }
        }
      }
    }

    return results;
  }

  _pruneNeighbors(node, level) {
    const neighbors = Array.from(node.layers[level]);
    if (neighbors.length <= this.m) return;

    const scored = neighbors.map(nId => {
      const nNode = this.nodes.get(nId);
      const d = nNode ? HNSWVectorReranker.cosineDistance(node.vector, nNode.vector) : Infinity;
      return { id: nId, dist: d };
    });

    scored.sort((a, b) => a.dist - b.dist);
    node.layers[level] = new Set(scored.slice(0, this.m).map(s => s.id));
  }

  searchKnn(queryVector, k = 5, efSearch = 16) {
    if (!this.entryPoint || this.nodes.size === 0) {
      return [];
    }

    let currObj = this.nodes.get(this.entryPoint);
    let currDist = HNSWVectorReranker.cosineDistance(queryVector, currObj.vector);

    for (let level = this.maxLevel; level > 0; level--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.layers[level] ? Array.from(currObj.layers[level]) : [];
        for (const neighborId of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (!neighbor) continue;
          const d = HNSWVectorReranker.cosineDistance(queryVector, neighbor.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighbor;
            changed = true;
          }
        }
      }
    }

    const rawResults = this._searchLayer(currObj, queryVector, Math.max(k, efSearch), 0);
    const topK = rawResults.slice(0, k);

    return topK.map(({ id, dist }) => {
      const node = this.nodes.get(id);
      const similarity = Math.max(0, 1 - dist);
      return {
        id,
        distance: Number(dist.toFixed(4)),
        similarity: Number(similarity.toFixed(4)),
        score: Number(similarity.toFixed(4)),
        metadata: node ? node.metadata : {}
      };
    });
  }

  dynamicRerank(queryVector, { k = 10, alpha = 0.65, beta = 0.35 } = {}) {
    const knnCandidates = this.searchKnn(queryVector, k * 2, 24);
    if (knnCandidates.length === 0) return [];

    let maxSales = 1;
    let maxRating = 5;

    for (const c of knnCandidates) {
      const sales = c.metadata.salesCount || 0;
      if (sales > maxSales) maxSales = sales;
    }

    const reranked = knnCandidates.map(c => {
      const meta = c.metadata;
      const normRating = (meta.rating || 4.0) / maxRating;
      const normSales = (meta.salesCount || 0) / maxSales;
      const isMallBonus = meta.isMall ? 0.1 : 0.0;
      const businessScore = Math.min(1.0, 0.5 * normRating + 0.4 * normSales + isMallBonus);

      const finalScore = Number((alpha * c.similarity + beta * businessScore).toFixed(4));

      return {
        id: c.id,
        finalScore,
        semanticScore: c.similarity,
        businessScore: Number(businessScore.toFixed(4)),
        metadata: meta
      };
    });

    reranked.sort((a, b) => b.finalScore - a.finalScore);
    return reranked.slice(0, k);
  }

  size() {
    return this.nodes.size;
  }
}

export class TarjanSccFraudDetector {
  constructor() {
    this.adjacencyList = new Map();
    this.edgeMetadata = new Map();
    this.nodes = new Set();
  }

  addNode(nodeId) {
    if (!this.nodes.has(nodeId)) {
      this.nodes.add(nodeId);
      this.adjacencyList.set(nodeId, new Set());
    }
  }

  addTransaction(fromId, toId, metadata = {}) {
    if (!fromId || !toId) return;

    this.addNode(fromId);
    this.addNode(toId);

    this.adjacencyList.get(fromId).add(toId);

    const edgeKey = `${fromId}->${toId}`;
    if (!this.edgeMetadata.has(edgeKey)) {
      this.edgeMetadata.set(edgeKey, []);
    }
    this.edgeMetadata.get(edgeKey).push({
      amount: metadata.amount || 0,
      orderId: metadata.orderId || `TX_${Date.now()}`,
      timestamp: metadata.timestamp || new Date().toISOString()
    });
  }

  findStronglyConnectedComponents() {
    let index = 0;
    const indices = new Map();
    const lowlink = new Map();
    const onStack = new Map();
    const stack = [];
    const sccs = [];

    const strongConnect = (v) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.set(v, true);

      const neighbors = this.adjacencyList.get(v) || new Set();
      for (const w of neighbors) {
        if (!indices.has(w)) {
          strongConnect(w);
          lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
        } else if (onStack.get(w)) {
          lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
        }
      }

      if (lowlink.get(v) === indices.get(v)) {
        const component = [];
        let w = null;
        do {
          w = stack.pop();
          onStack.set(w, false);
          component.push(w);
        } while (w !== v);

        sccs.push(component);
      }
    };

    for (const node of this.nodes) {
      if (!indices.has(node)) {
        strongConnect(node);
      }
    }

    return sccs;
  }

  detectWashTradingRings({ minSize = 2 } = {}) {
    const sccs = this.findStronglyConnectedComponents();
    const suspiciousRings = [];

    for (const component of sccs) {
      const hasMultiNodeCycle = component.length >= minSize;
      const hasSelfLoop = component.length === 1 && (this.adjacencyList.get(component[0])?.has(component[0]) ?? false);

      if (hasMultiNodeCycle || hasSelfLoop) {
        let totalWashVolume = 0;
        let transactionCount = 0;
        const internalEdges = [];

        for (const u of component) {
          const neighbors = this.adjacencyList.get(u) || new Set();
          for (const v of neighbors) {
            if (component.includes(v)) {
              const edgeKey = `${u}->${v}`;
              const txs = this.edgeMetadata.get(edgeKey) || [];
              internalEdges.push({ from: u, to: v, count: txs.length });
              for (const tx of txs) {
                totalWashVolume += tx.amount;
                transactionCount++;
              }
            }
          }
        }

        let riskLevel = "MEDIUM";
        if (component.length >= 3 || totalWashVolume > 10000000 || transactionCount >= 10) {
          riskLevel = "CRITICAL";
        } else if (component.length >= 2 || totalWashVolume > 2000000) {
          riskLevel = "HIGH";
        }

        suspiciousRings.push({
          ringId: `RING_SCC_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          nodes: component,
          nodeCount: component.length,
          riskLevel,
          totalWashVolume,
          transactionCount,
          internalEdges,
          recommendedAction: riskLevel === "CRITICAL"
            ? "QUARANTINE_SHOPS_AND_REVERSE_ESCROW"
            : "FLAG_ACCOUNTS_FOR_AUDIT"
        });
      }
    }

    suspiciousRings.sort((a, b) => b.totalWashVolume - a.totalWashVolume);
    return suspiciousRings;
  }

  getStats() {
    let edgeCount = 0;
    for (const [, neighbors] of this.adjacencyList) {
      edgeCount += neighbors.size;
    }
    return {
      nodeCount: this.nodes.size,
      edgeCount,
      txCount: Array.from(this.edgeMetadata.values()).reduce((sum, list) => sum + list.length, 0)
    };
  }
}

export class TimsortCatalogSorter {
  static MIN_MERGE = 32;

  static computeMinRun(n) {
    let r = 0;
    while (n >= TimsortCatalogSorter.MIN_MERGE) {
      r |= (n & 1);
      n >>= 1;
    }
    return n + r;
  }

  static binaryInsertionSort(arr, left, right, compareFn) {
    for (let i = left + 1; i <= right; i++) {
      const pivot = arr[i];
      let low = left;
      let high = i - 1;

      while (low <= high) {
        const mid = (low + high) >> 1;
        if (compareFn(pivot, arr[mid]) < 0) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      for (let j = i - 1; j >= low; j--) {
        arr[j + 1] = arr[j];
      }
      arr[low] = pivot;
    }
  }

  static merge(arr, left, mid, right, compareFn) {
    const len1 = mid - left + 1;
    const len2 = right - mid;

    const leftArr = new Array(len1);
    const rightArr = new Array(len2);

    for (let i = 0; i < len1; i++) leftArr[i] = arr[left + i];
    for (let i = 0; i < len2; i++) rightArr[i] = arr[mid + 1 + i];

    let i = 0;
    let j = 0;
    let k = left;

    while (i < len1 && j < len2) {
      if (compareFn(leftArr[i], rightArr[j]) <= 0) {
        arr[k++] = leftArr[i++];
      } else {
        arr[k++] = rightArr[j++];
      }
    }

    while (i < len1) arr[k++] = leftArr[i++];
    while (j < len2) arr[k++] = rightArr[j++];
  }

  static sort(array = [], compareFn = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
    if (!Array.isArray(array) || array.length <= 1) return array;

    const n = array.length;
    const minRun = TimsortCatalogSorter.computeMinRun(n);

    for (let i = 0; i < n; i += minRun) {
      const end = Math.min(i + minRun - 1, n - 1);
      TimsortCatalogSorter.binaryInsertionSort(array, i, end, compareFn);
    }

    for (let size = minRun; size < n; size = 2 * size) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);

        if (mid < right) {
          TimsortCatalogSorter.merge(array, left, mid, right, compareFn);
        }
      }
    }

    return array;
  }

  static countNaturalRuns(array = [], compareFn = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
    if (!array || array.length === 0) return 0;
    if (array.length === 1) return 1;

    let runs = 1;
    let isAsc = compareFn(array[1], array[0]) >= 0;

    for (let i = 2; i < array.length; i++) {
      const currAsc = compareFn(array[i], array[i - 1]) >= 0;
      if (currAsc !== isAsc) {
        runs++;
        isAsc = currAsc;
      }
    }
    return runs;
  }

  static sortCatalog(products = [], { sortBy = "price", order = "asc", secondarySortBy = "rating" } = {}) {
    const cloned = [...products];

    const compareFn = (a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string" && typeof valB === "string") {
        const comp = valA.localeCompare(valB, "vi");
        if (comp !== 0) return order === "desc" ? -comp : comp;
      } else {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
        if (valA !== valB) {
          return order === "desc" ? valB - valA : valA - valB;
        }
      }

      if (secondarySortBy && a[secondarySortBy] !== undefined && b[secondarySortBy] !== undefined) {
        const secA = Number(a[secondarySortBy] || 0);
        const secB = Number(b[secondarySortBy] || 0);
        return secB - secA;
      }

      return 0;
    };

    return TimsortCatalogSorter.sort(cloned, compareFn);
  }
}

// =========================================================================
// PHASE 22 ENTERPRISE ALGORITHMS SUITE (Feature 169)
// 1. Holt-Winters Triple Exponential Smoothing Demand & Seasonality Forecaster
// 2. Gale-Shapley Stable Matching Algorithm (Two-Sided Deferred Acceptance)
// 3. Radix Tree (Patricia Trie) with Compact Edge Compression for Category Taxonomies
// =========================================================================

export class HoltWintersDemandForecaster {
  constructor({ seasonLength = 7, alpha = 0.3, beta = 0.1, gamma = 0.2 } = {}) {
    if (seasonLength < 2) throw new Error("seasonLength must be >= 2");
    this.seasonLength = seasonLength;
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
    this.level = 0;
    this.trend = 0;
    this.seasonal = [];
  }

  _initModel(history = []) {
    const m = this.seasonLength;
    if (history.length < 2 * m) {
      throw new Error(`History length must be at least 2 * seasonLength (${2 * m}) for initialization`);
    }

    let sumSeason1 = 0;
    for (let i = 0; i < m; i++) sumSeason1 += history[i];
    this.level = sumSeason1 / m;

    let sumSeason2 = 0;
    for (let i = m; i < 2 * m; i++) sumSeason2 += history[i];
    this.trend = (sumSeason2 / m - this.level) / m;

    this.seasonal = new Array(m);
    for (let i = 0; i < m; i++) {
      this.seasonal[i] = history[i] - this.level;
    }
  }

  fit(history = []) {
    if (!Array.isArray(history) || history.length < 2 * this.seasonLength) {
      throw new Error(`Insufficient history data. Need at least ${2 * this.seasonLength} data points.`);
    }

    this._initModel(history);
    const m = this.seasonLength;

    for (let t = 0; t < history.length; t++) {
      const y = history[t];
      const sIndex = t % m;
      const prevLevel = this.level;
      const prevTrend = this.trend;
      const prevSeasonal = this.seasonal[sIndex];

      this.level = this.alpha * (y - prevSeasonal) + (1 - this.alpha) * (prevLevel + prevTrend);
      this.trend = this.beta * (this.level - prevLevel) + (1 - this.beta) * prevTrend;
      this.seasonal[sIndex] = this.gamma * (y - this.level) + (1 - this.gamma) * prevSeasonal;
    }

    return this;
  }

  predict(steps = 7) {
    const m = this.seasonLength;
    const predictions = [];

    for (let h = 1; h <= steps; h++) {
      const sIndex = (h - 1) % m;
      const rawForecast = this.level + h * this.trend + this.seasonal[sIndex];
      const forecastVal = Math.max(0, Math.round(rawForecast));
      const margin = Math.round(forecastVal * 0.15);

      predictions.push({
        step: h,
        forecast: forecastVal,
        lowerBound: Math.max(0, forecastVal - margin),
        upperBound: forecastVal + margin
      });
    }

    return predictions;
  }

  calculateRestockRecommendation({ currentStock = 0, safetyStock = 10, leadTimeDays = 2, planningHorizonDays = 7 } = {}) {
    const predictions = this.predict(planningHorizonDays + leadTimeDays);
    const totalForecastDemand = predictions.reduce((sum, p) => sum + p.forecast, 0);

    const reorderPoint = safetyStock + predictions.slice(0, leadTimeDays).reduce((sum, p) => sum + p.forecast, 0);
    const needsReorder = currentStock <= reorderPoint;
    const recommendedOrderQty = needsReorder ? Math.max(0, totalForecastDemand + safetyStock - currentStock) : 0;

    return {
      currentStock,
      safetyStock,
      reorderPoint,
      needsReorder,
      recommendedOrderQty,
      forecastDemand: totalForecastDemand,
      dailyForecasts: predictions.slice(0, planningHorizonDays)
    };
  }
}

export class GaleShapleyStableMatcher {
  constructor() {
    this.proposers = new Map();
    this.acceptors = new Map();
  }

  addProposer(id, preferences = []) {
    if (!id || !Array.isArray(preferences)) return;
    this.proposers.set(id, { id, preferences: [...preferences] });
  }

  addAcceptor(id, preferences = []) {
    if (!id || !Array.isArray(preferences)) return;
    const ranking = new Map();
    preferences.forEach((propId, rank) => {
      ranking.set(propId, rank);
    });
    this.acceptors.set(id, { id, preferences: [...preferences], ranking });
  }

  match() {
    const freeProposers = Array.from(this.proposers.keys());
    const nextProposalIndex = new Map();
    for (const pId of freeProposers) {
      nextProposalIndex.set(pId, 0);
    }

    const currentMatches = new Map();
    let iterations = 0;
    const maxIterations = (this.proposers.size * this.acceptors.size) + 10;

    while (freeProposers.length > 0 && iterations < maxIterations) {
      iterations++;
      const pId = freeProposers.shift();
      const pObj = this.proposers.get(pId);
      const propIndex = nextProposalIndex.get(pId);

      if (propIndex >= pObj.preferences.length) {
        continue;
      }

      const preferredAcceptorId = pObj.preferences[propIndex];
      nextProposalIndex.set(pId, propIndex + 1);

      const acceptorObj = this.acceptors.get(preferredAcceptorId);
      if (!acceptorObj) {
        freeProposers.unshift(pId);
        continue;
      }

      const currentPartnerId = currentMatches.get(preferredAcceptorId);

      if (!currentPartnerId) {
        currentMatches.set(preferredAcceptorId, pId);
      } else {
        const currentRank = acceptorObj.ranking.has(currentPartnerId)
          ? acceptorObj.ranking.get(currentPartnerId)
          : Infinity;
        const newRank = acceptorObj.ranking.has(pId)
          ? acceptorObj.ranking.get(pId)
          : Infinity;

        if (newRank < currentRank) {
          currentMatches.set(preferredAcceptorId, pId);
          freeProposers.push(currentPartnerId);
        } else {
          freeProposers.unshift(pId);
        }
      }
    }

    const matches = new Map();
    for (const [accId, propId] of currentMatches.entries()) {
      matches.set(propId, accId);
    }

    return {
      matches,
      reverseMatches: currentMatches,
      iterations,
      matchedCount: matches.size,
      totalProposers: this.proposers.size,
      totalAcceptors: this.acceptors.size
    };
  }

  isStable(matches) {
    for (const [pId, aId] of matches.entries()) {
      const pObj = this.proposers.get(pId);
      if (!pObj) continue;

      const currentAcceptorRank = pObj.preferences.indexOf(aId);
      const preferredAcceptors = currentAcceptorRank > 0
        ? pObj.preferences.slice(0, currentAcceptorRank)
        : [];

      for (const prefAccId of preferredAcceptors) {
        const accObj = this.acceptors.get(prefAccId);
        if (!accObj) continue;

        let partnerOfPrefAcc = null;
        for (const [prop, acc] of matches.entries()) {
          if (acc === prefAccId) {
            partnerOfPrefAcc = prop;
            break;
          }
        }

        if (!partnerOfPrefAcc) {
          return false;
        }

        const rankOfCurrent = accObj.ranking.get(partnerOfPrefAcc);
        const rankOfP = accObj.ranking.get(pId);

        if (rankOfP !== undefined && rankOfCurrent !== undefined && rankOfP < rankOfCurrent) {
          return false;
        }
      }
    }

    return true;
  }
}

export class PatriciaNode {
  constructor(edgeLabel = "") {
    this.edgeLabel = edgeLabel;
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null;
  }
}

export class PatriciaTrieCategoryRouter {
  constructor() {
    this.root = new PatriciaNode("");
    this._size = 0;
  }

  static _commonPrefixLength(s1 = "", s2 = "") {
    let i = 0;
    const maxLen = Math.min(s1.length, s2.length);
    while (i < maxLen && s1[i] === s2[i]) {
      i++;
    }
    return i;
  }

  insert(key, data = {}) {
    if (typeof key !== "string" || key.length === 0) return;

    let curr = this.root;
    let remaining = key;

    while (remaining.length > 0) {
      const firstChar = remaining[0];

      if (!curr.children.has(firstChar)) {
        const newNode = new PatriciaNode(remaining);
        newNode.isEndOfWord = true;
        newNode.data = { ...data, key };
        curr.children.set(firstChar, newNode);
        this._size++;
        return;
      }

      const child = curr.children.get(firstChar);
      const edge = child.edgeLabel;
      const commonLen = PatriciaTrieCategoryRouter._commonPrefixLength(edge, remaining);

      if (commonLen === edge.length) {
        curr = child;
        remaining = remaining.substring(commonLen);
        if (remaining.length === 0) {
          if (!curr.isEndOfWord) {
            curr.isEndOfWord = true;
            this._size++;
          }
          curr.data = { ...data, key };
          return;
        }
      } else {
        const splitPrefix = edge.substring(0, commonLen);
        const splitSuffixEdge = edge.substring(commonLen);
        const splitSuffixRem = remaining.substring(commonLen);

        const splitNode = new PatriciaNode(splitPrefix);
        curr.children.set(firstChar, splitNode);

        child.edgeLabel = splitSuffixEdge;
        splitNode.children.set(splitSuffixEdge[0], child);

        if (splitSuffixRem.length === 0) {
          splitNode.isEndOfWord = true;
          splitNode.data = { ...data, key };
          this._size++;
        } else {
          const newNode = new PatriciaNode(splitSuffixRem);
          newNode.isEndOfWord = true;
          newNode.data = { ...data, key };
          splitNode.children.set(splitSuffixRem[0], newNode);
          this._size++;
        }
        return;
      }
    }
  }

  search(key) {
    if (typeof key !== "string" || key.length === 0) return null;

    let curr = this.root;
    let remaining = key;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      if (!curr.children.has(firstChar)) return null;

      const child = curr.children.get(firstChar);
      const edge = child.edgeLabel;

      if (!remaining.startsWith(edge)) return null;

      remaining = remaining.substring(edge.length);
      curr = child;
    }

    return curr.isEndOfWord ? curr.data : null;
  }

  startsWith(prefix = "") {
    let curr = this.root;
    let remaining = prefix;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      if (!curr.children.has(firstChar)) return [];

      const child = curr.children.get(firstChar);
      const edge = child.edgeLabel;

      if (remaining.length <= edge.length) {
        if (!edge.startsWith(remaining)) return [];
        curr = child;
        break;
      } else {
        if (!remaining.startsWith(edge)) return [];
        remaining = remaining.substring(edge.length);
        curr = child;
      }
    }

    const results = [];
    const collect = (node) => {
      if (node.isEndOfWord && node.data) {
        results.push(node.data);
      }
      for (const child of node.children.values()) {
        collect(child);
      }
    };
    collect(curr);

    return results;
  }

  getBreadcrumb(path = "") {
    const parts = path.split("/").filter(Boolean);
    const breadcrumb = [];
    let cumulative = "";

    for (const part of parts) {
      cumulative = cumulative ? `${cumulative}/${part}` : part;
      const match = this.search(cumulative);
      breadcrumb.push({
        slug: part,
        path: cumulative,
        title: match ? match.title || part : part,
        exists: match !== null
      });
    }

    return breadcrumb;
  }

  countNodes() {
    let count = 0;
    const dfs = (node) => {
      count++;
      for (const child of node.children.values()) {
        dfs(child);
      }
    };
    dfs(this.root);
    return count;
  }

  size() {
    return this._size;
  }
}

// =========================================================================
// PHASE 23 ENTERPRISE ALGORITHMS SUITE (Feature 170)
// 1. Locality-Sensitive Hashing with p-Stable Random Projections (Vector Quantizer)
// 2. Multi-Depot Multi-Stop Fleet Routing Heuristic (Vehicle Routing Problem - VRP)
// 3. Segment Tree with Lazy Propagation for Time-Windowed Flash Sale Inventory
// =========================================================================

export class PStableLSHVectorQuantizer {
  constructor({ dimensions = 8, numHashFunctions = 4, numTables = 3, binWidth = 2.0 } = {}) {
    this.dimensions = dimensions;
    this.k = numHashFunctions;
    this.L = numTables;
    this.w = binWidth;

    this.tables = [];
    this.projections = [];

    this._initHashFunctions();
  }

  static _randomGaussian() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  _initHashFunctions() {
    this.tables = [];
    this.projections = [];

    for (let l = 0; l < this.L; l++) {
      this.tables.push(new Map());
      const tableProjections = [];

      for (let i = 0; i < this.k; i++) {
        const a = [];
        for (let d = 0; d < this.dimensions; d++) {
          a.push(PStableLSHVectorQuantizer._randomGaussian());
        }
        const b = Math.random() * this.w;
        tableProjections.push({ a, b });
      }

      this.projections.push(tableProjections);
    }
  }

  _computeHashKey(vector, tableIdx) {
    const tableProj = this.projections[tableIdx];
    const hashValues = [];

    for (let i = 0; i < this.k; i++) {
      const { a, b } = tableProj[i];
      let dot = 0;
      for (let d = 0; d < this.dimensions; d++) {
        dot += a[d] * (vector[d] || 0);
      }
      const h = Math.floor((dot + b) / this.w);
      hashValues.push(h);
    }

    return hashValues.join(",");
  }

  addVector(id, vector = [], metadata = {}) {
    if (!id || !Array.isArray(vector)) return;

    for (let l = 0; l < this.L; l++) {
      const bucketKey = this._computeHashKey(vector, l);
      const table = this.tables[l];

      if (!table.has(bucketKey)) {
        table.set(bucketKey, []);
      }
      table.get(bucketKey).push({ id, vector: [...vector], metadata: { ...metadata } });
    }
  }

  static euclideanDistance(v1 = [], v2 = []) {
    let sum = 0;
    const len = Math.min(v1.length, v2.length);
    for (let i = 0; i < len; i++) {
      const diff = v1[i] - v2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  queryCandidates(queryVector = [], { topK = 5 } = {}) {
    const candidateMap = new Map();

    for (let l = 0; l < this.L; l++) {
      const bucketKey = this._computeHashKey(queryVector, l);
      const bucket = this.tables[l].get(bucketKey);

      if (bucket) {
        for (const item of bucket) {
          if (!candidateMap.has(item.id)) {
            candidateMap.set(item.id, item);
          }
        }
      }
    }

    const scored = [];
    for (const item of candidateMap.values()) {
      const dist = PStableLSHVectorQuantizer.euclideanDistance(queryVector, item.vector);
      scored.push({
        id: item.id,
        distance: Number(dist.toFixed(4)),
        metadata: item.metadata
      });
    }

    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, topK);
  }

  getStats() {
    let totalBuckets = 0;
    let totalItemsIndexed = 0;

    for (const table of this.tables) {
      totalBuckets += table.size;
      for (const bucket of table.values()) {
        totalItemsIndexed += bucket.length;
      }
    }

    return {
      numTables: this.L,
      dimensions: this.dimensions,
      totalBuckets,
      averageBucketDepth: totalBuckets > 0 ? Number((totalItemsIndexed / totalBuckets).toFixed(2)) : 0
    };
  }
}

export class MultiDepotVRPRouter {
  constructor() {
    this.depots = new Map();
    this.customers = new Map();
  }

  static calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  addDepot(id, lat, lon, metadata = {}) {
    if (!id || typeof lat !== "number" || typeof lon !== "number") return;
    this.depots.set(id, {
      id,
      name: metadata.name || id,
      lat,
      lon,
      maxCapacity: metadata.maxCapacity || 500
    });
  }

  addCustomer(id, lat, lon, metadata = {}) {
    if (!id || typeof lat !== "number" || typeof lon !== "number") return;
    this.customers.set(id, {
      id,
      lat,
      lon,
      demand: metadata.demand || 1,
      orderId: metadata.orderId || id
    });
  }

  static optimizeTour2Opt(tour) {
    if (!Array.isArray(tour) || tour.length <= 3) return tour;

    let improved = true;
    let bestTour = [...tour];

    const tourDist = (t) => {
      let d = 0;
      for (let i = 0; i < t.length - 1; i++) {
        d += MultiDepotVRPRouter.calculateDistanceKm(t[i].lat, t[i].lon, t[i + 1].lat, t[i + 1].lon);
      }
      return d;
    };

    let bestDist = tourDist(bestTour);

    while (improved) {
      improved = false;
      for (let i = 1; i < bestTour.length - 2; i++) {
        for (let j = i + 1; j < bestTour.length - 1; j++) {
          const newTour = [
            ...bestTour.slice(0, i),
            ...bestTour.slice(i, j + 1).reverse(),
            ...bestTour.slice(j + 1)
          ];
          const newDist = tourDist(newTour);

          if (newDist < bestDist - 0.01) {
            bestTour = newTour;
            bestDist = newDist;
            improved = true;
          }
        }
      }
    }

    return bestTour;
  }

  solve({ vehicleCapacity = 50 } = {}) {
    if (this.depots.size === 0 || this.customers.size === 0) {
      return {
        routes: [],
        totalDistanceKm: 0,
        totalCustomersServed: 0,
        co2SavedKg: 0
      };
    }

    const depotClusters = new Map();
    for (const dId of this.depots.keys()) {
      depotClusters.set(dId, []);
    }

    for (const cust of this.customers.values()) {
      let closestDepotId = null;
      let minDistance = Infinity;

      for (const [dId, depot] of this.depots.entries()) {
        const d = MultiDepotVRPRouter.calculateDistanceKm(cust.lat, cust.lon, depot.lat, depot.lon);
        if (d < minDistance) {
          minDistance = d;
          closestDepotId = dId;
        }
      }

      if (closestDepotId) {
        depotClusters.get(closestDepotId).push(cust);
      }
    }

    const allRoutes = [];
    let totalFleetDistance = 0;

    for (const [depotId, assignedCustomers] of depotClusters.entries()) {
      const depot = this.depots.get(depotId);
      if (assignedCustomers.length === 0) continue;

      let remainingCusts = [...assignedCustomers];
      let vehicleNum = 1;

      while (remainingCusts.length > 0) {
        const currentBatch = [];
        let currentLoad = 0;

        for (let i = 0; i < remainingCusts.length; i++) {
          if (currentLoad + remainingCusts[i].demand <= vehicleCapacity) {
            currentBatch.push(remainingCusts[i]);
            currentLoad += remainingCusts[i].demand;
            remainingCusts.splice(i, 1);
            i--;
          }
        }

        if (currentBatch.length === 0 && remainingCusts.length > 0) {
          currentBatch.push(remainingCusts.shift());
        }

        currentBatch.sort((a, b) => {
          const dA = MultiDepotVRPRouter.calculateDistanceKm(depot.lat, depot.lon, a.lat, a.lon);
          const dB = MultiDepotVRPRouter.calculateDistanceKm(depot.lat, depot.lon, b.lat, b.lon);
          return dA - dB;
        });

        const initialTour = [depot, ...currentBatch, depot];
        const optimizedTour = MultiDepotVRPRouter.optimizeTour2Opt(initialTour);

        let tourKm = 0;
        for (let idx = 0; idx < optimizedTour.length - 1; idx++) {
          tourKm += MultiDepotVRPRouter.calculateDistanceKm(
            optimizedTour[idx].lat,
            optimizedTour[idx].lon,
            optimizedTour[idx + 1].lat,
            optimizedTour[idx + 1].lon
          );
        }
        tourKm = Number(tourKm.toFixed(2));
        totalFleetDistance += tourKm;

        allRoutes.push({
          routeId: `ROUTE_${depotId}_VEHICLE_${vehicleNum++}`,
          depotId,
          depotName: depot.name,
          stopsCount: currentBatch.length,
          totalDistanceKm: tourKm,
          estimatedDurationMinutes: Math.round(tourKm * 2.5 + currentBatch.length * 5),
          stops: optimizedTour.map((s, sIdx) => ({
            seq: sIdx,
            id: s.id,
            isDepot: s.id === depotId,
            lat: s.lat,
            lon: s.lon
          }))
        });
      }
    }

    totalFleetDistance = Number(totalFleetDistance.toFixed(2));
    const co2SavedKg = Number((totalFleetDistance * 0.18 * 0.25).toFixed(2));

    return {
      routes: allRoutes,
      totalDistanceKm: totalFleetDistance,
      totalCustomersServed: this.customers.size,
      totalVehiclesUsed: allRoutes.length,
      co2SavedKg
    };
  }
}

export class LazySegmentTreeInventory {
  constructor(size = 24, initialStock = 100, basePrice = 100000) {
    this.n = size;
    this.treeMinStock = new Array(4 * size).fill(0);
    this.treeMinPrice = new Array(4 * size).fill(0);
    this.lazyStock = new Array(4 * size).fill(0);
    this.lazyPriceMultiplier = new Array(4 * size).fill(1.0);

    this._build(1, 0, this.n - 1, initialStock, basePrice);
  }

  _build(node, start, end, initialStock, basePrice) {
    if (start === end) {
      this.treeMinStock[node] = initialStock;
      this.treeMinPrice[node] = basePrice;
      return;
    }

    const mid = (start + end) >> 1;
    this._build(2 * node, start, mid, initialStock, basePrice);
    this._build(2 * node + 1, mid + 1, end, initialStock, basePrice);

    this.treeMinStock[node] = Math.min(this.treeMinStock[2 * node], this.treeMinStock[2 * node + 1]);
    this.treeMinPrice[node] = Math.min(this.treeMinPrice[2 * node], this.treeMinPrice[2 * node + 1]);
  }

  _pushDown(node, start, end) {
    if (start === end) return;

    if (this.lazyStock[node] !== 0) {
      const delta = this.lazyStock[node];
      this.treeMinStock[2 * node] += delta;
      this.treeMinStock[2 * node + 1] += delta;
      this.lazyStock[2 * node] += delta;
      this.lazyStock[2 * node + 1] += delta;
      this.lazyStock[node] = 0;
    }

    if (this.lazyPriceMultiplier[node] !== 1.0) {
      const mult = this.lazyPriceMultiplier[node];
      this.treeMinPrice[2 * node] = Math.round(this.treeMinPrice[2 * node] * mult);
      this.treeMinPrice[2 * node + 1] = Math.round(this.treeMinPrice[2 * node + 1] * mult);
      this.lazyPriceMultiplier[2 * node] *= mult;
      this.lazyPriceMultiplier[2 * node + 1] *= mult;
      this.lazyPriceMultiplier[node] = 1.0;
    }
  }

  updateStockRange(l, r, delta, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return;

    if (l <= start && end <= r) {
      this.treeMinStock[node] += delta;
      this.lazyStock[node] += delta;
      return;
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    this.updateStockRange(l, r, delta, 2 * node, start, mid);
    this.updateStockRange(l, r, delta, 2 * node + 1, mid + 1, end);

    this.treeMinStock[node] = Math.min(this.treeMinStock[2 * node], this.treeMinStock[2 * node + 1]);
  }

  applyPriceDiscountRange(l, r, discountRate = 0.2, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return;

    const multiplier = 1 - discountRate;
    if (l <= start && end <= r) {
      this.treeMinPrice[node] = Math.round(this.treeMinPrice[node] * multiplier);
      this.lazyPriceMultiplier[node] *= multiplier;
      return;
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    this.applyPriceDiscountRange(l, r, discountRate, 2 * node, start, mid);
    this.applyPriceDiscountRange(l, r, discountRate, 2 * node + 1, mid + 1, end);

    this.treeMinPrice[node] = Math.min(this.treeMinPrice[2 * node], this.treeMinPrice[2 * node + 1]);
  }

  queryMinStock(l, r, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return Infinity;
    if (l <= start && end <= r) {
      return this.treeMinStock[node];
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    const leftMin = this.queryMinStock(l, r, 2 * node, start, mid);
    const rightMin = this.queryMinStock(l, r, 2 * node + 1, mid + 1, end);
    return Math.min(leftMin, rightMin);
  }

  queryMinPrice(l, r, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return Infinity;
    if (l <= start && end <= r) {
      return this.treeMinPrice[node];
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    const leftMin = this.queryMinPrice(l, r, 2 * node, start, mid);
    const rightMin = this.queryMinPrice(l, r, 2 * node + 1, mid + 1, end);
    return Math.min(leftMin, rightMin);
  }

  reserveSlot(l, r, quantity = 1) {
    const minAvail = this.queryMinStock(l, r);
    if (minAvail < quantity) {
      return {
        success: false,
        availableStock: minAvail,
        reservedQty: 0,
        reason: "INSUFFICIENT_TIME_WINDOW_STOCK"
      };
    }

    this.updateStockRange(l, r, -quantity);
    return {
      success: true,
      availableStock: minAvail - quantity,
      reservedQty: quantity
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 46: Heavy-Light Decomposition (HLD) on Deep Category Taxonomies (Phase 24)
// ------------------------------------------------------------------------------
class HLDSegmentTree {
  constructor(size) {
    this.n = size;
    this.treeMax = new Float64Array(4 * Math.max(1, size));
    this.lazy = new Float64Array(4 * Math.max(1, size));
  }

  _push(node) {
    if (this.lazy[node] !== 0) {
      const val = this.lazy[node];
      this.lazy[2 * node] += val;
      this.treeMax[2 * node] += val;
      this.lazy[2 * node + 1] += val;
      this.treeMax[2 * node + 1] += val;
      this.lazy[node] = 0;
    }
  }

  updateRange(node, start, end, l, r, val) {
    if (l > end || r < start) return;
    if (l <= start && end <= r) {
      this.treeMax[node] += val;
      this.lazy[node] += val;
      return;
    }
    this._push(node);
    const mid = Math.floor((start + end) / 2);
    this.updateRange(2 * node, start, mid, l, r, val);
    this.updateRange(2 * node + 1, mid + 1, end, l, r, val);
    this.treeMax[node] = Math.max(this.treeMax[2 * node], this.treeMax[2 * node + 1]);
  }

  queryRange(node, start, end, l, r) {
    if (l > end || r < start) return -Infinity;
    if (l <= start && end <= r) return this.treeMax[node];
    this._push(node);
    const mid = Math.floor((start + end) / 2);
    const leftVal = this.queryRange(2 * node, start, mid, l, r);
    const rightVal = this.queryRange(2 * node + 1, mid + 1, end, l, r);
    return Math.max(leftVal, rightVal);
  }
}

export class HeavyLightDecompositionTaxonomy {
  constructor() {
    this.nodes = new Map();
    this.adj = new Map();
    this.rootId = null;
    this.built = false;

    this.parent = new Map();
    this.depth = new Map();
    this.size = new Map();
    this.heavy = new Map();
    this.head = new Map();
    this.pos = new Map();
    this.nodeAtPos = [];
    this.curPos = 0;
    this.segTree = null;
  }

  addCategory(id, name, parentId = null, initialFeeRate = 0) {
    this.nodes.set(id, {
      id,
      name,
      parentId,
      feeRate: Number(initialFeeRate) || 0
    });

    if (!this.adj.has(id)) {
      this.adj.set(id, []);
    }

    if (parentId === null) {
      this.rootId = id;
    } else {
      if (!this.adj.has(parentId)) {
        this.adj.set(parentId, []);
      }
      this.adj.get(parentId).push(id);
    }
    this.built = false;
  }

  build() {
    if (!this.rootId && this.nodes.size > 0) {
      for (const [id, node] of this.nodes.entries()) {
        if (!node.parentId || !this.nodes.has(node.parentId)) {
          this.rootId = id;
          break;
        }
      }
    }

    if (!this.rootId) return;

    this.curPos = 0;
    this.nodeAtPos = new Array(this.nodes.size);

    this._dfsSize(this.rootId, null, 0);
    this._dfsHld(this.rootId, this.rootId);

    this.segTree = new HLDSegmentTree(this.nodes.size);
    for (const [id, node] of this.nodes.entries()) {
      const p = this.pos.get(id);
      if (p !== undefined && node.feeRate !== 0) {
        this.segTree.updateRange(1, 0, this.nodes.size - 1, p, p, node.feeRate);
      }
    }

    this.built = true;
  }

  _dfsSize(u, p, d) {
    this.parent.set(u, p);
    this.depth.set(u, d);
    this.size.set(u, 1);
    this.heavy.set(u, null);

    let maxChildSize = 0;
    const children = this.adj.get(u) || [];

    for (const v of children) {
      if (v === p) continue;
      this._dfsSize(v, u, d + 1);
      const subSize = this.size.get(v);
      this.size.set(u, this.size.get(u) + subSize);

      if (subSize > maxChildSize) {
        maxChildSize = subSize;
        this.heavy.set(u, v);
      }
    }
  }

  _dfsHld(u, h) {
    this.head.set(u, h);
    this.pos.set(u, this.curPos);
    this.nodeAtPos[this.curPos] = u;
    this.curPos++;

    const heavyChild = this.heavy.get(u);
    if (heavyChild) {
      this._dfsHld(heavyChild, h);
    }

    const children = this.adj.get(u) || [];
    for (const v of children) {
      if (v !== this.parent.get(u) && v !== heavyChild) {
        this._dfsHld(v, v);
      }
    }
  }

  _ensureBuilt() {
    if (!this.built) {
      this.build();
    }
  }

  updateSubtree(rootId, deltaFee) {
    this._ensureBuilt();
    if (!this.pos.has(rootId)) return;

    const p = this.pos.get(rootId);
    const sz = this.size.get(rootId);
    this.segTree.updateRange(1, 0, this.nodes.size - 1, p, p + sz - 1, deltaFee);
  }

  querySubtreeMax(rootId) {
    this._ensureBuilt();
    if (!this.pos.has(rootId)) return 0;

    const p = this.pos.get(rootId);
    const sz = this.size.get(rootId);
    const res = this.segTree.queryRange(1, 0, this.nodes.size - 1, p, p + sz - 1);
    return res === -Infinity ? 0 : Number(res.toFixed(4));
  }

  updatePath(u, v, deltaFee) {
    this._ensureBuilt();
    if (!this.pos.has(u) || !this.pos.has(v)) return;

    let currU = u;
    let currV = v;

    while (this.head.get(currU) !== this.head.get(currV)) {
      if (this.depth.get(this.head.get(currU)) > this.depth.get(this.head.get(currV))) {
        const h = this.head.get(currU);
        this.segTree.updateRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currU), deltaFee);
        currU = this.parent.get(h);
      } else {
        const h = this.head.get(currV);
        this.segTree.updateRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currV), deltaFee);
        currV = this.parent.get(h);
      }
    }

    const pU = this.pos.get(currU);
    const pV = this.pos.get(currV);
    this.segTree.updateRange(1, 0, this.nodes.size - 1, Math.min(pU, pV), Math.max(pU, pV), deltaFee);
  }

  queryPathMax(u, v) {
    this._ensureBuilt();
    if (!this.pos.has(u) || !this.pos.has(v)) return 0;

    let currU = u;
    let currV = v;
    let maxVal = -Infinity;

    while (this.head.get(currU) !== this.head.get(currV)) {
      if (this.depth.get(this.head.get(currU)) > this.depth.get(this.head.get(currV))) {
        const h = this.head.get(currU);
        const val = this.segTree.queryRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currU));
        maxVal = Math.max(maxVal, val);
        currU = this.parent.get(h);
      } else {
        const h = this.head.get(currV);
        const val = this.segTree.queryRange(1, 0, this.nodes.size - 1, this.pos.get(h), this.pos.get(currV));
        maxVal = Math.max(maxVal, val);
        currV = this.parent.get(h);
      }
    }

    const pU = this.pos.get(currU);
    const pV = this.pos.get(currV);
    const val = this.segTree.queryRange(1, 0, this.nodes.size - 1, Math.min(pU, pV), Math.max(pU, pV));
    maxVal = Math.max(maxVal, val);

    return maxVal === -Infinity ? 0 : Number(maxVal.toFixed(4));
  }

  getLCA(u, v) {
    this._ensureBuilt();
    if (!this.pos.has(u) || !this.pos.has(v)) return null;

    let currU = u;
    let currV = v;

    while (this.head.get(currU) !== this.head.get(currV)) {
      if (this.depth.get(this.head.get(currU)) > this.depth.get(this.head.get(currV))) {
        currU = this.parent.get(this.head.get(currU));
      } else {
        currV = this.parent.get(this.head.get(currV));
      }
    }

    return this.depth.get(currU) < this.depth.get(currV) ? currU : currV;
  }

  getBreadcrumb(u) {
    this._ensureBuilt();
    if (!this.nodes.has(u)) return [];

    const path = [];
    let curr = u;
    while (curr) {
      const node = this.nodes.get(curr);
      if (node) path.unshift({ id: node.id, name: node.name });
      curr = this.parent.get(curr);
    }
    return path;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 47: Simulated Annealing Warehouse Slotting Optimizer (Phase 24)
// ------------------------------------------------------------------------------
export class SimulatedAnnealingWarehouseSlotter {
  constructor(options = {}) {
    this.initialTemperature = options.initialTemperature || 1000;
    this.coolingRate = options.coolingRate || 0.95;
    this.minTemperature = options.minTemperature || 1e-3;
    this.iterationsPerTemp = options.iterationsPerTemp || 20;

    this.slots = new Map();
    this.skus = new Map();
    this.affinities = new Map();
  }

  addSlot(id, { distToPacking, shelf = 1, aisle = 1 }) {
    this.slots.set(id, {
      id,
      distToPacking: Number(distToPacking),
      shelf: Number(shelf),
      aisle: Number(aisle)
    });
  }

  addSku(id, { name = "", picksPerDay = 1, weightKg = 1 }) {
    this.skus.set(id, {
      id,
      name,
      picksPerDay: Math.max(1, Number(picksPerDay)),
      weightKg: Math.max(0.1, Number(weightKg))
    });
  }

  addAffinity(skuA, skuB, coPickCount) {
    const key = [skuA, skuB].sort().join("::");
    this.affinities.set(key, (this.affinities.get(key) || 0) + Number(coPickCount));
  }

  calculateEnergy(skuToSlot) {
    let travelEnergy = 0;
    let ergonomicsPenalty = 0;
    let affinityEnergy = 0;

    const slotMap = this.slots;

    for (const [skuId, slotId] of skuToSlot.entries()) {
      const sku = this.skus.get(skuId);
      const slot = slotMap.get(slotId);
      if (!sku || !slot) continue;

      travelEnergy += sku.picksPerDay * slot.distToPacking;

      if (sku.weightKg > 5 && slot.shelf > 1) {
        ergonomicsPenalty += sku.weightKg * (slot.shelf - 1) * 15;
      }
    }

    for (const [pairKey, count] of this.affinities.entries()) {
      const [skuA, skuB] = pairKey.split("::");
      const slotAId = skuToSlot.get(skuA);
      const slotBId = skuToSlot.get(skuB);

      if (slotAId && slotBId) {
        const slotA = slotMap.get(slotAId);
        const slotB = slotMap.get(slotBId);
        const dist = Math.abs(slotA.distToPacking - slotB.distToPacking) + Math.abs(slotA.aisle - slotB.aisle) * 10;
        affinityEnergy += count * dist;
      }
    }

    return travelEnergy + ergonomicsPenalty + affinityEnergy * 0.5;
  }

  optimize() {
    const skuIds = Array.from(this.skus.keys());
    const slotIds = Array.from(this.slots.keys());

    if (skuIds.length === 0 || slotIds.length === 0) {
      return {
        assignment: new Map(),
        initialEnergy: 0,
        finalEnergy: 0,
        improvementPercent: 0,
        iterations: 0
      };
    }

    if (slotIds.length < skuIds.length) {
      throw new Error("INSUFFICIENT_SLOTS: Số lượng vị trí kho ít hơn số lượng SKU cần xếp!");
    }

    let currentAssignment = new Map();
    for (let i = 0; i < skuIds.length; i++) {
      currentAssignment.set(skuIds[i], slotIds[i]);
    }

    let currentEnergy = this.calculateEnergy(currentAssignment);
    const initialEnergy = currentEnergy;

    let bestAssignment = new Map(currentAssignment);
    let bestEnergy = currentEnergy;

    let T = this.initialTemperature;
    let totalIterations = 0;

    while (T > this.minTemperature) {
      for (let iter = 0; iter < this.iterationsPerTemp; iter++) {
        totalIterations++;

        const nextAssignment = new Map(currentAssignment);

        const idxA = Math.floor(Math.random() * skuIds.length);
        const skuA = skuIds[idxA];

        if (Math.random() < 0.5 && skuIds.length > 1) {
          let idxB = Math.floor(Math.random() * skuIds.length);
          while (idxB === idxA) {
            idxB = Math.floor(Math.random() * skuIds.length);
          }
          const skuB = skuIds[idxB];
          const slotA = nextAssignment.get(skuA);
          const slotB = nextAssignment.get(skuB);
          nextAssignment.set(skuA, slotB);
          nextAssignment.set(skuB, slotA);
        } else {
          const randomSlotId = slotIds[Math.floor(Math.random() * slotIds.length)];
          let occupantSku = null;
          for (const [sId, slId] of nextAssignment.entries()) {
            if (slId === randomSlotId && sId !== skuA) {
              occupantSku = sId;
              break;
            }
          }

          const oldSlotA = nextAssignment.get(skuA);
          nextAssignment.set(skuA, randomSlotId);
          if (occupantSku) {
            nextAssignment.set(occupantSku, oldSlotA);
          }
        }

        const nextEnergy = this.calculateEnergy(nextAssignment);
        const deltaEnergy = nextEnergy - currentEnergy;

        if (deltaEnergy < 0 || Math.random() < Math.exp(-deltaEnergy / T)) {
          currentAssignment = nextAssignment;
          currentEnergy = nextEnergy;

          if (currentEnergy < bestEnergy) {
            bestEnergy = currentEnergy;
            bestAssignment = new Map(currentAssignment);
          }
        }
      }

      T *= this.coolingRate;
    }

    const improvementPercent = initialEnergy > 0
      ? Number((((initialEnergy - bestEnergy) / initialEnergy) * 100).toFixed(2))
      : 0;

    return {
      assignment: bestAssignment,
      initialEnergy: Math.round(initialEnergy),
      finalEnergy: Math.round(bestEnergy),
      improvementPercent: Math.max(0, improvementPercent),
      iterations: totalIterations
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 48: Time-Decayed Reservoir Sampling for Live Hot Deals Stream (Phase 24)
// ------------------------------------------------------------------------------
export class TimeDecayedReservoirSampler {
  constructor(capacity = 10, { decayLambda = 0.0001 } = {}) {
    this.capacity = Math.max(1, capacity);
    this.decayLambda = Math.max(1e-8, decayLambda);
    this.reservoir = [];
    this.totalProcessed = 0;
  }

  _computeKey(baseWeight, timestamp, referenceTime) {
    const u = Math.random();
    const safeU = Math.max(1e-7, Math.min(0.9999999, u));
    const ageSeconds = Math.max(0, (referenceTime - timestamp) / 1000);
    const decayedWeight = Math.max(1e-6, baseWeight * Math.exp(-this.decayLambda * ageSeconds));

    return Math.pow(safeU, 1.0 / decayedWeight);
  }

  addItem(item, timestamp = Date.now(), baseWeight = 1.0) {
    this.totalProcessed++;
    const now = Date.now();
    const key = this._computeKey(baseWeight, timestamp, now);

    const entry = {
      item,
      key,
      timestamp,
      baseWeight: Number(baseWeight) || 1.0,
      id: item.id || `ITEM_${this.totalProcessed}`
    };

    if (this.reservoir.length < this.capacity) {
      this.reservoir.push(entry);
      this.reservoir.sort((a, b) => a.key - b.key);
      return true;
    }

    if (key > this.reservoir[0].key) {
      this.reservoir[0] = entry;
      this.reservoir.sort((a, b) => a.key - b.key);
      return true;
    }

    return false;
  }

  getSample() {
    return [...this.reservoir]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(entry => ({
        ...entry.item,
        sampledKey: Number(entry.key.toFixed(6)),
        timestamp: entry.timestamp,
        ageSeconds: Math.round((Date.now() - entry.timestamp) / 1000)
      }));
  }

  getTrendingDeals(topK = 5) {
    const now = Date.now();
    return [...this.reservoir]
      .map(entry => {
        const ageSec = Math.max(0, (now - entry.timestamp) / 1000);
        const currentEffectiveWeight = entry.baseWeight * Math.exp(-this.decayLambda * ageSec);
        return {
          ...entry.item,
          effectiveWeight: Number(currentEffectiveWeight.toFixed(4)),
          ageSeconds: Math.round(ageSec)
        };
      })
      .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
      .slice(0, topK);
  }

  clear() {
    this.reservoir = [];
    this.totalProcessed = 0;
  }

  get size() {
    return this.reservoir.length;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 49: Dinic's Multi-Source Multi-Sink Fulfillment Network Flow (Phase 25)
// ------------------------------------------------------------------------------
class DinicEdge {
  constructor(to, capacity, revIndex, from = null) {
    this.from = from;
    this.to = to;
    this.capacity = capacity;
    this.flow = 0;
    this.revIndex = revIndex;
  }
}

export class DinicBipartiteFulfillmentFlow {
  constructor() {
    this.adj = new Map();
    this.nodes = new Set();
    this.level = new Map();
    this.ptr = new Map();
    this.nodeMetadata = new Map();
  }

  addNode(id, metadata = {}) {
    this.nodes.add(id);
    if (!this.adj.has(id)) {
      this.adj.set(id, []);
    }
    this.nodeMetadata.set(id, { id, ...metadata });
  }

  addEdge(u, v, capacity) {
    this.addNode(u);
    this.addNode(v);

    const cap = Math.max(0, Number(capacity) || 0);
    const forwardEdges = this.adj.get(u);
    const backwardEdges = this.adj.get(v);

    const forwardEdge = new DinicEdge(v, cap, backwardEdges.length, u);
    const backwardEdge = new DinicEdge(u, 0, forwardEdges.length, v);

    forwardEdges.push(forwardEdge);
    backwardEdges.push(backwardEdge);
  }

  _bfs(source, sink) {
    this.level.clear();
    for (const node of this.nodes) {
      this.level.set(node, -1);
    }

    const queue = [source];
    this.level.set(source, 0);

    while (queue.length > 0) {
      const u = queue.shift();
      const uLevel = this.level.get(u);
      const edges = this.adj.get(u) || [];

      for (const edge of edges) {
        if (edge.capacity - edge.flow > 0 && this.level.get(edge.to) === -1) {
          this.level.set(edge.to, uLevel + 1);
          queue.push(edge.to);
        }
      }
    }

    return this.level.get(sink) !== -1;
  }

  _dfs(u, pushed, sink) {
    if (pushed === 0 || u === sink) return pushed;

    const edges = this.adj.get(u) || [];
    let startIdx = this.ptr.get(u) || 0;

    for (let cid = startIdx; cid < edges.length; cid++) {
      this.ptr.set(u, cid);
      const edge = edges[cid];
      const tr = edge.to;

      if (this.level.get(u) + 1 !== this.level.get(tr) || edge.capacity - edge.flow === 0) {
        continue;
      }

      const trPushed = this._dfs(tr, Math.min(pushed, edge.capacity - edge.flow), sink);
      if (trPushed === 0) continue;

      edge.flow += trPushed;
      const revEdge = this.adj.get(edge.to)[edge.revIndex];
      revEdge.flow -= trPushed;

      return trPushed;
    }

    return 0;
  }

  computeMaxFlow(source, sink) {
    if (!this.nodes.has(source) || !this.nodes.has(sink)) {
      return {
        maxFlow: 0,
        bottlenecks: [],
        flows: []
      };
    }

    for (const edges of this.adj.values()) {
      for (const e of edges) {
        e.flow = 0;
      }
    }

    let totalFlow = 0;

    while (this._bfs(source, sink)) {
      this.ptr.clear();
      for (const node of this.nodes) {
        this.ptr.set(node, 0);
      }

      let pushed = this._dfs(source, Infinity, sink);
      while (pushed > 0) {
        totalFlow += pushed;
        pushed = this._dfs(source, Infinity, sink);
      }
    }

    const reachableFromSource = new Set();
    const q = [source];
    reachableFromSource.add(source);

    while (q.length > 0) {
      const u = q.shift();
      const edges = this.adj.get(u) || [];
      for (const e of edges) {
        if (e.capacity - e.flow > 0 && !reachableFromSource.has(e.to)) {
          reachableFromSource.add(e.to);
          q.push(e.to);
        }
      }
    }

    const bottlenecks = [];
    const activeFlows = [];

    for (const [u, edges] of this.adj.entries()) {
      for (const e of edges) {
        if (e.capacity > 0) {
          activeFlows.push({
            from: u,
            to: e.to,
            flow: e.flow,
            capacity: e.capacity,
            utilizationRate: Number(((e.flow / e.capacity) * 100).toFixed(1))
          });

          if (reachableFromSource.has(u) && !reachableFromSource.has(e.to)) {
            bottlenecks.push({
              from: u,
              to: e.to,
              capacity: e.capacity,
              saturatedFlow: e.flow
            });
          }
        }
      }
    }

    return {
      maxFlow: totalFlow,
      bottlenecks,
      activeFlows,
      reachableNodesCount: reachableFromSource.size
    };
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 50: K-D Tree for Multi-Attribute Geo & Pricing Radius Search (Phase 25)
// ------------------------------------------------------------------------------
class InternalKDNode {
  constructor(point, data, axis) {
    this.point = point;
    this.data = data;
    this.axis = axis;
    this.left = null;
    this.right = null;
  }
}

export class KDTreeSpatialCatalog {
  constructor(dimensions = ['lat', 'lon', 'price', 'rating']) {
    this.dimensions = dimensions;
    this.k = dimensions.length;
    this.root = null;
    this.size = 0;
  }

  static calculateHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  build(items = []) {
    this.size = items.length;
    const formatted = items.map(item => {
      const point = this.dimensions.map(dim => Number(item[dim]) || 0);
      return { point, data: item };
    });

    this.root = this._buildTree(formatted, 0);
  }

  _buildTree(points, depth) {
    if (points.length === 0) return null;

    const axis = depth % this.k;
    points.sort((a, b) => a.point[axis] - b.point[axis]);
    const medianIdx = Math.floor(points.length / 2);
    const median = points[medianIdx];

    const node = new InternalKDNode(median.point, median.data, axis);
    node.left = this._buildTree(points.slice(0, medianIdx), depth + 1);
    node.right = this._buildTree(points.slice(medianIdx + 1), depth + 1);

    return node;
  }

  insert(item) {
    const point = this.dimensions.map(dim => Number(item[dim]) || 0);
    const newNode = new InternalKDNode(point, item, 0);

    if (!this.root) {
      this.root = newNode;
      this.size++;
      return;
    }

    let curr = this.root;
    let depth = 0;

    while (true) {
      const axis = depth % this.k;
      if (point[axis] < curr.point[axis]) {
        if (!curr.left) {
          newNode.axis = (depth + 1) % this.k;
          curr.left = newNode;
          this.size++;
          break;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          newNode.axis = (depth + 1) % this.k;
          curr.right = newNode;
          this.size++;
          break;
        }
        curr = curr.right;
      }
      depth++;
    }
  }

  rangeSearch(minBounds, maxBounds) {
    const results = [];
    this._rangeSearch(this.root, minBounds, maxBounds, 0, results);
    return results;
  }

  _rangeSearch(node, minBounds, maxBounds, depth, results) {
    if (!node) return;

    let inside = true;
    for (let i = 0; i < this.k; i++) {
      if (node.point[i] < minBounds[i] || node.point[i] > maxBounds[i]) {
        inside = false;
        break;
      }
    }

    if (inside) {
      results.push(node.data);
    }

    const axis = depth % this.k;

    if (minBounds[axis] <= node.point[axis]) {
      this._rangeSearch(node.left, minBounds, maxBounds, depth + 1, results);
    }

    if (maxBounds[axis] >= node.point[axis]) {
      this._rangeSearch(node.right, minBounds, maxBounds, depth + 1, results);
    }
  }

  kNearestNeighbors(targetPoint, k = 5) {
    const best = [];

    const distSq = (p1, p2) => {
      let sum = 0;
      for (let i = 0; i < this.k; i++) {
        const diff = p1[i] - p2[i];
        sum += diff * diff;
      }
      return sum;
    };

    const search = (node, depth) => {
      if (!node) return;

      const d = distSq(targetPoint, node.point);

      if (best.length < k) {
        best.push({ item: node.data, distSq: d });
        best.sort((a, b) => a.distSq - b.distSq);
      } else if (d < best[best.length - 1].distSq) {
        best[best.length - 1] = { item: node.data, distSq: d };
        best.sort((a, b) => a.distSq - b.distSq);
      }

      const axis = depth % this.k;
      const axisDiff = targetPoint[axis] - node.point[axis];

      const nearNode = axisDiff < 0 ? node.left : node.right;
      const farNode = axisDiff < 0 ? node.right : node.left;

      search(nearNode, depth + 1);

      const maxDistSq = best.length < k ? Infinity : best[best.length - 1].distSq;
      if (axisDiff * axisDiff < maxDistSq) {
        search(farNode, depth + 1);
      }
    };

    search(this.root, 0);

    return best.map(entry => ({
      item: entry.item,
      distance: Number(Math.sqrt(entry.distSq).toFixed(4))
    }));
  }

  geoRadiusSearch(centerLat, centerLon, radiusKm, { minPrice = 0, maxPrice = Infinity, minRating = 0 } = {}) {
    const deltaLat = radiusKm / 111.0;
    const deltaLon = radiusKm / (111.0 * Math.cos((centerLat * Math.PI) / 180));

    const minBounds = [
      centerLat - deltaLat,
      centerLon - deltaLon,
      minPrice,
      minRating
    ];

    const maxBounds = [
      centerLat + deltaLat,
      centerLon + deltaLon,
      maxPrice,
      5.0
    ];

    const candidates = this.rangeSearch(minBounds, maxBounds);
    const inRadius = [];

    for (const item of candidates) {
      const d = KDTreeSpatialCatalog.calculateHaversineKm(centerLat, centerLon, item.lat, item.lon);
      if (d <= radiusKm) {
        inRadius.push({
          ...item,
          distanceKm: d
        });
      }
    }

    inRadius.sort((a, b) => a.distanceKm - b.distanceKm);
    return inRadius;
  }
}

// ------------------------------------------------------------------------------
// ALGORITHM 51: HyperLogLog++ with Bias Correction & Sparse Representation (Phase 25)
// ------------------------------------------------------------------------------
export class HyperLogLogPlusPlusCardinality {
  constructor(p = 12) {
    this.p = Math.min(16, Math.max(4, p));
    this.m = 1 << this.p;
    this.isSparseMode = true;
    this.sparseSet = new Set();
    this.sparseThreshold = Math.floor(this.m * 0.75);
    this.registers = null;

    if (this.m === 16) this.alpha = 0.673;
    else if (this.m === 32) this.alpha = 0.697;
    else if (this.m === 64) this.alpha = 0.709;
    else this.alpha = 0.7213 / (1 + 1.079 / this.m);

    this.totalAdded = 0;
  }

  static _murmur3(str, seed = 0) {
    const s = String(str);
    let h1 = seed >>> 0;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let i = 0;
    const len = s.length;

    while (i + 4 <= len) {
      let k1 = (s.charCodeAt(i) & 0xff) |
               ((s.charCodeAt(i + 1) & 0xff) << 8) |
               ((s.charCodeAt(i + 2) & 0xff) << 16) |
               ((s.charCodeAt(i + 3) & 0xff) << 24);
      i += 4;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);

      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
    }

    let k1 = 0;
    const rem = len - i;
    if (rem === 3) k1 ^= (s.charCodeAt(i + 2) & 0xff) << 16;
    if (rem >= 2) k1 ^= (s.charCodeAt(i + 1) & 0xff) << 8;
    if (rem >= 1) {
      k1 ^= (s.charCodeAt(i) & 0xff);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
    }

    h1 ^= len;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
  }

  static _hash64(str) {
    const s = String(str);
    const h1 = HyperLogLogPlusPlusCardinality._murmur3(s, 0);
    const h2 = HyperLogLogPlusPlusCardinality._murmur3(s, 0x9747b28c);
    return [h1, h2];
  }

  static _countLeadingZeros(val, maxBits = 32) {
    if (val === 0) return maxBits;
    return Math.clz32(val);
  }

  add(item) {
    this.totalAdded++;
    if (this.isSparseMode) {
      this.sparseSet.add(String(item));
      if (this.sparseSet.size >= this.sparseThreshold) {
        this._convertToDense();
      }
      return;
    }

    const [h1, h2] = HyperLogLogPlusPlusCardinality._hash64(item);
    const index = h1 >>> (32 - this.p);
    const remainder = ((h1 << this.p) | (h2 >>> (32 - this.p))) >>> 0;
    const rho = Math.min(32, HyperLogLogPlusPlusCardinality._countLeadingZeros(remainder) + 1);

    if (rho > this.registers[index]) {
      this.registers[index] = rho;
    }
  }

  _convertToDense() {
    this.registers = new Uint8Array(this.m);
    for (const item of this.sparseSet) {
      const [h1, h2] = HyperLogLogPlusPlusCardinality._hash64(item);
      const index = h1 >>> (32 - this.p);
      const remainder = ((h1 << this.p) | (h2 >>> (32 - this.p))) >>> 0;
      const rho = Math.min(32, HyperLogLogPlusPlusCardinality._countLeadingZeros(remainder) + 1);
      if (rho > this.registers[index]) {
        this.registers[index] = rho;
      }
    }
    this.sparseSet.clear();
    this.isSparseMode = false;
  }

  count() {
    if (this.isSparseMode) {
      return this.sparseSet.size;
    }

    let sum = 0;
    let zeroCount = 0;

    for (let i = 0; i < this.m; i++) {
      const val = this.registers[i];
      sum += Math.pow(2, -val);
      if (val === 0) {
        zeroCount++;
      }
    }

    let estimate = (this.alpha * this.m * this.m) / sum;

    if (estimate <= 2.5 * this.m && zeroCount > 0) {
      estimate = this.m * Math.log(this.m / zeroCount);
    }

    return Math.round(estimate);
  }

  merge(other) {
    if (this.p !== other.p) {
      throw new Error(`INCOMPATIBLE_PRECISION: Không thể gộp 2 HLL++ có p khác nhau (${this.p} !== ${other.p})`);
    }

    if (this.isSparseMode && other.isSparseMode) {
      for (const val of other.sparseSet) {
        this.sparseSet.add(val);
      }
      if (this.sparseSet.size >= this.sparseThreshold) {
        this._convertToDense();
      }
      return;
    }

    if (this.isSparseMode) {
      this._convertToDense();
    }

    if (other.isSparseMode) {
      for (const item of other.sparseSet) {
        const [h1, h2] = HyperLogLogPlusPlusCardinality._hash64(item);
        const index = h1 >>> (32 - this.p);
        const remainder = ((h1 << this.p) | (h2 >>> (32 - this.p))) >>> 0;
        const rho = Math.min(32, HyperLogLogPlusPlusCardinality._countLeadingZeros(remainder) + 1);
        if (rho > this.registers[index]) {
          this.registers[index] = rho;
        }
      }
    } else {
      for (let i = 0; i < this.m; i++) {
        if (other.registers[i] > this.registers[i]) {
          this.registers[i] = other.registers[i];
        }
      }
    }
  }

  getStats() {
    return {
      precision: this.p,
      numRegisters: this.m,
      isSparse: this.isSparseMode,
      sparseEntriesCount: this.sparseSet.size,
      estimatedCardinality: this.count(),
      totalStreamEventsProcessed: this.totalAdded,
      standardErrorPercent: Number(((1.04 / Math.sqrt(this.m)) * 100).toFixed(2))
    };
  }

  clear() {
    this.isSparseMode = true;
    this.sparseSet.clear();
    this.registers = null;
    this.totalAdded = 0;
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
  RecommendationEngine,
  AhoCorasick,
  calculateHaversineDistance,
  optimizeDeliveryRoute,
  CountMinSketch,
  HyperLogLog,
  knapsack01,
  findOptimalAddonToUnlockVoucher,
  DynamicPricingBandit,
  sampleBeta,
  DisjointSetUnion,
  SybilFraudRadar,
  TrieAutocomplete,
  removeVietnameseTones,
  sha256,
  DoubleEntryLedger,
  MerkleTree,
  SkiplistIndex,
  MultiWarehouseDispatcher,
  // Phase 9 Enterprise Algorithms
  LSH_PRIME,
  kShingles,
  MinHash,
  MinHashLSH,
  LSHCloneDetector,
  CatalogCloneRadar,
  AuctionEngine,
  GspAuctionEngine,
  VcgAuctionEngine,
  PNCounter,
  LWWElementSet,
  CrdtCart,
  // Phase 10 Enterprise Distributed Algorithms
  cosineDistance,
  euclideanDistance,
  PriorityQueue,
  HNSWNode,
  HNSWIndex,
  solveHungarian,
  SPXDispatchEngine,
  NodeRole,
  RaftNode,
  FlashSaleStateMachine,
  RaftCluster,
  // Phase 11 Enterprise Algorithms
  FPNode,
  FPTree,
  FPGrowthBundler,
  SPX_STANDARD_BOXES,
  calculateVolumetricWeight,
  MaximalRectanglesPacker,
  SPXBoxOptimizer,
  MemberStatus,
  ClusterMember,
  SwimNode,
  SwimCluster,
  // Phase 12 Enterprise Algorithms
  SPX_DEFAULT_HUBS,
  SPX_DEFAULT_ROUTES,
  SPXHubGraphRouter,
  ArrayContainer,
  BitmapContainer,
  RoaringBitmap,
  FacetedCatalogIndex,
  RFM_SEGMENT_RULES,
  RFMSegmentationEngine,
  // Phase 13 Enterprise Algorithms
  INVENTORY_AGE_TIERS,
  InventoryDecayOptimizer,
  encodeGeohash,
  decodeGeohash,
  calculateHaversineKm,
  getGeohashNeighbors,
  GeohashSpatialIndex,
  invertMatrix,
  matrixVectorMultiply,
  dotProduct,
  LinUCBRecommender,
  // Phase 14 Enterprise Algorithms
  PidBiddingController,
  EdmondsKarpMaxFlow,
  PerceptualImageHash,
  ImageHashIndex,
  // Phase 15 Enterprise Algorithms
  PriceElasticitySimulator,
  HopcroftKarpMatching,
  LSMTreeClickstream,
  // Phase 16 Enterprise Algorithms
  DynamicTimeWarping,
  HierarchicalKMeans,
  ReservoirSampling,
  // Phase 17 Enterprise Algorithms
  SimHashReviewSpam,
  AhoCorasickNode,
  AhoCorasickModerator,
  BellmanFordArbitrage,
  // Phase 18 Enterprise Algorithms
  JohnsonGraphRouting,
  SAMState,
  SuffixAutomatonDeduplicator,
  CuckooFilterRevocation,
  // Phase 19 Enterprise Algorithms
  DLXNode,
  DancingLinksExactCover,
  StreamEntry,
  SpaceSavingHeavyHitters,
  KademliaContact,
  KademliaDhtRouting,
  // Phase 20 Enterprise Algorithms
  FisherYatesFairRaffle,
  PrefixSpanSequentialMining,
  AlphaNode,
  PromotionRule,
  RetePromotionEngine,
  // Phase 21 Enterprise Algorithms
  HNSWVectorReranker,
  TarjanSccFraudDetector,
  TimsortCatalogSorter,
  // Phase 22 Enterprise Algorithms
  HoltWintersDemandForecaster,
  GaleShapleyStableMatcher,
  PatriciaNode,
  PatriciaTrieCategoryRouter,
  // Phase 23 Enterprise Algorithms
  PStableLSHVectorQuantizer,
  MultiDepotVRPRouter,
  LazySegmentTreeInventory,
  // Phase 24 Enterprise Algorithms
  HeavyLightDecompositionTaxonomy,
  SimulatedAnnealingWarehouseSlotter,
  TimeDecayedReservoirSampler,
  // Phase 25 Enterprise Algorithms
  DinicBipartiteFulfillmentFlow,
  KDTreeSpatialCatalog,
  HyperLogLogPlusPlusCardinality,
};



