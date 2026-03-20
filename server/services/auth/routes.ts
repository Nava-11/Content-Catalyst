import { Router } from "express";
import { db } from "../../storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { creatorProfiles } from "@shared/schema";
import { createSession, getSession, deleteSession } from "./session";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Me Endpoint
router.get("/me", async (req, res) => {
    const token = req.cookies?.auth_token;
    if (!token) return res.json({ user: null });

    const userId = await getSession(token);
    if (!userId) return res.json({ user: null });

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.json({ user: null });

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id));

    res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.profilePic
        },
        isProfileComplete: !!profile,
        channelId: profile?.channelId,
        channelTitle: profile?.channelTitle,
        subscriberCount: profile?.subscriberCount
    });
});

// Manual Register
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!email || !password || !username) return res.status(400).json({ message: "Missing fields" });

        const [existing] = await db.select().from(users).where(eq(users.email, email));
        if (existing) return res.status(400).json({ message: "Email taken" });

        const [newUser] = await db.insert(users).values({
            email,
            name: username,
            password: password,
            profilePic: null
        }).returning();

        const token = await createSession(newUser.id);
        res.cookie("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax" });

        res.json({ success: true, user: newUser, isProfileComplete: false, channelId: null });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// Manual Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const [user] = await db.select().from(users).where(eq(users.email, username));

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id));
        const token = await createSession(user.id);
        res.cookie("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax" });

        res.json({ success: true, user, isProfileComplete: !!profile, channelId: profile?.channelId });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// Google Auth
router.post("/google", async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: "Missing idToken" });

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) return res.status(400).json({ message: "Invalid token payload" });

        const { sub: googleId, email, name, picture } = payload;
        if (!email) return res.status(400).json({ message: "Email required from Google" });

        let [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            [user] = await db.insert(users).values({
                email,
                name: name || "User",
                googleId,
                profilePic: picture,
            }).returning();
        } else {
            if (user.googleId !== googleId || user.profilePic !== picture) {
                [user] = await db.update(users)
                    .set({ googleId, profilePic: picture })
                    .where(eq(users.id, user.id))
                    .returning();
            }
        }

        // Google Auth
        const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id));
        const isProfileComplete = !!profile;

        const token = await createSession(user.id);
        res.cookie("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax" });
        res.json({ token, isProfileComplete, user, channelId: profile?.channelId, channelTitle: profile?.channelTitle, subscriberCount: profile?.subscriberCount });

    } catch (e: any) {
        console.error("Google Auth Error:", e);
        res.status(500).json({ message: "Authentication failed: " + e.message });
    }
});

// Logout
router.post("/logout", async (req, res) => {
    const token = req.cookies?.auth_token;
    if (token) await deleteSession(token);
    res.clearCookie("auth_token");
    res.json({ success: true });
});

export default router;
