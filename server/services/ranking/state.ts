import { redis } from "../infrastructure/redis";

export class RLState {
    private static PREFIX = "rl:v1:";

    // Get current reward estimate for an arm (e.g., a specific format like "tutorial")
    static async getArmStats(armId: string): Promise<{ alpha: number; beta: number }> {
        const key = `${this.PREFIX}arm:${armId}`;
        const data = await redis.get(key);
        if (!data) return { alpha: 1, beta: 1 }; // Default Beta(1,1) prior
        return JSON.parse(data);
    }

    // Update arm stats (Thompson Sampling update: alpha += reward, beta += (1-reward))
    static async updateArm(armId: string, reward: number) {
        const current = await this.getArmStats(armId);

        // Simple Bernouilli update or approximate
        // If reward is binary 1/0:
        const newAlpha = current.alpha + reward;
        const newBeta = current.beta + (1 - reward);

        const key = `${this.PREFIX}arm:${armId}`;
        await redis.set(key, JSON.stringify({ alpha: newAlpha, beta: newBeta }));
        return { alpha: newAlpha, beta: newBeta };
    }

    // Store user-specific context/session vector
    static async setUserContext(userId: string, context: any) {
        const key = `${this.PREFIX}user:${userId}`;
        await redis.set(key, JSON.stringify(context), 'EX', 86400); // 24h session
    }

    static async getUserContext(userId: string) {
        const key = `${this.PREFIX}user:${userId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
}
