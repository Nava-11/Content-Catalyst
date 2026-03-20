import { Router } from "express";
import { db, storage } from "../../storage";
import { userPreferences, ideaInteractions, users, creatorProfiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { kafka, Topics } from "../infrastructure/kafka";

const router = Router();

async function getUserFromRequest(req: any) {
    const token = req.cookies?.auth_token;
    if (!token) return null;
    try {
        const parts = token.split("_");
        if (parts[0] === "mock" && parts[1] === "jwt") {
            return parseInt(parts[2]);
        }
    } catch { }
    return null;
}

// GET /preferences
router.get("/preferences", async (req, res) => {
    const userId = await getUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    if (!prefs) {
        [prefs] = await db.insert(userPreferences)
            .values({ userId, riskTolerance: 'moderate', tonePreference: 'balanced' })
            .returning();
    }
    res.json(prefs);
});

// GET /profiles
router.get("/profiles", async (req, res) => {
    const userId = await getUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const profiles = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId));
    res.json(profiles);
});

// POST /profiles
router.post("/profiles", async (req, res) => {
    const userId = await getUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { channelId, channelTitle, subscriberCount } = req.body;

    const [existing] = await db.select().from(creatorProfiles).where(
        and(eq(creatorProfiles.userId, userId), eq(creatorProfiles.channelId, channelId))
    );

    if (existing) return res.json(existing);

    const [created] = await db.insert(creatorProfiles).values({
        userId,
        channelId,
        channelTitle,
        subscriberCount,
        createdAt: new Date()
    }).returning();

    res.json(created);
});

// POST /preferences
router.post("/preferences", async (req, res) => {
    const userId = await getUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { riskTolerance, tonePreference } = req.body;
    const [existing] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    
    if (existing) {
        const [updated] = await db.update(userPreferences)
            .set({ riskTolerance, tonePreference })
            .where(eq(userPreferences.id, existing.id))
            .returning();
        res.json(updated);
    } else {
        const [created] = await db.insert(userPreferences)
            .values({ userId, riskTolerance, tonePreference })
            .returning();
        res.json(created);
    }
});

// POST /interact
router.post("/interact", async (req, res) => {
    const userId = await getUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { ideaId, actionType } = req.body;

    await db.insert(ideaInteractions).values({
        userId,
        ideaId,
        actionType
    });

    let topic: Topics | null = null;
    if (actionType === "clicked") topic = Topics.IDEA_CLICKED;
    if (actionType === "saved") topic = Topics.IDEA_SAVED;
    if (actionType === "published") topic = Topics.IDEA_SAVED; 

    if (topic) {
        await kafka.produce(topic, { userId, ideaId, timestamp: Date.now(), action: actionType });
    }

    res.json({ success: true });
});

// GET /personas/:channelId
router.get("/personas/:channelId", async (req, res) => {
    try {
        const { channelId } = req.params;
        const personas = await storage.getAudiencePersonas(channelId);
        res.json(personas);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
