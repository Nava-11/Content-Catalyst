import { Router } from "express";
import { db } from "../../storage";
import { creatorProfiles, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

const router = Router();

// Middleware to checking Auth (Basic version, should be shared)
// For now, we replicate or import if we had a middleware file.
// Let's assume req.cookies.auth_token is present and valid for this route.
// In a real app, use the `checkAuth` middleware.

import { getSession } from "../auth/session";

async function getAuthenticatedUser(req: any) {
    const token = req.cookies?.auth_token;
    if (!token) return null;
    return await getSession(token);
}

// Start Onboarding
router.post("/channel", async (req, res) => {
    try {
        const { channelId } = req.body;
        const userId = await getAuthenticatedUser(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        // Validate Channel with YouTube
        const youtube = google.youtube("v3");
        // We need a Public API Key for simple checks
        const apiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

        if (!channelId) return res.status(400).json({ message: "Channel ID required" });

        let channelTitle = "Detected Title";
        let subscriberCount = 0;

        if (apiKey) {
            try {
                const ytRes = await youtube.channels.list({
                    key: apiKey,
                    id: [channelId],
                    part: ["snippet", "statistics"]
                });
                if (ytRes.data.items && ytRes.data.items.length > 0) {
                    channelTitle = ytRes.data.items[0].snippet?.title || channelTitle;
                    subscriberCount = parseInt(ytRes.data.items[0].statistics?.subscriberCount || "0");
                }
            } catch (ytError) {
                console.error("YouTube API Profile Fetch Error:", ytError);
            }
        }

        // Insert Profile
        const [profile] = await db.insert(creatorProfiles).values({
            userId,
            channelId,
            channelTitle,
            subscriberCount
        }).returning();

        res.json({ success: true, profile });

    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
