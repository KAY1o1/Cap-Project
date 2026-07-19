import { useEffect, useState } from 'react';
import {supabase} from '../lib/supabase'
import '../styles/FriendsList.css';
import { Images } from '../assets/images';


interface FriendProfile{
    id: string;
    name: string;
    pfpUrl: string;
    notes_count: number;
}


const FriendsList = () => {

    const [friends] = useState<FriendProfile[]>()

    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
          
        };
    });


    return(
        <div className="friends">
            <div className="friend_card">
                <img src={Images.placeholder} alt="placeholder" />
                <h3>UserName</h3>
                <p>Number of Notes</p>

            </div>



        </div>

    );

};

export default FriendsList;


