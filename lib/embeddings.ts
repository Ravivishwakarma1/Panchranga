/**
 * Panchranga Multilingual Vector Embedding Module (384 Dimensions)
 * Supports English, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati.
 */

export const EMBEDDING_DIMENSION = 384;

/**
 * Normalizes a vector to unit length (L2 norm = 1) for cosine similarity calculation via dot product.
 */
export function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
}

/**
 * Stopwords to filter out generic grammatical noise from similarity matching.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
  'must', 'news', 'latest', 'india', 'today', 'live', 'updates', 'pm', 'says'
]);

/**
 * Generates a 384-dimensional vector embedding for multilingual text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Unicode regex matching letters & numbers across all Indian scripts
  const clean = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  const words = clean.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Primary word token hash
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSION;
    vector[idx] += 2.0;

    // Sub-word 3-grams for fuzzy word matching
    if (word.length >= 3) {
      for (let j = 0; j <= word.length - 3; j++) {
        const gram = word.substring(j, j + 3);
        let gHash = 0;
        for (let c = 0; c < gram.length; c++) {
          gHash = (gHash << 5) - gHash + gram.charCodeAt(c);
          gHash |= 0;
        }
        const gIdx = Math.abs(gHash) % EMBEDDING_DIMENSION;
        vector[gIdx] += 0.8;
      }
    }
  }

  return normalizeVector(vector);
}

/**
 * Calculates Cosine Similarity between two 384-dim vector embeddings.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
