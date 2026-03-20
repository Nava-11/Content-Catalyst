import { db } from "./db";
export { db };
import {
  videos, channelAnalytics, videoMetrics, topKeywords, clusters, ideas, audiencePersonas,
  creatorStyleProfiles, narrativeAnalysis, audienceCuriositySignals, burnoutSignals, longevityPredictions, ecosystemHealthScores,
  type InsertVideo, type Video, type ChannelAnalytics, type VideoMetric, type TopKeyword, type Cluster, type IdeaRow, type AudiencePersona
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Videos
  upsertVideo(video: InsertVideo): Promise<Video>;
  getVideos(channelId: string): Promise<Video[]>;

  // Ideas
  getIdeas(channelId: string): Promise<IdeaRow[]>;
  updateIdeaStatus(id: number, status: string, publishedAt?: Date): Promise<IdeaRow>;

  // Audience Persona methods
  getAudiencePersonas(channelId: string): Promise<AudiencePersona[]>;
  createAudiencePersona(persona: any): Promise<AudiencePersona>;

  // Analytics
  upsertChannelAnalytics(analytics: any): Promise<ChannelAnalytics>;
  getChannelAnalytics(channelId: string): Promise<ChannelAnalytics | undefined>;

  // Metrics
  upsertVideoMetric(metric: any): Promise<VideoMetric>;
  getVideoMetrics(channelId: string): Promise<VideoMetric[]>;
  getVideoMetricsForVideo(videoId: string): Promise<VideoMetric | undefined>;

  // Keywords
  upsertTopKeyword(keyword: any): Promise<TopKeyword>;
  getTopKeywords(channelId: string): Promise<TopKeyword[]>;
  clearTopKeywords(channelId: string): Promise<void>;

  // Clusters & Ideas
  upsertCluster(cluster: any): Promise<any>;
  clearClusters(channelId: string): Promise<void>;
  getClusters(channelId: string): Promise<any[]>;
  upsertIdea(idea: any): Promise<any>;
  getIdeaById(id: number): Promise<IdeaRow | undefined>;
  recentIdeaEmbeddings(channelId: string, limit?: number): Promise<number[][]>;

  // Advanced Features
  upsertCreatorStyleProfile(profile: any): Promise<any>;
  getCreatorStyleProfile(channelId: string): Promise<any>;
  upsertNarrativeAnalysis(analysis: any): Promise<any>;
  getNarrativeAnalysis(videoId: string): Promise<any>;
  upsertAudienceCuriositySignal(signal: any): Promise<any>;
  getAudienceCuriositySignals(channelId: string): Promise<any[]>;
  upsertBurnoutSignal(signal: any): Promise<any>;
  getBurnoutSignal(channelId: string): Promise<any>;
  upsertLongevityPrediction(prediction: any): Promise<any>;
  getLongevityPrediction(videoId: string): Promise<any>;
  upsertEcosystemHealthScore(score: any): Promise<any>;
  getEcosystemHealthScore(channelId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  private _mem: { clusters: Record<string, any[]>; ideas: Record<string, any[]> } = { clusters: {}, ideas: {} };

  private isRelationMissing(err: any) {
    return err && (err.code === '42P01' || (err.message && typeof err.message === 'string' && err.message.includes('relation')));
  }

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
    const existing = await db.select().from(videoMetrics).where(eq(videoMetrics.videoId, metric.videoId));
    if (existing.length > 0) {
      const [updated] = await db.update(videoMetrics).set(metric).where(eq(videoMetrics.videoId, metric.videoId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(videoMetrics).values(metric).returning();
    return inserted;
  }

  async getVideoMetrics(channelId: string): Promise<VideoMetric[]> {
    const videosList = await this.getVideos(channelId);
    if (videosList.length === 0) return [];
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

  async upsertCluster(cluster: any): Promise<any> {
    try {
      const existing = await db.select().from(clusters).where(eq(clusters.clusterId, cluster.clusterId));
      if (existing.length > 0) {
        const [updated] = await db.update(clusters).set(cluster).where(eq(clusters.clusterId, cluster.clusterId)).returning();
        return updated;
      }
      const [inserted] = await db.insert(clusters).values(cluster).returning();
      return inserted;
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        const ch = cluster.channelId;
        this._mem.clusters[ch] = this._mem.clusters[ch] || [];
        const idx = this._mem.clusters[ch].findIndex((c: any) => c.clusterId === cluster.clusterId);
        if (idx >= 0) this._mem.clusters[ch][idx] = { ...this._mem.clusters[ch][idx], ...cluster };
        else this._mem.clusters[ch].push(cluster);
        return cluster;
      }
      throw err;
    }
  }

  async clearClusters(channelId: string): Promise<void> {
    try {
      await db.delete(clusters).where(eq(clusters.channelId, channelId));
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        delete this._mem.clusters[channelId];
        return;
      }
      throw err;
    }
  }

  async getClusters(channelId: string): Promise<any[]> {
    try {
      return await db.select().from(clusters).where(eq(clusters.channelId, channelId)).orderBy(desc(clusters.lastUpdated));
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        return this._mem.clusters[channelId] || [];
      }
      throw err;
    }
  }

  async upsertIdea(idea: any): Promise<any> {
    try {
      const [inserted] = await db.insert(ideas).values(idea).returning();
      return inserted;
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        const ch = idea.channelId;
        this._mem.ideas[ch] = this._mem.ideas[ch] || [];
        const id = (this._mem.ideas[ch].length ? (this._mem.ideas[ch][0].id + 1) : 1) || Math.floor(Math.random() * 100000);
        const row = { id, ...idea };
        this._mem.ideas[ch].unshift(row);
        return row;
      }
      throw err;
    }
  }

  async getIdeas(channelId: string): Promise<IdeaRow[]> {
    try {
      return await db.select().from(ideas).where(eq(ideas.channelId, channelId)).orderBy(desc(ideas.createdAt));
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        return this._mem.ideas[channelId] || [];
      }
      throw err;
    }
  }

  async updateIdeaStatus(id: number, status: string, publishedAt?: Date): Promise<IdeaRow> {
    const [updated] = await db.update(ideas)
      .set({ status, publishedAt: publishedAt || null })
      .where(eq(ideas.id, id))
      .returning();
    return updated;
  }

  async getAudiencePersonas(channelId: string): Promise<AudiencePersona[]> {
    return await db.select().from(audiencePersonas).where(eq(audiencePersonas.channelId, channelId));
  }

  async createAudiencePersona(persona: any): Promise<AudiencePersona> {
    const [created] = await db.insert(audiencePersonas).values(persona).returning();
    return created;
  }

  async getIdeaById(id: number): Promise<IdeaRow | undefined> {
    try {
      const [r] = await db.select().from(ideas).where(eq(ideas.id, id));
      return r;
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        for (const ch of Object.keys(this._mem.ideas)) {
          const found = (this._mem.ideas[ch] || []).find((i: any) => i.id === id);
          if (found) return found;
        }
        return undefined;
      }
      throw err;
    }
  }

  async recentIdeaEmbeddings(channelId: string, limit = 50): Promise<number[][]> {
    try {
      const rows = await db.select().from(ideas).where(eq(ideas.channelId, channelId)).orderBy(desc(ideas.createdAt)).limit(limit);
      return rows.map(r => ((r.embedding as number[]) || []));
    } catch (err: any) {
      if (this.isRelationMissing(err)) {
        const rows = (this._mem.ideas[channelId] || []).slice(0, limit);
        return rows.map((r: any) => r.embedding || []);
      }
      throw err;
    }
  }

  // Advanced Features Implementations
  async upsertCreatorStyleProfile(profile: any): Promise<any> {
    const existing = await db.select().from(creatorStyleProfiles).where(eq(creatorStyleProfiles.channelId, profile.channelId));
    if (existing.length > 0) {
      const [updated] = await db.update(creatorStyleProfiles).set(profile).where(eq(creatorStyleProfiles.channelId, profile.channelId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(creatorStyleProfiles).values(profile).returning();
    return inserted;
  }

  async getCreatorStyleProfile(channelId: string): Promise<any> {
    const [res] = await db.select().from(creatorStyleProfiles).where(eq(creatorStyleProfiles.channelId, channelId));
    return res;
  }

  async upsertNarrativeAnalysis(analysis: any): Promise<any> {
    const existing = await db.select().from(narrativeAnalysis).where(eq(narrativeAnalysis.videoId, analysis.videoId));
    if (existing.length > 0) {
      const [updated] = await db.update(narrativeAnalysis).set(analysis).where(eq(narrativeAnalysis.videoId, analysis.videoId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(narrativeAnalysis).values(analysis).returning();
    return inserted;
  }

  async getNarrativeAnalysis(videoId: string): Promise<any> {
    const [res] = await db.select().from(narrativeAnalysis).where(eq(narrativeAnalysis.videoId, videoId));
    return res;
  }

  async upsertAudienceCuriositySignal(signal: any): Promise<any> {
    const [inserted] = await db.insert(audienceCuriositySignals).values(signal).returning();
    return inserted;
  }

  async getAudienceCuriositySignals(channelId: string): Promise<any[]> {
    return await db.select().from(audienceCuriositySignals).where(eq(audienceCuriositySignals.channelId, channelId)).orderBy(desc(audienceCuriositySignals.lastDetected));
  }

  async upsertBurnoutSignal(signal: any): Promise<any> {
    const existing = await db.select().from(burnoutSignals).where(eq(burnoutSignals.channelId, signal.channelId));
    if (existing.length > 0) {
      const [updated] = await db.update(burnoutSignals).set(signal).where(eq(burnoutSignals.channelId, signal.channelId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(burnoutSignals).values(signal).returning();
    return inserted;
  }

  async getBurnoutSignal(channelId: string): Promise<any> {
    const [res] = await db.select().from(burnoutSignals).where(eq(burnoutSignals.channelId, channelId));
    return res;
  }

  async upsertLongevityPrediction(prediction: any): Promise<any> {
    const existing = await db.select().from(longevityPredictions).where(eq(longevityPredictions.videoId, prediction.videoId));
    if (existing.length > 0) {
      const [updated] = await db.update(longevityPredictions).set(prediction).where(eq(longevityPredictions.videoId, prediction.videoId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(longevityPredictions).values(prediction).returning();
    return inserted;
  }

  async getLongevityPrediction(videoId: string): Promise<any> {
    const [res] = await db.select().from(longevityPredictions).where(eq(longevityPredictions.videoId, videoId));
    return res;
  }

  async upsertEcosystemHealthScore(score: any): Promise<any> {
    const existing = await db.select().from(ecosystemHealthScores).where(eq(ecosystemHealthScores.channelId, score.channelId));
    if (existing.length > 0) {
      const [updated] = await db.update(ecosystemHealthScores).set(score).where(eq(ecosystemHealthScores.channelId, score.channelId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(ecosystemHealthScores).values(score).returning();
    return inserted;
  }

  async getEcosystemHealthScore(channelId: string): Promise<any> {
    const [res] = await db.select().from(ecosystemHealthScores).where(eq(ecosystemHealthScores.channelId, channelId));
    return res;
  }
}

export const storage = new DatabaseStorage();
