import { db } from "../../storage";
import { sessions } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function createSession(userId: number): Promise<string> {
    const token = `auth_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    await db.insert(sessions).values({
        userId,
        token,
        expiresAt
    });

    return token;
}

export async function getSession(token: string): Promise<number | null> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));

    if (!session) return null;
    if (new Date() > session.expiresAt) {
        await deleteSession(token);
        return null;
    }

    return session.userId;
}

export async function deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
}
