import { Router } from "express";
import { calculateCRPS, classifyFormat, extractKeywords } from "./analysis";
import { storage } from "../../storage";
import { kafka, Topics } from "../infrastructure/kafka";
import { featureStore } from "./store";

const router = Router();

// Internal helper
export async function computeFeatures(channelId: string, analytics: any) {
    console.log(`[Features] Computing features for ${channelId}...`);
    const dbVideos = await storage.getVideos(channelId);
    const allTexts: string[] = [];

    const avgViews = analytics.avgViews || 0;
    const avgLikes = analytics.avgLikes || 0;
    const avgComments = analytics.avgComments || 0;

    for (const v of dbVideos) {
        const format = classifyFormat(v.title, v.description || "");
        const crps = calculateCRPS(v, avgViews, avgLikes, avgComments);

        // Feature Store Write (Syncs to Redis & DB)
        await featureStore.putFeatures(v.videoId, {
            "video_crps": crps,
            "video_format": format,
            "video_views": v.views,
            "video_likes": v.likes,
            "video_comments": v.comments,
            "video_duration": v.duration
        });

        allTexts.push(v.title + " " + (v.description || ""));
    }

    // Keywords (Still stored directly in DB for now, as they are a list/relation, not a simple feature vector)
    await storage.clearTopKeywords(channelId);
    const keywords = extractKeywords(allTexts);
    for (const k of keywords) {
        await storage.upsertTopKeyword({
            channelId,
            keyword: k.keyword,
            score: k.score
        });
    }

    // Metrics
    const result = { videoCount: dbVideos.length, keywordCount: keywords.length };

    await kafka.produce(Topics.FEATURES_COMPUTED, { channelId, stats: result });
    return result;
}

export function initFeaturesService() {
    kafka.consume(Topics.VIDEO_INGESTED, async (msg) => {
        const { channelId } = msg.value;
        console.log(`[Features] Reacting to ingestion for ${channelId}`);
        // We need analytics to compute features. 
        // In a real flow, Analytics Service should probably run first or we fetch it.
        // For now, we fetch what's available.
        const analytics = await storage.getChannelAnalytics(channelId);
        if (analytics) {
            await computeFeatures(channelId, analytics);
        } else {
            console.warn("[Features] Skipping auto-compute, no analytics found.");
        }
    });
}

// POST /compute
router.post("/compute", async (req, res) => {
    try {
        const { channelId } = req.body;
        // ideally we fetch analytics here or pass them in. 
        // for now, let's fetch them from storage since Ingestion/Analytics might have run.
        const analytics = await storage.getChannelAnalytics(channelId);

        if (!analytics) return res.status(404).json({ error: "Analytics not found (run ingestion/analytics first)" });

        const result = await computeFeatures(channelId, analytics);
        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error("[Features] Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
