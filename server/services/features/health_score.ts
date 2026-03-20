export interface EcosystemHealth {
    topicDiversity: number;
    engagementStability: number;
    innovationRate: number;
    curiosityCoverage: number;
    overallScore: number;
    burnoutRisk: "Stable" | "Warning" | "Burnout Risk";
}

export class EcosystemHealthScoreService {
    private static instance: EcosystemHealthScoreService;

    static getInstance(): EcosystemHealthScoreService {
        if (!EcosystemHealthScoreService.instance) {
            EcosystemHealthScoreService.instance = new EcosystemHealthScoreService();
        }
        return EcosystemHealthScoreService.instance;
    }

    calculateHealth(metrics: {
        topicDiversity: number;
        engagementStability: number;
        innovationRate: number;
        curiosityCoverage: number;
        burnoutSignals: { level: string };
    }): EcosystemHealth {
        const { topicDiversity, engagementStability, innovationRate, curiosityCoverage, burnoutSignals } = metrics;

        const overallScore = (
            (topicDiversity * 0.25) +
            (engagementStability * 0.25) +
            (innovationRate * 0.25) +
            (curiosityCoverage * 0.25)
        );

        return {
            topicDiversity,
            engagementStability,
            innovationRate,
            curiosityCoverage,
            overallScore: parseFloat(overallScore.toFixed(1)),
            burnoutRisk: burnoutSignals.level as any
        };
    }
}

export const ecosystemHealthScore = EcosystemHealthScoreService.getInstance();
