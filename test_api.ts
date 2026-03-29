import axios from "axios";

async function test() {
  try {
    console.log("Testing /api/features/thumbnail/generate with DashScope...");
    const res = await axios.post("http://127.0.0.1:5000/api/features/thumbnail/generate", {
      idea: "Futuristic city with neon lights",
      style: "Dark"
    });
    console.log("Success! Image data length:", res.data.image.length);
    console.log("Prompt used:", res.data.prompt);
  } catch (err: any) {
    console.error("Error:", err.response?.data || err.message);
  }
}

test();
