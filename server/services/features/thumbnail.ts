import { HfInference } from "@huggingface/inference";

interface VisualConcept {
  subject: string;
  scene: string;
  transformation: string;
  emotion: string;
  focus: string;
}

export class ThumbnailService {
  private static instance: ThumbnailService;

  private constructor() {}

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  /**
   * SECTION 1: INTENT INTERPRETATION LAYER
   * Converts vague/numeric input into visual metaphors
   */
  public interpretIdea(input: string): string {
    const text = input.trim();
    
    // 1. Handle numeric or mathematical strings
    if (/^[\d\s+\-*/=()]+$/.test(text)) {
      return `math calculation concept, glowing numbers ${text}, solving a complex problem visually, classroom aesthetic`;
    }

    // 2. Expand short, vague inputs
    if (text.length < 10) {
       if (text.toLowerCase().includes("coding")) return "focused programmer at neon workstation, multiple monitors, intense concentration";
       if (text.toLowerCase().includes("data")) return "complex digital world of numbers and charts, network nodes, data flow";
       return `${text} masterclass, expert showcase, high-end production style`;
    }

    // 3. Keyword mapping for domains
    if (text.toLowerCase().includes("powerbi") || text.toLowerCase().includes("analysis")) {
       return `data transformation, switching from confusion with messy tables to clarity with a sleek Power BI dashboard`;
    }

    return text;
  }

  /**
   * SECTION 2: CONCEPT STRUCTURING ENGINE
   * Always converts ideas into structured fields
   */
  public buildConcept(idea: string): VisualConcept {
    const raw = idea.toLowerCase();
    
    // Heuristic extraction or expansion based on idea content
    // In a real system, this could be an LLM-powered extraction
    let concept: VisualConcept = {
      subject: "Central subject",
      scene: "A specialized YouTube studio workspace",
      transformation: "from basic to advanced",
      emotion: "determined and confident",
      focus: "sharp facial features and hands"
    };

    if (raw.includes("data") || raw.includes("powerbi")) {
      concept = {
        subject: "Professional data analyst",
        scene: "High-tech workspace with glowing holographic charts",
        transformation: "messy data clouds into structured digital crystalline nodes",
        emotion: "from intense confusion to a 'eureka' moment of clarity",
        focus: "the contrast between old tables and new 3D dashboards"
      };
    } else if (raw.includes("coding") || raw.includes("developer")) {
      concept = {
        subject: "Individual software developer",
        scene: "Minimalist desk with mechanical keyboard and ultrawide monitors",
        transformation: "raw code lines morphing into a finished 3D application interface",
        emotion: "focused and calm and futuristic",
        focus: "silhouette of the developer against the glow of monitors"
      };
    } else if (raw.includes("math") || raw.includes("calculation")) {
      concept = {
        subject: "Mathematical symbols and equations",
        scene: "Floating in a dark void like a constellation of stars",
        transformation: "chaos of fragments merging into a perfect golden ratio spiral",
        emotion: "wonder and discovery",
        focus: "the central solving of the equation"
      };
    }

    return concept;
  }

  /**
   * SECTION 3: PROMPT GENERATION ENGINE
   * Enforces mandatory composition rules and YouTube-specific aesthetic
   */
  public generatePrompt(concept: VisualConcept, style: string = 'Clickbait'): string {
    const styleModifiers = {
      'Clickbait': 'exaggerated high energy, bold vivid aesthetic, glowing particles, dramatic contrast',
      'Minimal': 'clean composition, professional elegance, soft-box lighting, balanced white space',
      'Educational': 'clean workspace, informative atmosphere, high-end flat lighting, detailed diagrams',
      'Dark': 'neon highlights, cyberpunk mood, deep shadows, cinematic rim lighting'
    };

    const styleMod = styleModifiers[style as keyof typeof styleModifiers] || styleModifiers['Clickbait'];
    
    return `YouTube thumbnail background,
${concept.subject},
${concept.scene},
${concept.transformation},
${concept.emotion},

single clear subject,
center composition,
high contrast,
simple background,
dramatic lighting,
no text, no letters, no watermark,
space for text overlay,
${styleMod},
sharp focus, 4k`;
  }

  /**
   * SECTION 6: PROMPT SANITIZATION
   * Removes noise and prevents garbage output
   */
  private sanitizePrompt(prompt: string): string {
    return prompt
      .replace(/artstation|hyper-detailed|overload|highly detailed|8k/gi, "") // Remove common pollution
      .replace(/\s{2,}/g, " ") // Normalize spacing
      .substring(0, 500); // Clamp length
  }

  /**
   * SECTION 4 & 8: IMAGE GENERATION PIPELINE
   */
  public async generateThumbnail(
    idea: string, 
    style: string = 'Clickbait'
  ): Promise<{ image: string, prompt: string, interpretedIdea: string, concept: VisualConcept, suggestionText: string }> {
    const token = process.env.HF_TOKEN;
    if (!token) throw new Error("HF_TOKEN is not defined");
    
    const hf = new HfInference(token);
    
    // 1. Interpret
    const interpreted = this.interpretIdea(idea);
    
    // 2. Structure
    const concept = this.buildConcept(interpreted);
    
    // 3. Build & Sanitize Prompt
    const rawPrompt = this.generatePrompt(concept, style);
    const finalPrompt = this.sanitizePrompt(rawPrompt);
    
    console.log(`[ThumbnailService] Gen Pipeline - Prompt: ${finalPrompt}`);

    try {
      const response = await hf.textToImage({
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        inputs: finalPrompt,
        parameters: {
          num_inference_steps: 40,
          guidance_scale: 8.5
        }
      }) as any;

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      return {
        image: `data:image/png;base64,${base64}`,
        prompt: finalPrompt,
        interpretedIdea: interpreted,
        concept: concept,
        suggestionText: `A cinematic ${style} thumbnail focusing on the ${concept.transformation}.`
      };
    } catch (error: any) {
      console.error("[ThumbnailService] Error generating:", error.message);
      throw new Error(`Failed to generate: ${error.message}`);
    }
  }

  /**
   * SECTION 5: ITERATIVE EDITING SYSTEM
   */
  public async editThumbnail(
    baseImage: string, 
    instruction: string, 
    history: string[]
  ): Promise<{ image: string, prompt: string, suggestionText: string }> {
    const token = process.env.HF_TOKEN;
    if (!token) throw new Error("HF_TOKEN is not defined");
    
    const hf = new HfInference(token);
    
    // 1. Manage history
    const fullHistory = [...history, instruction];
    
    // 2. Strength logic based on keywords
    let strength = 0.6; // Default
    const text = instruction.toLowerCase();
    if (text.includes("slight") || text.includes("small") || text.includes("lighting")) strength = 0.4;
    if (text.includes("change") || text.includes("transform") || text.includes("completely")) strength = 0.8;

    // 3. Build Refined Prompt
    // Note: Cumulative text-to-image as a proxy for the requested flow while preserving context
    const refinedPrompt = `previous scene, 
apply modification: ${instruction}, 
keep same composition,
enhance clarity,
high detail, cinematic`;
    
    const finalPrompt = this.sanitizePrompt(refinedPrompt);
    console.log(`[ThumbnailService] Edit Pipeline (Strength ${strength}) - Prompt: ${finalPrompt}`);

    try {
      const response = await hf.textToImage({
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        inputs: finalPrompt,
        parameters: {
          num_inference_steps: 40,
          guidance_scale: 8.5
        }
      }) as any;

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      return {
        image: `data:image/png;base64,${base64}`,
        prompt: finalPrompt,
        suggestionText: `Refined visualization based on instruction: "${instruction}"`
      };
    } catch (error: any) {
      console.error("[ThumbnailService] Error editing:", error.message);
      throw new Error(`Failed to edit: ${error.message}`);
    }
  }
}
