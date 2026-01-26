import { Router } from "express";
import { fetchChannelVideos, parseDuration } from "./youtube";
import { storage } from "../../storage";
import { api } from "../../../shared/routes";
import { kafka, Topics } from "../infrastructure/kafka";

const router = Router();

// Internal helper for "Service" logic
export async function ingestChannel(channelId: string, apiKey: string) {
    console.log(`[Ingestion] Fetching videos for ${channelId}...`);
    const ytVideos = await fetchChannelVideos(channelId, apiKey);

    if (ytVideos.length === 0) {
        throw new Error("No videos found or channel invalid");
    }

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    for (const v of ytVideos) {
        const views = parseInt(v.statistics.viewCount) || 0;
        const likes = parseInt(v.statistics.likeCount) || 0;
        const comments = parseInt(v.statistics.commentCount) || 0;

        totalViews += views;
        totalLikes += likes;
        totalComments += comments;

        await storage.upsertVideo({
            channelId,
            videoId: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            publishedAt: new Date(v.snippet.publishedAt),
            views,
            likes,
            comments,
            duration: parseDuration(v.contentDetails.duration),
        });
    }

    const result = {
        count: ytVideos.length,
        totalViews,
        totalLikes,
        totalComments
    };

    await kafka.produce(Topics.VIDEO_INGESTED, { channelId, stats: result });

    return result;
}

// POST /ingest
router.post("/ingest", async (req, res) => {
    try {
        const { channelId } = req.body; // Simple JSON body for internal service
        const apiKey = process.env.YOUTUBE_API_KEY!;

        if (!apiKey) return res.status(500).json({ error: "No API Key" });
        if (!channelId) return res.status(400).json({ error: "Missing channelId" });

        const result = await ingestChannel(channelId, apiKey);
        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error("[Ingestion] Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
