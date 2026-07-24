type YouTubeVideo = {
  id: string | { videoId: string };
  snippet: {
    title: string;
    channelTitle?: string;
    channelId?: string;
    thumbnails?: {
      medium?: { url?: string };
    };
  };
};

type VideoCardProps = {
  video: YouTubeVideo;
  videoId: string;
  channelThumb?: string;
  onSelect: (videoId: string) => void;
};

export default function VideoCard({
  video,
  videoId,
  channelThumb,
  onSelect,
}: VideoCardProps) {
  return (
    <div
      className="video-card"
      onClick={() => onSelect(videoId)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(videoId);
        }
      }}
    >
      <div className="video-card-header">
        <h3>{video.snippet.title}</h3>
      </div>

      <div className="video-media">
        <div className="video-creator">
          {channelThumb && (
            <img
              src={channelThumb}
              alt={video.snippet.channelTitle ?? "Creator"}
              className="creator-avatar"
            />
          )}
          <span className="creator-name">{video.snippet.channelTitle}</span>
        </div>

        {video.snippet.thumbnails?.medium?.url && (
          <img
            src={video.snippet.thumbnails.medium.url}
            alt={video.snippet.title}
            className="video-thumbnail"
          />
        )}

        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="video-link"
          onClick={(event) => event.stopPropagation()}
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}
