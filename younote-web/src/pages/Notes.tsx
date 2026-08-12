import { useEffect, useState, type FormEvent } from "react";
import type { SingleValue } from "react-select";
import NotesModal from "../components/NotesModal";
import VideoCard from "../components/VideoCard";
import VideoSearchBar from "../components/VideoSearchBar";
import { useYouTubeVideos } from "../hooks/useYouTubeVideos";
import "../styles/Notes.css";
import { supabase } from "../lib/supabase";

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

type Option = {
  value: string;
  label: string;
};

type NoteItem = {
  id: string;
  profile_id?: string;
  video_id?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  is_private?: boolean;
  timestamp_seconds?: number;
  videos?: { id?: string; youtube_video_id: string };
  profiles?: { username?: string; email?: string };
};

const tags: Option[] = [
  { value: "gaming", label: "Gaming" },
  { value: "tutorial", label: "Tutorial" },
  { value: "comedy", label: "Comedy" },
  { value: "news", label: "News" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "fitness", label: "Fitness" },
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
];


export default function Notes() {
  const [selectedOption, setSelectedOption] =
    useState<SingleValue<Option>>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoRatings, setVideoRatings] = useState<{ profile_id: string; rating: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [hasUser, setHasUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [defaultVideos, setDefaultVideos] = useState<YouTubeVideo[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const {
    videos: ytVid,
    nextPageToken,
    loadingMore,
    channelThumbs,
    fetchVideos,
  } = useYouTubeVideos(searchQuery);

  const getVideoId = (video: YouTubeVideo) => {
    if (typeof video.id === "string") {
      return video.id;
    }
    return video.id.videoId;
  };

  //Removed previous search entry after new search
  const handleChange = (selected: SingleValue<Option>) => {
    setSelectedOption(selected);
    const tag = selected?.value ?? "";
    const query = tag ? `#${tag}` : "";
    setSearchTerm(query);
    setSearchQuery(query);
    setSelectedVideoId(null);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedOption(null);
    setSearchQuery(searchTerm.trim());
    setSelectedVideoId(null);
  };

  //Display content for selected video
  const handleVideoSelect = async (videoId: string) => {
    setSelectedVideoId(videoId);
    setLoading(true);
    setVideoRatings([]);

    try {
      const { data: videoData } = await supabase
        .from("videos")
        .select("id")
        .eq("youtube_video_id", videoId)
        .maybeSingle();

      const vId = videoData?.id || null;
      if (vId) {
        const { data: ratingsData } = await supabase
          .from("video_ratings")
          .select("rating, profile_id")
          .eq("video_id", vId);

        if (ratingsData) {
          setVideoRatings(ratingsData);
        }
      }

      const { data, error } = await supabase
        .from("notes")
        .select(
          "id, content, created_at, video_id, is_private, profile_id, timestamp_seconds, videos!inner(id, youtube_video_id), profiles(username, email)",
        )
        .eq("videos.youtube_video_id", videoId);

      if (error) throw error;
      setNotes((data as unknown as NoteItem[]) || []);
    } catch (error) {
      console.error("[Notes] Error loading data:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotes = () => {
    setSelectedVideoId(null);
  };

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      void fetchVideos(nextPageToken, true);
    }
  };

  useEffect(() => {
    setNotes([]);
  }, [searchQuery]);

  //Is the user logged in?
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      setAuthLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setHasUser(!!user);
        setCurrentUserId(user?.id || null);
        setAuthLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setHasUser(!!session?.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  //Fetch default videos that already contain notes on page load
  useEffect(() => {
    let isMounted = true;

    const fetchVideosWithNotes = async () => {
      if (searchQuery) return;

      setLoadingDefaults(true);
      try {
        const { data: notesData, error } = await supabase
          .from("notes")
          .select("videos!inner(youtube_video_id)")
          .or(
            `is_private.is.false${
              currentUserId ? `,profile_id.eq.${currentUserId}` : ""
            }`
          );

        if (error) throw error;

        const uniqueVideoIds = Array.from(
          new Set(
            notesData
              ?.map((n: any) => n.videos?.youtube_video_id)
              .filter(Boolean)
          )
        );

        if (uniqueVideoIds.length === 0) {
          if (isMounted) setDefaultVideos([]);
          setLoadingDefaults(false);
          return;
        }

        const apiKey = import.meta.env.VITE_YT_KEY;
        const idsQuery = uniqueVideoIds.join(",");
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${idsQuery}&key=${apiKey}`
        );
        const result = await response.json();

        if (isMounted) {
          setDefaultVideos(result.items || []);
        }
      } catch (err) {
        console.error("Error fetching default videos with notes:", err);
        if (isMounted) setDefaultVideos([]);
      } finally {
        if (isMounted) setLoadingDefaults(false);
      }
    };

    if (hasUser && !searchQuery) {
      fetchVideosWithNotes();
    }

    return () => {
      isMounted = false;
    };
  }, [searchQuery, hasUser, currentUserId]);

  if (authLoading) {
    return (
      <div
        className="notes-page"
        style={{ textAlign: "center", paddingTop: "60px" }}
      >
        <h3>Loading...</h3>
      </div>
    );
  }

  if (!hasUser) {
    return (
      <div
        className="notes-page"
        style={{ textAlign: "center", paddingTop: "60px" }}
      >
        <p>
          Sign into the extension and click <strong>"View All Notes"</strong> to
          view this page.
        </p>
      </div>
    );
  }

  const displayVideos = searchQuery ? ytVid : defaultVideos;

  return (
    <div className="notes-page">
      <VideoSearchBar
        tags={tags}
        selectedOption={selectedOption}
        searchTerm={searchTerm}
        onTagChange={handleChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchTermChange={setSearchTerm}
      />

      {/* Video Display */}
      <div className="video-list">
        {!searchQuery && loadingDefaults ? (
          <p>Loading your saved note videos...</p>
        ) : !searchQuery && defaultVideos.length === 0 ? (
          <p>No notes found yet. Try searching for a video above!</p>
        ) : searchQuery && ytVid.length === 0 ? (
          <p>No videos found for this search.</p>
        ) : null}

        {displayVideos.length > 0 ? (
          <>
            {!searchQuery && (
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "#374151" }}>
                Videos with Notes
              </h3>
            )}
            <div className="video-grid">
              {displayVideos.map((video) => {
                const videoId = getVideoId(video);
                const channelThumb = video.snippet.channelId
                  ? channelThumbs[video.snippet.channelId]
                  : undefined;

                return (
                  <VideoCard
                    key={videoId}
                    video={video}
                    videoId={videoId}
                    channelThumb={channelThumb}
                    onSelect={handleVideoSelect}
                  />
                );
              })}
            </div>
          </>
        ) : null}

        {searchQuery && nextPageToken ? (
          <div className="load-more-container">
            <button
              type="button"
              className="load-more-button"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading more..." : "Load more results"}
            </button>
          </div>
        ) : null}
      </div>

      <NotesModal
        isOpen={Boolean(selectedVideoId)}
        loading={loading}
        notes={notes}
        videoId={selectedVideoId}
        currentUserId={currentUserId}
        videoRatings={videoRatings}
        onClose={handleCloseNotes}
      />
    </div>
  );
}