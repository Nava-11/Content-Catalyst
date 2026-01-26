import { db } from "../server/storage";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Dropping tables...");
    await db.execute(sql`DROP TABLE IF EXISTS "creator_profiles" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE;`);
    console.log("Tables dropped.");
    process.exit(0);
}

main().catch(console.error);
