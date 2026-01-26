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

  // --- API Gateway (Client Compatibility) ---

  // 1. Analysis Orchestrator (Monolithic Glue for Task 0)
  app.post(api.analyze.path, async (req, res) => {
    try {
      const { channelId } = api.analyze.input.parse(req.body);
      const apiKey = process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ message: "YOUTUBE_API_KEY not configured" });
      }

      console.log(`[Gateway] Orchestrating analysis for ${channelId}...`);

      // Step 1: Ingestion
      await ingestChannel(channelId, apiKey);

      // Step 2: Analytics (Aggregation)
      const analyticsInfo = await updateChannelStats(channelId);

      // Reload full analytics object for features
      const analytics = await storage.getChannelAnalytics(channelId);

      // Step 3: Features & Keywords
      if (analytics) {
        await computeFeatures(channelId, analytics);
      }

      // Step 4: Clustering
      // We rely on the ideas service keying off the data later, 
      // or we could hit an internal helper if we exported it.
      // For now, lazy-loading in /recommendations is sufficient.

      res.json({ success: true, message: "Analysis complete" });

    } catch (error: any) {
      console.error("[Gateway] Analysis error:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // 2. Analytics Routes
  // Route: /api/analytics/:channelId
  // Service: /services/analytics/:channelId
  app.use("/api/analytics", analyticsRouter);

  // 3. Ideas/Recommendations Routes
  // Route: /api/recommendations/:channelId -> Service handles /recommendations/:channelId
  // Route: /api/idea/:id -> Service handles /idea/:id
  app.use("/api", ideasRouter);

  // 4. Chat Routes
  // Route: /api/chat -> Service handles /message
  // We need to rewrite the path or just proxy manually.
  // Using manual proxy for clarity.
  app.post(api.chat.path, async (req, res, next) => {
    req.url = "/message"; // Rewrite for the sub-router
    chatRouter(req, res, next);
  });

  return httpServer;
}
