import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import analyticsRouter from './routes';
import { storage } from '../../storage';

// Mock storage
vi.mock('../../storage', () => ({
  storage: {
    getChannelAnalytics: vi.fn(),
    getVideos: vi.fn(),
    getVideoMetrics: vi.fn(),
    getTopKeywords: vi.fn(),
    upsertChannelAnalytics: vi.fn(),
  }
}));

const app = express();
app.use(express.json());
app.use('/analytics', analyticsRouter);

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /analytics/:channelId - should return 404 if no analytics found', async () => {
    vi.mocked(storage.getChannelAnalytics).mockResolvedValue(undefined);
    
    const res = await request(app).get('/analytics/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Analytics not found');
  });

  it('GET /analytics/:channelId - should return analytics and chart data', async () => {
    const mockAnalytics = { channelId: 'c1', totalVideos: 10 };
    const mockVideos = [{ videoId: 'v1', views: 100, publishedAt: new Date() }];
    const mockMetrics = [{ videoId: 'v1', crps: 0.8, format: 'tutorial' }];
    const mockKeywords = [{ keyword: 'test', score: 10 }];

    vi.mocked(storage.getChannelAnalytics).mockResolvedValue(mockAnalytics as any);
    vi.mocked(storage.getVideos).mockResolvedValue(mockVideos as any);
    vi.mocked(storage.getVideoMetrics).mockResolvedValue(mockMetrics as any);
    vi.mocked(storage.getTopKeywords).mockResolvedValue(mockKeywords as any);

    const res = await request(app).get('/analytics/c1');
    expect(res.status).toBe(200);
    expect(res.body.analytics).toEqual(mockAnalytics);
    expect(res.body.viewsOverTime).toHaveLength(1);
    expect(res.body.avgCrpsByFormat).toEqual([{ format: 'tutorial', crps: 0.8 }]);
  });

  it('POST /analytics/update-stats - should update channel stats', async () => {
    const mockVideos = [
      { views: 1000, likes: 100, comments: 20 },
      { views: 2000, likes: 200, comments: 40 }
    ];
    vi.mocked(storage.getVideos).mockResolvedValue(mockVideos as any);

    const res = await request(app).post('/analytics/update-stats').send({ channelId: 'c1' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.avgViews).toBe(1500);
    expect(storage.upsertChannelAnalytics).toHaveBeenCalledWith(expect.objectContaining({
      avgViews: 1500,
      avgLikes: 150,
      avgComments: 30
    }));
  });
});
