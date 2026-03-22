import { Router } from "express";
import { kafka, Topics } from "../infrastructure/kafka";
import { RLState } from "./state";
import { sampleBeta, getRiskMultiplier } from "./logic";

const router = Router();

import { db } from "../../storage";
import { ideas, userPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";


export function initRankingService() {
    // Listen for Rewards
    // TOPIC: IDEA_CLICKED ("clicked" action)
    kafka.consume(Topics.IDEA_CLICKED, async (msg) => {
        const { ideaId, userId } = msg.value;
        console.log(`[Ranking] Click received for Idea ${ideaId}`);

        // Lookup Idea to get Format
        const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
        if (idea && idea.format) {
            console.log(`[Ranking] Rewarding format: ${idea.format}`);
            await RLState.updateArm(idea.format, 1.0); // +1 Alpha
        }
    });

    // TOPIC: IDEA_SAVED ("saved" action)
    kafka.consume(Topics.IDEA_SAVED, async (msg) => {
        const { ideaId } = msg.value;
        const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
        if (idea && idea.format) {
            console.log(`[Ranking] Super Reward (Save) for format: ${idea.format}`);
            await RLState.updateArm(idea.format, 2.0); // +2 Alpha (Stronger signal)
        }
    });
}

// POST /rank
router.post("/rank", async (req, res) => {
    try {
        const { items, userId } = req.body; // Expects array of { id, format, ... } + userId

        // Fetch User Profile if exists
        let riskProfile = "moderate";
        if (userId) {
            const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
            if (prefs && prefs.riskTolerance) {
                riskProfile = prefs.riskTolerance;
            }
        }

        // Enrich items with Score
        const ranked = await Promise.all(items.map(async (item: any) => {
            const format = item.format || "general";
            const stats = await RLState.getArmStats(format);

            // 1. Thompson Sampling Base Score (0.0 - 1.0)
            let score = sampleBeta(stats.alpha, stats.beta);

            // 2. Personalization Multiplier
            const multiplier = getRiskMultiplier(riskProfile, format);
            score = score * multiplier;

            // Map to 0-100
            return { ...item, score: Math.round(score * 100), debugStats: stats, riskProfileUsed: riskProfile };
        }));

        // Sort descending
        ranked.sort((a, b) => b.score - a.score);

        res.json({ ranked });
    } catch (e: any) {
        console.error("[Ranking] Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
