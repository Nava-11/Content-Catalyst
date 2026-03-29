
import Groq from "groq-sdk";

// Initialize Groq
// Expects GROQ_API_KEY in environment variables
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Using a high-performance model suitable for complex reasoning
// Llama 3 70B is a good balance of speed and intelligence on Groq
const MODEL = "llama-3.3-70b-versatile";

export async function chatWithContext(
    userMessage: string,
    systemContext: string,
    previousMessages: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
    try {
        if (!process.env.GROQ_API_KEY) {
            console.warn("GROQ_API_KEY is not set. Falling back to heuristic response.");
            return "I'm currently running in offline mode. I can see your channel metrics, but my creative brain is taking a nap. Try asking simple questions about your top videos!";
        }

        const messages = [
            { role: "system", content: systemContext },
            ...previousMessages,
            { role: "user", content: userMessage }
        ] as any[];

        const completion = await groq.chat.completions.create({
            messages,
            model: MODEL,
            temperature: 0.78, // High creativity for variety and natural flow
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("Groq Chat Error:", error);
        return "I'm having trouble connecting to my brain (Groq API Error). However, looking at your data, I see you have some strong performing topics. Maybe try exploring those?";
    }
}

export async function generateIdeas(
    keywords: string[],
    topFormats: string[],
    existingTitles: string[]
) {
    try {
        if (!process.env.GROQ_API_KEY) return { ideas: [] };

        const prompt = `
      You are a YouTube Content Strategist.
      
      CONTEXT:
      Top Keywords: ${keywords.join(", ")}
      Best Formats: ${topFormats.join(", ")}
      Existing Video Titles:
      ${existingTitles.slice(0, 10).join("\n")}
      
      TASK:
      Generate 5 UNIQUE content ideas.
      
      RULES:
      1. Select a contrasting angle (misconception, impact, opinion, consequence, comparison).
      2. Format titles as: [Keyword] + [Contrasting Angle].
      3. Max 12 words per title.
      4. NO part numbers. NO clickbait spam.
      5. Return valid JSON only.
      
      OUTPUT FORMAT:
      {
        "ideas": [
          {
            "title": "...",
            "format": "...",
            "whyItWorks": "...",
            "suggestedPostingTime": "Best time based on analytics" 
          }
        ]
      }
    `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODEL,
            temperature: 0.8,
            response_format: { type: "json_object" },
        });

        const text = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(text);

    } catch (error) {
        console.error("Groq Generate Ideas Error:", error);
        return { ideas: [] };
    }
}

export async function generateGuidance(analyticsSummary: any) {
    try {
        if (!process.env.GROQ_API_KEY) return {};

        const prompt = `
      Generate YouTube content guidance based on this analytics summary:
      ${JSON.stringify(analyticsSummary)}
  
      Return JSON only:
      {
        "topFormat": "...",
        "topFormatCrps": 0.0,
        "diffVsOther": 0.0,
        "optimalLength": "...",
        "bestTime": "...",
        "structure": {
          "hook": "...",
          "body": "...",
          "cta": "..."
        }
      }
      `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODEL,
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const text = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Groq Guidance Error:", error);
        return {};
    }
}

export async function generateLensedIdeas(
    worldState: any, // entities, tones
    tensions: any[]
) {
    try {
        if (!process.env.GROQ_API_KEY) return [];

        const prompt = `
      You are a Creative Ignition Engine for a YouTube Creator.
      
      CREATOR WORLD (Context):
      Entities: ${worldState.entities.map((e: any) => e.text).join(", ")}
      Dominant Formats: ${worldState.dominantFormats && worldState.dominantFormats.length > 0 ? worldState.dominantFormats.join(", ") : "Mixed/General"}
      Tones: Seriousness: ${(worldState.tones.seriousness * 100).toFixed(0)}%, Narrative: ${(worldState.tones.narrative * 100).toFixed(0)}%
      Detected Tensions: ${tensions.map(t => t.description).join("; ")}

      YOUR TASK:
      Generate 4 Creative Sparks that describe FILMABLE MOMENTS.
      
      CRITICAL "SCENE TEST":
      For every idea, ask: "Can I imagine the first 3 seconds of this video?"
      If NO (it's abstract/poetic) -> REJECT IT.
      
      ABSOLUTE PROHIBITIONS:
      - NO "Guide", "Step-by-step", "Analysis", "Process", "Introduction"
      - NO purely abstract nouns ("The Silence", "The Void", "The Unseen") without context.
      - NO instructional titles ("How to use X").
      
      REQUIRED TRANSFORMATION (Make it visual):
      - Abstract: "The Dark Side of AI" -> Filmable: "The exact moment AI broke my workflow"
      - Abstract: "Silence in Movies" -> Filmable: "Why movies stopped using silence (and it hurts)"
      - Abstract: "Coding Fatigue" -> Filmable: "I coded for 10 hours and regretted it"
      
      LENSES to use for transformation:
      - A MOMENT: "The day...", "The first time..."
      - A REACTION: "Felt wrong...", "Suddenly stopped..."
      - A REVEAL: "Until this shows up...", "Only after this breaks..."

      OUTPUT REQUIREMENTS:
      - Title: Specific, punchy, implies motion/change.
      - Rationale: Conversational, "I could actually shoot this" feeling.
      
      RETURN JSON ONLY:
      {
        "sparks": [
          {
            "title": "...",
            "rationale": "...",
            "lens": "Twist" | "Inversion" | "Expansion" | "Micro-Series"
          }
        ]
      }
    `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODEL,
            temperature: 0.85, // Slightly higher for creativity
            response_format: { type: "json_object" },
        });

        const text = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(text);
        return parsed.sparks || [];

    } catch (error) {
        console.error("Groq Lensed Ideas Error:", error);
        return [];
    }
}
