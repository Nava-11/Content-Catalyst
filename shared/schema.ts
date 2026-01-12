import { pgTable, text, serial, integer, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table: videos
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  duration: integer("duration_seconds").default(0),
});

// Table: channel_analytics
export const channelAnalytics = pgTable("channel_analytics", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  totalVideos: integer("total_videos").default(0),
  avgViews: integer("avg_views").default(0),
  avgLikes: integer("avg_likes").default(0),
  avgComments: integer("avg_comments").default(0),
  bestDay: text("best_day"),
  bestHour: integer("best_hour"),
  optimalDurationMin: integer("optimal_duration_min"),
  optimalDurationMax: integer("optimal_duration_max"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Table: video_metrics
export const videoMetrics = pgTable("video_metrics", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  format: text("format"),
  crps: real("crps"),
});

// Table: top_keywords
export const topKeywords = pgTable("top_keywords", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  keyword: text("keyword").notNull(),
  score: real("score").default(0),
});

// Table: clusters
export const clusters = pgTable("clusters", {
  id: serial("id").primaryKey(),
  clusterId: text("cluster_id").notNull(),
  channelId: text("channel_id").notNull(),
  centroid: json("centroid_embedding"),
  avgCrps: real("avg_crps"),
  dominantFormats: json("dominant_formats"),
  size: integer("size"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Table: ideas
export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  title: text("title").notNull(),
  format: text("format"),
  experimentType: text("experiment_type"),
  suggestedPostingTime: text("suggested_posting_time"),
  embedding: json("embedding"),
  sourceClusterId: text("source_cluster_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true });
export const insertChannelAnalyticsSchema = createInsertSchema(channelAnalytics).omit({ id: true, lastUpdated: true });
export const insertVideoMetricsSchema = createInsertSchema(videoMetrics).omit({ id: true });
export const insertTopKeywordSchema = createInsertSchema(topKeywords).omit({ id: true });
export const insertClusterSchema = createInsertSchema(clusters).omit({ id: true, lastUpdated: true });
export const insertIdeaSchema = createInsertSchema(ideas).omit({ id: true, createdAt: true });

// Types
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type ChannelAnalytics = typeof channelAnalytics.$inferSelect;
export type VideoMetric = typeof videoMetrics.$inferSelect;
export type TopKeyword = typeof topKeywords.$inferSelect;
export type Cluster = typeof clusters.$inferSelect;
export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type IdeaRow = typeof ideas.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;

export type Idea = {
  id: number;
  title: string;
  format: string;
  suggestedPostingTime: string;
  rationale: string;
};

export type TopicClusterSummary = {
  index: number;
  label: string;
  avgCrps: number;
  size: number;
  performanceSummary: string;
};

export type RecommendationsResponse = {
  diagnosis: {
    comfortable: string[];
    curious: string[];
    disengaged: string[];
  };
  strategy: string[];
  experiments: {
    experimentType: string;
    description?: string;
    ideas: Idea[];
  }[];
  topicClusters: TopicClusterSummary[];
};
