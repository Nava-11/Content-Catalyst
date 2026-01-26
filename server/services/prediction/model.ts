import { featureStore } from "../features/store";

// Simple interface for a model
export interface Model {
    predict(features: Record<string, any>): number;
    train?(data: any[]): void;
}

// 1. Heuristic Baseline Model (Cold Start)
// Uses weighted sum of features to predict "Performance Score"
export class HeuristicModel implements Model {
    predict(features: Record<string, any>): number {
        // Normalize inputs (assuming rough ranges)
        const views = Math.log(features["video_views"] + 1) || 0;
        const duration = (features["video_duration"] || 600) / 60; // Minutes
        const crps = features["video_crps"] || 1.0;

        // Feature Engineering: "Sweet Spot" duration (10-20 mins)
        let durationScore = 0;
        if (duration > 10 && duration < 20) durationScore = 1;
        else if (duration > 5 && duration < 30) durationScore = 0.5;

        // Prediction formula
        // We predict a "Potential Score" from 0 to 100
        const score = (crps * 50) + (durationScore * 20) + (Math.min(views, 100) / 100 * 30);

        return Math.min(100, Math.max(0, score));
    }
}

// 2. Placeholder for Real ML (Random Forest)
// In a real app, we'd load a serialize JSON model or ONNX here.
export class MLModel implements Model {
    predict(features: Record<string, any>): number {
        // Stub: random variation around heuristic
        return new HeuristicModel().predict(features) * (0.9 + Math.random() * 0.2);
    }
}

export const activeModel = new HeuristicModel(); // Start with Heuristic
