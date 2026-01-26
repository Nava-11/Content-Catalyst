import { Router } from "express";
import { workflows } from "./engine";

const router = Router();

// POST /run/:name
router.post("/run/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const context = req.body || {};

        // Async execution
        workflows.run(name, context).catch(err => console.error(err));

        res.json({ success: true, message: `Workflow ${name} started` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
