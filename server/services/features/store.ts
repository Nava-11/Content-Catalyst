import { redis } from "../infrastructure/redis";
import { storage } from "../../storage";

// ============================================================================
// 1. Feature Registry & Schema
// ============================================================================

export type FeatureType = "numerical" | "categorical" | "embedding";

export interface FeatureDefinition {
    name: string;
    type: FeatureType;
    description: string;
    defaultValue?: any;
}

export const FeatureRegistry: Record<string, FeatureDefinition> = {
    // Analytical Features
    "video_views": { name: "video_views", type: "numerical", description: "Total views count" },
    "video_likes": { name: "video_likes", type: "numerical", description: "Total likes count" },
    "video_comments": { name: "video_comments", type: "numerical", description: "Total comments count" },
    "video_duration": { name: "video_duration", type: "numerical", description: "Duration in seconds" },

    // Computed Features
    "video_crps": { name: "video_crps", type: "numerical", description: "Channel Relative Performance Score" },
    "video_format": { name: "video_format", type: "categorical", description: "Classified format (tutorial, vlog, etc)" },

    // Embeddings
    "title_embedding": { name: "title_embedding", type: "embedding", description: "Semantic vector of the title" }
};

// ============================================================================
// 2. Feature Store Interface
// ============================================================================

export class FeatureStore {
    private static instance: FeatureStore;

    static getInstance(): FeatureStore {
        if (!FeatureStore.instance) {
            FeatureStore.instance = new FeatureStore();
        }
        return FeatureStore.instance;
    }

    /**
     * Puts features into both Online (Redis) and Offline (DB) stores.
     * @param entityId - Usually clean videoId
     * @param features - Dictionary of feature values
     */
    async putFeatures(entityId: string, features: Record<string, any>) {
        // 1. Online Store (Redis)
        // Key: fs:video:{videoId}
        const redisKey = `fs:video:${entityId}`;
        await redis.set(redisKey, JSON.stringify(features), 'EX', 86400 * 7); // 7 day cache

        // 2. Offline Store (DB)
        // For MVP, we map specific known features to our DB schema constraints.
        // In a full Feature Store, this would be a generic BigQuery/Table insert.

        // We try to update 'video_metrics' if relevant keys exist
        if (features["video_crps"] !== undefined || features["video_format"] !== undefined) {
            await storage.upsertVideoMetric({
                videoId: entityId,
                crps: features["video_crps"],
                format: features["video_format"]
            });
        }
        // We update 'videos' table if stats exist (Ingestion usually does this, but FS can update too)
        if (features["video_views"] !== undefined) {
            // Note: storage.upsertVideo expects full object, so we might skip partial updates here 
            // or implement a generic patch. For now, we trust Ingestion to be the source of truth for raw stats.
        }
    }

    /**
     * Retrieves features from Online Store (Redis), falling back to Offline Store (DB).
     */
    async getFeatures(entityId: string, featureNames: string[]): Promise<Record<string, any>> {
        // 1. Try Redis
        const redisKey = `fs:video:${entityId}`;
        const cached = await redis.get(redisKey);

        if (cached) {
            const data = JSON.parse(cached);
            // Filter requested
            const result: Record<string, any> = {};
            featureNames.forEach(name => {
                if (data[name] !== undefined) result[name] = data[name];
            });
            return result;
        }

        // 2. Fallback to DB (Hydrate Online Store)
        const metrics = await storage.getVideoMetricsForVideo(entityId);
        // We might need to fetch Video object too for views/duration
        // Ideally storage should provide a "getFeatureVector" helper.

        // Construct feature set from DB
        const features: Record<string, any> = {};
        if (metrics) {
            features["video_crps"] = metrics.crps;
            features["video_format"] = metrics.format;
        }

        // If we found something, cache it
        if (Object.keys(features).length > 0) {
            await redis.set(redisKey, JSON.stringify(features), 'EX', 86400 * 7);
        }

        return features;
    }
}

export const featureStore = FeatureStore.getInstance();
