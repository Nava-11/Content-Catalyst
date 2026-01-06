import natural from "natural";
import { type Video, type VideoMetric } from "@shared/schema";

const tfidf = new natural.TfIdf();

// Format Classification Rules
export function classifyFormat(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes("story") || text.includes("how i") || text.includes("history of")) return "story";
  if (text.includes("tutorial") || text.includes("how to") || text.includes("guide")) return "tutorial";
  if (text.includes("tips") || text.includes("tricks") || text.includes("advice")) return "tips";
  if (text.includes("mistake") || text.includes("stop doing") || text.includes("avoid")) return "mistakes";
  if (text.includes("react") || text.includes("reaction") || text.includes("watching")) return "reaction";
  
  return "other";
}

// CRPS Calculation
export function calculateCRPS(video: Video, avgViews: number, avgLikes: number, avgComments: number): number {
  const viewScore = avgViews > 0 ? video.views! / avgViews : 0;
  const likeScore = avgLikes > 0 ? video.likes! / avgLikes : 0;
  const commentScore = avgComments > 0 ? video.comments! / avgComments : 0;

  return (0.5 * viewScore) + (0.3 * likeScore) + (0.2 * commentScore);
}

// TF-IDF Extraction
export function extractKeywords(documents: string[]): { keyword: string; score: number }[] {
  const tfidf = new natural.TfIdf();
  
  documents.forEach(doc => tfidf.addDocument(doc));
  
  const keywords: Map<string, number> = new Map();
  
  documents.forEach((doc, index) => {
    tfidf.listTerms(index).forEach(item => {
      const current = keywords.get(item.term) || 0;
      keywords.set(item.term, current + item.tfidf);
    });
  });

  return Array.from(keywords.entries())
    .map(([keyword, score]) => ({ keyword, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

// Idea Dimension Definitions
export const Angles = [
  "origin",
  "misconception",
  "impact",
  "comparison",
  "future",
  "reaction",
  "creator_mistake",
  "behind_the_scenes"
];

export const Formats = [
  "story",
  "reaction",
  "breakdown",
  "explanation"
];

export interface GeneratedIdea {
  title: string;
  format: string;
  whyItWorks: string;
  suggestedPostingTime: string;
}

// Advanced Niche-Based Idea Generation
const INTENT_PATTERNS = [
  {
    angle: "unexplained_trend",
    match: ["trend", "viral", "happened"],
    generate: (k: string) => `This ${k} trend made no sense… until this happened`,
    logic: "Leverages curiosity gap by highlighting a nonsensical trend with a hidden resolution."
  },
  {
    angle: "underdog_success",
    match: ["idea", "laughed", "everyone"],
    generate: (k: string) => `Everyone laughed at this ${k} idea — now it’s everywhere`,
    logic: "Uses the classic hero's journey narrative where a dismissed concept becomes dominant."
  },
  {
    angle: "accidental_viral",
    match: ["clip", "viral", "meant"],
    generate: (k: string) => `This ${k} clip wasn’t meant to go viral (but it did)`,
    logic: "Plays on the 'authenticity' factor of accidental success which audiences find relatable."
  },
  {
    angle: "boundary_crossed",
    match: ["moment", "line", "crossed"],
    generate: (k: string) => `The moment this ${k} trend crossed the line`,
    logic: "Uses controversy and moral boundaries to drive intense discussion and clicks."
  },
  {
    angle: "pivotal_change",
    match: ["change", "flipped", "story"],
    generate: (k: string) => `One small change that flipped the entire ${k} story`,
    logic: "Focuses on the 'butterfly effect' in content, showing how minor tweaks lead to major shifts."
  }
];

export function generateStaticGuidance(ideas: GeneratedIdea[], analytics: any): ContentGuidance {
  return {
    topFormat: analytics.avgCrpsByFormat?.[0]?.format || "Story",
    topFormatCrps: analytics.avgCrpsByFormat?.[0]?.crps || 1.0,
    diffVsOther: 24, // Hardcoded estimate based on top format performance
    optimalLength: `${Math.floor(analytics.analytics.optimalDurationMin/60)}-${Math.ceil(analytics.analytics.optimalDurationMax/60)}m`,
    bestTime: analytics.analytics.bestDay + " " + analytics.analytics.bestHour + ":00",
    structure: {
      hook: "Start with the high-stakes moment or the 'nonsensical' element immediately.",
      body: "Walk through the sequence of events, focusing on the turning point identified in the title.",
      cta: "Ask viewers if they've seen this trend elsewhere to drive comment engagement."
    }
  };
}

// --- Growth Diagnosis & Experiments ---

export interface Experiment {
  experimentType: string;
  ideas: GeneratedIdea[];
}

export interface GrowthDiagnosis {
  strengths: string[];
  constraints: string[];
  strategy: string[];
  experiments: Experiment[];
}

const EXPERIMENT_TYPES = {
  NARRATIVE: "Narrative Differentiation Experiment",
  HOOK: "Hook-Strength Experiment",
  FORMAT: "Format Diversification Experiment",
  TIMING: "Timing Optimization Experiment",
  CONSISTENCY: "Scaling Consistency Experiment",
  SATURATION: "Saturation Escape Experiment"
};

const EXPERIMENT_INTENTS: Record<string, typeof INTENT_PATTERNS> = {
  [EXPERIMENT_TYPES.NARRATIVE]: [
    {
      angle: "narrative_shift",
      match: ["story", "flipped"],
      generate: (k) => `One small change that flipped the entire ${k} story`,
      logic: "Tests if a narrative pivot increases retention."
    },
    {
      angle: "unconventional_origin",
      match: ["started", "truth"],
      generate: (k) => `How ${k} actually started: The hidden truth`,
      logic: "Tests if historical context builds more authority than news."
    }
  ],
  [EXPERIMENT_TYPES.HOOK]: [
    {
      angle: "intrigue_gap",
      match: ["sense", "happened"],
      generate: (k) => `This ${k} trend made no sense… until this happened`,
      logic: "Tests if a high-curiosity hook improves CTR."
    },
    {
      angle: "social_proof_reversal",
      match: ["laughed", "everywhere"],
      generate: (k) => `Everyone laughed at this ${k} idea — now it’s everywhere`,
      logic: "Tests if underdog narratives outperform standard tutorials."
    }
  ],
  [EXPERIMENT_TYPES.FORMAT]: [
    {
      angle: "format_clash",
      match: ["vs", "tradition"],
      generate: (k) => `${k} vs traditional content — what actually works`,
      logic: "Tests if comparative formats drive higher engagement."
    }
  ]
};

export function diagnoseAndPlan(
  analytics: any,
  keywords: string[],
  existingTitles: string[]
): GrowthDiagnosis {
  const diagnosis: GrowthDiagnosis = {
    strengths: [],
    constraints: [],
    strategy: [],
    experiments: []
  };

  const avgViews = analytics.avgViews || 0;
  const totalVideos = analytics.totalVideos || 0;
  
  // 1. Data-Driven Diagnosis
  if (avgViews > 10000) {
    diagnosis.strengths.push("High baseline reach indicates strong topical authority.");
    diagnosis.strategy.push("Focus on Scaling Consistency to maintain momentum.");
  } else if (totalVideos > 20) {
    diagnosis.constraints.push("High output but low average views suggests a Hook or Narrative gap.");
    diagnosis.strategy.push("Prioritize Hook-Strength and Narrative Differentiation experiments.");
  } else {
    diagnosis.strengths.push("Early stage channel allows for high experimental freedom.");
    diagnosis.strategy.push("Focus on Format Diversification to find your core niche.");
  }

  // 2. Map Strategy to Experiments
  const selectedExperimentTypes: string[] = [];
  if (diagnosis.strategy.some(s => s.includes("Consistency"))) selectedExperimentTypes.push(EXPERIMENT_TYPES.CONSISTENCY);
  if (diagnosis.strategy.some(s => s.includes("Hook"))) selectedExperimentTypes.push(EXPERIMENT_TYPES.HOOK);
  if (diagnosis.strategy.some(s => s.includes("Narrative"))) selectedExperimentTypes.push(EXPERIMENT_TYPES.NARRATIVE);
  if (diagnosis.strategy.some(s => s.includes("Format"))) selectedExperimentTypes.push(EXPERIMENT_TYPES.FORMAT);

  // 3. Generate Ideas within Experiments
  const topKeywords = keywords.slice(0, 3);
  const historySet = new Set(existingTitles.map(t => t.toLowerCase()));

  selectedExperimentTypes.forEach(type => {
    const experiment: Experiment = { experimentType: type, ideas: [] };
    const patterns = EXPERIMENT_INTENTS[type] || EXPERIMENT_INTENTS[EXPERIMENT_TYPES.HOOK];

    topKeywords.forEach(k => {
      patterns.forEach(p => {
        const title = p.generate(k);
        if (!historySet.has(title.toLowerCase()) && experiment.ideas.length < 3) {
          experiment.ideas.push({
            title,
            experimentType: type,
            format: p.angle.replace(/_/g, " "),
            whyItWorks: p.logic,
            suggestedPostingTime: "Optimal based on channel analytics"
          });
        }
      });
    });
    
    if (experiment.ideas.length > 0) {
      diagnosis.experiments.push(experiment);
    }
  });

  return diagnosis;
}
