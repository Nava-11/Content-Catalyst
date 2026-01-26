import { kafka, Topics } from "../infrastructure/kafka";

type WorkflowStep = (context: any) => Promise<any>;

interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
}

export class WorkflowEngine {
    private static instance: WorkflowEngine;
    private workflows: Map<string, WorkflowDefinition> = new Map();

    static getInstance(): WorkflowEngine {
        if (!WorkflowEngine.instance) {
            WorkflowEngine.instance = new WorkflowEngine();
        }
        return WorkflowEngine.instance;
    }

    register(name: string, steps: WorkflowStep[]) {
        this.workflows.set(name, { name, steps });
    }

    async run(name: string, initialContext: any = {}) {
        const wf = this.workflows.get(name);
        if (!wf) throw new Error(`Workflow ${name} not found`);

        console.log(`[Workflow] Starting ${name}...`);
        let context = { ...initialContext };

        for (const step of wf.steps) {
            try {
                const result = await step(context);
                context = { ...context, ...result };
            } catch (e) {
                console.error(`[Workflow] Step failed in ${name}:`, e);
                throw e;
            }
        }

        console.log(`[Workflow] Completed ${name}.`);
        return context;
    }
}

export const workflows = WorkflowEngine.getInstance();

// Define Standard Workflows
import { computeAndPersistClusters } from "../ideas/routes";
import { backfillFeatures } from "../features/backfill";

export function initWorkflows() {
    // 1. "Refine Creator World" Workflow
    // Triggered when clusters are updated -> maybe re-run deep analysis
    workflows.register("refine-world", [
        async (ctx) => {
            console.log("Step 1: Checking cluster stability...");
            return { clustersStable: true };
        },
        async (ctx) => {
            if (ctx.clustersStable) {
                console.log("Step 2: Refining world model...");
                // Call logic...
            }
            return {};
        }
    ]);

    // 2. "Full Analysis" Workflow
    workflows.register("full-analysis", [
        async (ctx) => {
            // Step 1: Backfill/Hydrate Features
            await backfillFeatures(ctx.channelId);
            return { featuresReady: true };
        },
        async (ctx) => {
            // Step 2: Re-cluster
            await computeAndPersistClusters(ctx.channelId);
            return { clustersUpdated: true };
        }
    ]);

    // Kafka Triggers
    kafka.consume(Topics.CLUSTER_UPDATED, async (msg) => {
        // Trigger workflow if needed
        // await workflows.run("refine-world", { channelId: msg.value.channelId });
    });
}
