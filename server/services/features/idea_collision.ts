import { type Cluster } from "@shared/schema";

export interface CollisionIdea {
    title: string;
    sourceClusters: string[];
    noveltyScore: number;
}

export class IdeaCollisionEngineService {
    private static instance: IdeaCollisionEngineService;

    static getInstance(): IdeaCollisionEngineService {
        if (!IdeaCollisionEngineService.instance) {
            IdeaCollisionEngineService.instance = new IdeaCollisionEngineService();
        }
        return IdeaCollisionEngineService.instance;
    }

    generateCollisions(clusters: Cluster[]): CollisionIdea[] {
        if (clusters.length < 2) return [];

        const collisions: CollisionIdea[] = [];

        // Sort clusters by size to pick diverse sources
        const sortedClusters = [...clusters].sort((a, b) => (b.size || 0) - (a.size || 0));

        for (let i = 0; i < Math.min(sortedClusters.length, 5); i++) {
            for (let j = sortedClusters.length - 1; j > sortedClusters.length - 4 && j > i; j--) {
                const c1 = sortedClusters[i];
                const c2 = sortedClusters[j];

                // Simulate collision detection
                const idea = this.createHybridIdea(c1, c2);
                collisions.push({
                    title: idea,
                    sourceClusters: [c1.clusterId, c2.clusterId],
                    noveltyScore: Math.random() * 0.5 + 0.5 // High novelty for collisions
                });
            }
        }

        return collisions;
    }

    private createHybridIdea(c1: Cluster, c2: Cluster): string {
        // In a real system, we'd use LLM prompts or semantic merging
        const labels = ["Tutorial", "Case Study", "Deep Dive", "Comparison"];
        const label = labels[Math.floor(Math.random() * labels.length)];
        return `${label}: Combining ${c1.clusterId} with ${c2.clusterId} strategies`;
    }
}

export const ideaCollisionEngine = IdeaCollisionEngineService.getInstance();
