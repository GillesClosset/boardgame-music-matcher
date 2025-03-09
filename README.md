# Board Game Music Matcher

A web application that creates Spotify playlists tailored to board games and your mood. Connect your Spotify account, search for a board game, adjust your mood settings, and get a perfectly matched playlist to enhance your gaming experience.

## Features

- **Board Game Search**: Find any board game using the BoardGameGeek database
- **Mood Customization**: Adjust energy levels, emotional tone, and other parameters
- **Spotify Integration**: Connect your Spotify account to create and play playlists
- **Playlist Generation**: Automatically generate playlists based on game attributes and mood
- **Playback Controls**: Control playback directly from the app
- **Playlist History**: View and replay previously generated playlists
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend & API**: Next.js (React framework)
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **Hosting**: Vercel
- **UI Components**: Material-UI (MUI)
- **State Management**: React Query
- **External APIs**: Spotify Web API, BoardGameGeek API

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Spotify Developer Account
- Supabase Account

### Setup Instructions

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/boardgame-music-matcher.git
   cd boardgame-music-matcher
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in the required environment variables:
     - Supabase URL and Anon Key
     - Spotify Client ID and Secret

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL scripts in the `supabase` directory to set up the database schema
   - Enable Spotify OAuth in the Supabase Auth settings

5. **Set up Spotify Developer App**
   - Create a new app in the Spotify Developer Dashboard
   - Add `http://localhost:3000/api/auth/callback` as a redirect URI
   - Copy the Client ID and Client Secret to your `.env.local` file

6. **Run the development server**
   ```
   npm run dev
   ```

7. **Open the application**
   - Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- BoardGameGeek for their comprehensive board game database
- Spotify for their excellent API and SDK
- The open-source community for all the amazing tools and libraries
