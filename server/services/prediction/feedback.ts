import { storage } from "../../storage";
import { cosine, embedText } from "../ideas/hf";
import { db } from "../../db";
import { ideas, videos, videoMetrics } from "@shared/schema";
import { eq, and, isNotNull, isNull } from "drizzle-orm";

export class PredictionFeedbackLoop {
    /**
     * Cross-references published ideas with actual video performance.
     * Updates the 'ideas' table with actual CRPS and calculates the delta.
     */
    async syncFeedback(channelId: string) {
        console.log(`[FeedbackLoop] Starting sync for ${channelId}`);
        
        // 1. Get all published ideas that haven't been linked to a video result yet
        const publishedIdeas = await db.select().from(ideas).where(
            and(
                eq(ideas.channelId, channelId),
                eq(ideas.status, 'published'),
                isNull(ideas.actualCrps)
            )
        );

        if (publishedIdeas.length === 0) {
            console.log("[FeedbackLoop] No new published ideas to sync.");
            return;
        }

        // 2. Get recent videos and metrics
        const channelVideos = await storage.getVideos(channelId);
        const metrics = await storage.getVideoMetrics(channelId);

        for (const idea of publishedIdeas) {
            // 3. Find matching video by title similarity
            const ideaTitle = idea.title.toLowerCase();
            const ideaEmbedding = (idea.embedding as number[]) || await embedText(idea.title);

            let bestMatch = null;
            let maxSim = 0.85; // High threshold for auto-matching

            for (const video of channelVideos) {
                // Skip videos published before the idea was created
                if (video.publishedAt && idea.createdAt && video.publishedAt < idea.createdAt) continue;

                // Simple title overlap or cosine similarity
                const videoTitle = video.title.toLowerCase();
                const sim = await this.calculateSimilarity(ideaTitle, videoTitle, ideaEmbedding);

                if (sim > maxSim) {
                    maxSim = sim;
                    bestMatch = video;
                }
            }

            if (bestMatch) {
                console.log(`[FeedbackLoop] Matched Idea "${idea.title}" with Video "${bestMatch.title}" (sim: ${maxSim.toFixed(2)})`);
                
                // 4. Get Actual CRPS
                const metric = metrics.find(m => m.videoId === bestMatch.videoId);
                if (metric && metric.crps !== null) {
                    const actualCrps = metric.crps;
                    const predictedCrps = idea.predictedCrps || 1.0; // Fallback
                    const delta = actualCrps - predictedCrps;

                    // 5. Update Idea Record
                    await db.update(ideas)
                        .set({
                            actualCrps,
                            predictionDelta: delta,
                            publishedAt: bestMatch.publishedAt
                        })
                        .where(eq(ideas.id, idea.id));

                    console.log(`[FeedbackLoop] Updated Idea ${idea.id}: Predicted ${predictedCrps}, Actual ${actualCrps}, Delta ${delta}`);
                }
            }
        }
    }

    private async calculateSimilarity(t1: string, t2: string, e1: number[]): Promise<number> {
        // Jaccard for word overlap
        const w1 = new Set(t1.split(" "));
        const w2 = new Set(t2.split(" "));
        const intersection = new Set([...w1].filter(x => w2.has(x)));
        const union = new Set([...w1, ...w2]);
        const jaccard = intersection.size / union.size;

        if (jaccard > 0.6) return jaccard;

        // Semantic similarity fallback if Jaccard is low but structure is similar
        try {
            const e2 = await embedText(t2);
            return cosine(e1, e2);
        } catch {
            return jaccard;
        }
    }
}

export const feedbackLoop = new PredictionFeedbackLoop();
