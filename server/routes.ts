import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

// Microservices
import ingestionRouter, { ingestChannel } from "./services/ingestion/routes";
import analyticsRouter, { updateChannelStats } from "./services/analytics/routes";
import featuresRouter, { computeFeatures, initFeaturesService } from "./services/features/routes";
import ideasRouter, { initIdeasService } from "./services/ideas/routes";
import { initRankingService } from "./services/ranking/routes";
import chatRouter from "./services/chat/routes";
import predictionRouter from "./services/prediction/routes";
import rankingRouter from "./services/ranking/routes";
import workflowRouter from "./services/workflow/routes";
import { initWorkflows } from "./services/workflow/engine";
import authRouter from "./services/auth/routes";
import userRouter from "./services/user/routes";
import onboardingRouter from "./services/user/onboarding";
import roadmapRouter, { regenerateRoadmap } from "./services/roadmap/routes";
import { feedbackLoop } from "./services/prediction/feedback"; // Added this import
import { commentClustering } from "./services/features/comment_clustering";
import { nudgeService } from "./services/notifications/nudges";
import { seriesDetector } from "./services/features/series_detector";
import { twinFinder } from "./services/features/twin_finder";
import { thumbnailAnalyzer } from "./services/features/multimodal";
import { trendForecasting } from "./services/features/trends";
import { voiceCapture } from "./services/multimodal/voice";
import socialRouter from "./services/social/routes";

// New Extensions
import { initMemoryGraph } from "./services/infrastructure/memory_graph";
import { initFatigueDetector } from "./services/features/analysis_bus";
import { initMultimodal } from "./services/features/multimodal";
import { initWorkflowAutomation } from "./services/workflow/automation";
import { initPersonaService } from "./services/user/personas";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Microservices Registry (Internal/Admin) ---
  app.use("/services/ingestion", ingestionRouter);
  app.use("/services/analytics", analyticsRouter);
  app.use("/services/features", featuresRouter);
  app.use("/services/ideas", ideasRouter);
  app.use("/services/chat", chatRouter);
  app.use("/services/prediction", predictionRouter);
  app.use("/services/ranking", rankingRouter);
  app.use("/services/workflow", workflowRouter);
  app.use("/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/onboarding", onboardingRouter);

  // Initialize Consumers
  initFeaturesService();
  initIdeasService();
  initRankingService();
  initWorkflows();

  // Initialize New Extensions
  initMemoryGraph();
  initFatigueDetector();
  initMultimodal();
  initWorkflowAutomation();
  initPersonaService();

  // --- API Gateway (Client Compatibility) ---
  app.post(api.analyze.path, async (req, res) => {
    try {
      const { channelId } = api.analyze.input.parse(req.body);
      const apiKey = process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ message: "YOUTUBE_API_KEY not configured" });
      }

      console.log(`[Gateway] Orchestrating analysis for ${channelId}...`);

      await ingestChannel(channelId, apiKey);
      await updateChannelStats(channelId);
      const analytics = await storage.getChannelAnalytics(channelId);

      if (analytics) {
        await computeFeatures(channelId, analytics);
      }

      // Tier 1 & 2 Intelligence (Background Orchestration)
      feedbackLoop.syncFeedback(channelId).catch(console.error);
      commentClustering.processCommentsForChannel(channelId, apiKey).catch(console.error);
      nudgeService.generateNudges(channelId).catch(console.error);
      
      // Multimodal & Advanced Signals
      thumbnailAnalyzer.correlateWithCrps(channelId).catch(console.error);
      seriesDetector.detectArcs(channelId).catch(console.error);

      // Background Roadmap Generation
      regenerateRoadmap(channelId).catch(console.error);

      res.json({ success: true, message: "Analysis complete" });
    } catch (error: any) {
      console.error("[Gateway] Analysis error:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  app.use("/api/analytics", analyticsRouter);
  app.use("/api/roadmap", roadmapRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/user", userRouter);
  app.use("/api", ideasRouter);
  app.use("/api/features", featuresRouter);

  // Advanced Tier 2-4 Endpoints
  app.get("/api/intelligence/twin/:channelId", async (req, res) => {
      const { channelId } = req.params;
      const twin = await twinFinder.findTwin(channelId);
      res.json(twin);
  });

  app.get("/api/intelligence/arcs/:channelId", async (req, res) => {
      const { channelId } = req.params;
      const arcs = await seriesDetector.detectArcs(channelId);
      res.json(arcs);
  });

  app.get("/api/intelligence/trends/:channelId", async (req, res) => {
      const { channelId } = req.params;
      const trends = await trendForecasting.forecastTrends(channelId);
      res.json(trends);
  });

  app.post("/api/intelligence/voice", async (req, res) => {
      const { audio, channelId } = req.body;
      const idea = await voiceCapture.transcribeAndExtract(audio, channelId);
      res.json(idea);
  });

  app.post(api.chat.path, async (req, res, next) => {
    req.url = "/message";
    chatRouter(req, res, next);
  });

  return httpServer;
}
