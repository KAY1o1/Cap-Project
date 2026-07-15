// import React from 'react';
import '../styles/HomePage.css';
import { Images } from '../assets/images';

export default function HomePage(){
    return(
        <div className="home-container"> 
            <h1 id='dashboard-title'>Notes Dashboard</h1>
            <hr className='dash-line'/>
            <div id="dashboard-box">
                <div className="db-box">
                    <div className="activity-text"> 
                        <h2 id='activity-subt'>Friend's Actitvity</h2>
                        <h3 id='activity-note'> What your frineds are watching & learning</h3>
                        <h3 id='expand-all'>See all → </h3>
                    </div>

                    <hr className='dash-line'/>

                    {/* Friends' Activity */}

                    <div id="activity-box">
                        <div className="act-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                        <div className="act-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                        <div className="act-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                        <div className="act-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                    </div>
                </div>

                <hr className='dash-line'/>

                {/* Trending in your Network */}

                <div className="db-box">


                </div>

                <hr className='dash-line'/>

                {/* Suggested for you */}

                <div className="db-box">
                    <div className="suggest-text"> 
                        <h2 id='suggest-subt'>Suggested for you</h2>
                        <h3 id='suggest-note'> Based on your saved notes</h3>
                        <h3 id='sug-expand-all'>See all → </h3>
                    </div>

                    <div id="suggest-box">
                        <div className="sug-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                        <div className="sug-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                        <div className="sug-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                        <div className="sug-box">
                            <p>Detail on the video... </p>
                            <img src={Images.placeholder} alt="placeholder" />
                        </div>
                    </div>



                </div>

            </div>
        
        
        
        
        
        
        </div>

    );
}
