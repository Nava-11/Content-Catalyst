import { storage } from "../../storage";
import { db } from "../../db";
import { userNotifications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class NudgeService {
    /**
     * Aggregates intelligence into actionable nudges.
     * To be called weekly or after a major analysis.
     */
    async generateNudges(channelId: string) {
        console.log(`[NudgeService] Generating push intelligence for ${channelId}`);
        
        const nudges = [];

        // 1. Check Burnout/Fatigue
        const burnout = await storage.getBurnoutSignal(channelId);
        if (burnout && burnout.burnoutRisk === 'High') {
            nudges.push({
                type: 'alert',
                title: 'Burnout Risk Detected',
                message: `Your creative entropy is high. We recommend a ${burnout.recommendation || 'short break'} to reset your narrative arc.`
            });
        }

        // 2. Check Audience Curiosity (Comment Signals)
        const curiosity = await storage.getAudienceCuriositySignals(channelId);
        if (curiosity.length > 0) {
            const topSignal = curiosity[0];
            nudges.push({
                type: 'nudge',
                title: 'Audience Signal Detected',
                message: `Your viewers are specifically asking for more content about "${topSignal.topic}". This is a high-growth opportunity.`
            });
        }

        // 3. Check Prediction Performance
        // (If we have ideas with high negative delta, suggest a format pivot)
        const ideas = await storage.getIdeas(channelId);
        const badPerformers = ideas.filter(i => (i.predictionDelta || 0) < -0.5).slice(0, 1);
        if (badPerformers.length > 0) {
            nudges.push({
                type: 'digest',
                title: 'Format Fatigue Alert',
                message: `Your latest video on "${badPerformers[0].title}" underperformed relative to our prediction. Consider shifting to a ${badPerformers[0].experimentType || 'different'} lens for this topic.`
            });
        }

        // Save to DB
        for (const n of nudges) {
            await db.insert(userNotifications).values({
                channelId,
                type: n.type,
                title: n.title,
                message: n.message,
                isRead: "false",
                createdAt: new Date()
            });
        }

        console.log(`[NudgeService] Created ${nudges.length} nudges for ${channelId}`);
    }

    async getNotifications(channelId: string) {
        return await db.select().from(userNotifications)
            .where(eq(userNotifications.channelId, channelId))
            .orderBy(desc(userNotifications.createdAt))
            .limit(10);
    }
}

export const nudgeService = new NudgeService();
