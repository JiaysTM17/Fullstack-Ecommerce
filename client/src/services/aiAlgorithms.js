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

export default {
  calculateLevenshteinDistance,
  findClosestTerm,
  BM25Engine,
  calculateCosineSimilarity,
  createTfEmbedding,
  analyzeSentiment,
};
