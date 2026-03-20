import { storage } from "../../storage";
import { cosine, embedText } from "../ideas/hf";
import { db } from "../../db";
import { ideas } from "@shared/schema";

export interface SeriesArc {
    videos: any[];
    seriesTitle: string;
    similarityScore: number;
    recommendedPart: string;
}

export class SeriesArcDetector {
    /**
     * Scans video history for semantic patterns indicating a series.
     */
    async detectArcs(channelId: string): Promise<SeriesArc[]> {
        console.log(`[SeriesDetector] Scanning for arcs in ${channelId}`);
        
        const videos = await storage.getVideos(channelId);
        if (videos.length < 3) return [];

        // 1. Get Embeddings for all videos
        // (In a real app, these are pre-calculated)
        const embeddings: number[][] = [];
        for (const v of videos.slice(0, 20)) { // Scan recent 20
            const emb = await embedText(v.title);
            embeddings.push(emb);
        }

        const arcs: SeriesArc[] = [];

        // 2. Sliding window of 3
        for (let i = 0; i < embeddings.length - 2; i++) {
            const v1 = embeddings[i];
            const v2 = embeddings[i+1];
            const v3 = embeddings[i+2];

            const sim12 = cosine(v1, v2);
            const sim23 = cosine(v2, v3);

            if (sim12 > 0.75 && sim23 > 0.75) {
                // Potential Arc detected!
                const matchedVideos = videos.slice(i, i + 3);
                const avgSim = (sim12 + sim23) / 2;

                arcs.push({
                    videos: matchedVideos,
                    seriesTitle: this.commonPrefix(matchedVideos.map(v => v.title)),
                    similarityScore: avgSim,
                    recommendedPart: this.generateNextPart(matchedVideos[0].title)
                });

                // Jump ahead to avoid overlapping arcs for the same series
                i += 2;
            }
        }

        return arcs;
    }

    private commonPrefix(titles: string[]): string {
        const first = titles[0].split(" ");
        return first.slice(0, 3).join(" ") + "...";
    }

    private generateNextPart(lastTitle: string): string {
        const match = lastTitle.match(/Part (\d+)/i);
        if (match) {
            const next = parseInt(match[1]) + 1;
            return lastTitle.replace(/Part \d+/i, `Part ${next}`);
        }
        return `${lastTitle} (Part 2)`;
    }
}

export const seriesDetector = new SeriesArcDetector();
