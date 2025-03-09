# Supabase Spotify OAuth Setup Guide

This guide will help you enable and configure the Spotify OAuth provider in your Supabase project.

## Steps to Enable Spotify OAuth in Supabase

1. **Log in to your Supabase Dashboard**
   - Go to https://supabase.com and log in to your account
   - Select your project (URL: https://hiagslphkigebtdxayco.supabase.co)

2. **Navigate to Authentication Settings**
   - In the left sidebar, click on "Authentication"
   - Then click on "Providers"

3. **Enable and Configure Spotify Provider**
   - Find "Spotify" in the list of OAuth providers
   - Toggle the switch to enable it
   - Enter your Spotify credentials:
     - Client ID: `29fa231ee64c46949c6bf3ed275ed3ac`
     - Client Secret: `fd62837060e6409a8b77a1c16c21cd14`
   - Note: The Callback URL is automatically set to `https://hiagslphkigebtdxayco.supabase.co/auth/v1/callback` and cannot be changed
   - Click "Save" to apply the changes

4. **Configure Spotify Developer App Settings**
   - Go to https://developer.spotify.com/dashboard
   - Log in and select your app
   - Add the following Redirect URI: `https://hiagslphkigebtdxayco.supabase.co/auth/v1/callback`
   - Save the changes

5. **Test the Authentication**
   - Return to your application
   - Click the "Connect with Spotify" button
   - You should now be redirected to Spotify for authentication
   - After authenticating, you should be redirected back to your application's callback page and then to the dashboard

## Troubleshooting

If you encounter any issues:

1. **Check Console Errors**
   - Open your browser's developer tools (F12)
   - Look for any errors in the Console tab

2. **Verify Environment Variables**
   - Make sure your `.env.local` file has the correct values:
     ```
     NEXT_PUBLIC_SPOTIFY_CLIENT_ID=29fa231ee64c46949c6bf3ed275ed3ac
     SPOTIFY_CLIENT_SECRET=fd62837060e6409a8b77a1c16c21cd14
     SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
     ```

3. **Check Supabase Logs**
   - In the Supabase dashboard, go to "Authentication" > "Logs"
   - Look for any authentication errors

4. **Restart the Development Server**
   - Sometimes, you need to restart your Next.js server after making changes
   - Stop the server (Ctrl+C) and run `npm run dev` again 