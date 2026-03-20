import { storage } from "../../storage";
import { cosine, embedText } from "../ideas/hf";
import { db } from "../../db";
import { clusters, creatorStyleProfiles, channelAnalytics } from "@shared/schema";
import { eq, ne } from "drizzle-orm";

export interface TwinProfile {
    channelId: string;
    label: string;
    similarity: number;
    trajectory: { month: string, views: number }[];
    topTopics: string[];
}

export class CreativeTwinFinder {
    /**
     * Finds the channel whose early-stage embedding most resembles the current creator's.
     */
    async findTwin(channelId: string): Promise<TwinProfile | null> {
        console.log(`[TwinFinder] Finding creative twin for ${channelId}`);
        
        // 1. Get current creator's profile
        const myProfile = await storage.getCreatorStyleProfile(channelId);
        const myClusters = await storage.getClusters(channelId);
        if (!myProfile || myClusters.length === 0) return null;

        // 2. Create the "Channel Embedding" (A composite vector of style + top topics)
        const myVector = this.createChannelVector(myProfile, myClusters);

        // 3. Find other channels (excluding own)
        // In a real app, we'd query a vector DB. Here we'll iterate through known profiles in the DB.
        const allProfiles = await db.select().from(creatorStyleProfiles).where(ne(creatorStyleProfiles.channelId, channelId));
        
        let bestTwinId = null;
        let maxSim = -1;

        for (const profile of allProfiles) {
            const twinClusters = await storage.getClusters(profile.channelId);
            if (twinClusters.length === 0) continue;

            const twinVector = this.createChannelVector(profile, twinClusters);
            const sim = cosine(myVector, twinVector);

            if (sim > maxSim) {
                maxSim = sim;
                bestTwinId = profile.channelId;
            }
        }

        if (!bestTwinId) {
            // Fallback: If no other real profiles in DB, return a synthetic "benchmark" twin
            const topTopic = (myClusters[0] as any)?.topicLabel || "Specialist";
            return this.getSyntheticTwin(maxSim > 0 ? maxSim : 0.72, topTopic);
        }

        // 4. Build Twin Profile
        const twinAnalytics = await storage.getChannelAnalytics(bestTwinId);
        const twinClusters = await storage.getClusters(bestTwinId);

        return {
            channelId: "anonymized-" + bestTwinId.slice(-4),
            label: `${this.getDomainLabel(twinClusters)} Creator`,
            similarity: maxSim,
            trajectory: this.generateTrajectory(twinAnalytics?.avgViews || 10000),
            topTopics: twinClusters.slice(0, 3).map(c => c.clusterId) // clusterId usually has the label
        };
    }

    private createChannelVector(profile: any, clusterList: any[]): number[] {
        // Convert style scores (already 0-1 strings usually) to numbers
        const style = [
            parseFloat(profile.technicalDepth || "0.5"),
            parseFloat(profile.storytelling || "0.5"),
            parseFloat(profile.humorLevel || "0.5")
        ];

        // Add topic distribution (represented by cluster sizes normalized)
        const total = clusterList.reduce((sum, c) => sum + (c.size || 0), 0) || 1;
        const distribution = clusterList.slice(0, 5).map(c => (c.size || 0) / total);
        
        // Pad distribution to fixed length
        while (distribution.length < 5) distribution.push(0);

        return [...style, ...distribution];
    }

    private getDomainLabel(clusters: any[]): string {
        const top = clusters[0]?.clusterId || "General";
        if (top.toLowerCase().includes("tech")) return "Tech/Coding";
        if (top.toLowerCase().includes("lifestyle")) return "Lifestyle/Vlog";
        if (top.toLowerCase().includes("gaming")) return "Gaming";
        return "Creative";
    }

    private generateTrajectory(avgViews: number) {
        return [
            { month: "Month 1", views: Math.floor(avgViews * 0.4) },
            { month: "Month 3", views: Math.floor(avgViews * 0.7) },
            { month: "Month 6", views: Math.floor(avgViews * 1.2) },
            { month: "Month 12", views: Math.floor(avgViews * 2.5) }
        ];
    }

    private getSyntheticTwin(sim: number, topTopicLabel?: string): TwinProfile {
        const labels = topTopicLabel ? [topTopicLabel, "Storytelling", "Formats"] : ["Productivity/SaaS Creator", "Workflows", "Automation"];
        return {
            channelId: "benchmark-alpha",
            label: topTopicLabel ? `${topTopicLabel} Creator` : "Benchmark Creator",
            similarity: sim,
            trajectory: this.generateTrajectory(25000),
            topTopics: labels
        };
    }
}

export const twinFinder = new CreativeTwinFinder();
