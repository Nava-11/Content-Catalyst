import { storage } from "../../storage";

/**
 * Feedback Loop & Skill Evolution Service
 * Closes the loop by connecting results to predictions.
 */

export interface SkillScore {
    technical: number;
    creative: number;
    consistency: number;
    overall: number;
}

export class FeedbackLoopService {
    private static instance: FeedbackLoopService;

    private constructor() {}

    public static getInstance(): FeedbackLoopService {
        if (!FeedbackLoopService.instance) {
            FeedbackLoopService.instance = new FeedbackLoopService();
        }
        return FeedbackLoopService.instance;
    }

    /**
     * Calculate Creator Skill Score evolution
     */
    async calculateSkillScore(channelId: string): Promise<SkillScore> {
        const videos = await storage.getVideos(channelId);
        const analytics = await storage.getChannelAnalytics(channelId);
        
        if (!videos.length) return { technical: 0, creative: 0, consistency: 0, overall: 0 };

        // Simple logic for demographic
        const techScore = Math.min(100, videos.filter(v => v.title.toLowerCase().includes("tech") || v.title.toLowerCase().includes("how to")).length * 10);
        const consistency = Math.min(100, (videos.length / 10) * 100); // 10 videos = 100%
        const creative = analytics ? Math.min(100, (analytics.avgCRPS * 50)) : 50;

        const overall = (techScore + creative + consistency) / 3;

        return {
            technical: techScore,
            creative: Math.round(creative),
            consistency: Math.round(consistency),
            overall: Math.round(overall)
        };
    }

    /**
     * Record feedback on an AI suggestion
     */
    async recordFeedback(ideaId: string, action: "ACCEPTED" | "REJECTED") {
        console.log(`[FeedbackLoop] Idea ${ideaId} was ${action}. Updating model...`);
        // In a real system, this would update weights in the recommendation engine (Thompson Sampling)
        return { success: true };
    }
}

export const feedbackLoopService = FeedbackLoopService.getInstance();
