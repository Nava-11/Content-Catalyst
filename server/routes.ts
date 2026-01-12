import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { fetchChannelVideos, parseDuration } from "./lib/youtube";
import { calculateCRPS, classifyFormat, extractKeywords } from "./lib/analysis";
import ideasLib from "./lib/ideas";
import hf from "./lib/hf";
import clustering from "./lib/clustering";
import { chatWithContext } from "./lib/groq";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // POST /api/analyze
  app.post(api.analyze.path, async (req, res) => {
    try {
      const { channelId } = api.analyze.input.parse(req.body);
      const apiKey = process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ message: "YOUTUBE_API_KEY not configured" });
      }

      // 1. Fetch Videos
      console.log(`Fetching videos for ${channelId}...`);
      const ytVideos = await fetchChannelVideos(channelId, apiKey);

      if (ytVideos.length === 0) {
        return res.status(404).json({ message: "No videos found or channel invalid" });
      }

      // 2. Process & Save Videos
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

      const totalVideos = ytVideos.length;
      const avgViews = totalVideos > 0 ? Math.floor(totalViews / totalVideos) : 0;
      const avgLikes = totalVideos > 0 ? Math.floor(totalLikes / totalVideos) : 0;
      const avgComments = totalVideos > 0 ? Math.floor(totalComments / totalVideos) : 0;

      // 3. Compute Metrics (CRPS, Format)
      const allTexts: string[] = [];
      const dbVideos = await storage.getVideos(channelId);

      for (const v of dbVideos) {
        const format = classifyFormat(v.title, v.description || "");
        const crps = calculateCRPS(v, avgViews, avgLikes, avgComments);

        await storage.upsertVideoMetric({
          videoId: v.videoId,
          format,
          crps,
        });

        allTexts.push(v.title + " " + (v.description || ""));
      }

      // 4. Keywords
      await storage.clearTopKeywords(channelId);
      const keywords = extractKeywords(allTexts);
      for (const k of keywords) {
        await storage.upsertTopKeyword({
          channelId,
          keyword: k.keyword,
          score: k.score
        });
      }

      // 5. Channel Analytics
      // Simple logic for best day/hour/duration (Placeholder for now, or simple calculation)
      // Real implementation would group by day/hour and avg CRPS.
      // For MVP, taking a dummy approach or simple stats.
      await storage.upsertChannelAnalytics({
        channelId,
        totalVideos,
        avgViews,
        avgLikes,
        avgComments,
        bestDay: "Friday", // Placeholder
        bestHour: 18,      // Placeholder
        optimalDurationMin: 600, // 10 mins
        optimalDurationMax: 1200 // 20 mins
      });

      // 6. Embeddings + Clustering (semantic topic families)
      try {
        const textsForEmbedding = dbVideos.map(v => v.title + " " + (v.description || ""));
        const embeddings = await hf.embedTexts(textsForEmbedding);
        const clusterResult = clustering.clusterEmbeddingsFallback(embeddings, 3, Math.min(8, embeddings.length));

        // persist clusters
        await storage.clearClusters(channelId);
        const allMetrics = await storage.getVideoMetrics(channelId);
        const videoIdIndexMap: Record<number, string> = {};
        dbVideos.forEach((v, idx) => { videoIdIndexMap[idx] = v.videoId; });

        const labels = clusterResult.labels || [];
        const centroids = clusterResult.centroids || [];

        for (let ci = 0; ci < centroids.length; ci++) {
          const membersIdx = labels.map((lab, idx) => lab === ci ? idx : -1).filter(i => i !== -1);
          const memberVideoIds = membersIdx.map(i => videoIdIndexMap[i]);
          const memberMetrics = allMetrics.filter(m => memberVideoIds.includes(m.videoId));
          const avgCrps = memberMetrics.length ? memberMetrics.reduce((a, b) => a + (b.crps || 0), 0) / memberMetrics.length : 0;
          const formatCounts: Record<string, number> = {};
          memberMetrics.forEach(m => { formatCounts[m.format || 'other'] = (formatCounts[m.format || 'other'] || 0) + 1; });
          const dominantFormats = Object.entries(formatCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);

          await storage.upsertCluster({
            clusterId: `${channelId}_c${ci}`,
            channelId,
            centroid: centroids[ci],
            avgCrps,
            dominantFormats,
            size: memberVideoIds.length,
            // Topic labels are not yet persisted in the schema; they are recomputed when needed for responses.
          });
        }
      } catch (e) {
        console.error("Clustering error:", e);
      }

      res.json({ success: true, message: "Analysis complete" });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // GET /api/analytics/:channelId
  app.get(api.analytics.path, async (req, res) => {
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

  // GET /api/recommendations/:channelId
  app.get(api.recommendations.path, async (req, res) => {
    const { channelId } = req.params;
    try {
      const videos = await storage.getVideos(channelId);
      const metrics = await storage.getVideoMetrics(channelId);
      const channelAnalytics = await storage.getChannelAnalytics(channelId);

      if (!channelAnalytics || videos.length === 0) return res.status(404).json({ message: "No data found. Run analysis first." });

      // Build embeddings once for all videos
      const texts = videos.map(v => v.title + " " + (v.description || ""));
      const embeddings = await hf.embedTexts(texts);

      // Prefer previously persisted clusters (from /api/analyze) so topics stay
      // stable across refreshes. If none exist, compute fresh clusters.
      const persistedClusters = await storage.getClusters(channelId);

      let labels: number[] = [];
      let centroids: any[] = [];

      if (persistedClusters && persistedClusters.length > 0) {
        centroids = persistedClusters.map((c: any) => (c.centroid as any) || []);
        labels = embeddings.map((emb) => {
          let best = 0;
          let bestSim = -Infinity;
          for (let j = 0; j < centroids.length; j++) {
            const sim = hf.cosine(emb, centroids[j] || []);
            if (sim > bestSim) {
              bestSim = sim;
              best = j;
            }
          }
          return best;
        });
      } else {
        const clusterResult = clustering.clusterEmbeddingsFallback(
          embeddings,
          3,
          Math.min(8, embeddings.length)
        );
        labels = clusterResult.labels || [];
        centroids = clusterResult.centroids || [];
      }

      // Map videos to clusters and compute cluster stats
      const clusterMap: Record<number, { videos: any[]; avgCrps: number; dominantFormats: string[]; centroid: any; topicLabel?: string; performanceSummary?: string }> = {};
      for (let i = 0; i < centroids.length; i++) {
        clusterMap[i] = { videos: [], avgCrps: 0, dominantFormats: [], centroid: centroids[i] };
      }

      const allMetrics = metrics;
      for (let i = 0; i < videos.length; i++) {
        const lab = labels[i] ?? 0;
        if (!clusterMap[lab]) {
          clusterMap[lab] = { videos: [], avgCrps: 0, dominantFormats: [], centroid: centroids[lab] || [] };
        }
        clusterMap[lab].videos.push(videos[i]);
      }

      Object.entries(clusterMap).forEach(([k, v]) => {
        const vids = v.videos.map(d => d.videoId);
        const memberMetrics = allMetrics.filter((m: any) => vids.includes(m.videoId));
        v.avgCrps = memberMetrics.length ? memberMetrics.reduce((a: number, b: any) => a + (b.crps || 0), 0) / memberMetrics.length : 0;
        const fmtCounts: Record<string, number> = {};
        memberMetrics.forEach((m: any) => { fmtCounts[m.format || 'other'] = (fmtCounts[m.format || 'other'] || 0) + 1; });
        v.dominantFormats = Object.entries(fmtCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
      });

      // Compute human-readable topic labels from cluster titles and simple performance summaries per cluster
      const allCrps = allMetrics.map((m: any) => m.crps || 0).filter((v: number) => v > 0);
      const overallAvgCrps = allCrps.length
        ? allCrps.reduce((a: number, b: number) => a + b, 0) / allCrps.length
        : 0;

      for (const [key, value] of Object.entries(clusterMap)) {
        const idx = parseInt(key, 10);
        const clusterVideos = value.videos || [];
        const topTitles = clusterVideos
          .map((v: any) => v.title || "")
          .filter(Boolean)
          .slice(0, 12);

        // Use a representative sample title as the visible label instead of
        // abstract names; clusters remain semantic structures rather than
        // being mapped to fixed genres.
        const topicLabel = topTitles[0] || "Untitled cluster";

        let performanceSummary = "Performance similar to your channel average.";
        if (overallAvgCrps > 0) {
          const rel = (value.avgCrps || 0) / overallAvgCrps;
          if (rel >= 1.15) {
            performanceSummary = `Videos about ${topicLabel} tend to perform better than other topics on this channel.`;
          } else if (rel <= 0.85) {
            performanceSummary = `Videos about ${topicLabel} usually underperform compared to your other topics.`;
          } else {
            performanceSummary = `Videos about ${topicLabel} perform roughly in line with your channel average.`;
          }
        }

        clusterMap[idx].topicLabel = topicLabel;
        clusterMap[idx].performanceSummary = performanceSummary;
      }

      // Identify primary cluster (highest avgCrps)
      let clusterList = Object.entries(clusterMap).map(([k, v]) => ({ idx: parseInt(k, 10), ...v }));
      clusterList.sort((a, b) => (b.avgCrps || 0) - (a.avgCrps || 0));
      // attach per-cluster concept profiles for the conceptual expansion layer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((ideasLib as any).attachConceptProfilesToClusters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clusterList = (ideasLib as any).attachConceptProfilesToClusters(clusterList) as any[];
      }
      const primary = clusterList[0];

      // Use layered generator: analysis -> diagnosis -> strategy -> experiments -> ideas
      const analysis = await ideasLib.analyzeChannel(videos, metrics, clusterList, channelAnalytics);
      const { diagnosis, topicContext, expressionProfile } = analysis as any; // topicContext carries primary/expansion topics

      const strategy = ideasLib.strategyFromDiagnosis(diagnosis);

      const experimentsDef = ideasLib.experimentsFromStrategy(strategy, clusterList);

      // Build adjacent clusters map for idea expansion
      const sims = clusterList.map((c: any) => ({ idx: c.idx, sim: hf.cosine(clusterList[0].centroid || [], c.centroid || []) }));
      sims.sort((a: any, b: any) => b.sim - a.sim);
      const adjacentIdxs = sims.filter((s: any) => s.idx !== clusterList[0].idx).slice(0, 3).map((s: any) => s.idx);
      const adjacentClusters = adjacentIdxs.map((i: any) => clusterList.find((c: any) => c.idx === i)).filter(Boolean);

      // For each experiment, generate ideas purely from domain-level expansion
      // topics. We do not reuse older ideas here so that recommendations
      // always reflect the current understanding of which domain topics are
      // still unused on this channel.
      const experiments: any[] = [];
      for (const expDef of experimentsDef) {
        const ideas = await ideasLib.ideasFromExperiment(
          expDef,
          clusterList[0],
          adjacentClusters,
          channelId,
          channelAnalytics,
          metrics,
          clusterList,
          topicContext,
          expressionProfile,
          3
        );
        experiments.push({
          experimentType: expDef.experimentType,
          description: expDef.description,
          ideas,
        });
      }

      // Topic cluster summaries exposed to the client for explainable clustering
      const topicClusters = clusterList.map((c: any) => ({
        index: c.idx,
        label: c.topicLabel || "Cluster",
        avgCrps: c.avgCrps || 0,
        size: (c.videos || []).length,
        performanceSummary: c.performanceSummary || "Performance similar to your channel average.",
      }));

      const payload = { diagnosis, strategy, experiments, topicClusters };
      res.json(JSON.parse(JSON.stringify(payload)));
    } catch (e: any) {
      console.error('Recommendations error:', e);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  // GET /api/idea/:id -> generate idea deep-dive blueprint
  app.get("/api/idea/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    try {
      const blueprint = await ideasLib.expandIdeaBlueprint(id);
      if (!blueprint) return res.status(404).json({ message: "Idea not found" });
      res.json({ ideaBlueprint: blueprint });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: "Failed to build idea blueprint" });
    }
  });

  // POST /api/chat -> context-aware conversation
  app.post(api.chat.path, async (req, res) => {
    try {
      const { channelId, message, previousMessages } = api.chat.input.parse(req.body);

      // 1. Gather Context
      const analytics = await storage.getChannelAnalytics(channelId);
      const keywords = await storage.getTopKeywords(channelId);
      const ideas = await storage.getIdeas(channelId);

      const clusters = await storage.getClusters(channelId);

      const contextSummary = {
        analytics: {
          totalVideos: analytics?.totalVideos,
          avgViews: analytics?.avgViews,
          avgEngagement: (analytics?.avgLikes || 0) + (analytics?.avgComments || 0),
          optimalDuration: `${analytics?.optimalDurationMin}-${analytics?.optimalDurationMax}s`,
        },
        topTopics: clusters.map(c => ({
          label: (c as any).topicLabel || "Cluster " + (c as any).clusterId,
          performance: (c as any).performanceSummary
        })).slice(0, 3),
        topKeywords: keywords.slice(0, 5).map(k => k.keyword),
        recentIdeaSparks: ideas.slice(0, 3).map(i => ({
          title: i.title,
          format: i.format,
          notes: (i as any).note
        })),
      };

      // 2. Build System Prompt
      const systemPrompt = `
        You are the "Creator Thinking Companion" for the YouTube channel "${channelId}".
        
        YOUR GOAL:
        Act as a creative sparring partner. help the creator explore new angles, refine ideas, and understand their audience better.
        Do NOT be a generic AI assistant. Be a specific, context-aware strategist.
        
        CHANNEL CONTEXT:
        ${JSON.stringify(contextSummary, null, 2)}
        
        GUIDELINES:
        1. Base your answers on the channel's actual data (provided above).
        2. If asked about performance, refer to the metrics.
        3. If asked for ideas, try to recombine their top keywords with new formats.
        4. Keep responses concise, conversational, and encouraging but realistic.
        5. Never halluncinate metrics.
        
        TONE:
        Collaborative, insightful, reflective.
      `;

      // 3. Generate Response
      const responseMessage = await chatWithContext(message, systemPrompt, previousMessages);

      res.json({ message: responseMessage });
    } catch (e: any) {
      console.error("Chat error:", e);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  return httpServer;
}
