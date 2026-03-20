import { type Video } from "@shared/schema";

export interface StyleProfile {
    technicalDepth: "Low" | "Medium" | "High";
    storytelling: "Low" | "Medium" | "High";
    humorLevel: "Low" | "Medium" | "High";
    instructionClarity: "Low" | "Medium" | "High";
    emotionTone: "Positive" | "Neutral" | "Negative";
}

export class CreatorStyleFingerprintService {
    private static instance: CreatorStyleFingerprintService;

    static getInstance(): CreatorStyleFingerprintService {
        if (!CreatorStyleFingerprintService.instance) {
            CreatorStyleFingerprintService.instance = new CreatorStyleFingerprintService();
        }
        return CreatorStyleFingerprintService.instance;
    }

    analyzeStyle(videos: Video[]): StyleProfile {
        const allText = videos.map(v => `${v.title} ${v.description || ""}`).join(" ").toLowerCase();

        return {
            technicalDepth: this.calculateTechnicalDepth(allText),
            storytelling: this.calculateStorytelling(allText),
            humorLevel: this.calculateHumor(allText),
            instructionClarity: this.calculateClarity(allText),
            emotionTone: this.calculateTone(allText),
        };
    }

    private calculateTechnicalDepth(text: string): "Low" | "Medium" | "High" {
        const technicalKeywords = ["tutorial", "architecture", "implementation", "advanced", "deep dive", "framework", "schema", "uul", "optimization"];
        const count = technicalKeywords.filter(k => text.includes(k)).length;
        if (count > 5) return "High";
        if (count > 2) return "Medium";
        return "Low";
    }

    private calculateStorytelling(text: string): "Low" | "Medium" | "High" {
        const narrativeKeywords = ["story", "journey", "experience", "how i", "behind the scenes", "lesson", "then", "finally"];
        const count = narrativeKeywords.filter(k => text.includes(k)).length;
        if (count > 4) return "High";
        if (count > 2) return "Medium";
        return "Low";
    }

    private calculateHumor(text: string): "Low" | "Medium" | "High" {
        const humorSignals = ["lol", "funny", "joke", "meme", "outtakes", "parody", "hilarious"];
        const count = humorSignals.filter(k => text.includes(k)).length;
        if (count > 3) return "High";
        if (count > 1) return "Medium";
        return "Low";
    }

    private calculateClarity(text: string): "Low" | "Medium" | "High" {
        const claritySignals = ["explaining", "clear", "simple", "step by step", "how to", "understand", "overview"];
        const count = claritySignals.filter(k => text.includes(k)).length;
        if (count > 4) return "High";
        if (count > 2) return "Medium";
        return "Low";
    }

    private calculateTone(text: string): "Positive" | "Neutral" | "Negative" {
        const positiveWords = ["great", "awesome", "excited", "happy", "love", "best"];
        const negativeWords = ["bad", "wrong", "fail", "broken", "issue", "problem"];

        const posCount = positiveWords.filter(k => text.includes(k)).length;
        const negCount = negativeWords.filter(k => text.includes(k)).length;

        if (posCount > negCount + 2) return "Positive";
        if (negCount > posCount + 1) return "Negative";
        return "Neutral";
    }
}

export const creatorStyleFingerprint = CreatorStyleFingerprintService.getInstance();
