import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testChat() {
    console.log("--- Testing Hybrid Assistant ---");
    try {
        const res = await axios.post(`http://127.0.0.1:5000/api/chat`, {
            channelId: 'test_channel',
            message: 'What is the sum of 123 and 456? Also, give me a thumbnail idea for a video about "The Future of AI Coding".',
            previousMessages: []
        });
        console.log("Assistant Response:", res.data.message);
    } catch (e: any) {
        console.error("Chat Test Failed:", e.response?.data || e.message);
    }
}

async function testThumbnailRefinement() {
    console.log("\n--- Testing Thumbnail Refinements ---");
    try {
        const res = await axios.post(`${BASE_URL}/features/thumbnail/generate`, {
            idea: 'A developer coding with an AI assistant',
            style: 'Dark',
            expression: 'Happy / Excited',
            text: 'CODE WITH AI',
            modifiers: ['Glow', 'Cinematic']
        });
        console.log("Thumbnail Service Response:", res.data.prompt);
    } catch (e: any) {
        console.error("Thumbnail Test Failed:", e.message);
    }
}

async function runTests() {
    await testChat();
    await testThumbnailRefinement();
}

runTests();
