import '../styles/HomePage.css';
import { Images } from '../assets/images';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { renderSection } from '../components/help';
import type { Session } from '@supabase/supabase-js';

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
    video?: VideoItem[] | VideoItem; // Handles both object and single-element array formats
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
    video?: VideoItem[] | VideoItem; // Handles both object and single-element array formats
};

interface homeP {
    session: Session | null;
}

export default function HomePage() {
    const [activities, setActivities] = useState<RecentItem[]>([]);
    const [trends, setTrends] = useState<TrendItem[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [loading, setLoading] = useState(true);
    

    const SeeAll = (type: string) => {
        console.log(`see all ${type}`);
    };
    const ItemClick = (id: string) => {
        console.log(`Item: ${id}`);
    };


        useEffect(() => {
        const fetchContent = async()=>{
            try{
                setLoading(true);

                const{data:{user}} = await supabase.auth.getUser();
                if(!user) return;

                
                const[activity, trend, rating] = await Promise.all([
                    supabase
                    .from("notes")
                    .select(`id, profile_id, video_id, content, created_at, video:videos(id, title, youtube_video_id)`)
                    .eq("profile_id", user.id)
                    .order("created_at",{ascending:false})
                    .limit(4),

                    supabase
                    .from("videos")
                    .select("id, title, youtube_video_id")
                    .limit(5),

                    supabase
                    .from("video_ratings")
                    .select(`profile_id, video_id, rating, created_at, video:videos(id, title, youtube_video_id)`)
                    .eq("profile_id", user.id)
                    .order("created_at", {ascending: false})
                    .limit(4),

                ]);

                setActivities((activity.data as RecentItem[]) || []);
                setTrends((trend.data as TrendItem[]) || []);
                setRatings((rating.data as unknown as RatingItem[]) || []);
                
            

            }catch (error){
                setActivities([]);
                setTrends([]);
                setRatings([]);

            }finally{
                setLoading(false);
            }
        };
        fetchContent();

    }, []);
 


    const getThumb = (videoWrapper: any) => {
       
        const actualVideo = Array.isArray(videoWrapper) ? videoWrapper[0] : videoWrapper;
        return actualVideo?.youtube_video_id 
            ? `...` 
            : Images.placeholder;
    };

    if (loading) {
        return <div className='home-container'><h3>Loading application context...</h3></div>;
    }

    return (
        <div className="home-container">
            <h1 id='dashboard-title'>Notes Dashboard</h1>
            
{/*             
            {!activeSession && (
                <div style={{ padding: '12px', textAlign: 'center', background: '#fff3cd', color: '#856404', borderRadius: '4px', margin: '15px 0' }}>
                    <strong>Extension Sync Pending:</strong> Please log in to your video tool extension to display your tracking rows.
                </div>
            )} */}
            
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

