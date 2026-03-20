import { Router } from "express";
import { calculateCRPS, classifyFormat, extractKeywords } from "./analysis";
import { storage, db } from "../../storage";
import { userNotifications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { kafka, Topics } from "../infrastructure/kafka";
import { featureStore } from "./store";
import { trendForecasting } from "./trends";
import { twinFinder } from "./twin_finder";
import { creatorStyleFingerprint } from "./style_fingerprint";
import { narrativeArcAnalyzer } from "./narrative_arc";
import { ideaCollisionEngine } from "./idea_collision";
import { audienceCuriosityMap } from "./audience_curiosity";
import { ecosystemHealthScore } from "./health_score";
import { dnaService } from "./dna";
import { livePulseService } from "./pulse";
import { simulatorService } from "./simulator";
import { narrativeGraphService } from "./narrative_graph";
import { feedbackLoopService } from "./feedback_loop";
import { coCreatorAgent } from "../agent/co_creator";

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

// GET /personas/:channelId
router.get("/personas/:channelId", async (req, res) => {
    try {
        const { channelId } = req.params;
        const personas = await storage.getAudiencePersonas(channelId);
        res.json(personas);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /notifications/:id/read
router.post("/notifications/:id/read", async (req, res) => {
    try {
        const { id } = req.params;

        await db.update(userNotifications)
            .set({ isRead: "true" })
            .where(eq(userNotifications.id, parseInt(id)));

        res.json({ success: true });
    } catch (error: any) {
        console.error("[Features] Read Notification Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /fatigue/:channelId
router.get("/fatigue/:channelId", async (req, res) => {
    try {
        const { channelId } = req.params;
        const analytics = await storage.getChannelAnalytics(channelId);
        if (!analytics) return res.status(404).json({ error: "Analytics not found" });

        // Logic mirrored from analysis_bus.ts for real-time fetch
        const videos = await storage.getVideos(channelId);
        const uploadGaps = [];
        for (let i = 0; i < videos.length - 1; i++) {
            const gap = (new Date(videos[i].publishedAt!).getTime() - new Date(videos[i + 1].publishedAt!).getTime()) / (1000 * 3600 * 24);
            uploadGaps.push(gap);
        }
        const avgGap = uploadGaps.length ? uploadGaps.reduce((a, b) => a + b, 0) / uploadGaps.length : 0;

        let level = "Stable";
        let reason = "Upload consistency is healthy.";
        if (avgGap > 14) { level = "Warning"; reason = "Large gaps between uploads detected."; }
        if (avgGap > 30) { level = "Burnout Risk"; reason = "Critical upload hiatus. Risk of audience decay."; }

        res.json({ level, reason, avgGap });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/channel/:channelId/style", async (req, res) => {
    const { channelId } = req.params;
    const videos = await storage.getVideos(channelId);
    const profile = creatorStyleFingerprint.analyzeStyle(videos);
    await storage.upsertCreatorStyleProfile({ channelId, ...profile });
    res.json(profile);
});

router.get("/video/:videoId/narrative", async (req, res) => {
    const { videoId } = req.params;
    // Mock transcript for demonstration if not exists
    const analysis = narrativeArcAnalyzer.analyzeTranscript("This is a mock transcript for video analysis.");
    await storage.upsertNarrativeAnalysis({ videoId, ...analysis });
    res.json(analysis);
});

router.get("/channel/:channelId/collisions", async (req, res) => {
    const { channelId } = req.params;
    const clusters = await storage.getClusters(channelId);
    const collisions = ideaCollisionEngine.generateCollisions(clusters);
    res.json(collisions);
});

router.get("/channel/:channelId/curiosity", async (req, res) => {
    const { channelId } = req.params;
    const keywords = await storage.getTopKeywords(channelId);
    const signals = audienceCuriosityMap.detectCuriosity(keywords, []);
    for (const s of signals) {
        await storage.upsertAudienceCuriositySignal({ channelId, topic: s.topic, signalStrength: s.strength, sourceType: s.source });
    }
    res.json(signals);
});

router.get("/channel/:channelId/health", async (req, res) => {
    const { channelId } = req.params;
    const metrics = {
        topicDiversity: 0.8,
        engagementStability: 0.7,
        innovationRate: 0.6,
        curiosityCoverage: 0.5,
        burnoutSignals: { level: "Stable" }
    };
    const health = ecosystemHealthScore.calculateHealth(metrics);
    await storage.upsertEcosystemHealthScore({ channelId, ...health });
    res.json(health);
});

// GET /channel/:channelId/nudges
router.get("/channel/:channelId/nudges", async (req, res) => {
    try {
        const { channelId } = req.params;
        
        const nudges = await db.select()
            .from(userNotifications)
            .where(eq(userNotifications.channelId, channelId))
            .orderBy(desc(userNotifications.createdAt));
            
        res.json(nudges);
    } catch (error: any) {
        console.error("[Features] Nudges Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// DNA Evolution Routes (Phase 17)
router.get("/channel/:channelId/dna/evolution", async (req, res) => {
    try {
        const evolution = await dnaService.getEvolutionTimeline(req.params.channelId);
        res.json(evolution);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch DNA evolution" });
    }
});

router.get("/channel/:channelId/pulse", async (req, res) => {
    try {
        const stats = await livePulseService.checkBreakouts(req.params.channelId);
        res.json(stats);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch channel pulse" });
    }
});

router.post("/simulate/retention", async (req, res) => {
    try {
        const result = await simulatorService.forecastRetention(req.body);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to simulate retention" });
    }
});

router.post("/simulate/ab", async (req, res) => {
    try {
        const { conceptA, conceptB } = req.body;
        const result = await simulatorService.simulateAB(conceptA, conceptB);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to run A/B simulation" });
    }
});

router.get("/agent/:channelId/directives", async (req, res) => {
    try {
        const directives = await coCreatorAgent.reason(req.params.channelId);
        res.json(directives);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch agent directives" });
    }
});

router.get("/agent/thoughts", async (req, res) => {
    try {
        const thoughts = coCreatorAgent.getThoughts();
        res.json(thoughts);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch agent thoughts" });
    }
});

router.get("/channel/:channelId/narrative-graph", async (req, res) => {
    try {
        const graph = await narrativeGraphService.buildGraph(req.params.channelId);
        res.json(graph);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch narrative graph" });
    }
});

router.get("/channel/:channelId/skill-score", async (req, res) => {
    try {
        const score = await feedbackLoopService.calculateSkillScore(req.params.channelId);
        res.json(score);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch skill score" });
    }
});

router.post("/feedback/idea/:ideaId", async (req, res) => {
    try {
        const result = await feedbackLoopService.recordFeedback(req.params.ideaId, req.body.action);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to record feedback" });
    }
});

export default router;
