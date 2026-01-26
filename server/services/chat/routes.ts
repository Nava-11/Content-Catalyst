import { Router } from "express";
import { chatWithContext } from "./groq";
import { storage } from "../../storage";

const router = Router();

router.post("/message", async (req, res) => {
    try {
        const { channelId, message, previousMessages } = req.body;

        // 1. Gather Context
        const analytics = await storage.getChannelAnalytics(channelId);
        const keywords = await storage.getTopKeywords(channelId);
        const ideas = await storage.getIdeas(channelId); // This might need to come from Ideas Service
        const clusters = await storage.getClusters(channelId);

        const contextSummary = {
            analytics: {
                totalVideos: analytics?.totalVideos,
                avgViews: analytics?.avgViews,
                avgEngagement: (analytics?.avgLikes || 0) + (analytics?.avgComments || 0),
                optimalDuration: `${analytics?.optimalDurationMin}-${analytics?.optimalDurationMax}s`,
            },
            topTopics: clusters.map((c: any) => ({
                label: c.topicLabel || "Cluster " + c.clusterId, // Note: topicLabel isn't explicitly persisted in schema yet, might be missing
                performance: c.dominantFormats
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

export default router;
