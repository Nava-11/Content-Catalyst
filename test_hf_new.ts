import axios from "axios";
import "dotenv/config";

async function testHF() {
  const token = "hf_vRjYpUKitHqJpZzVvjZQvZQvZQvZQvZQv"; // I'll check the .env for the actual old key if possible
  // Wait, I should use the key from the conversation history if I can find it.
  // The user didn't give a NEW HF key lately, they gave Qwen and Replicate.
  
  const url = "https://router.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
  
  try {
    console.log(`Testing Hugging Face Router (${url})...`);
    // I'll use a dummy key to see if I get 401 or something else
    const res = await axios.post(
      url,
      { inputs: "A beautiful sunset" },
      {
        headers: { 'Authorization': `Bearer ${process.env.HF_API_KEY}` },
        responseType: 'arraybuffer'
      }
    );
    console.log("SUCCESS! Image received.");
  } catch (err: any) {
    console.error(`FAILED: ${err.response?.status} ${err.message}`);
  }
}

testHF();
