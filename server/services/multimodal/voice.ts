import { embedText } from "../ideas/hf";
import { storage } from "../../storage";

export class VoiceIdeaCapture {
    /**
     * Transcribes audio and extracts idea seeds.
     * Mock implementation for MVP.
     */
    async transcribeAndExtract(audioBase64: string, channelId: string) {
        // In a real app: payload -> whisper -> text
        // For MVP, we'll simulate a few transcriptions
        const mockTranscripts = [
            "I want to make a video about using AI to generate code for a website",
            "Comparing the new React 19 features with the old version",
            "A deep dive into how YouTube's algorithm actually works in 2026"
        ];
        
        const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        console.log(`[VoiceCapture] Transcribed: "${transcript}"`);

        // Extract title and rationale (In real app, use LLM)
        const title = transcript.split(" ").slice(5).join(" ") || transcript;
        const rationale = `Voice captured idea: ${transcript}`;

        // Save as Idea
        const embedding = await embedText(title);
        const [idea] = await storage.upsertIdea({
            channelId,
            title: title.charAt(0).toUpperCase() + title.slice(1),
            format: "Voice Idea",
            status: "saved",
            embedding,
            executionMetadata: {
                transcription: transcript,
                capturedAt: new Date().toISOString()
            }
        });

        return idea;
    }
}

export const voiceCapture = new VoiceIdeaCapture();
