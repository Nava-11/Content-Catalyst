import { db } from "./server/db";
import { users, creatorProfiles, videos, channelAnalytics, clusters, creatorStyleProfiles, narrativeAnalysis } from "./shared/schema";

async function diagnose() {
    try {
        console.log("--- Comprehensive Database Diagnosis ---");

        const allClusters = await db.select().from(clusters);
        console.log("Clusters:", allClusters.length);
        console.log(JSON.stringify(allClusters, null, 2));

        const styleProfiles = await db.select().from(creatorStyleProfiles);
        console.log("Style Profiles:", styleProfiles.length);
        console.log(JSON.stringify(styleProfiles, null, 2));

        const narrative = await db.select().from(narrativeAnalysis);
        console.log("Narrative Analysis:", narrative.length);
        console.log(JSON.stringify(narrative, null, 2).slice(0, 1000)); // Truncate if too long

        console.log("--- End Diagnosis ---");
    } catch (err) {
        console.error("Diagnosis failed:", err);
    } finally {
        process.exit(0);
    }
}

diagnose();
