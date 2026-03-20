import { type Video } from "@shared/schema";

export type LongevityClassification = "Evergreen" | "Seasonal" | "Short-term trending" | "One-time spike";

export interface LongevityPrediction {
    classification: LongevityClassification;
    predictionScore: number;
}

export class ContentLongevityPredictorService {
    private static instance: ContentLongevityPredictorService;

    static getInstance(): ContentLongevityPredictorService {
        if (!ContentLongevityPredictorService.instance) {
            ContentLongevityPredictorService.instance = new ContentLongevityPredictorService();
        }
        return ContentLongevityPredictorService.instance;
    }

    predictLongevity(video: Video, clusterStability: number): LongevityPrediction {
        const title = video.title.toLowerCase();
        const views = video.views || 0;
        const publishedAt = new Date(video.publishedAt!);
        const ageInDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

        let classification: LongevityClassification = "Short-term trending";
        let score = 0.5;

        // Heuristics for classification
        if (title.includes("tutorial") || title.includes("how to") || title.includes("explained")) {
            classification = "Evergreen";
            score = 0.8 + (clusterStability * 0.2);
        } else if (title.includes("2024") || title.includes("2025") || title.includes("review") || title.includes("news")) {
            classification = "Seasonal";
            score = 0.6;
        } else if (views > 10000 && ageInDays < 7) {
            classification = "One-time spike";
            score = 0.9;
        }

        return { classification, predictionScore: score };
    }
}

export const contentLongevityPredictor = ContentLongevityPredictorService.getInstance();
