import { google } from "googleapis";

// Initialize YouTube API client
const youtube = google.youtube("v3");

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
  };
}

export async function fetchChannelVideos(channelId: string, apiKey: string, maxResults = 50): Promise<YouTubeVideo[]> {
  try {
    // 1. Get Uploads Playlist ID
    const channelResponse = await youtube.channels.list({
      key: apiKey,
      id: [channelId],
      part: ["contentDetails"],
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error("Channel not found");
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error("Uploads playlist not found");
    }

    // 2. Get Videos from Playlist
    const playlistResponse = await youtube.playlistItems.list({
      key: apiKey,
      playlistId: uploadsPlaylistId,
      part: ["snippet"],
      maxResults: maxResults,
    });

    const videoIds = playlistResponse.data.items?.map((item) => item.snippet?.resourceId?.videoId).filter(Boolean) as string[];

    if (videoIds.length === 0) return [];

    // 3. Get Video Details (Stats + Duration)
    const videosResponse = await youtube.videos.list({
      key: apiKey,
      id: videoIds,
      part: ["snippet", "statistics", "contentDetails"],
    });

    return videosResponse.data.items as YouTubeVideo[] || [];
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    throw error;
  }
}

export function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);

  return (hours * 3600) + (minutes * 60) + seconds;
}
