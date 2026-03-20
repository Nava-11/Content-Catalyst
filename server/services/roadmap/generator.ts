import { storage } from "../../storage";
import { db } from "../../db";
import { Cluster, videos } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface RoadmapItem {
    week: number;
    title: string;
    topic: string;
    clusterSource: string;
    noveltyScore: number;
    predictedCrps: number;
    strategyType: "Core" | "Expansion" | "Experimental";
    suggestedTitles: string[];
}

export interface RoadmapResponse {
    channel: string;
    generatedAt: string;
    roadmap: {
        month1: RoadmapItem[];
        month2: RoadmapItem[];
        month3: RoadmapItem[];
    };
    insights: {
        topCluster: string;
        decliningCluster: string;
        fatigueRisk: string;
        entropy: number;
    };
}

export class RoadmapGenerator {
    async generateRoadmap(channelId: string): Promise<RoadmapResponse | null> {
        console.log(`[RoadmapGenerator] Generating roadmap for ${channelId}...`);

        const clusters = await storage.getClusters(channelId);

        if (!clusters || clusters.length === 0) {
            console.log(`[RoadmapGenerator] No clusters found for ${channelId}`);
            return null;
        }

        // 1. Calculate Entropy
        const totalSize = clusters.reduce((sum, c) => sum + (c.size || 0), 0);
        let entropy = 0;
        if (totalSize > 0) {
            for (const c of clusters) {
                const probability = (c.size || 0) / totalSize;
                if (probability > 0) {
                    entropy -= probability * Math.log2(probability);
                }
            }
        }

        // 2. Identify Clusters
        const sortedByPerformance = [...clusters].sort((a, b) => (b.avgCrps || 0) - (a.avgCrps || 0));
        const topCluster = sortedByPerformance[0];

        const sortedBySize = [...clusters].sort((a, b) => (b.size || 0) - (a.size || 0));
        // Find a large but low-performing cluster as "declining"
        const decliningCluster = sortedBySize.find(c => (c.avgCrps || 0) < 1.0) || sortedByPerformance[sortedByPerformance.length - 1];

        // Fatigue Risk logic based on entropy
        let fatigueRisk = "Low";
        if (entropy < 1.0) fatigueRisk = "Critical (High Repetition)";
        else if (entropy < 1.5) fatigueRisk = "Moderate";
        else fatigueRisk = "Low (Healthy Exploration)";

        // 3. Generate 12-week roadmap
        const roadmap: RoadmapResponse["roadmap"] = { month1: [], month2: [], month3: [] };

        // Helper to generate mock titles for AI idea generation integration
        const generateTitles = (topic: string, modifier: string) => [
            `${modifier}: ${topic} Masterclass`,
            `The Truth About ${topic} (${modifier})`,
            `I Tried ${topic} So You Don't Have To`,
            `${topic} Explained in 10 Minutes`
        ].sort(() => 0.5 - Math.random()).slice(0, 3);

        // Fetch or mock semantic names for clusters instead of showing raw UCJv... IDs
        const getSemanticTopic = async (cluster: Cluster) => {
            if ((cluster as any).topicLabel) return (cluster as any).topicLabel;

            // Try to find a video title from this cluster
            try {
                const vids = await storage.getVideos(channelId);
                // Simple heuristic: find videos that are likely in this cluster (if we had the mapping)
                // But since we are generating the roadmap from clusters directly, 
                // we should ideally have the topicLabel already set during clustering.
                // If not, we'll use the top keywords for the channel.
                
                const keywords = await storage.getTopKeywords(channelId);
                if (keywords.length > 0) {
                   const index = Math.abs(cluster.clusterId.charCodeAt(cluster.clusterId.length - 1)) % Math.min(5, keywords.length);
                   return keywords[index].keyword;
                }
            } catch (e) { }

            return "General Content";
        };

        const topTopicName = await getSemanticTopic(topCluster);
        const decliningTopicName = await getSemanticTopic(decliningCluster);

        const month1Modifiers = ["Core Foundations", "Advanced Techniques", "Common Mistakes", "Ultimate Guide"];

        // Month 1: Core Reinforcement (Weeks 1-4)
        for (let i = 1; i <= 4; i++) {
            const modifier = month1Modifiers[i - 1];
            roadmap.month1.push({
                week: i,
                title: `${modifier} for ${topTopicName}`,
                topic: topTopicName,
                clusterSource: topCluster.clusterId,
                noveltyScore: 0.15 + (i * 0.05), // Low novelty, highly familiar, slightly increasing
                predictedCrps: (topCluster.avgCrps || 1.2) * (1 + (i * 0.02)),
                strategyType: "Core",
                suggestedTitles: generateTitles(topTopicName, modifier)
            });
        }

        // Month 2: Strategic Expansion (Weeks 5-8)
        const expansionCluster = clusters.length > 1 ? clusters[1] : topCluster;
        const expansionTopicName = await getSemanticTopic(expansionCluster.clusterId);
        const month2Modifiers = ["Trend Analysis", "Cross-pollination", "Audience Bridge", "Format Shift"];

        for (let i = 5; i <= 8; i++) {
            const modifier = month2Modifiers[(i - 5)];
            roadmap.month2.push({
                week: i,
                title: `${modifier}: ${expansionTopicName}`,
                topic: expansionTopicName,
                clusterSource: expansionCluster.clusterId,
                noveltyScore: 0.4 + ((i - 4) * 0.08), // Medium novelty, ramping up
                predictedCrps: (expansionCluster.avgCrps || 1.0) * (1.05 + ((i - 4) * 0.02)),
                strategyType: "Expansion",
                suggestedTitles: generateTitles(expansionTopicName, modifier)
            });
        }

        // Month 3: Experimental Exploration (Weeks 9-12)
        const experimentalCluster = clusters.length > 2 ? clusters[2] : decliningCluster;
        const experimentalTopicName = await getSemanticTopic(experimentalCluster.clusterId);
        const month3Modifiers = ["Wildcard Format", "Controversial Take", "Vlog Shift", "Future Predictions"];

        for (let i = 9; i <= 12; i++) {
            const modifier = month3Modifiers[(i - 9)];
            roadmap.month3.push({
                week: i,
                title: `${modifier}: The ${experimentalTopicName} Experiment`,
                topic: experimentalTopicName,
                clusterSource: experimentalCluster.clusterId,
                noveltyScore: 0.75 + ((i - 8) * 0.05), // High novelty
                predictedCrps: (experimentalCluster.avgCrps || 0.8) * (1.1 + ((i - 8) * 0.05)), // Higher potential upside
                strategyType: "Experimental",
                suggestedTitles: generateTitles(experimentalTopicName, modifier)
            });
        }

        return {
            channel: channelId,
            generatedAt: new Date().toISOString(),
            roadmap,
            insights: {
                topCluster: topTopicName,
                decliningCluster: decliningTopicName,
                fatigueRisk,
                entropy
            }
        };
    }
}

export const roadmapGenerator = new RoadmapGenerator();
