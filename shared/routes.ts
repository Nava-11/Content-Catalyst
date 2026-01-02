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
        ideas: z.array(z.object({
          title: z.string(),
          format: z.string(),
          whyItWorks: z.string(),
          suggestedPostingTime: z.string(),
        })),
        guidance: z.object({
          topFormat: z.string(),
          topFormatCrps: z.number(),
          diffVsOther: z.number(),
          optimalLength: z.string(),
          bestTime: z.string(),
          structure: z.object({
            hook: z.string(),
            body: z.string(),
            cta: z.string(),
          }),
        }),
      }),
      404: z.object({ message: z.string() }),
    },
  },
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
