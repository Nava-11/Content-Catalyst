import { EventEmitter } from "events";

// Typed Events
export enum Topics {
    VIDEO_INGESTED = "video.ingested",
    FEATURES_COMPUTED = "features.computed",
    CLUSTER_UPDATED = "cluster.updated",
    IDEA_GENERATED = "idea.generated",
    IDEA_CLICKED = "idea.clicked",
    IDEA_SAVED = "idea.saved",
    IDEA_PLANNED = "idea.planned",
    IDEA_PUBLISHED = "idea.published",
    REWARD_LOGGED = "reward.logged",
    CREATIVE_MEMORY_UPDATED = "creative.memory.updated",
    CREATIVE_FATIGUE_DETECTED = "creative.fatigue.detected",
    MEDIA_ANALYZED = "media.analyzed"
}

export interface KafkaMessage<T = any> {
    topic: Topics;
    value: T;
    timestamp: number;
}

class MockKafkaService extends EventEmitter {
    private static instance: MockKafkaService;

    private constructor() {
        super();
        // Increase listener limit for complex orchestrations
        this.setMaxListeners(20);
    }

    static getInstance(): MockKafkaService {
        if (!MockKafkaService.instance) {
            MockKafkaService.instance = new MockKafkaService();
        }
        return MockKafkaService.instance;
    }

    async produce(topic: Topics, message: any): Promise<void> {
        const payload: KafkaMessage = {
            topic,
            value: message,
            timestamp: Date.now()
        };

        // Simulate network delay
        setTimeout(() => {
            console.log(`[Kafka] Emitting ${topic}`, JSON.stringify(message).slice(0, 50) + "...");
            this.emit(topic, payload);
        }, 10);
    }

    async consume(topic: Topics, callback: (message: KafkaMessage) => Promise<void> | void): Promise<void> {
        this.on(topic, async (payload: KafkaMessage) => {
            try {
                await callback(payload);
            } catch (e) {
                console.error(`[Kafka] Consumer error on ${topic}:`, e);
            }
        });
        console.log(`[Kafka] Subscribed to ${topic}`);
    }
}

export const kafka = MockKafkaService.getInstance();
