import axios from "axios";

async function testReplicate() {
  try {
    console.log("Testing /api/features/thumbnail/generate with Replicate...");
    const res = await axios.post("http://127.0.0.1:5000/api/features/thumbnail/generate", {
      idea: "Space exploration in 2050",
      style: "Dark"
    });
    
    console.log("SUCCESS! Image URL:", res.data.image);
    console.log("Prompt generated:", res.data.prompt);
  } catch (err: any) {
    console.error("Error:", err.response?.data || err.message);
  }
}

testReplicate();
