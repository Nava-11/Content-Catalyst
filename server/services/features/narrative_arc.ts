export interface NarrativeSegmentation {
    hook: string;
    problemDefinition: string;
    solutionDepth: string;
    retentionRisk: "Low" | "Medium" | "High";
    structure: { stage: string; content: string }[];
}

export class NarrativeArcAnalyzerService {
    private static instance: NarrativeArcAnalyzerService;

    static getInstance(): NarrativeArcAnalyzerService {
        if (!NarrativeArcAnalyzerService.instance) {
            NarrativeArcAnalyzerService.instance = new NarrativeArcAnalyzerService();
        }
        return NarrativeArcAnalyzerService.instance;
    }

    analyzeTranscript(transcript: string): NarrativeSegmentation {
        // Basic segmentation logic using keyword markers
        const lines = transcript.split("\n");
        const segments: { stage: string; content: string }[] = [];

        let currentStage = "Hook";
        let currentContent = "";

        const markers = [
            { keywords: ["problem", "issue", "why", "difficult"], stage: "Problem Definition" },
            { keywords: ["solution", "how to", "fix", "step", "implement"], stage: "Solution Depth" },
            { keywords: ["conclusion", "summary", "finally", "thanks"], stage: "Conclusion" }
        ];

        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            const marker = markers.find(m => m.keywords.some(k => lowerLine.includes(k)));

            if (marker && marker.stage !== currentStage) {
                segments.push({ stage: currentStage, content: currentContent.trim() });
                currentStage = marker.stage;
                currentContent = "";
            }
            currentContent += line + " ";
        }
        segments.push({ stage: currentStage, content: currentContent.trim() });

        const hook = segments.find(s => s.stage === "Hook")?.content || "Present";
        const problem = segments.find(s => s.stage === "Problem Definition")?.content || "Undefined";
        const solution = segments.find(s => s.stage === "Solution Depth")?.content || "Undefined";

        return {
            hook: hook.length > 50 ? "Present" : "Weak",
            problemDefinition: problem.length > 100 ? "Strong" : "Weak",
            solutionDepth: solution.length > 200 ? "Strong" : "Medium",
            retentionRisk: solution.length < 100 ? "High" : "Low",
            structure: segments
        };
    }
}

export const narrativeArcAnalyzer = NarrativeArcAnalyzerService.getInstance();
