import { z } from "zod";
import { channelAnalytics, topKeywords, videoMetrics, videos } from "./schema";

export const api = {
  analyze: {
    method: "POST" as const,
    path: "/api/analyze",
    input: z.object({
      channelId: z.string().min(1, "Channel ID is required"),
    }),
    responses: {
      200: z.object({ success: z.boolean(), message: z.string() }),
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
  },
  analytics: {
    method: "GET" as const,
    path: "/api/analytics/:channelId",
    responses: {
      200: z.object({
        analytics: z.custom<typeof channelAnalytics.$inferSelect>(),
        videos: z.array(z.custom<typeof videos.$inferSelect>()),
        metrics: z.array(z.custom<typeof videoMetrics.$inferSelect>()),
        keywords: z.array(z.custom<typeof topKeywords.$inferSelect>()),
        viewsOverTime: z.array(z.object({ date: z.string(), views: z.number() })),
        avgCrpsByFormat: z.array(z.object({ format: z.string(), crps: z.number() })),
      }),
      404: z.object({ message: z.string() }),
    },
  },
  recommendations: {
    method: "GET" as const,
    path: "/api/recommendations/:channelId",
    responses: {
      200: z.object({
        diagnosis: z.object({
          comfortable: z.array(z.string()),
          curious: z.array(z.string()),
          disengaged: z.array(z.string()),
        }),
        strategy: z.array(z.string()),
        experiments: z.array(z.object({
          experimentType: z.string(),
          description: z.string().optional(),
          ideas: z.array(z.object({
            id: z.number(),
            title: z.string(),
            format: z.string(),
            suggestedPostingTime: z.string(),
            rationale: z.string(),
            note: z.string().optional(),
            score: z.number().optional(),
            // High-level per-idea guidance is now generated on demand via the deep-dive endpoint.
          }))
        })),
        topicClusters: z.array(z.object({
          index: z.number(),
          label: z.string(),
          avgCrps: z.number(),
          size: z.number(),
          performanceSummary: z.string(),
        })),
      }),
      404: z.object({ message: z.string() }),
    },
  },
  chat: {
    method: "POST" as const,
    path: "/api/chat",
    input: z.object({
      channelId: z.string(),
      message: z.string(),
      previousMessages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })).optional()
    }),
    responses: {
      200: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
