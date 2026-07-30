# Privacy Policy

*Last updated: 07-27-2026*

YouNote is a social note-taking browser extension and web application designed to encourage mindful media consumption on YouTube. Everyday Americans spend upwards of 7 hours on media consumption daily, and yet chances are they can barely remember the details of what they watched. YouNote addresses this problem by allowing users to capture reflections, notes, and insights directly as they watch YouTube videos. Additionally, by combining note-taking with social interaction, YouNote encourages users to share meaningful content and insights with others. 

We are committed to keeping your data secure.

## Permissions Required

To function as intended, YouNote requires the following browser permissions:

- **storage**,to remember whether the extension is turned on and to store locally on your device.
- **Access to youtube.com**, to display the notes panel on YouTube's watch pages, read the current video's title and creator name (so notes can be organized by video), and control video playback when you jump to a note's timestamp.

These permissions are used to power the extension's core features on the page you're viewing; they are not used to track browsing outside of YouTube.

## Data Collection

YouNote requires you to sign in with Google before you can take notes or rate videos. Browsing YouTube with the extension installed but not signed in does not collect or transmit any data.

**Signed in with Google (via Supabase Auth):** to save and sync your notes, you sign in with your Google account. We use Supabase, a third-party backend provider, to handle authentication and store your data. Signing in with Google is required to use YouNote's note-taking features.

When you sign in, Supabase Auth stores:

- **Name and profile picture**, your display name and avatar URL, as provided by your Google account.
- **Email address**, including whether Google has verified it - used to identify your account and the notes/ratings associated with it.
- **Google account identifier**, a unique ID Google assigns to your account (not your email), used to link your Google sign-in to your YouNote account.
- **Authentication provider**, a record that you signed in via Google.
- **Account creation timestamp**, **last sign-in timestamp**, and **last-updated timestamp** (recorded in GMT).

We do not collect your phone number; this field exists in our authentication provider's database but is never populated, since YouNote only supports signing in with Google.

In addition, our application stores:

- **Your notes**, the text you write, the video timestamp it's attached to, and whether you've marked it private or public.
- **Video metadata**, the title and creator of videos you take notes on, so your notes can be organized and displayed against the right video.
- **Video ratings**, the star rating (1–5) you optionally give a video, tied to your account and that video.
- **Record timestamps**, when each note, rating, or profile was created or last updated.

**Public vs. private notes:** notes marked private are visible only to you. Notes marked public are visible to other signed-in YouNote users viewing the same video. This is enforced both in the app and at the database level (row-level security), so public visibility only ever applies to notes you've explicitly marked public.

We do not store:

- Your general YouTube or browsing history
- Videos you've watched but haven't taken notes on
- Any personally identifiable usage behavior beyond the notes and ratings you create

## Data Processing Without Collection

Some information is used locally on your device but never transmitted to our servers:

- **Extension on/off state**, stored locally via the browser's `storage` API.
- **Draft note text**, while you're typing a note, before you submit it.

## Third-Party Services

YouNote relies on the following third-party providers to operate:

- **Google**, for signing in via OAuth. We only receive the account details Google shares upon sign-in (e.g., email); we do not receive your Google password.
- **Supabase**, our backend provider, used to authenticate users and store notes, video metadata, and ratings. All communication with Supabase is encrypted via HTTPS.

We do not sell, rent, or share your data with third parties for advertising or marketing purposes.

## User Control

You retain full control over your data:

- Use YouNote without an account for a local-only experience (no note-taking, no data collected).
- Sign out at any time from the popup.
- Delete individual notes at any time from the notes panel.
- Request deletion of your account and all associated data by contacting us (see below).

## Updates to This Policy

We may update this policy as the extension evolves. Changes will be posted here with a new effective date.

## Contact

For questions or concerns, or to request account/data deletion, please contact: nbaulib[at]gmail[dot]com
