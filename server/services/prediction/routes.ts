import { Router } from "express";
import { activeModel } from "./model";
import { featureStore } from "../features/store";

const router = Router();

// POST /predict
// Accepts: { videoId } OR { features }
router.post("/predict", async (req, res) => {
    try {
        const { videoId, features } = req.body;

        let inputFeatures = features;

        // Feature Hydration from Store if videoId provided
        if (videoId && !inputFeatures) {
            inputFeatures = await featureStore.getFeatures(videoId, [
                "video_views", "video_duration", "video_crps", "video_format"
            ]);
        }

        if (!inputFeatures) {
            return res.status(400).json({ error: "Missing videoId or features" });
        }

        const score = activeModel.predict(inputFeatures);

        res.json({ success: true, score, explanation: "Heuristic prediction based on CRPS and Duration" });
    } catch (error: any) {
        console.error("[Prediction] Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
