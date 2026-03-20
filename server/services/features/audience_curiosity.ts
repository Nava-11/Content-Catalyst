import { type TopKeyword } from "@shared/schema";

export interface CuriositySignal {
    topic: string;
    strength: number;
    source: "comment" | "keyword_gap";
}

export class AudienceCuriosityMapService {
    private static instance: AudienceCuriosityMapService;

    static getInstance(): AudienceCuriosityMapService {
        if (!AudienceCuriosityMapService.instance) {
            AudienceCuriosityMapService.instance = new AudienceCuriosityMapService();
        }
        return AudienceCuriosityMapService.instance;
    }

    detectCuriosity(keywords: TopKeyword[], comments: string[]): CuriositySignal[] {
        const signals: CuriositySignal[] = [];

        // 1. Keyword Gaps: Keywords with high frequency but low coverage in video titles
        const gapKeywords = keywords.slice(0, 10).filter(k => k.score! > 0.5);
        for (const k of gapKeywords) {
            signals.push({
                topic: k.keyword,
                strength: k.score!,
                source: "keyword_gap"
            });
        }

        // 2. Comment Analysis: Detect questions or requests
        const questionPatterns = ["how do i", "can you show", "what about", "is it possible", "request", "please make"];
        const topicFrequency: Map<string, number> = new Map();

        for (const comment of comments) {
            const lowerComment = comment.toLowerCase();
            if (questionPatterns.some(p => lowerComment.includes(p))) {
                // Simple extraction: words after the pattern
                const words = lowerComment.split(" ");
                if (words.length > 5) {
                    const topic = words.slice(3, 6).join(" ");
                    topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);
                }
            }
        }

        for (const [topic, freq] of topicFrequency.entries()) {
            signals.push({
                topic,
                strength: Math.min(freq / 5, 1.0),
                source: "comment"
            });
        }

        return signals.sort((a, b) => b.strength - a.strength).slice(0, 10);
    }
}

export const audienceCuriosityMap = AudienceCuriosityMapService.getInstance();
