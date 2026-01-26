import { cosine } from "./hf";

function zeros(n: number) { return new Array(n).fill(0); }

export function centroidOf(points: number[][]): number[] {
  if (points.length === 0) return [];
  const dims = points[0].length;
  const c = zeros(dims);
  for (const p of points) {
    for (let i = 0; i < dims; i++) c[i] += p[i];
  }
  return c.map(v => v / points.length);
}

export function kmeans(embeddings: number[][], k: number, maxIter = 100) {
  const n = embeddings.length;
  if (n === 0) return { labels: [], centroids: [] };
  const dims = embeddings[0].length;
  // initialize centroids: pick first k distinct points (or random)
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) centroids.push(embeddings[i % n].slice());

  let labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    // assign
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestSim = -Infinity;
      for (let j = 0; j < k; j++) {
        const sim = cosine(embeddings[i], centroids[j]);
        if (sim > bestSim) { bestSim = sim; best = j; }
      }
      if (labels[i] !== best) { changed = true; labels[i] = best; }
    }
    // update
    const groups: number[][][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) groups[labels[i]].push(embeddings[i]);
    for (let j = 0; j < k; j++) {
      if (groups[j].length === 0) continue;
      centroids[j] = centroidOf(groups[j]);
    }
    if (!changed) break;
  }

  return { labels, centroids };
}

export function silhouetteScore(embeddings: number[][], labels: number[]): number {
  const n = embeddings.length;
  if (n <= 1) return 0;
  const labelSet = Array.from(new Set(labels));
  const clusters: Record<number, number[]> = {};
  for (let i = 0; i < n; i++) {
    const l = labels[i];
    clusters[l] = clusters[l] || [];
    clusters[l].push(i);
  }

  function avgDistance(i: number, group: number[]) {
    if (group.length === 0) return 0;
    let s = 0;
    for (const j of group) s += 1 - cosine(embeddings[i], embeddings[j]);
    return s / group.length;
  }

  let total = 0;
  for (let i = 0; i < n; i++) {
    const own = clusters[labels[i]];
    const a = own.length > 1 ? avgDistance(i, own.filter(ix => ix !== i)) : 0;
    let b = Infinity;
    for (const l of labelSet) {
      if (l === labels[i]) continue;
      const group = clusters[l];
      if (!group || group.length === 0) continue;
      const d = avgDistance(i, group);
      if (d < b) b = d;
    }
    if (!isFinite(b)) b = 0;
    const s = (b - a) / Math.max(a, b, 1e-8);
    total += s;
  }
  return total / n;
}

export function clusterEmbeddingsFallback(embeddings: number[][], minK = 3, maxK = 8) {
  if (embeddings.length === 0) return { labels: [], centroids: [], k: 0 };

  // Strict Constraint: Max clusters based on video count
  let effectiveMaxK = maxK;
  if (embeddings.length <= 30) effectiveMaxK = Math.min(maxK, 5);
  else if (embeddings.length <= 60) effectiveMaxK = Math.min(maxK, 7);
  else effectiveMaxK = Math.min(maxK, 8); // Never exceed 8ish even for large channels

  let best = { score: -Infinity, labels: [] as number[], centroids: [] as number[][], k: 0 };
  for (let k = Math.min(minK, embeddings.length); k <= Math.min(effectiveMaxK, embeddings.length); k++) {
    const { labels, centroids } = kmeans(embeddings, k);
    const score = silhouetteScore(embeddings, labels);
    // Bias towards fewer clusters if scores are close? Silhouette handles this naturally but let's be safe
    if (score > best.score) best = { score, labels, centroids, k };
  }
  return best;
}

export default { centroidOf, kmeans, silhouetteScore, clusterEmbeddingsFallback };
