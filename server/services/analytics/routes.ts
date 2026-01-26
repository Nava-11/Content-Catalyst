import { Router } from "express";
import { storage } from "../../storage";

const router = Router();

// Internal helper
export async function updateChannelStats(channelId: string) {
    console.log(`[Analytics] Updating stats for ${channelId}...`);
    const videos = await storage.getVideos(channelId);
    const totalVideos = videos.length;

    if (totalVideos === 0) return null;

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    for (const v of videos) {
        totalViews += (v.views || 0);
        totalLikes += (v.likes || 0);
        totalComments += (v.comments || 0);
    }

    const avgViews = Math.floor(totalViews / totalVideos);
    const avgLikes = Math.floor(totalLikes / totalVideos);
    const avgComments = Math.floor(totalComments / totalVideos);

    await storage.upsertChannelAnalytics({
        channelId,
        totalVideos,
        avgViews,
        avgLikes,
        avgComments,
        bestDay: "Friday", // Placeholder logic
        bestHour: 18,      // Placeholder logic
        optimalDurationMin: 600,
        optimalDurationMax: 1200
    });

    return { totalVideos, avgViews };
}

// POST /update-stats
router.post("/update-stats", async (req, res) => {
    try {
        const { channelId } = req.body;
        const result = await updateChannelStats(channelId);
        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error("[Analytics] Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /:channelId
router.get("/:channelId", async (req, res) => {
    const { channelId } = req.params;
    const analytics = await storage.getChannelAnalytics(channelId);

    if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
    }

    const videos = await storage.getVideos(channelId);
    const metrics = await storage.getVideoMetrics(channelId);
    const keywords = await storage.getTopKeywords(channelId);

    // Prepare chart data
    const viewsOverTime = videos
        .sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime())
        .map(v => ({ date: v.publishedAt!.toISOString().split('T')[0], views: v.views || 0 }));

    // Avg CRPS by Format
    const formatGroups: Record<string, number[]> = {};
    metrics.forEach(m => {
        if (!formatGroups[m.format!]) formatGroups[m.format!] = [];
        formatGroups[m.format!].push(m.crps || 0);
    });

    const avgCrpsByFormat = Object.entries(formatGroups).map(([format, scores]) => ({
        format,
        crps: scores.reduce((a, b) => a + b, 0) / scores.length
    }));

    res.json({
        analytics,
        videos,
        metrics,
        keywords,
        viewsOverTime,
        avgCrpsByFormat
    });
});

export default router;
