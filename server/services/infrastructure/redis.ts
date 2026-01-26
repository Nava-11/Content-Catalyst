// Mock Redis implementation for local development
// Simulates basic Redis commands with TTL support

type CacheItem = {
    value: string;
    expiresAt: number | null;
};

export class MockRedis {
    private static instance: MockRedis;
    private store: Map<string, CacheItem>;

    private constructor() {
        this.store = new Map();
        // Cleanup interval
        setInterval(() => this.cleanup(), 60000);
    }

    static getInstance(): MockRedis {
        if (!MockRedis.instance) {
            MockRedis.instance = new MockRedis();
        }
        return MockRedis.instance;
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (item.expiresAt && item.expiresAt < now) {
                this.store.delete(key);
            }
        }
    }

    async get(key: string): Promise<string | null> {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiresAt && item.expiresAt < Date.now()) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
        let expiresAt: number | null = null;
        if (mode === 'EX' && duration) {
            expiresAt = Date.now() + (duration * 1000);
        }
        this.store.set(key, { value, expiresAt });
        return "OK";
    }

    async del(key: string): Promise<number> {
        return this.store.delete(key) ? 1 : 0;
    }

    async keys(pattern: string): Promise<string[]> {
        // Simple regex match for mocking
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return Array.from(this.store.keys()).filter(k => regex.test(k));
    }
}

export const redis = MockRedis.getInstance();
