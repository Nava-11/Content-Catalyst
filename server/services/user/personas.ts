import { storage } from "../../storage";
import { log } from "../../index";
import { kafka, Topics } from "../infrastructure/kafka";

/**
 * PersonaService
 * 
 * Models audience personas based on engagement patterns and comments.
 */
class PersonaService {
    private static instance: PersonaService;

    private constructor() { }

    static getInstance(): PersonaService {
        if (!PersonaService.instance) {
            PersonaService.instance = new PersonaService();
        }
        return PersonaService.instance;
    }

    async init() {
        log("[PersonaService] Initializing...");

        // In a real app, this would consume comment.ingested events
        await kafka.consume(Topics.FEATURES_COMPUTED, async (msg) => {
            const { channelId } = msg.value;
            await this.updatePersonas(channelId);
        });
    }

    async updatePersonas(channelId: string) {
        log(`[PersonaService] Modeling personas for ${channelId}...`);

        const existing = await storage.getAudiencePersonas(channelId);
        if (existing.length === 0) {
            // Seed default personas
            const defaults = [
                { channelId, personaName: "Learners", description: "Audience seeking specific tutorials and how-to knowledge.", engagementWeight: 0.8 },
                { channelId, personaName: "Fans", description: "Loyal viewers who watch for personality and community.", engagementWeight: 1.2 },
                { channelId, personaName: "Explorers", description: "New viewers coming from search or recommendations.", engagementWeight: 0.5 }
            ];
            for (const p of defaults) {
                await storage.createAudiencePersona(p);
            }
            log(`[PersonaService] Seeded ${defaults.length} personas for ${channelId}`);
        }
    }
}

export const personaService = PersonaService.getInstance();
export const initPersonaService = () => personaService.init();
