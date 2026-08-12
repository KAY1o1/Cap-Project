/*
manages authentication for the extension. 
It lets users log in with Google, log out.
lets the React UI know whether a user is logged in and what their email is
*/


import { useEffect, useState } from "react";
import { supabase } from "./supabase";


export async function login(): Promise<void>
{
  const response = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://www.youtube.com/",
      skipBrowserRedirect: true,
    },
  });

  const data = response.data;

  if (data === null || data === undefined || data.url === null || data.url === undefined)
  {
    return;
  }

  window.open(data.url, "_blank");
}


export async function logout(): Promise<void>
{
  await supabase.auth.signOut();
}


export function useSession(): string | null 
{
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() =>
  {
    const refreshSessionData = async () => {
 
      const allStoredData = await chrome.storage.local.get(null);
      const allKeys: string[] = Object.keys(allStoredData);

      let authTokenKey: string | null = null;
 
      for (let i = 0; i < allKeys.length; i++)
      {
        const key = allKeys[i];
      
        if (key.endsWith("-auth-token") === true) {
          authTokenKey = key;
          break;
        }
      }

      if (authTokenKey !== null)
      {
        try
        {
          const rawValue = allStoredData[authTokenKey];
          const parsedData = JSON.parse(rawValue as string);
          
          const userEmail = parsedData.user.email;
          
          setEmail(userEmail);
        } 
        catch (error: any)
        {
          setEmail(null);
        }
      } 
      else
      {
        setEmail(null);
      }
    };


    refreshSessionData();

    // listen for changes
    chrome.storage.onChanged.addListener(refreshSessionData);

    // cleanup listener when component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(refreshSessionData);
    };
  }, []);

  return email;
}