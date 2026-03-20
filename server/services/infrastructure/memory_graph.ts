import { neo4j } from "../infrastructure/neo4j";
import { kafka, Topics, KafkaMessage } from "../infrastructure/kafka";
import { log } from "../../index";

/**
 * MemoryGraphService
 * 
 * Orchestrates the "Creative Journey" memory by consuming Kafka events
 * and modeling them into the Neo4j graph.
 */
class MemoryGraphService {
    private static instance: MemoryGraphService;

    private constructor() { }

    static getInstance(): MemoryGraphService {
        if (!MemoryGraphService.instance) {
            MemoryGraphService.instance = new MemoryGraphService();
        }
        return MemoryGraphService.instance;
    }

    async init() {
        log("[MemoryGraph] Initializing consumers...");

        // 1. Video Ingested -> Node: Video, Topic
        await kafka.consume(Topics.VIDEO_INGESTED, async (msg: KafkaMessage) => {
            const video = msg.value;
            const videoKey = await neo4j.createNode("Video", {
                id: video.videoId,
                title: video.title,
                publishedAt: video.publishedAt
            });

            // If we have topics/keywords in the message (extended later)
            if (video.keywords) {
                for (const kw of video.keywords) {
                    const topicKey = await neo4j.createNode("Topic", { id: kw, name: kw });
                    await neo4j.createRelationship(videoKey, topicKey, "DESCRIBES");
                }
            }

            await kafka.produce(Topics.CREATIVE_MEMORY_UPDATED, { type: "video", id: video.videoId });
        });

        // 2. Cluster Updated -> Node: Topic (Cluster)
        await kafka.consume(Topics.CLUSTER_UPDATED, async (msg: KafkaMessage) => {
            const cluster = msg.value;
            const clusterKey = await neo4j.createNode("Topic", {
                id: cluster.clusterId,
                label: cluster.label,
                avgCrps: cluster.avgCrps
            });

            await kafka.produce(Topics.CREATIVE_MEMORY_UPDATED, { type: "cluster", id: cluster.clusterId });
        });

        // 3. Idea Published -> Node: Idea, Relationship: EVOLVED_FROM
        await kafka.consume(Topics.IDEA_PUBLISHED, async (msg: KafkaMessage) => {
            const { idea, videoId } = msg.value;
            const ideaKey = await neo4j.createNode("Idea", {
                id: idea.id,
                title: idea.title,
                format: idea.format
            });

            if (videoId) {
                const videoKey = `Video:${videoId}`;
                await neo4j.createRelationship(videoKey, ideaKey, "PERFORMED_AS");
            }

            await kafka.produce(Topics.CREATIVE_MEMORY_UPDATED, { type: "idea", id: idea.id });
        });

        log("[MemoryGraph] Consumers ready.");
    }
}

export const memoryGraph = MemoryGraphService.getInstance();
export const initMemoryGraph = () => memoryGraph.init();
