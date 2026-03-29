import fetch from "node-fetch";

async function verify() {
    console.log("--- Testing AI Assistant: General Query ---");
    const res1 = await fetch("http://127.0.0.1:5000/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            channelId: "UCJvGL-AQUc",
            message: "What is 12 + 23?"
        })
    });
    const data1 = await res1.json();
    console.log("Response (12 + 23):", data1.message);

    console.log("\n--- Testing AI Assistant: Analytics Query ---");
    const res2 = await fetch("http://127.0.0.1:5000/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            channelId: "UCJvGL-AQUc",
            message: "Which cluster is most saturated right now?"
        })
    });
    const data2 = await res2.json();
    console.log("Response (Saturation):", data2.message);
}

verify().catch(console.error);
