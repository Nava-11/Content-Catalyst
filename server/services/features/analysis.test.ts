import { describe, it, expect } from 'vitest';
import { calculateCRPS, classifyFormat } from './analysis';
import { type Video } from '@shared/schema';

describe('calculateCRPS', () => {
  const mockVideo: Video = {
    id: 1,
    channelId: 'test-channel',
    videoId: 'v1',
    title: 'Test Video',
    description: 'Desc',
    publishedAt: new Date(),
    views: 1000,
    likes: 100,
    comments: 50,
    duration: 600,
  };

  it('should calculate correct score with normal averages', () => {
    // viewScore = 1000/1000 = 1
    // likeScore = 100/100 = 1
    // commentScore = 50/50 = 1
    // total = (0.5 * 1) + (0.3 * 1) + (0.2 * 1) = 1
    const score = calculateCRPS(mockVideo, 1000, 100, 50);
    expect(score).toBe(1);
  });

  it('should handle division by zero (avg = 0)', () => {
    const score = calculateCRPS(mockVideo, 0, 0, 0);
    expect(score).toBe(0);
  });

  it('should handle zero metrics in video', () => {
    const zeroVideo: Video = { ...mockVideo, views: 0, likes: 0, comments: 0 };
    const score = calculateCRPS(zeroVideo, 1000, 100, 50);
    expect(score).toBe(0);
  });

  it('should correctly weight different metrics', () => {
    // Views are 0, Likes are double avg, Comments are 0
    // viewScore = 0
    // likeScore = 200/100 = 2
    // commentScore = 0
    // total = (0.5 * 0) + (0.3 * 2) + (0.2 * 0) = 0.6
    const highLikesVideo: Video = { ...mockVideo, views: 0, likes: 200, comments: 0 };
    const score = calculateCRPS(highLikesVideo, 1000, 100, 50);
    expect(score).toBeCloseTo(0.6);
  });
});

describe('classifyFormat', () => {
  it('should detect tutorial format', () => {
    expect(classifyFormat('How to cook', '')).toBe('tutorial');
    expect(classifyFormat('A guide to gardening', '')).toBe('tutorial');
  });

  it('should detect tips format', () => {
    expect(classifyFormat('5 tips for SEO', '')).toBe('tips');
  });

  it('should detect mistakes format', () => {
    expect(classifyFormat('Common mistakes in React', '')).toBe('mistakes');
  });

  it('should return other for unknown formats', () => {
    expect(classifyFormat('My daily vlog', '')).toBe('other');
  });
});
