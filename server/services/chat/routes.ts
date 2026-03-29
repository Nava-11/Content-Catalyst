import { Router } from "express";
import { chatWithContext } from "./groq";
import { storage } from "../../storage";

const router = Router();

type Intent = "ANALYTICS" | "IDEA_GENERATION" | "STRATEGY" | "THUMBNAIL" | "GENERAL";

function detectIntent(message: string): Intent {
    const msg = message.toLowerCase();
    
    if (msg.includes("thumbnail") || msg.includes("image") || msg.includes("visual")) return "THUMBNAIL";
    if (msg.includes("why") || msg.includes("drop") || msg.includes("performance") || msg.includes("retention") || msg.includes("views") || msg.includes("saturation")) return "ANALYTICS";
    if (msg.includes("idea") || msg.includes("suggestion") || msg.includes("what should i make") || msg.includes("create")) return "IDEA_GENERATION";
    if (msg.includes("how to grow") || msg.includes("strategy") || msg.includes("plan") || msg.includes("next step") || msg.includes("roadmap")) return "STRATEGY";
    
    return "GENERAL";
}

router.post("/message", async (req, res) => {
    try {
        const { channelId, message, previousMessages = [] } = req.body;

        // 1. Detect Intent
        const intent = detectIntent(message);
        
        // 2. Selective Context Retrieval
        let contextSummary: any = null;
        
        if (intent !== "GENERAL") {
            const [analytics, keywords, ideas, clusters] = await Promise.all([
                storage.getChannelAnalytics(channelId),
                storage.getTopKeywords(channelId),
                storage.getIdeas(channelId),
                storage.getClusters(channelId)
            ]);

            // Construct minimal relevant context based on intent
            contextSummary = {};
            
            if (intent === "ANALYTICS" || intent === "STRATEGY") {
                contextSummary.analytics = {
                    totalVideos: analytics?.totalVideos,
                    avgViews: analytics?.avgViews,
                    retentionSignals: "Watch time and engagement are primary drivers"
                };
                contextSummary.topTopics = clusters.map((c: any) => ({
                    label: c.topicLabel || "Cluster " + c.clusterId,
                    crps: c.avgCrps,
                    size: c.size
                })).slice(0, 3);
            }
            
            if (intent === "IDEA_GENERATION" || intent === "THUMBNAIL") {
                contextSummary.topKeywords = keywords.slice(0, 8).map(k => k.keyword);
                contextSummary.successfulFormats = clusters.flatMap((c: any) => c.dominantFormats || []).slice(0, 5);
                contextSummary.recentIdeas = ideas.slice(0, 3).map(i => i.title);
            }
        }

        // 3. Memory Truncation (Keep last 3 turns)
        const recentHistory = previousMessages.slice(-6); // 3 users + 3 assistants

        // 4. Adaptive System Prompt Construction
        const styleGuides = {
            ANALYTICS: "Act as a Data Scientist. Explain causes, identify drops, and provide precise diagnostic insights based on the stats.",
            IDEA_GENERATION: "Act as a Creative Director. Provide 3-5 punchy, high-impact video ideas. Focus on 'filmable' moments.",
            STRATEGY: "Act as a Growth Strategist. Provide clear, actionable steps for channel evolution. Focus on long-term health.",
            THUMBNAIL: "Act as a Visual Architect. Describe a high-fidelity visual concept with specific focus on composition and lighting.",
            GENERAL: "Act as a helpful AI Assistant, just like ChatGPT. Be conversational, sharp, and helpful. Only use data if it's truly relevant to the query."
        };

        const systemPrompt = `
      USER INTENT: ${intent}
      STYLE GUIDE: ${styleGuides[intent]}
      
      CHANNEL CONTEXT (Grounded Data):
      ${contextSummary ? JSON.stringify(contextSummary, null, 2) : "No specific channel data requested for this general query."}

      CRITICAL CONSTRAINTS:
      1. DO NOT repeat the same response or analysis unless explicitly asked to revisit it.
      2. DO NOT use generic robotic templates like "Based on your channel's historical performance..."
      3. ANSWER ONLY the user's specific query. Be direct and conversational.
      4. IF the query is clear, answer it. IF it's unclear, ask a sharp follow-up question.
      5. RESPONSE FORMAT: Use clean, natural language. Avoid robotic structured lists unless requested.
      
      You are the "Creator Intelligence Engine". Be human, intelligent, and insightful.
    `;

        // 5. Generate Response
        const responseMessage = await chatWithContext(message, systemPrompt, recentHistory);

        res.json({ message: responseMessage });
    } catch (e: any) {
        console.error("Chat error:", e);
        res.status(500).json({ message: "Failed to process chat message" });
    }
});

export default router;
