export type RiskLevel = "Safe" | "Stretch" | "Experimental" | "Disruptive";

export interface RiskAnalysis {
    riskLevel: RiskLevel;
    noveltyScore: number;
    identityFit: "Low" | "Medium" | "High";
    predictedEngagement: "Low" | "Moderate" | "High";
}

export class CreativeRiskMeterService {
    private static instance: CreativeRiskMeterService;

    static getInstance(): CreativeRiskMeterService {
        if (!CreativeRiskMeterService.instance) {
            CreativeRiskMeterService.instance = new CreativeRiskMeterService();
        }
        return CreativeRiskMeterService.instance;
    }

    analyzeRisk(noveltyScore: number, historicalCrps: number[]): RiskAnalysis {
        const avgCrps = historicalCrps.reduce((a, b) => a + b, 0) / (historicalCrps.length || 1);

        let riskLevel: RiskLevel = "Safe";
        let identityFit: "Low" | "Medium" | "High" = "High";
        let predictedEngagement: "Low" | "Moderate" | "High" = "Moderate";

        if (noveltyScore > 0.8) {
            riskLevel = "Disruptive";
            identityFit = "Low";
            predictedEngagement = "High"; // High risk, high reward
        } else if (noveltyScore > 0.6) {
            riskLevel = "Experimental";
            identityFit = "Medium";
            predictedEngagement = "Moderate";
        } else if (noveltyScore > 0.4) {
            riskLevel = "Stretch";
            identityFit = "High";
            predictedEngagement = "Moderate";
        }

        if (avgCrps > 1.2) {
            predictedEngagement = "High";
        }

        return {
            riskLevel,
            noveltyScore,
            identityFit,
            predictedEngagement
        };
    }
}

export const creativeRiskMeter = CreativeRiskMeterService.getInstance();
