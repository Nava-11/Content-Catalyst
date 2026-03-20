import { kafka, Topics } from "../infrastructure/kafka";
import { log } from "../../index";
import { storage } from "../../storage";

/**
 * CreativeWorkflowService
 * 
 * Automates thinking triggers based on creator state.
 */
class CreativeWorkflowService {
    private static instance: CreativeWorkflowService;

    private constructor() { }

    static getInstance(): CreativeWorkflowService {
        if (!CreativeWorkflowService.instance) {
            CreativeWorkflowService.instance = new CreativeWorkflowService();
        }
        return CreativeWorkflowService.instance;
    }

    async init() {
        log("[Workflow] Initializing triggers...");

        // Trigger 1: If fatigue detected -> suggests experiments
        await kafka.consume(Topics.CREATIVE_FATIGUE_DETECTED, async (msg) => {
            const { channelId, status } = msg.value;
            if (status === "Burnout Risk" || status === "Warning") {
                log(`[Workflow] Fatigue trigger for ${channelId}: Suggesting specialized experiment.`);
                // Logic to inject a "Refresh" experiment into the ideas service or notify the user
            }
        });

        // Trigger 2: If memory graph significant update -> check for identity shifts
        await kafka.consume(Topics.CREATIVE_MEMORY_UPDATED, async (msg) => {
            const { channelId, type } = msg.value;
            if (type === "cluster") {
                log(`[Workflow] Topic drift trigger for ${channelId}: Notable identity shift detected.`);
            }
        });

        log("[Workflow] Ready.");
    }
}

export const creativeWorkflow = CreativeWorkflowService.getInstance();
export const initWorkflowAutomation = () => creativeWorkflow.init();
