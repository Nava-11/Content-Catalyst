import natural from "natural";
import { type Video, type VideoMetric } from "@shared/schema";

const tfidf = new natural.TfIdf();

// Format Classification Rules
export function classifyFormat(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes("story") || text.includes("how i") || text.includes("history of")) return "story";
  if (text.includes("tutorial") || text.includes("how to") || text.includes("guide")) return "tutorial";
  if (text.includes("tips") || text.includes("tricks") || text.includes("advice")) return "tips";
  if (text.includes("mistake") || text.includes("stop doing") || text.includes("avoid")) return "mistakes";
  if (text.includes("react") || text.includes("reaction") || text.includes("watching")) return "reaction";
  
  return "other";
}

// CRPS Calculation
export function calculateCRPS(video: Video, avgViews: number, avgLikes: number, avgComments: number): number {
  const viewScore = avgViews > 0 ? video.views! / avgViews : 0;
  const likeScore = avgLikes > 0 ? video.likes! / avgLikes : 0;
  const commentScore = avgComments > 0 ? video.comments! / avgComments : 0;

  return (0.5 * viewScore) + (0.3 * likeScore) + (0.2 * commentScore);
}

// TF-IDF Extraction
export function extractKeywords(documents: string[]): { keyword: string; score: number }[] {
  const tfidf = new natural.TfIdf();
  
  documents.forEach(doc => tfidf.addDocument(doc));
  
  const keywords: Map<string, number> = new Map();
  
  // Get top terms for all documents
  // Note: natural's tfidf works per document. We want global top keywords.
  // We'll aggregate scores across all documents.
  
  documents.forEach((doc, index) => {
    tfidf.listTerms(index).forEach(item => {
      const current = keywords.get(item.term) || 0;
      keywords.set(item.term, current + item.tfidf);
    });
  });

  return Array.from(keywords.entries())
    .map(([keyword, score]) => ({ keyword, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
