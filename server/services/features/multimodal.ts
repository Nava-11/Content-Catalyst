import sharp from "sharp";
import axios from "axios";
import { storage } from "../../storage";

export interface ThumbnailStats {
    videoId: string;
    brightness: number; // 0-255
    contrast: number;   // 0-100
    dominantColor: string;
    hasFacePossible: boolean;
}

export class ThumbnailAnalyzer {
    /**
     * Downloads and analyzes a YouTube thumbnail.
     */
    async analyzeThumbnail(videoId: string, url: string): Promise<ThumbnailStats | null> {
        try {
            console.log(`[ThumbnailAnalyzer] Processing ${videoId}...`);
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');

            const metadata = await sharp(buffer).metadata();
            const stats = await sharp(buffer).stats();

            // 1. Brightness (Mean of R, G, B)
            const brightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;

            // 2. Contrast (Average of standard deviations across channels)
            const contrast = (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3;

            // 3. Simple Face Detection Heuristic (Center area skin-tone detection)
            // Note: This is a placeholder for face-api.js
            const hasFacePossible = contrast > 40 && brightness > 50; 

            return {
                videoId,
                brightness,
                contrast,
                dominantColor: `rgb(${Math.round(stats.channels[0].mean)}, ${Math.round(stats.channels[1].mean)}, ${Math.round(stats.channels[2].mean)})`,
                hasFacePossible
            };
        } catch (error) {
            console.warn(`[ThumbnailAnalyzer] Failed for ${videoId}:`, error);
            return null;
        }
    }

    async correlateWithCrps(channelId: string) {
        const videos = await storage.getVideos(channelId);
        const metrics = await storage.getVideoMetrics(channelId);

        const results = [];
        for (const video of videos.slice(0, 10)) {
            const m = metrics.find(metric => metric.videoId === video.videoId);
            if (!m) continue;

            // YouTube thumbnail standard URL
            const url = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
            const stats = await this.analyzeThumbnail(video.videoId, url);
            
            if (stats) {
                results.push({ ...stats, crps: m.crps });
            }
        }

        // Return a summary of correlations
        const highContrast = results.filter(r => r.contrast > 50);
        const lowContrast = results.filter(r => r.contrast <= 50);

        const avgHigh = highContrast.length ? highContrast.reduce((s, r) => s + (r.crps || 0), 0) / highContrast.length : 0;
        const avgLow = lowContrast.length ? lowContrast.reduce((s, r) => s + (r.crps || 0), 0) / lowContrast.length : 0;

        return {
            highContrastImpact: avgLow > 0 ? (avgHigh / avgLow).toFixed(2) : "1.0",
            totalAnalyzed: results.length
        };
    }
}

export const thumbnailAnalyzer = new ThumbnailAnalyzer();
export const initMultimodal = () => {
    console.log("[Multimodal] Service initialized.");
};
