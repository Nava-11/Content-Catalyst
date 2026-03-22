import { describe, it, expect, vi } from 'vitest';
import { centroidOf, kmeans, clusterEmbeddingsFallback } from './clustering';

// Mock cosine similarity to make it predictable for testing
vi.mock('./hf', () => ({
  cosine: (a: number[], b: number[]) => {
    // Simple dot product for unit vectors in our tests
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  },
  default: {
    cosine: (a: number[], b: number[]) => {
      return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }
  }
}));

describe('centroidOf', () => {
  it('should calculate the mean of points', () => {
    const points = [
      [1, 2],
      [3, 4]
    ];
    const centroid = centroidOf(points);
    expect(centroid).toEqual([2, 3]);
  });

  it('should handle empty array', () => {
    expect(centroidOf([])).toEqual([]);
  });

  it('should handle single point', () => {
    expect(centroidOf([[5, 10]])).toEqual([5, 10]);
  });
});

describe('kmeans', () => {
  it('should group points correctly', () => {
    const points = [
      [1, 0], [1.1, 0.1], // Cluster 0
      [0, 1], [0.1, 1.1]  // Cluster 1
    ];
    const { labels, centroids } = kmeans(points, 2);
    
    // Check that points in the same cluster have the same label
    expect(labels[0]).toBe(labels[1]);
    expect(labels[2]).toBe(labels[3]);
    expect(labels[0]).not.toBe(labels[2]);
    expect(centroids).toHaveLength(2);
  });

  it('should handle empty input', () => {
    const result = kmeans([], 2);
    expect(result.labels).toEqual([]);
    expect(result.centroids).toEqual([]);
  });
});

describe('clusterEmbeddingsFallback', () => {
  it('should limit k based on input size', () => {
    // 5 points, minK=3, maxK=8
    // Should choose k between 3 and 5 (Math.min(minK, len) to Math.min(effMaxK, len))
    const points = Array.from({ length: 5 }, () => [Math.random(), Math.random()]);
    const result = clusterEmbeddingsFallback(points, 3, 8);
    expect(result.k).toBeGreaterThanOrEqual(3);
    expect(result.k).toBeLessThanOrEqual(5);
  });

  it('should handle large input with maxK constraint', () => {
    const points = Array.from({ length: 100 }, () => [Math.random(), Math.random()]);
    const result = clusterEmbeddingsFallback(points, 2, 10);
    // For len > 60, effMaxK = Math.min(10, 8) = 8
    expect(result.k).toBeLessThanOrEqual(8);
  });
});
