"use client";

import { useEffect } from 'react';
import supabase from './supabase';

/**
 * This hook ensures that the Supabase auth configuration is properly set up
 * It should be used in the root layout or a top-level component
 */
export function useAuthConfig() {
  useEffect(() => {
    // Configure Supabase auth
    const configureAuth = async () => {
      try {
        // Set the auth flow to use the current URL as the site URL
        await supabase.auth.setSession({
          access_token: '',
          refresh_token: '',
        });
        
        console.log('Supabase auth configured');
      } catch (error) {
        console.error('Error configuring Supabase auth:', error);
      }
    };
    
    configureAuth();
  }, []);
  
  return null;
}

/**
 * Helper function to parse auth errors from the URL
 */
export function parseAuthError(url: string) {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const errorCode = params.get('error_code');
    
    if (error || errorDescription || errorCode) {
      return {
        error,
        errorDescription: errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : null,
        errorCode,
      };
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing URL for auth errors:', e);
    return null;
  }
} 