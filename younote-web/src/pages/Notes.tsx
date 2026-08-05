import { useEffect, useState, type FormEvent } from "react";
import type { SingleValue } from "react-select";
import NotesModal from "../components/NotesModal";
import VideoCard from "../components/VideoCard";
import VideoSearchBar from "../components/VideoSearchBar";
import { useYouTubeVideos } from "../hooks/useYouTubeVideos";
import "../styles/Notes.css";
// Added Supabase import
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
  videos?: { youtube_video_id: string };
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
      //Check if Supabase client knows we are logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log(
        "[Notes Debug] Current Session:",
        session ? "Logged In" : "NOT Logged In",
      );

      //Check if the video exists in the videos table
      const { data: videoData } = await supabase
        .from("videos")
        .select("*")
        .eq("youtube_video_id", videoId);
      console.log("[Notes Debug] Video in DB?", videoData);

      //Fetch the notes using the Supabase Client (handles auth automatically!)
      const { data, error } = await supabase
        .from("notes")
        .select(
          "id, content, created_at, video_id, is_private, videos!inner(youtube_video_id)",
        )
        .eq("videos.youtube_video_id", videoId);

      if (error) {
        console.error(`[Notes] Supabase Fetch Error:`, error.message);
        throw error;
      }

      console.log("[Notes] Raw data returned from Supabase:", data);

      // Update state with our returned notes
      // Force TypeScript to map the Supabase response to your NoteItem type
      setNotes((data as unknown as NoteItem[]) || []);
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
    // When the search query changes, reset notes array
    setNotes([]);
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
        videoId={selectedVideoId}
        onClose={handleCloseNotes}
      />
    </div>
  );
}
