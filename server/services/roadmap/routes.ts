import { Router } from "express";
import { roadmapGenerator } from "./generator";
import { redis as redisClient } from "../infrastructure/redis";

const router = Router();

// GET /api/roadmap/:channelId
router.get("/:channelId", async (req, res) => {
    try {
        const { channelId } = req.params;
        const cacheKey = `roadmap:${channelId}`;

        // Try Cache First
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const roadmap = await roadmapGenerator.generateRoadmap(channelId);
        if (!roadmap) {
            return res.status(404).json({ message: "Not enough data to generate roadmap." });
        }

        // Cache for 24 hours
        await redisClient.set(cacheKey, JSON.stringify(roadmap), 'EX', 60 * 60 * 24);

        res.json(roadmap);
    } catch (error: any) {
        console.error("[Roadmap Route] Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Internal trigger for regeneration
export async function regenerateRoadmap(channelId: string) {
    console.log(`[Roadmap Route] Forcing regeneration for ${channelId}`);
    const roadmap = await roadmapGenerator.generateRoadmap(channelId);
    if (roadmap) {
        const cacheKey = `roadmap:${channelId}`;
        await redisClient.set(cacheKey, JSON.stringify(roadmap), 'EX', 60 * 60 * 24);
    }
}

export default router;
