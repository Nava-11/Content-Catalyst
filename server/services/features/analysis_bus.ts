import { kafka, Topics, KafkaMessage } from "../infrastructure/kafka";
import { log } from "../../index";
import { storage } from "../../storage";

/**
 * CreativeFatigueService
 * 
 * Detects creative burnout risks by analyzing topic entropy, 
 * novelty scores, and CRPS variance over time.
 */
class CreativeFatigueService {
    private static instance: CreativeFatigueService;

    private constructor() { }

    static getInstance(): CreativeFatigueService {
        if (!CreativeFatigueService.instance) {
            CreativeFatigueService.instance = new CreativeFatigueService();
        }
        return CreativeFatigueService.instance;
    }

    async init() {
        log("[FatigueDetector] Initializing consumers...");

        await kafka.consume(Topics.FEATURES_COMPUTED, async (msg: KafkaMessage) => {
            const { channelId, features } = msg.value;
            const fatigueStatus = await this.analyzeFatigue(channelId, features);

            await kafka.produce(Topics.CREATIVE_FATIGUE_DETECTED, {
                channelId,
                status: fatigueStatus.level,
                reason: fatigueStatus.reason,
                metrics: fatigueStatus.metrics
            });
        });

        log("[FatigueDetector] Ready.");
    }

    private async analyzeFatigue(channelId: string, features: any) {
        // Mocked logic for fatigue detection based on user requirements:
        // Cluster entropy (topic repetition)
        // Decreasing novelty score
        // Declining CRPS variance

        // Simulating statistical drift detection
        const recentVideos = await storage.getVideos(channelId); // In a real app, use a windowed query
        const uploadGaps = this.calculateUploadGaps(recentVideos);

        const avgGap = uploadGaps.reduce((a, b) => a + b, 0) / (uploadGaps.length || 1);
        const maxGap = Math.max(...uploadGaps, 0);

        let level: "Stable" | "Warning" | "Burnout Risk" = "Stable";
        let reason = "Your creative engine is humming along nicely.";

        // Heuristic: If gaps are increasing significantly or novelty is low
        if (avgGap > 15 || maxGap > 30) {
            level = "Warning";
            reason = "A slight drop in upload frequency detected. Might be a good time to experiment.";
        }

        if (features?.noveltyScore < 0.3) {
            level = "Burnout Risk";
            reason = "We're seeing a lot of topic repetition recently. Your audience might appreciate a fresh perspective.";
        }

        return {
            level,
            reason,
            metrics: {
                avgGap,
                noveltyScore: features?.noveltyScore || 0.5
            }
        };
    }

    private calculateUploadGaps(videos: any[]): number[] {
        if (videos.length < 2) return [];
        const gaps: number[] = [];
        for (let i = 0; i < videos.length - 1; i++) {
            const d1 = new Date(videos[i].publishedAt).getTime();
            const d2 = new Date(videos[i + 1].publishedAt).getTime();
            gaps.push(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
        }
        return gaps;
    }
}

export const creativeFatigue = CreativeFatigueService.getInstance();
export const initFatigueDetector = () => creativeFatigue.init();
