// import React from 'react';
import '../styles/HomePage.css';
import { Images } from '../assets/images';

export default function HomePage(){

    const SeeAll = (section: string) => {
        console.log(`Opening all for ${section}`);
    }

    const ItemClick = (detail: string) => {
        console.log(`Opening item: ${detail}`);
    }


    return(
        <div className="home-container"> 
            <h1 id='dashboard-title'>Notes Dashboard</h1>
            <hr className='note-dash'/>
            <div id="dashboard-box">

                {/* Friends' Activity */}

                <div className="db-box">
                    <div className="activity-text"> 
                        <div className="sep">
                            <h2 id='activity-subt'>Friend's Actitvity</h2>
                            <p id='activity-note'> What your frineds are watching & learning</p>
                        </div>
                        
                        <h3 id='expand-all' onClick={() => SeeAll('activity')}>See all → </h3>
                        
                    </div>
                    
                    <hr className='dash-line'/>

                    <div id="activity-box">
                        <div className="act-box" onClick={() => ItemClick('activity-1')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="act-box" onClick={() => ItemClick('activity-2')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="act-box" onClick={() => ItemClick('activity-3')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="act-box"onClick={() => ItemClick('activity-4')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                    </div>
                </div>

                <hr className='dash-line-end'/>

                {/* Trending in your Network */}

                <div className="db-box">
                     <div className="trend-text"> 
                        <div className="sep">
                            <h2 id='trend-subt'>Trending in Your Network</h2>
                            <p id='trend-note'> Most liked by people you fellow this week</p>
                        </div>
                        <h3 id='tr-expand-all' onClick={() => SeeAll('trending')}>See all → </h3>
                        
                    </div>

                    <hr className='dash-line'/>


                    <div id="trend-box">
                        <div className="tre-box" onClick={() => ItemClick('trend-1')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="tre-box" onClick={() => ItemClick('trend-2')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="tre-box" onClick={() => ItemClick('trend-3')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="tre-box" onClick={() => ItemClick('trend-4')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                    </div>


                </div>

                <hr className='dash-line-end'/>


                {/* Suggested for you */}

                <div className="db-box">
                    <div className="suggest-text"> 
                        <div className="sep">
                            <h2 id='suggest-subt'>Suggested for you</h2>
                            <p id='suggest-note'> Based on your saved notes</p>
                        </div>
                        <h3 id='sug-expand-all' onClick={() => SeeAll('suggested')}>See all → </h3>
                    </div>

                    <div id="suggest-box">
                        <div className="sug-box" onClick={() => ItemClick('suggest-1')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="sug-box" onClick={() => ItemClick('suggest-2')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="sug-box" onClick={() => ItemClick('suggest-3')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                        <div className="sug-box" onClick={() => ItemClick('suggest-4')}>
                            <p>Detail on the video... </p>
                            <div><img src={Images.placeholder} alt="placeholder" /></div>
                        </div>
                    </div>



                </div>

            </div>
        
        
        
        
        
        
        </div>

    );
}
