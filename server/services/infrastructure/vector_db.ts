// Basic in-memory Vector DB with cosine similarity search
// Simulating Qdrant API

type VectorPoint = {
    id: string | number;
    vector: number[];
    payload?: any;
};

export class MockVectorDB {
    private static instance: MockVectorDB;
    private collections: Map<string, VectorPoint[]>;

    private constructor() {
        this.collections = new Map();
    }

    static getInstance(): MockVectorDB {
        if (!MockVectorDB.instance) {
            MockVectorDB.instance = new MockVectorDB();
        }
        return MockVectorDB.instance;
    }

    async createCollection(name: string, size: number) {
        this.collections.set(name, []);
        return true;
    }

    async upsert(collection: string, points: VectorPoint[]) {
        if (!this.collections.has(collection)) {
            await this.createCollection(collection, 384);
        }
        const col = this.collections.get(collection)!;

        // Simple overwrite logic based on ID
        for (const p of points) {
            const idx = col.findIndex(x => x.id === p.id);
            if (idx >= 0) col[idx] = p;
            else col.push(p);
        }
        return true;
    }

    async search(collection: string, vector: number[], limit = 5) {
        const col = this.collections.get(collection);
        if (!col) return [];

        // Brute force cosine similarity
        const results = col.map(p => ({
            ...p,
            score: this.cosine(vector, p.vector)
        }));

        // Sort descending
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    private cosine(a: number[], b: number[]): number {
        let dot = 0;
        let na = 0;
        let nb = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    }
}

export const vectorDB = MockVectorDB.getInstance();
