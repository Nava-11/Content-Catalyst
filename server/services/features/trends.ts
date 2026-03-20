import { storage } from "../../storage";
import { embedText } from "../ideas/hf";

export interface TrendSignal {
    topic: string;
    momentum: number; // 0-1
    predictedPeak: string;
    sentiment: "Rising" | "Saturating" | "Declining";
}

export class NicheTrendForecasting {
    /**
     * Identifies rising trends by cross-referencing channel performance with global seeds.
     * Mock implementation for MVP.
     */
    async forecastTrends(channelId: string): Promise<TrendSignal[]> {
        console.log(`[TrendForecasting] Generating niche forecast for ${channelId}`);
        
        const myKeywords = await storage.getTopKeywords(channelId);
        const topTopic = myKeywords.length > 0 ? myKeywords[0].keyword : "AI Technology";

        // Determine niche based on keywords (simple heuristic)
        const isTech = myKeywords.some(k => ["code", "programming", "software", "tech", "react", "architecture"].includes(k.keyword.toLowerCase()));
        
        let risingSeeds = ["Creator Burnout Solutions", "Short-form Storytelling", "Community-led Growth", "Monetization Pivots", "Vertical Video SEO"];
        if (isTech) {
            risingSeeds = ["Agentic AI", "Real-world automation", "Post-SaaS era", "Local LLMs", "Open source breakthroughs"];
        } else if (myKeywords.some(k => ["comic", "story", "manga", "art"].includes(k.keyword.toLowerCase()))) {
            risingSeeds = ["Digital Art Workflows", "Webtoon Adaptation", "Indie Comic Marketing", "Character Design Trends", "Narrative Pacing"];
        }
        
        const forecast: TrendSignal[] = risingSeeds.map(topic => {
            const momentum = 0.5 + Math.random() * 0.4;
            return {
                topic,
                momentum,
                predictedPeak: "2-4 Weeks",
                sentiment: momentum > 0.7 ? "Rising" : "Saturating"
            };
        });

        // Add one specifically fused with the channel's top topic
        forecast.push({
            topic: `The Future of ${topTopic}`,
            momentum: 0.92,
            predictedPeak: "Next 7 Days",
            sentiment: "Rising"
        });

        return forecast.sort((a, b) => b.momentum - a.momentum);
    }
}

export const trendForecasting = new NicheTrendForecasting();
