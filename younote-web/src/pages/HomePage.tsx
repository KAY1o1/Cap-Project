import '../styles/HomePage.css';
import { Images } from '../assets/images';
import { useState, useEffect } from 'react';
import {supabase} from '../lib/supabase';
import { renderSection } from '../components/help';


type VideoItem = {
    id: string;
    title: string;
    youtube_video_id: string;
    creator?: string;
    created_at: string;

};


type RecentItem ={
    id:string;
    profile_id: string;
    video_id: string;
    content: string;
    created_at?:string;
    video?: VideoItem[];
    
};

type TrendItem = {
    id: string;
    title: string;
    youtube_video_id: string;

}

type RatingItem ={
    profile_id: string;
    video_id: string;
    rating: number;
    created_at?: string;
    video?: VideoItem[];

}


export default function HomePage(){

    const [activities, setActivities] =  useState<RecentItem[]>([]);
    const [trends, setTrends] =  useState<TrendItem[]>([]);
    const [ratings, setRatings] =  useState<RatingItem[]>([]);
    const [loading, setLoading] =  useState(true);

    const SeeAll = (type: string) =>{
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

    const getThumb = (video:any) =>
        video?.youtube_video_id ? `...` : Images.placeholder;

    if(loading){
        return <div className='home-container'><h3>Loading...</h3></div>
    }

    return(
       <div className="home-container">
            <h1 id='dashboard-title'>Notes Dashboard</h1>
            <hr className='note-dash' />
            <div id="dashboard-box">

                {/* 1. Recent Activity Section */}
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

                {/* 2. Trending Section */}
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

                {/* 3. Ratings Section */}
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
                            <p>{item.rating}</p>
                            <div><img src={getThumb(item.video)} alt="thumbnail" /></div>
                        </div>
                    )
                })}

            </div>
        </div>
    );
}
//         <div className="home-container"> 
//             <h1 id='dashboard-title'>Notes Dashboard</h1>
//             <hr className='note-dash'/>
//             <div id="dashboard-box">

//                 {/* Recent Activity */}

//                 <div className="db-box">
//                     <div className="activity-text"> 
//                         <div className="sep">
//                             <h2 id='activity-subt'>Recent Activity</h2>
//                             <p id='activity-note'> What you are currently watching & learning</p>
//                         </div>
                        
//                         <h3 id='expand-all' className='see-all-link' onClick= {() => SeeAll('activity')} >See all → </h3>
                        
//                     </div>
                    
//                     <hr className='dash-line'/>

//                     <div className="activity-box">
//                         {activities.length > 0 ?(
//                             activities.map((item) => (
//                                 <div key={item.id} className='act-box' onClick={() => ItemClick(item.video_id)}>
//                                     <p>{item.content}</p>
//                                     <div>
//                                         <img src={item.video?.thumbnail_url || Images.placeholder} alt={item.video?.title || "thumbnail"} />
//                                     </div>
//                                 </div>
//                             ))
//                         ):(
//                             [1,2,3,4].map((i) => (
//                                 <div key={i} className='act-box' onClick={() => ItemClick(`~${i}~`)}>
//                                     <p>No Notes...</p>
//                                     <div><img src={Images.placeholder} alt="placeholder" /></div>
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>    

//                 <hr className='dash-line-end'/>

//                 {/* Trending in your Network */}

//                 <div className="db-box">
//                      <div className="trend-text"> 
//                         <div className="sep">
//                             <h2 id='trend-subt'>Trends</h2>
//                             <p id='trend-note'> Interesting categories to explore</p>
//                         </div>
//                         <h3 id='tr-expand-all' className='see-all-link' onClick={() => SeeAll('trending')}>See all → </h3>
                        
//                     </div>

//                     <hr className='dash-line'/>

//                     <div id="trend-box">
//                         {trends.length > 0 ? (
//                             trends.map((item) => (
//                                 <div key={item.id} className='tre-box' onClick={() => ItemClick(item.id)}>
//                                     <p>{item.title}</p>
//                                     <div><img src={item.thumbnail_url || Images.placeholder} alt="trend snapshot" /></div>
//                                 </div>
//                             ))
//                         ):(
//                             [1,2,3,4].map((i) => (
//                                 <div key={i} className='tre-box' onClick={() => ItemClick(`~${i}~`)}>
//                                     <p>...</p>
//                                     <div><img src={Images.placeholder} alt="placeholder" /></div>
//                                 </div>
//                             ))
//                         )}
                       
//                     </div>
//                 </div>

//                 <hr className='dash-line-end'/>


//                 {/* Rating */}

//                 <div className="db-box">
//                     <div className="suggest-text"> 
//                         <div className="sep">
//                             <h2 id='suggest-subt'>Your Ratings</h2>
//                             <p id='suggest-note'> Your ratings on various videos</p>
//                         </div>
//                         <h3 id='sug-expand-all' className='see-all-link' onClick={() => SeeAll('suggested')}>See all → </h3>
//                     </div>

//                     <div id="suggest-box">
//                         {ratings.length > 0 ? (
//                             ratings.map((item) => (
//                                 <div key={item.id} className='sug-box' onClick={() => ItemClick(item.video_id)}>
//                                     <p>{item.rating}</p>
//                                     <div>
//                                         <img src={item.video?.thumbnail_url || Images.placeholder} alt={item.video?.title || "thumbnail"} />
//                                     </div>
//                                 </div>
//                             ))
//                         ):(
//                             [1,2,3,4].map((i) => (
//                                 <div key={i} className='sug-box' onClick={() => ItemClick(`~${i}~`)}>
//                                     <p>No Rating</p>
//                                     <div><img src={Images.placeholder} alt="placeholder" /></div>
//                                 </div>
//                             ))
//                         )}
//                     </div>



//                 </div>

//             </div>
        
        
//         </div>

//     );
// }
