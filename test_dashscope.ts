import axios from "axios";
import "dotenv/config";

async function checkChinaWithWorkspace() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const workspaceId = process.env.DASHSCOPE_WORKSPACE_ID;
  
  if (!apiKey || !workspaceId) {
    console.error("Missing DASHSCOPE_API_KEY or DASHSCOPE_WORKSPACE_ID");
    return;
  }

  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
  const model = "qwen-image-2.0-pro";

  try {
    console.log(`Checking key against China Endpoint (${url}) for ${model} with Workspace ${workspaceId}...`);
    const res = await axios.post(
      url,
      {
        model: model,
        input: {
          messages: [
            { role: "user", content: [{ text: "A beautiful sunset over a futuristic city" }] }
          ]
        },
        parameters: {
          size: "1024*1024",
          n: 1
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-WorkSpace': workspaceId
        },
        timeout: 60000
      }
    );
    console.log(`SUCCESS! worked with Workspace ID on China Endpoint.`);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error(`FAILED: ${err.response?.status} ${JSON.stringify(err.response?.data)}`);
  }
}

checkChinaWithWorkspace();
