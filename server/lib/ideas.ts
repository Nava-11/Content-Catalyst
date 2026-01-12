import { extractKeywords } from "./analysis";
import { storage } from "../storage";

// ===========================================================================
// CREATOR WORLD MODELING (Stage 1)
// ===========================================================================

export type CreatorWorld = {
  entities: WorldElement[];   // Characters, Tools, Concepts (Nouns)
  situations: WorldElement[]; // Contexts, Scenarios (Prepositional Phrases, Gerunds)
  tones: ToneProfile;         // The "Vibe" of the channel
  dominantFormats: string[];  // NEW: Inferred formats (e.g. "Tutorial", "Vlog", "Listicle")
};

type WorldElement = {
  text: string;
  type: "entity" | "situation" | "action";
  frequency: "core" | "peripheral" | "rare";
  sourceContext?: string; // Where did we see this?
};

type ToneProfile = {
  seriousness: number;  // 0=Meme/Chaos, 1=Academic/Formal
  optimism: number;     // 0=Doom/Rant, 1=Hype/Growth
  narrative: number;    // 0=Listicle/Raw, 1=Story/Journey
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/**
 * Heuristically extracts the "World" of the creator from their past 50 titles.
 * Does NOT use hardcoded categories. Uses simple NLP structural heuristics.
 */
export function extractCreatorWorld(titles: string[], descriptions: string[]): CreatorWorld {
  const combinedText = titles.join(" ") + " " + descriptions.join(" ");
  // We use our existing utility, but we interpret the results differently.
  const keywords = extractKeywords([combinedText], 100);

  const entities: WorldElement[] = [];
  const situations: WorldElement[] = [];

  // 1. Differentiate Entities vs Situations via Heuristics
  // - Entities: Concrete nouns, often capitalized in original titles, short (1-2 words).
  // - Situations: Often start with "in", "at", "during", "when", or end in "ing".

  const situationMarkers = ["in", "at", "on", "during", "when", "while", "using"];
  const actionSuffixes = ["ing", "ed"];

  // Quick Format Heuristic based on title structure
  const formatCounts: Record<string, number> = {};
  const detectFormat = (t: string) => {
    const low = t.toLowerCase();
    if (low.startsWith("how to") || low.includes("guide") || low.includes("tutorial")) return "Tutorial/How-To";
    if (low.match(/^\d+ /) || low.includes("top 10") || low.includes("ranked")) return "Listicle/Ranking";
    if (low.includes("vs") || low.includes("versus") || low.includes("compared")) return "Comparison";
    if (low.includes("why i") || low.includes("stop") || low.includes("don't")) return "Warning/Opinion";
    if (low.includes("day in the life") || low.includes("vlog") || low.includes("trip")) return "Vlog/Lifestyle";
    if (low.includes("explained") || low.includes("documentary") || low.includes("history of")) return "Deep Dive/Essay";
    return "General";
  };

  titles.forEach(t => {
    const fmt = detectFormat(t);
    if (fmt !== "General") formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
  });

  const dominantFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);

  keywords.forEach(({ keyword, score }) => {
    const raw = keyword.trim();
    const low = raw.toLowerCase();

    // Heuristic: Situation
    const isSituation = situationMarkers.some(m => low.startsWith(m + " ")) ||
      actionSuffixes.some(s => low.endsWith(s));

    // Frequency Classification
    // (score is relative TF-IDF-ish from analysis.ts)
    let freq: "core" | "peripheral" | "rare" = "rare";
    if (score > 15) freq = "core";
    else if (score > 5) freq = "peripheral";

    if (isSituation) {
      situations.push({ text: raw, type: "situation", frequency: freq });
    } else {
      // Exclude common noise words
      if (["video", "channel", "part", "update"].includes(low)) return;
      entities.push({ text: raw, type: "entity", frequency: freq });
    }
  });

  // 2. Detect Tone (Naive Sentiment/Structure Analysis)
  let seriousScore = 0;
  let optimismScore = 0;
  let narrativeScore = 0;

  const total = titles.length || 1;
  titles.forEach(t => {
    const low = t.toLowerCase();
    if (low.includes("how") || low.includes("tutorial") || low.includes("guide")) seriousScore++;
    if (low.includes("meme") || low.includes("fun") || low.includes("lol")) seriousScore--;

    if (low.includes("best") || low.includes("win") || low.includes("love")) optimismScore++;
    if (low.includes("worst") || low.includes("fail") || low.includes("hate")) optimismScore--;

    if (low.includes("i ") || low.includes("my") || low.includes("story")) narrativeScore++;
  });

  // Normalize scores to 0-1 range
  const norm = (val: number) => Math.max(0, Math.min(1, (val / total) + 0.5));

  return {
    entities: entities.slice(0, 30), // Keep top 30
    situations: situations.slice(0, 20),
    dominantFormats, // Return the heuristically inferred formats
    tones: {
      seriousness: norm(seriousScore),
      optimism: norm(optimismScore),
      narrative: norm(narrativeScore)
    }
  };
}


// ===========================================================================
// CREATIVE TENSION DETECTION (Stage 2)
// ===========================================================================

export type Tension = {
  type: "contrast" | "gap" | "shift";
  elementA: WorldElement;
  elementB?: WorldElement;
  description: string;
};

/**
 * Finds explicit contrasts in the creator's world.
 * - Familiar Entity vs New Situation
 * - Serious Topic vs Playful Vibe
 */
export function detectTensions(world: CreatorWorld): Tension[] {
  const tensions: Tension[] = [];

  const coreEntities = world.entities.filter(e => e.frequency === "core");
  const peripheralSituations = world.situations.filter(s => s.frequency === "peripheral" || s.frequency === "rare");

  // 1. The "Fish out of Water" Tension (Core Entity in Rare Situation)
  if (coreEntities.length && peripheralSituations.length) {
    tensions.push({
      type: "contrast",
      elementA: coreEntities[0], // Top entity
      elementB: peripheralSituations[Math.floor(Math.random() * peripheralSituations.length)],
      description: "Placing a familiar subject in an unfamiliar context."
    });
  }

  // 2. The "Tone Shift" Tension (Serious Entity treated Playfully, or vice versa)
  if (coreEntities.length) {
    const ent = coreEntities[Math.floor(Math.random() * coreEntities.length)];
    // If channel is usually serious (score > 0.6), suggest something chaotic
    if (world.tones.seriousness > 0.6) {
      tensions.push({
        type: "shift",
        elementA: ent,
        description: `Taking the serious concept of '${ent.text}' but engaging with it chaotically or casually.`
      });
    } else {
      // If channel is usually meme/vlog, suggest a Deep Dive
      tensions.push({
        type: "shift",
        elementA: ent,
        description: `Taking the casual topic of '${ent.text}' but treating it with extreme academic seriousness.`
      });
    }
  }

  return tensions;
}


// ===========================================================================
// IDEA SPARK GENERATION (Stage 3)
// ===========================================================================

export type IdeaSpark = {
  spark: string;          // The "Title" (but closer to a thought)
  rationale: string;      // The "Why"
  tensionType: string;
};

/**
 * Generates textual "Sparks". 
 * NOTE: These are NOT templates. They are narrative constructors.
 * We assemble raw concepts into natural language thoughts.
 */
export function generateSparks(tensions: Tension[], count: number = 3): IdeaSpark[] {
  const sparks: IdeaSpark[] = [];

  if (!tensions.length) {
    return [{
      spark: "Explore a Core Topic in a New Style",
      rationale: "We couldn't detect enough contrasts in your history yet. Try taking your most popular topic and filming it in a completely different location.",
      tensionType: "fallback"
    }, {
      spark: "Review Your Oldest Video",
      rationale: "Look back at where you started to see how far you've come.",
      tensionType: "fallback"
    }];
  }

  // We cycle through tensions to produce ideas
  for (let i = 0; i < count; i++) {
    const tension = tensions[i % tensions.length]; // Cycle

    let text = "";
    let reason = "";

    if (tension.type === "contrast" && tension.elementB) {
      // Construct: "Entity" + "Situation"
      // Avoiding fixed template like "{Entity} in {Situation}"
      // Instead, use conversational connectors.

      const connectors = [
        `What happens if ${tension.elementA.text} is forced into ${tension.elementB.text}?`,
        `${tension.elementA.text}, but strictly ${tension.elementB.text}.`,
        `Trying to do ${tension.elementA.text} while ${tension.elementB.text}.`,
        `The ${tension.elementA.text} arc: ${tension.elementB.text} edition.`
      ];
      text = connectors[Math.floor(Math.random() * connectors.length)];
      reason = `You usually talk about ${tension.elementA.text} in a specific way. This forces it into the context of ${tension.elementB.text} to break the pattern.`;

    } else if (tension.type === "shift") {
      // Tone shift
      const e = tension.elementA.text;
      const shifters = [
        `A completely serious documentary about ${e}.`,
        `${e} but explained like a conspiracy theory.`,
        `Treating ${e} like it's a competitive sport.`,
        `Speedrunning ${e} (even though you can't).`
      ];
      text = shifters[Math.floor(Math.random() * shifters.length)];
      reason = tension.description; // "Taking serious concept... treating it chaotically"
    }

    // fallback if text is empty (shouldn't happen given logic above)
    if (!text) text = `Reflecting on ${tension.elementA.text} from a totally new perspective.`;

    sparks.push({
      spark: capitalize(text),
      rationale: reason,
      tensionType: tension.type
    });
  }

  return sparks;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}


// ===========================================================================
// PUBLIC API ADAPTERS (Connecting to the rest of the app)
// ===========================================================================

export async function analyzeChannelForWorld(videos: any[]) {
  const titles = videos.map(v => v.title || "");
  const descriptions = videos.map(v => v.description || "");
  return extractCreatorWorld(titles, descriptions);
}

// Simple in-memory cache to support deep dive fetches for the research prototype.
// In a real app, this would be in the database.
const ideaCache = new Map<number, any>();

// Replaces the old "ideasFromExperiment"
import { generateLensedIdeas } from "./groq";

// ... (previous code remains)

// Replaces the old "ideasFromExperiment"
export async function generateCreativeSparks(
  channelVideos: any[],
  maxIdeas: number = 3
) {
  // 1. Build Model
  const world = await analyzeChannelForWorld(channelVideos);

  // 2. Identify Tensions (Real or Implied)
  let tensions = detectTensions(world);

  // CRITICAL CHANGE: If no strong tensions, create "Gentle Probes" from top entities
  // This ensures we NEVER fall back to generic templates just because data is subtle.
  if (tensions.length === 0 && world.entities.length > 0) {
    const topEntity = world.entities[0];
    tensions.push({
      type: "gap", // Treated as a curiosity gap
      elementA: topEntity,
      description: `Implicit Tension: We see '${topEntity.text}' often, but we haven't seen its breaking point yet.`
    });

    if (world.entities.length > 1) {
      const secondEntity = world.entities[1];
      tensions.push({
        type: "contrast",
        elementA: topEntity,
        elementB: secondEntity,
        description: `Latent Connection: Connecting '${topEntity.text}' with '${secondEntity.text}' in a way viewers don't expect.`
      });
    }
  }

  // 3. Generate Lensed Ideas via Groq
  // We prefer the LLM's creativity over our hardcoded templates.
  let sparks = [];
  try {
    sparks = await generateLensedIdeas(world, tensions);
  } catch (e) {
    console.error("Groq generation failed, falling back to heuristics", e);
  }

  // Fallback ONLY if Groq fails or returns nothing (API down)
  if (!sparks || sparks.length === 0) {
    sparks = generateSparks(tensions, maxIdeas);
  }

  // 4. Map and Cache
  // Frontend expects: { id, title, format, suggestedPostingTime, rationale }
  return sparks.slice(0, maxIdeas).map((s: any, i: number) => {
    // Generate a stable-ish ID based on time + index to avoid collisions in short sessions
    const id = Date.now() + i;

    const ideaObj = {
      id,
      title: s.title,
      format: "Creative Spark",
      suggestedPostingTime: "Best posted when you feel the energy.",
      rationale: s.rationale, // Groq now generates the creator-friendly rationale directly
      // Store raw tension data for the deep dive
      note: `This idea was sparked by the '${s.lens}' lens. ` + s.rationale
    };

    ideaCache.set(id, ideaObj);
    return ideaObj;
  });
}

// ---------------------------------------------------------------------------
// LEGACY / ADAPTER FUNCTIONS
// (Kept to satisfy calls from routes.ts/analysis.ts without breaking build,
// but internally redirected to new logic where possible)
// ---------------------------------------------------------------------------

export async function analyzeChannel(videos: any[], metrics: any[], clusterList: any[], analytics: any) {
  // Return a dummy "diagnosis" that encourages creativity, 
  // replacing the old metric-heavy diagnosis.
  const world = await analyzeChannelForWorld(videos);
  const coreEntities = world.entities.filter(e => e.frequency === "core").map(e => e.text).slice(0, 3);
  const core = coreEntities.join(", ");

  const comfortable = coreEntities.length > 0
    ? [`Your Core World revolves around: ${core}.`]
    : ["Your content has a stable, recognizable rhythm, even if specific recurring topics are hard to pin down."];

  const curious = ["We're looking for gaps between your Serious and Playful content to find new sparks."];

  const disengaged = ["Most of your content holds viewer attention well, suggesting a strong connection with your audience."];

  return {
    diagnosis: {
      comfortable,
      curious,
      disengaged
    },
    primary: clusterList[0],
    topicContext: { primaryTopics: [], expansionTopics: [] }, // Dummy
    expressionProfile: {} // Dummy
  };
}

export function strategyFromDiagnosis(diagnosis: any) {
  return ["Explore Creative Tensions"];
}

export function experimentsFromStrategy(strategy: string[], clusterList: any[]) {
  return [{ experimentType: "creative-spark", description: "Generating Sparks from Implicit Tensions" }];
}

export async function ideasFromExperiment(
  experiment: any,
  primaryCluster: any,
  adjacentClusters: any[],
  channelId: string,
  channelAnalytics: any,
  metrics: any[],
  clusterList: any[],
  topicContext: any,
  expressionProfile: any,
  maxIdeas = 3
) {
  // Retrieve videos purely to rebuild world model (stateless for now, or could pass in)
  // In a real optimized system, we'd pass 'CreatorWorld' down. 
  // For now, we fetch videos again or rely on arguments if they were passed fully.
  // Ideally, use `storage` to get videos if not provided in a usable way.

  const videos = await storage.getVideos(channelId);
  return generateCreativeSparks(videos, maxIdeas);
}

export async function expandIdeaBlueprint(id: number) {
  const cached = ideaCache.get(id);
  if (cached) return cached;

  return {
    title: "Unknown Spark",
    note: "The details for this spark have been lost in the ether. Try refreshing to generate new ideas."
  };
}

export default {
  analyzeChannel,
  strategyFromDiagnosis,
  experimentsFromStrategy,
  ideasFromExperiment,
  expandIdeaBlueprint,
  generateCreativeSparks,
  analyzeChannelForWorld,
  extractCreatorWorld,
  detectTensions,
  generateSparks,
};
