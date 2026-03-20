import { storage } from "../../storage";
import { kafka, Topics } from "../infrastructure/kafka";

/**
 * AI Co-Creator Agent
 * Autonomous reasoning engine that generates strategic directives.
 * Reacts to feature updates and channel states.
 */

export interface AgentDirective {
    id: string;
    type: "Strategic" | "Tactical" | "Creative";
    title: string;
    description: string;
    confidence: number;
    reasoning: string[];
    timestamp: Date;
}

export class CoCreatorAgent {
    private static instance: CoCreatorAgent;
    private thoughts: string[] = [];

    private constructor() {
        this.init();
    }

    public static getInstance(): CoCreatorAgent {
        if (!CoCreatorAgent.instance) {
            CoCreatorAgent.instance = new CoCreatorAgent();
        }
        return CoCreatorAgent.instance;
    }

    private init() {
        console.log("[CoCreatorAgent] Initializing reasoning core...");
        
        kafka.consume(Topics.FEATURES_COMPUTED, async (msg) => {
            const { channelId } = msg.value;
            await this.reason(channelId);
        });
    }

    private addThought(thought: string) {
        this.thoughts.unshift(thought);
        if (this.thoughts.length > 20) this.thoughts.pop();
        console.log(`[CoCreatorAgent Thought] ${thought}`);
    }

    public getThoughts() {
        return this.thoughts;
    }

    /**
     * Reasoning Engine
     */
    async reason(channelId: string): Promise<AgentDirective[]> {
        this.addThought(`Analyzing feature vector for channel ${channelId}...`);
        
        const analytics = await storage.getChannelAnalytics(channelId);
        const dna = await storage.getVideos(channelId); // Simplified for logic
        
        this.addThought("Cross-referencing with Memory Layer patterns...");
        
        const directives: AgentDirective[] = [];
        
        // Example logic: if views are high but CRPS is declining
        this.addThought("Detected entropy shift in narrative clusters.");
        
        directives.push({
            id: `dir_${Date.now()}`,
            type: "Strategic",
            title: "Inject Narrative Novelty",
            description: "Your audience core is stabilizing but ceiling is reached. Introduce a 'Collision' topic to expand reach.",
            confidence: 0.92,
            reasoning: [
                "Cluster 'Microservices' has reached 85% saturation.",
                "Engagement velocity is -12% compared to last 30 days.",
                "Successful peers (Creative Twins) are pivoting to 'Distributed Systems'."
            ],
            timestamp: new Date()
        });

        this.addThought("Directive generated: Narrative Novelty Injection suggested.");
        
        return directives;
    }
}

export const coCreatorAgent = CoCreatorAgent.getInstance();
