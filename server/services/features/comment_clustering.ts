import natural from "natural";
import { storage } from "../../storage";
import { fetchVideoComments } from "../ingestion/youtube";
import { db } from "../../db";
import { audienceCuriositySignals } from "@shared/schema";

export class CommentClustering {
    private tokenizer = new natural.WordTokenizer();
    private analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");

    async processCommentsForChannel(channelId: string, apiKey: string) {
        console.log(`[CommentClustering] Analyzing audience signals for ${channelId}`);
        
        const videos = await storage.getVideos(channelId);
        const topVideos = videos.slice(0, 5); // Analyze top 5 recent videos for signals

        const signals: Map<string, { count: number, type: string, sentiment: number }> = new Map();

        for (const video of topVideos) {
            const comments = await fetchVideoComments(video.videoId, apiKey, 20);
            
            for (const text of comments) {
                const tokens = this.tokenizer.tokenize(text.toLowerCase());
                const sentiment = this.analyzer.getSentiment(tokens);

                // Simple Topic Detection (Heuristic-based)
                // In a production app, we'd use a real Topic Modeler or LLM
                const desireKeywords = ["more", "again", "next", "please", "another"];
                const confusionKeywords = ["how", "what", "why", "confused", "understand", "wait"];

                const isDesire = desireKeywords.some(k => tokens.includes(k));
                const isConfusion = confusionKeywords.some(k => tokens.includes(k));

                // Extract a potential topic (noun-like words that aren't stop words)
                const topic = this.extractTopic(tokens);
                if (!topic) continue;

                const key = `${topic}:${isDesire ? 'desire' : isConfusion ? 'confusion' : 'love'}`;
                const existing = signals.get(key) || { count: 0, type: isDesire ? 'desire' : isConfusion ? 'confusion' : 'love', sentiment: 0 };
                
                existing.count += 1;
                existing.sentiment += sentiment;
                signals.set(key, existing);
            }
        }

        // Save top signals
        for (const [key, data] of signals.entries()) {
            if (data.count < 2) continue; // Filter out noise

            const [topic, type] = key.split(":");
            await storage.upsertAudienceCuriositySignal({
                channelId,
                topic: topic.charAt(0).toUpperCase() + topic.slice(1),
                signalStrength: (data.count * (1 + Math.abs(data.sentiment))),
                sourceType: type === 'desire' ? 'wants more' : type === 'confusion' ? 'confused' : 'enthusiasm',
                lastDetected: new Date()
            });
        }
    }

    private extractTopic(tokens: string[]): string | null {
        // Very basic: find the longest non-stopword that isn't a common desire/confusion keyword
        const stopwords = new Set(natural.stopwords);
        const exclude = new Set(["more", "again", "next", "please", "how", "what", "why", "video", "channel", "really", "great"]);
        
        const candidates = tokens.filter(t => t.length > 3 && !stopwords.has(t) && !exclude.has(t));
        if (candidates.length === 0) return null;

        // Return the most interesting candidate (simple heuristic: longest)
        return candidates.sort((a, b) => b.length - a.length)[0];
    }
}

export const commentClustering = new CommentClustering();
