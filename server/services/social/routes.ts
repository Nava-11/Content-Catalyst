import { Router } from "express";
import { db, storage } from "../../storage";
import { ideas, collaborations, creatorProfiles, clusters } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /public/profile/:channelId
router.get("/profile/:channelId", async (req, res) => {
    const { channelId } = req.params;
    
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.channelId, channelId));
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const publicIdeas = await db.select().from(ideas).where(
        and(eq(ideas.channelId, channelId), eq(ideas.isPublic, "true"))
    );

    const channelClusters = await storage.getClusters(channelId);

    res.json({
        profile,
        topTopics: channelClusters.slice(0, 3).map(c => c.clusterId),
        sharedIdeas: publicIdeas.map(i => ({
            id: i.id,
            title: i.title,
            format: i.format,
            score: i.score
        }))
    });
});

// POST /share/:ideaId
router.post("/share/:ideaId", async (req, res) => {
    const { ideaId } = req.params;
    const { isPublic } = req.body; // "true" or "false"

    await db.update(ideas)
        .set({ isPublic: isPublic ? "true" : "false" })
        .where(eq(ideas.id, parseInt(ideaId)));

    res.json({ success: true });
});

// POST /collab/invite
router.post("/collab/invite", async (req, res) => {
    const { ideaId, collaboratorEmail } = req.body;
    const { users } = require("@shared/schema");

    // 1. Find collaborator
    const [collaborator] = await db.select().from(users).where(eq(users.email, collaboratorEmail));
    if (!collaborator) return res.status(404).json({ message: "User not found" });

    // 2. Create collab
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
    if (!idea) return res.status(404).json({ message: "Idea not found" });

    await db.insert(collaborations).values({
        ideaId,
        ownerId: 1, // Mock current user
        collaboratorId: collaborator.id,
        status: "pending"
    });

    res.json({ success: true, message: `Collab invite sent to ${collaboratorEmail}` });
});

export default router;
