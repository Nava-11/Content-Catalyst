import { storage } from "../../storage";
import { graphStore } from "../infrastructure/graph_store";

/**
 * Narrative Graph Service
 * Detects story arcs and video relationships (Sequels, Callbacks).
 */

export interface NarrativeNode {
    id: string;
    title: string;
    type: "Origin" | "Sequel" | "Callback";
}

export interface NarrativeEdge {
    source: string;
    target: string;
    label: "SEQUEL_TO" | "CALLBACK_TO" | "SPINOFF";
}

export class NarrativeGraphService {
    private static instance: NarrativeGraphService;

    private constructor() {}

    public static getInstance(): NarrativeGraphService {
        if (!NarrativeGraphService.instance) {
            NarrativeGraphService.instance = new NarrativeGraphService();
        }
        return NarrativeGraphService.instance;
    }

    /**
     * Build the narrative graph for a channel
     */
    async buildGraph(channelId: string): Promise<{ nodes: NarrativeNode[], edges: NarrativeEdge[] }> {
        const videos = await storage.getVideos(channelId);
        const nodes: NarrativeNode[] = [];
        const edges: NarrativeEdge[] = [];

        // Sort by date ascending to find origins
        const sorted = [...videos].sort((a, b) => 
            new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime()
        );

        for (let i = 0; i < sorted.length; i++) {
            const v = sorted[i];
            const isPartX = v.title.toLowerCase().includes("part") || v.title.toLowerCase().includes("episode");
            
            nodes.push({
                id: v.videoId,
                title: v.title,
                type: i === 0 ? "Origin" : (isPartX ? "Sequel" : "Callback")
            });

            // If it's a sequel/callback, find a previous related video
            if (i > 0) {
                // Simplified logic: link to previous video in the same "cluster" or just previous for demo
                edges.push({
                    source: v.videoId,
                    target: sorted[i - 1].videoId,
                    label: isPartX ? "SEQUEL_TO" : "CALLBACK_TO"
                });

                // Persist in Graph Store
                await graphStore.addRelation(v.videoId, sorted[i-1].videoId, isPartX ? "SEQUEL_TO" : "CALLBACK_TO");
            }
        }

        return { nodes, edges };
    }
}

export const narrativeGraphService = NarrativeGraphService.getInstance();
