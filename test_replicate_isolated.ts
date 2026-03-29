import Replicate from "replicate";
import "dotenv/config";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function test() {
  try {
    console.log("Testing Replicate token directly with stability-ai/sdxl...");
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: "a cat wearing a hat",
          width: 768,
          height: 768
        }
      }
    );
    console.log("SUCCESS!", output);
  } catch (err: any) {
    console.error("FAILED:", err.message);
  }
}

test();
