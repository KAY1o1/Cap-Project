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

export default function HomePage() {
    const [activities, setActivities] = useState<RecentItem[]>([]);
    const [trends, setTrends] = useState<TrendItem[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);

    const SeeAll = (type: string) => {
        console.log(`see all ${type}`);
    };
    const ItemClick = (id: string) => {
        console.log(`Item: ${id}`);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchContent = async () => {
            try {
                setLoading(true);

                // 1. Authenticate user session passed over from the extension window
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    if (isMounted) {
                        setHasUser(false);
                        setLoading(false);
                    }
                    return;
                }

                if (isMounted) setHasUser(true);

                // 2. Fetch parallel dashboard resources
                const [activity, trend, rating] = await Promise.all([
                    supabase
                        .from("notes")
                        .select(`id, profile_id, video_id, content, created_at, video:videos(id, title, youtube_video_id)`)
                        .eq("profile_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(4),

                    supabase
                        .from("videos")
                        .select("id, title, youtube_video_id")
                        .limit(5),

                    supabase
                        .from("video_ratings")
                        .select(`profile_id, video_id, rating, created_at, video:videos(id, title, youtube_video_id)`)
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

        // 3. Re-fires automatically the instant window.postMessage updates the tokens in App.tsx
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchContent();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // FIXED: Resolves and compiles valid YouTube middle-quality preview assets
    const getThumb = (videoWrapper: any) => {
        if (!videoWrapper) return Images.placeholder;
        
        const actualVideo = Array.isArray(videoWrapper) ? videoWrapper[0] : videoWrapper;
        const videoId = actualVideo?.youtube_video_id;

        return videoId 
            ? `https://youtube.com{videoId}/mqdefault.jpg` 
            : Images.placeholder;
    };

    if (loading) {
        return (
            <div className='home-container'>
                <h3>Loading application context...</h3>
            </div>
        );
    }

    // ADJUSTED: Rephrased instructions to match your cross-window extension sync strategy
    if (!hasUser) {
        return (
            <div className='home-container' style={{ textAlign: 'center', paddingTop: '60px' }}>
                <h3>Extension Sync Pending</h3>
                <p>Please click <strong>"View All Notes"</strong> inside your browser extension popup window to securely sync your dashboard view profiles.</p>
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
                    renderItem: (item) => (
                        <div key={item.id} className='act-box' onClick={() => ItemClick(item.video_id)}>
                            <p>{item.content}</p>
                            <div><img src={getThumb(item.video)} alt="thumbnail" /></div>
                        </div>
                    )
                })}

                <hr className='dash-line-end' />

                {/* Trending Section */}
                {renderSection({
                    title: "Trends",
                    subtitle: "Interesting categories to explore",
                    typeKey: "trend",
                    items: trends,
                    emptyText: "...",
                    onSeeAll: SeeAll,
                    onItemClick: ItemClick,
                    placeholderImage: Images.placeholder,
                    renderItem: (item) => (
                        <div key={item.id} className='tre-box' onClick={() => ItemClick(item.id)}>
                            <p>{item.title}</p>
                            <div><img src={getThumb(item)} alt="trend snapshot" /></div>
                        </div>
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
                    renderItem: (item) => (
                        <div key={`${item.profile_id}-${item.video_id}`} className='sug-box' onClick={() => ItemClick(item.video_id)}>
                            <p>Rating: {item.rating} ✏️</p>
                            <div><img src={getThumb(item.video)} alt="thumbnail" /></div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
