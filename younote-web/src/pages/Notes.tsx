import { useEffect, useState, type FormEvent } from "react";
import type { SingleValue } from "react-select";
import NotesModal from "../components/NotesModal";
import VideoCard from "../components/VideoCard";
import VideoSearchBar from "../components/VideoSearchBar";
import { useYouTubeVideos } from "../hooks/useYouTubeVideos";
import "../styles/Notes.css";

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
  videos?: { youtube_video_id: string }; // <-- Updated column name here
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
  // --- State: selection, inputs, and data ---
  const [selectedOption, setSelectedOption] =
    useState<SingleValue<Option>>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    videos: ytVid,
    nextPageToken,
    loadingMore,
    channelThumbs,
    fetchVideos,
  } = useYouTubeVideos(searchQuery);

  // --- Helpers ---
  const getVideoId = (video: YouTubeVideo) => {
    if (typeof video.id === "string") {
      return video.id;
    }

    return video.id.videoId;
  };

  // --- Handlers: selection and input actions ---
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

  const handleVideoSelect = async (videoId: string) => {
    console.log(`[Notes] Fetching notes for video ID: ${videoId}`);
    setSelectedVideoId(videoId);
    setLoading(true);

    try {
      const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
      if (!supabaseKey) {
        console.error("[Notes] Missing Supabase Key");
        setNotes([]);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notes?select=id,content,created_at,video_id,is_private,videos!inner(youtube_video_id)&videos.youtube_video_id=eq.${videoId}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      // --- NEW ERROR LOGGING LOGIC ---
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Notes] Supabase 400 Error Body:`, errorText);
        throw new Error(
          `Failed to fetch notes: ${response.status} ${response.statusText}`,
        );
      }
      // -------------------------------

      const data = (await response.json()) as NoteItem[];
      console.log("[Notes] Raw data returned from Supabase:", data);

      setNotes(data);
    } catch (error) {
      console.error("[Notes] Error fetching notes:", error);
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

  // --- Effects ---
  useEffect(() => {
    // When the search query changes, fetch fresh search results and notes.
    const fetchContent = async () => {
      try {
        setLoading(true);

        const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
        if (!supabaseKey) {
          setNotes([]);
          return;
        }

        setNotes([]);
      } catch (error) {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchContent();
  }, [searchQuery]);

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
        {!searchQuery ? (
          <p>
            Choose a tag or search generally to see the most-viewed long videos.
          </p>
        ) : ytVid.length === 0 ? (
          <p>No long videos found for this search.</p>
        ) : null}

        {ytVid.length > 0 ? (
          <div className="video-grid">
            {ytVid.map((video) => {
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
        ) : null}

        {nextPageToken ? (
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
        videoId={selectedVideoId} // <-- Pass the selected video ID here
        onClose={handleCloseNotes}
      />
    </div>
  );
}