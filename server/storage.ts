import { db } from "./db";
import {
  videos, channelAnalytics, videoMetrics, topKeywords,
  type InsertVideo, type InsertVideoMetricsSchema, type InsertChannelAnalyticsSchema, type InsertTopKeywordSchema,
  type Video, type ChannelAnalytics, type VideoMetric, type TopKeyword
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Videos
  upsertVideo(video: InsertVideo): Promise<Video>;
  getVideos(channelId: string): Promise<Video[]>;
  
  // Analytics
  upsertChannelAnalytics(analytics: any): Promise<ChannelAnalytics>; // Type 'any' for now to simplify Partial matching
  getChannelAnalytics(channelId: string): Promise<ChannelAnalytics | undefined>;
  
  // Metrics
  upsertVideoMetric(metric: any): Promise<VideoMetric>;
  getVideoMetrics(channelId: string): Promise<VideoMetric[]>; // Requires join, or just list by videoIds (not implemented efficiently here but okay for MVP)
  getVideoMetricsForVideo(videoId: string): Promise<VideoMetric | undefined>;

  // Keywords
  upsertTopKeyword(keyword: any): Promise<TopKeyword>;
  getTopKeywords(channelId: string): Promise<TopKeyword[]>;
  clearTopKeywords(channelId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async upsertVideo(video: InsertVideo): Promise<Video> {
    const existing = await db.select().from(videos).where(eq(videos.videoId, video.videoId));
    if (existing.length > 0) {
      const [updated] = await db.update(videos).set(video).where(eq(videos.videoId, video.videoId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(videos).values(video).returning();
    return inserted;
  }

  async getVideos(channelId: string): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.channelId, channelId)).orderBy(desc(videos.publishedAt));
  }

  async upsertChannelAnalytics(analytics: any): Promise<ChannelAnalytics> {
    const existing = await db.select().from(channelAnalytics).where(eq(channelAnalytics.channelId, analytics.channelId));
    if (existing.length > 0) {
      const [updated] = await db.update(channelAnalytics).set(analytics).where(eq(channelAnalytics.channelId, analytics.channelId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(channelAnalytics).values(analytics).returning();
    return inserted;
  }

  async getChannelAnalytics(channelId: string): Promise<ChannelAnalytics | undefined> {
    const [result] = await db.select().from(channelAnalytics).where(eq(channelAnalytics.channelId, channelId));
    return result;
  }

  async upsertVideoMetric(metric: any): Promise<VideoMetric> {
    // Check if exists
    const existing = await db.select().from(videoMetrics).where(eq(videoMetrics.videoId, metric.videoId));
    if (existing.length > 0) {
      const [updated] = await db.update(videoMetrics).set(metric).where(eq(videoMetrics.videoId, metric.videoId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(videoMetrics).values(metric).returning();
    return inserted;
  }

  async getVideoMetrics(channelId: string): Promise<VideoMetric[]> {
    // In a real app we'd join, but here we can just fetch all metrics that match video IDs from that channel
    // For MVP, simpler: fetch videos, then fetch metrics for those videos. 
    // Actually, let's just return all metrics for now, or filtered by a list of IDs. 
    // But IStorage interface is slightly leaky. Let's do a join query logic in the route or here.
    // For simplicity, I'll fetch ALL metrics and filter in memory if dataset is small, or assume calling code handles it.
    // Better: Helper query.
    const videosList = await this.getVideos(channelId);
    if (videosList.length === 0) return [];
    const ids = videosList.map(v => v.videoId);
    // Drizzle `inArray` would be good here.
    // For now, let's just use raw SQL or loop (inefficient but safe for MVP).
    // Actually, I'll just implement getVideos and let the route handle matching metrics for now.
    // Or better, let's return metrics for these videos.
    const metrics: VideoMetric[] = [];
    for (const v of videosList) {
       const m = await this.getVideoMetricsForVideo(v.videoId);
       if (m) metrics.push(m);
    }
    return metrics;
  }

  async getVideoMetricsForVideo(videoId: string): Promise<VideoMetric | undefined> {
    const [m] = await db.select().from(videoMetrics).where(eq(videoMetrics.videoId, videoId));
    return m;
  }

  async clearTopKeywords(channelId: string): Promise<void> {
    await db.delete(topKeywords).where(eq(topKeywords.channelId, channelId));
  }

  async upsertTopKeyword(keyword: any): Promise<TopKeyword> {
    const [inserted] = await db.insert(topKeywords).values(keyword).returning();
    return inserted;
  }

  async getTopKeywords(channelId: string): Promise<TopKeyword[]> {
    return await db.select().from(topKeywords).where(eq(topKeywords.channelId, channelId)).orderBy(desc(topKeywords.score));
  }
}

export const storage = new DatabaseStorage();
