import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

export async function generateIdeas(
  keywords: string[],
  topFormats: string[],
  existingTitles: string[]
) {
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
    5. Return valid JSON.
    
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateGuidance(analyticsSummary: any) {
    const prompt = `
    Generate YouTube content guidance based on this analytics summary:
    ${JSON.stringify(analyticsSummary)}

    Return JSON:
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

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
    });
    
    return JSON.parse(response.choices[0].message.content || "{}");
}
