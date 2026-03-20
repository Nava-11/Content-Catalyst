import { db } from "./server/db";
import { users, creatorProfiles, videos, channelAnalytics } from "./shared/schema";

async function diagnose() {
    try {
        console.log("--- Database Diagnosis ---");

        const allUsers = await db.select().from(users);
        console.log("Users:", allUsers.length);
        console.log(JSON.stringify(allUsers, null, 2));

        const profiles = await db.select().from(creatorProfiles);
        console.log("Creator Profiles:", profiles.length);
        console.log(JSON.stringify(profiles, null, 2));

        const videoCount = await db.select().from(videos);
        console.log("Videos:", videoCount.length);

        const analytics = await db.select().from(channelAnalytics);
        console.log("Channel Analytics:", analytics.length);

        console.log("--- End Diagnosis ---");
    } catch (err) {
        console.error("Diagnosis failed:", err);
    } finally {
        process.exit(0);
    }
}

diagnose();
