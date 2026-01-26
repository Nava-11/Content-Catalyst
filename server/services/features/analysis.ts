import natural from "natural";
import { type Video, type VideoMetric } from "@shared/schema";

// Keep only essential analysis helpers used across the app.
// These functions are deterministic and lightweight (TF-IDF via `natural`).

export function classifyFormat(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("how to") || text.includes("tutorial") || text.includes("guide")) return "tutorial";
  if (text.includes("tips") || text.includes("tricks")) return "tips";
  if (text.includes("mistake") || text.includes("avoid")) return "mistakes";
  return "other";
}

export function calculateCRPS(video: Video, avgViews: number, avgLikes: number, avgComments: number): number {
  const viewScore = avgViews > 0 ? video.views! / avgViews : 0;
  const likeScore = avgLikes > 0 ? video.likes! / avgLikes : 0;
  const commentScore = avgComments > 0 ? video.comments! / avgComments : 0;
  return (0.5 * viewScore) + (0.3 * likeScore) + (0.2 * commentScore);
}

export function extractKeywords(documents: string[], topN = 10): { keyword: string; score: number }[] {
  const tfidf = new natural.TfIdf();
  documents.forEach(doc => tfidf.addDocument(doc || ""));
  const keywords: Map<string, number> = new Map();
  documents.forEach((doc, index) => {
    tfidf.listTerms(index).forEach(item => {
      const current = keywords.get(item.term) || 0;
      keywords.set(item.term, current + item.tfidf);
    });
  });
  return Array.from(keywords.entries()).map(([keyword, score]) => ({ keyword, score })).sort((a,b)=>b.score-a.score).slice(0, topN);
}

export const Angles = ["origin","misconception","impact","comparison","future","reaction","creator_mistake","behind_the_scenes"];
export const Formats = ["story","reaction","breakdown","explanation","tutorial","other"];

