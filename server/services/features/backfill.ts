import { storage } from "../../storage";
import { featureStore } from "./store";

// One-off script or route handler to backfill Redis from Postgres
export async function backfillFeatures(channelId: string) {
    console.log(`[Backfill] Starting feature backfill for ${channelId}...`);

    const videos = await storage.getVideos(channelId);
    const metrics = await storage.getVideoMetrics(channelId); // Inefficient full fetch, but okay for MVP

    let count = 0;
    for (const v of videos) {
        const m = metrics.find(met => met.videoId === v.videoId);
        if (!m) continue;

        const features = {
            "video_crps": m.crps,
            "video_format": m.format,
            "video_views": v.views,
            "video_likes": v.likes,
            "video_comments": v.comments,
            "video_duration": v.duration
        };

        // We use putFeatures, which updates Redis (and DB again, but that's safe/idempotent)
        await featureStore.putFeatures(v.videoId, features);
        count++;
    }

    console.log(`[Backfill] Completed. Hydrated ${count} videos into Online Store.`);
    return count;
}
