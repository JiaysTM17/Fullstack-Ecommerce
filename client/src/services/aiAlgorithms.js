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
};

