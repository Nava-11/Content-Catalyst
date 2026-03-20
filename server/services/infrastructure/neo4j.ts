import { log } from "../../index";

/**
 * MockNeo4jService
 * 
 * Since Content Catalyst uses mocked infrastructure for Kafka and Redis, 
 * we follow the same pattern for Neo4j to ensure portability and ease of testing.
 * In a production environment, this would use the `neo4j-driver`.
 */
class MockNeo4jService {
    private static instance: MockNeo4jService;
    private nodes: Map<string, { label: string, properties: any }> = new Map();
    private relationships: Array<{ from: string, to: string, type: string, properties: any }> = [];

    private constructor() { }

    static getInstance(): MockNeo4jService {
        if (!MockNeo4jService.instance) {
            MockNeo4jService.instance = new MockNeo4jService();
        }
        return MockNeo4jService.instance;
    }

    async createNode(label: string, properties: any): Promise<string> {
        const id = properties.id || Math.random().toString(36).substring(7);
        const key = `${label}:${id}`;
        this.nodes.set(key, { label, properties });
        log(`[Neo4j] Created Node (${label}) with properties: ${JSON.stringify(properties).slice(0, 50)}...`);
        return key;
    }

    async createRelationship(fromKey: string, toKey: string, type: string, properties: any = {}): Promise<void> {
        this.relationships.push({ from: fromKey, to: toKey, type, properties });
        log(`[Neo4j] Created Relationship: (${fromKey}) -[:${type}]-> (${toKey})`);
    }

    async query(cypher: string, params: any = {}): Promise<any[]> {
        log(`[Neo4j] Executing Cypher: ${cypher} with params: ${JSON.stringify(params)}`);
        // Mock query logic for common patterns used in the Memory Graph
        if (cypher.includes("MATCH") && cypher.includes("Video")) {
            return Array.from(this.nodes.values())
                .filter(n => n.label === "Video")
                .map(n => n.properties);
        }
        return [];
    }

    // Helper for debugging/verification
    getInternalState() {
        return {
            nodeCount: this.nodes.size,
            relCount: this.relationships.length
        };
    }
}

export const neo4j = MockNeo4jService.getInstance();
