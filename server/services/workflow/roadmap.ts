import { storage } from "../../storage";
import { log } from "../../index";

/**
 * CreativeRoadmapService
 * 
 * Generates narrative 30/60/90 day arcs.
 */
class CreativeRoadmapService {
    private static instance: CreativeRoadmapService;

    private constructor() { }

    static getInstance(): CreativeRoadmapService {
        if (!CreativeRoadmapService.instance) {
            CreativeRoadmapService.instance = new CreativeRoadmapService();
        }
        return CreativeRoadmapService.instance;
    }

    async generateRoadmap(channelId: string) {
        log(`[Roadmap] Generating arc for ${channelId}`);

        const analytics = await storage.getChannelAnalytics(channelId);

        return {
            channelId,
            arcs: [
                {
                    period: "30 Days (Consolidation)",
                    goal: "Master your core topic flow.",
                    focus: "Efficiency & Refinement"
                },
                {
                    period: "60 Days (Expansion)",
                    goal: "Introduce 2 sub-topics from adjacent clusters.",
                    focus: "Reach & Novelty"
                },
                {
                    period: "90 Days (Identity Shift)",
                    goal: "Redefine your core vibe with an experimental format.",
                    focus: "Growth & Longevity"
                }
            ]
        };
    }
}

export const roadmapService = CreativeRoadmapService.getInstance();
