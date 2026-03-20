import { vectorStore } from "../infrastructure/vector_store";
import { graphStore } from "../infrastructure/graph_store";
import { storage } from "../../storage";

/**
 * MemoryIndexer Service
 * Responsible for 'Brain Indexing'—transforming raw ingestion data into 
 * long-term memory nodes in the Vector and Graph layers.
 */

export class MemoryIndexer {
    private static instance: MemoryIndexer;

    private constructor() {}

    public static getInstance(): MemoryIndexer {
        if (!MemoryIndexer.instance) {
            MemoryIndexer.instance = new MemoryIndexer();
        }
        return MemoryIndexer.instance;
    }

    /**
     * Index a newly ingested channel into the Memory Layer
     */
    async indexChannel(channelId: string) {
        console.log(`[MemoryIndexer] Starting brain indexing for channel ${channelId}`);

        // 1. Fetch all videos and metrics for this creator
        const videos = await storage.getVideos(channelId);
        
        // 2. Build semantic embeddings and index in Vector Store (Simulated)
        for (const video of videos) {
            // We simulate embedding generation from title/description
            const fakeEmbedding = Array.from({ length: 384 }, () => Math.random());
            await vectorStore.upsert(video.videoId, fakeEmbedding, {
                id: video.videoId,
                channelId,
                text: video.title,
                type: 'video',
                timestamp: video.publishedAt || new Date(),
                metadata: { viewCount: video.views }
            });

            // 3. Map Narrative Continuity in Graph (Simulated)
            // If the title contains "Part" or similar series patterns, map the relationship
            if (video.title.toLowerCase().includes("part") || video.title.toLowerCase().includes("#")) {
                // Find potential 'Previous' video in the graph
                const prev = videos.find(v => v.videoId !== video.videoId && video.title.includes(v.title.split("Part")[0])); 
                if (prev) {
                    await graphStore.addRelationship(video.videoId, prev.videoId, 'SEQUEL_TO', 0.95);
                }
            }
        }

        console.log(`[MemoryIndexer] Brain indexing complete for channel ${channelId}`);
    }
}

export const memoryIndexer = MemoryIndexer.getInstance();
