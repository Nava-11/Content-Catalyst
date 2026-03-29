import { ThumbnailService } from "../server/services/features/thumbnail";
import * as dotenv from "dotenv";
dotenv.config();

async function verify() {
    const service = ThumbnailService.getInstance();
    
    console.log("--- Testing Intent Interpretation ---");
    const math = service.interpretIdea("15+78");
    console.log("Input: 15+78 -> Interpreted:", math);

    const data = service.interpretIdea("PowerBI");
    console.log("Input: PowerBI -> Interpreted:", data);

    console.log("\n--- Testing Concept Structuring ---");
    const mathConcept = service.buildConcept(math);
    console.log("Math Concept:", JSON.stringify(mathConcept, null, 2));

    const dataConcept = service.buildConcept(data);
    console.log("Data Concept:", JSON.stringify(dataConcept, null, 2));

    console.log("\n--- Testing Prompt Generation ---");
    const prompt = service.generatePrompt(dataConcept, "Dark");
    console.log("Generated Prompt (Dark Style):\n", prompt);

    console.log("\n--- Testing Sanitization ---");
    // @ts-ignore - accessing private for test
    const sanitized = service.sanitizePrompt("artstation hyper-detailed overload test string 8k");
    console.log("Sanitized:", sanitized);
}

verify().catch(console.error);
