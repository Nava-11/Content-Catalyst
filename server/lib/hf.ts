import natural from "natural";
import { pipeline } from "@xenova/transformers";

let embeddingPipelinePromise: Promise<any> | null = null;

// Very small in-memory cache so repeated calls for the same
// texts (e.g. during /api/recommendations refreshes) do not
// recompute embeddings. This stays process-local and keeps
// behaviour deterministic for a given input.
const embeddingCache = new Map<string, number[]>();

async function getEmbeddingPipeline() {
  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return embeddingPipelinePromise;
}

function localTfIdfEmbeddings(texts: string[], dims = 128): number[][] {
  // deterministic TF-IDF based fallback embedding using `natural`
  const tfidf = new natural.TfIdf();
  texts.forEach(t => tfidf.addDocument(t || ""));

  // build a vocabulary of top terms across all documents
  const termScores: Record<string, number> = {};
  for (let i = 0; i < texts.length; i++) {
    tfidf.listTerms(i).slice(0, 50).forEach((it: any) => {
      termScores[it.term] = (termScores[it.term] || 0) + it.tfidf;
    });
  }
  const vocab = Object.entries(termScores).sort((a, b) => b[1] - a[1]).slice(0, dims).map(e => e[0]);

  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    const vec = new Array(vocab.length).fill(0);
    const terms = tfidf.listTerms(i);
    const map: Record<string, number> = {};
    terms.forEach((t: any) => map[t.term] = t.tfidf);
    for (let j = 0; j < vocab.length; j++) vec[j] = map[vocab[j]] || 0;
    // normalize
    const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
    embeddings.push(vec.map(v => v / norm));
  }
  return embeddings;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  try {
    const extractor = await getEmbeddingPipeline();
    const vectors: number[][] = [];

    for (const raw of texts) {
      const input = (raw || "").trim();
      if (!input) {
        vectors.push([]);
        continue;
      }

      const cached = embeddingCache.get(input);
      if (cached) {
        vectors.push(cached);
        continue;
      }

      const output: any = await extractor(input, {
        pooling: "mean",
        normalize: true,
      });

      // @xenova/transformers returns a Tensor; convert to plain array
      const tensor = Array.isArray(output) ? output[0] : output;
      const data: any = tensor.data || tensor;
      const arr = Array.from(data as Iterable<number>);
      embeddingCache.set(input, arr);
      vectors.push(arr);
    }

    return vectors;
  } catch (err) {
    console.warn(
      "Local embedding pipeline failed, falling back to TF-IDF embeddings:",
      err
    );
    return localTfIdfEmbeddings(texts, 128);
  }
}

export async function embedText(text: string): Promise<number[]> {
  const r = await embedTexts([text]);
  return r[0];
}

// Summarise a cluster of video titles into a short, human-readable topic label
// using only deterministic NLP. This does not depend on HuggingFace and works
// even when external APIs are unavailable.
export function summarizeClusterLabel(titles: string[]): string {
  const cleaned = (titles || [])
    .map((t) => (t || "").trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!cleaned.length) return "Miscellaneous";

  const tokenizer = new natural.WordTokenizer();
  const stop = new Set(natural.stopwords || []);

  type PhraseScore = { score: number; length: number };
  const phraseScores: Map<string, PhraseScore> = new Map();

  function isStop(word: string) {
    return stop.has(word.toLowerCase());
  }

  function toTitleCase(str: string) {
    return (str || "")
      .split(/\s+/)
      .map((w) =>
        w
          ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          : ""
      )
      .join(" ")
      .trim();
  }

  for (const title of cleaned) {
    const tokens = tokenizer.tokenize(title).filter((w) => /[a-z0-9]/i.test(w));
    const lower = tokens.map((w) => w.toLowerCase());
    const n = tokens.length;
    for (let i = 0; i < n; i++) {
      for (let len = 2; len <= 4; len++) {
        if (i + len > n) continue;
        const sliceOrig = tokens.slice(i, i + len);
        const sliceLower = lower.slice(i, i + len);
        if (sliceOrig.join("").length < 4) continue;
        if (isStop(sliceLower[0]) || isStop(sliceLower[sliceLower.length - 1])) continue;
        const nonStopCount = sliceLower.filter((w) => !isStop(w)).length;
        if (!nonStopCount) continue;
        const phrase = sliceLower.join(" ");
        const existing = phraseScores.get(phrase) || { score: 0, length: len };
        existing.score += 1;
        phraseScores.set(phrase, existing);
      }
    }
  }

  let bestPhrase = "";
  let bestScore = -Infinity;
  for (const [phrase, info] of Array.from(phraseScores.entries())) {
    // Prefer slightly longer phrases when scores are close
    const adjusted = info.score + info.length * 0.1;
    if (adjusted > bestScore) {
      bestScore = adjusted;
      bestPhrase = phrase;
    }
  }

  if (bestPhrase) {
    const core = toTitleCase(bestPhrase);

    const label = `Exploring ${core}`;
    return label.length > 64 ? label.slice(0, 64).trim() : label;
  }

  // As a last resort, lean on a generic but readable
  // description derived from the first title, without
  // using TF‑IDF scores for the label itself.
  const seed = cleaned[0];
  const truncated = seed.length > 64 ? seed.slice(0, 64).trim() : seed;
  return `Exploratory cluster around ${toTitleCase(truncated)}`;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export default { embedTexts, embedText, cosine, summarizeClusterLabel };
