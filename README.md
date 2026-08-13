# YouNote
Team Members: Camren Henderson, Mackayla Dangleben, Nico Bautista-Libreros, Xin(Sue) Sui

## Problem Statement
Everyday Americans spend upwards of seven hours on media consumption daily, and yet chances are they can barely remember the details of what they watched. YouNote addresses this problem by allowing users to write notes, save timestamps, and insights directly while watching YouTube videos.

## Tech Stack
- **TypeScript & React:** Frontend of both the extension and website.
- **WXT Framework:** Web Extension framework used to build and manage the Chrome/browser extension.
- **Vite**

- **Supabase:** PostgreSQL database storage, Row Level Security (RLS), and authentication.
- **Python & FastAPI:** Backend service handling key topic generator 

- **YouTube Data API v3 (Google Cloud):** Search videos, fetch channel thumbnails metadata, and videos with notes.
- **Vercel:** Deployment and hosting of the web dashboard and API environment variables.

## Setup

### Option 1: Pre-built Extension
1. Download `younote-extension.zip` from GitHub Actions.
    - Latest: https://github.com/KAY1o1/Cap-Project/actions/runs/31660795909 
2. Unzip the downloaded file.
3. Open Chrome or any Chromium-based browser
4. Go to `chrome://extensions/`.
5. Enable **Developer mode** using the toggle in the top-right corner.
6. Click **Load unpacked** and select the unzipped folder.


### Option 2: Local Development Setup

#### 1. Clone the Repository
```bash
git clone [https://github.com/KAY1o1/Cap-Project.git](https://github.com/KAY1o1/Cap-Project.git)
cd Cap-Project
```

#### 2. Set up environment
Rename both `.env.example` files to `.env` and fill with the correct values

### 3. Install and Run
```
(cd younote-web && npm run dev) & (cd younote-ex && npm run dev)
```

### 4. Load Extension
1. Open chrome or a chromium based browser
1. Go to `chrome://extensions/`
1. Turn on Developer mode (top right toggle)
1. Click **Load unpacked**
1. Select `younote-ex/.output/chrome-mv3-dev`
    - Note: You will need to show hidden file if `.output` isn't visible
        - Mac: Command + Shift + . (period)

## Features
#### Extension
1. Take time-stamped notes
1. Set notes to either public or private
1. Edit notes and delete notes
1. Rate vidoes from 1-5

#### Website
1. Re-visit old notes in the Notes page
    - Get a quick overview of your note using the Key Topic generator 
1. See the communities public notes on the explore page


## Demo
https://vimeo.com/1217853011
