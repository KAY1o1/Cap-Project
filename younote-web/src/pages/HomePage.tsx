import '../styles/HomePage.css';
import { Images } from '../assets/images';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { renderSection } from '../components/help';


type VideoItem = {
    id: string;
    title: string;
    youtube_video_id: string;
    creator?: string;
    created_at: string;
};

type RecentItem = {
    id: string;
    profile_id: string;
    video_id: string;
    content: string;
    created_at?: string;
    timestamp_seconds?: number;
    video?: VideoItem[] | VideoItem;
};

type TrendItem = {
    id: string;
    title: string;
    youtube_video_id: string;
};

type RatingItem = {
    profile_id: string;
    video_id: string;
    rating: number;
    created_at?: string;
    video?: VideoItem[] | VideoItem;
};

type HomePageP = {
    setPage: (page: 'home' | 'notes') => void;
};

export default function HomePage({ setPage }: HomePageP) {
    const [activities, setActivities] = useState<RecentItem[]>([]);
    const [trends, setTrends] = useState<TrendItem[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);

    const SeeAll = (type: string) => {
        if (type === 'activity' || type === 'trend' || type === 'suggest') {
            setPage('notes');
        }
    };


    const ItemClick = (id: string) => {
        console.log(`Item: ${id}`);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchContent = async () => {
            try {
                setLoading(true);


                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    if (isMounted) {
                        setHasUser(false);
                        setLoading(false);
                    }
                    return;
                }

                if (isMounted) setHasUser(true);


                const [activity, trend, rating] = await Promise.all([
                    supabase
                        .from("notes")
                        .select(`id, profile_id, video_id, content, created_at, timestamp_seconds, video:videos!video_id(id, title, youtube_video_id, creator)`)
                        .eq("profile_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(4),

                    supabase
                        .from("videos")
                        .select("id, title, youtube_video_id")
                        .limit(5),

                    supabase
                        .from("video_ratings")
                        .select(`profile_id, video_id, rating, created_at, video:videos!video_id(id, title, youtube_video_id, creator)`)
                        .eq("profile_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(4),
                ]);

                if (isMounted) {
                    setActivities((activity.data as RecentItem[]) || []);
                    setTrends((trend.data as TrendItem[]) || []);
                    setRatings((rating.data as unknown as RatingItem[]) || []);
                }
            } catch (error) {
                console.error("Error loading dashboard metrics:", error);
                if (isMounted) {
                    setActivities([]);
                    setTrends([]);
                    setRatings([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchContent();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchContent();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const getThumb = (videoWrapper: any) => {
        if (!videoWrapper) return Images.placeholder;

        const actualVideo = videoWrapper.youtube_video_id ? videoWrapper
            : (Array.isArray(videoWrapper) ? videoWrapper[0] : videoWrapper);

        const videoId = actualVideo?.youtube_video_id;

        return videoId
            ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            : Images.placeholder;
    };

    if (loading) {
        return (
            <div className='home-container'>
                <h3>Loading...</h3>
            </div>
        );
    }


    if (!hasUser) {
        return (
            <div className='home-container' style={{ textAlign: 'center', paddingTop: '60px' }}>
                <p>Sign into the extension and click <strong>"View All Notes"</strong> </p>
            </div>
        );
    }

    return (
        <div className="home-container">
            <h1 id='dashboard-title'>Notes Dashboard</h1>
            <hr className='note-dash' />

            <div id="dashboard-box">

                {/* Recent Activity Section */}
                {renderSection({
                    title: "Recent Activity",
                    subtitle: "What you are currently watching & learning",
                    typeKey: "activity",
                    items: activities,
                    emptyText: "No Notes...",
                    onSeeAll: SeeAll,
                    onItemClick: ItemClick,
                    placeholderImage: Images.placeholder,
                    renderItem: (item) => {

                        let videoData: VideoItem | null = null;
                        if (item.video) {
                            videoData = Array.isArray(item.video) ? item.video[0] : item.video;
                        }

                        const titleText = videoData?.title || "Title";
                        const creatorText = videoData?.creator || "Creator";

                        const formatVideoTimestamp = (totalSeconds: number | undefined) => {
                            if (totalSeconds === undefined || totalSeconds === null) return null;

                            const hrs = Math.floor(totalSeconds / 3600);
                            const mins = Math.floor((totalSeconds % 3600) / 60);
                            const secs = Math.floor(totalSeconds % 60);

                            const paddedSecs = secs.toString().padStart(2, '0');

                            if (hrs > 0) {
                                const paddedMins = mins.toString().padStart(2, '0');
                                return `${hrs}:${paddedMins}:${paddedSecs}`;
                            }

                            return `${mins}:${paddedSecs}`;
                        };

                        const videoTimeMarker = formatVideoTimestamp(item.timestamp_seconds);

                        return (

                            <div key={item.id} className='act-box' onClick={() => ItemClick(item.video_id)}>
                                <div className="act-details">

                                    <h5 className="act-video-title" style={{ fontSize: '11px' }}>{titleText}</h5>
                                    <p className="act-video-creator" style={{ fontSize: '10px' }}>by {creatorText}</p>

                                    <hr className='dash-ra' />

                                    <p className="act-content" style={{ fontSize: '12px' }}>"{item.content}"</p>

                                    {videoTimeMarker && <span className="act-video-time" style={{ fontSize: '11px' }}> <strong>{videoTimeMarker}</strong> </span>}
                                </div>
                                <div className="act-thumb-container">
                                    <img src={getThumb(item.video)} alt="thumbnail" />
                                </div>
                            </div>

                        );
                    }
                })}

                <hr className='dash-line-end' />

                {/* Trending Section */}
                {renderSection({
                    title: "Trends",
                    subtitle: "Take a look at what others watched",
                    typeKey: "trend",
                    items: trends,
                    emptyText: "Nothing Trending at the moment",
                    onSeeAll: SeeAll,
                    onItemClick: ItemClick,
                    placeholderImage: Images.placeholder,
                    renderItem: (item) => (
                        <a 
                        key={item.id} 
                        href={`https://www.youtube.com/watch?v=${item.youtube_video_id}`}
                        style={{ textDecoration: 'none', color: 'inherit', textDecorationLine: 'none' }}
                        >
                            <div className='tre-box' onClick={() => ItemClick(item.id)}>
                                <p>{item.title}</p>
                                <div><img src={getThumb(item)} alt="trend snapshot" /></div>
                            </div>
                        </a>
                    )
                })}

                <hr className='dash-line-end' />

                {/* Ratings Section */}
                {renderSection({
                    title: "Your Ratings",
                    subtitle: "Your ratings on various videos",
                    typeKey: "suggest",
                    items: ratings,
                    emptyText: "No Rating",
                    onSeeAll: SeeAll,
                    onItemClick: ItemClick,
                    placeholderImage: Images.placeholder,
                    renderItem: (item) => {

                        let videoData: VideoItem | null = null;
                        if (item.video) {
                            videoData = Array.isArray(item.video) ? item.video[0] : item.video;
                        }

                        const titleText = videoData?.title || "Title";
                        const creatorText = videoData?.creator || "Creator";

                        return (
                            <div key={`${item.profile_id}-${item.video_id}`} className='sug-box' onClick={() => ItemClick(item.video_id)}>

                                <div className="act-details">
                                    <h5 className="sug-video-title" style={{ fontSize: '11px' }}>{titleText}</h5>
                                    <p className="sug-video-creator" style={{ fontSize: '10px' }}>by {creatorText}</p>

                                    <p>Rating: {item.rating}/5 {"✏️".repeat(Math.max(0, Math.min(5, Math.floor(item.rating))))}</p>
                                </div>

                                <div className="sug-thumb-container">
                                    <div><img src={getThumb(item.video)} alt="thumbnail" /></div>
                                </div>
                            </div>
                        )
                    }
                })}
            </div>
        </div >
    );
}