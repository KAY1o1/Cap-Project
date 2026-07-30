import { useCallback, useEffect, useState } from "react";

type YouTubeVideo = {
  id: string | { videoId: string };
  snippet: {
    title: string;
    tags?: string[];
    channelTitle?: string;
    channelId?: string;
    thumbnails?: {
      medium?: { url?: string };
    };
  };
  contentDetails?: {
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
  };
};

export function useYouTubeVideos(searchQuery: string) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [channelThumbs, setChannelThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const YT_KEY = import.meta.env.VITE_YT_KEY;

  const fetchVideos = useCallback(
    async (pageToken?: string, append = false) => {
      try {
        if (!YT_KEY || !searchQuery) {
          setVideos([]);
          setNextPageToken(null);
          return;
        }

        setLoading(true);

        if (!append) {
          setNextPageToken(null);
        }

        if (pageToken) {
          setLoadingMore(true);
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&order=relevance&q=${encodeURIComponent(
          searchQuery,
        )}&regionCode=US${pageToken ? `&pageToken=${pageToken}` : ""}&key=${YT_KEY}`;

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        const videoIds = (searchData.items || [])
          .map((item: any) => item.id?.videoId)
          .filter(Boolean)
          .join(",");

        let fetchedVideos: YouTubeVideo[] = [];
        if (videoIds) {
          const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YT_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          fetchedVideos = detailsData.items || [];
        }

        try {
          const channelIds = Array.from(
            new Set(
              (fetchedVideos as any)
                .map((video: any) => video.snippet?.channelId)
                .filter(Boolean),
            ),
          );

          if (channelIds.length > 0) {
            const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(
              ",",
            )}&key=${YT_KEY}`;
            const channelsResponse = await fetch(channelsUrl);
            const channelsData = await channelsResponse.json();

            const newThumbs: Record<string, string> = {};
            (channelsData.items || []).forEach((channel: any) => {
              const id = channel.id;
              const thumb =
                channel.snippet?.thumbnails?.default?.url ||
                channel.snippet?.thumbnails?.medium?.url ||
                "";

              if (id && thumb) {
                newThumbs[id] = thumb;
              }
            });

            setChannelThumbs((prev) => ({ ...prev, ...newThumbs }));
          }
        } catch (err) {
          console.error("Error fetching channel thumbnails:", err);
        }

        const filteredVideos = fetchedVideos.filter((video: YouTubeVideo) => {
          const duration = video.contentDetails?.duration;
          if (!duration) {
            return true;
          }

          const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (!match) {
            return true;
          }

          const hours = Number(match[1] ?? 0);
          const minutes = Number(match[2] ?? 0);
          const seconds = Number(match[3] ?? 0);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;

          return totalSeconds >= 480;
        });

        const sortedVideos = filteredVideos.sort((a: YouTubeVideo, b: YouTubeVideo) => {
          const aViews = Number(a.statistics?.viewCount ?? 0);
          const bViews = Number(b.statistics?.viewCount ?? 0);
          return bViews - aViews;
        });

        setNextPageToken(searchData.nextPageToken ?? null);
        setVideos((prev) =>
          append ? [...prev, ...sortedVideos.slice(0, 50)] : sortedVideos.slice(0, 50),
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setVideos([]);
        setNextPageToken(null);
      } finally {
        setLoading(false);
        if (pageToken) {
          setLoadingMore(false);
        }
      }
    },
    [YT_KEY, searchQuery],
  );

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    nextPageToken,
    loading,
    loadingMore,
    channelThumbs,
    fetchVideos,
  };
}