import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { fetchChannelVideos, parseDuration } from "./lib/youtube";
import { calculateCRPS, classifyFormat, extractKeywords, diagnoseAndPlan, generateStaticGuidance } from "./lib/analysis";
import { generateGuidance } from "./lib/openai";

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
      const keywords = await storage.getTopKeywords(channelId);
      const videos = await storage.getVideos(channelId);
      const metrics = await storage.getVideoMetrics(channelId);
      const channelAnalytics = await storage.getChannelAnalytics(channelId);
      
      if (keywords.length === 0 || !channelAnalytics) {
          return res.status(404).json({ message: "No data found. Run analysis first." });
      }

      const keywordList = keywords.map(k => k.keyword);
      const videoTitles = videos.map(v => v.title);
      
      try {
        const diagnosisData = diagnoseAndPlan(channelAnalytics, keywordList, videoTitles);
        
        // Prepare guidance based on the first experiment's ideas if available
        const allIdeas = diagnosisData.experiments.flatMap(e => e.ideas);
        
        const formatGroups: Record<string, number[]> = {};
        metrics.forEach(m => {
            if (!formatGroups[m.format!]) formatGroups[m.format!] = [];
            formatGroups[m.format!].push(m.crps || 0);
        });
        
        const avgCrpsByFormat = Object.entries(formatGroups).map(([format, scores]) => ({
            format,
            crps: scores.reduce((a, b) => a + b, 0) / scores.length
        })).sort((a,b) => b.crps - a.crps);

        const guidance = generateStaticGuidance(allIdeas, { 
          analytics: channelAnalytics, 
          avgCrpsByFormat 
        });

        res.json({ 
          diagnosis: {
            strengths: diagnosisData.strengths,
            constraints: diagnosisData.constraints
          },
          strategy: diagnosisData.strategy,
          experiments: diagnosisData.experiments,
          guidance // Keep for compatibility but UI will focus on experiments
        });
      } catch (e: any) {
        console.error("Analysis Error:", e);
        res.status(500).json({ message: "Failed to generate recommendations" });
      }
  });

  return httpServer;
}
