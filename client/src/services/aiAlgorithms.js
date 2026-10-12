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

export function calculateHaversineDistance(locA, locB) {
  if (!locA || !locB) return 0;
  const lat1 = locA.lat || locA.latitude || 0;
  const lon1 = locA.lng || locA.lon || locA.longitude || 0;
  const lat2 = locB.lat || locB.latitude || 0;
  const lon2 = locB.lng || locB.lon || locB.longitude || 0;

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
};
