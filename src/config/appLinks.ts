/*
 * Mobile app store links & availability.
 *
 * iOS is LIVE on the App Store; Android (Google Play) is coming soon.
 * Paste the real App Store URL below so the badge links to your listing.
 */
export const APP_STORE_URL = 'https://apps.apple.com/us/app/ai-health-scan/id6740406583';
export const GOOGLE_PLAY_URL = ''; // set when the Android app goes live

// Per-platform availability (controls "Download" vs "Coming soon" on each badge)
export const APP_STORE_AVAILABLE = true;    // live on iOS
export const GOOGLE_PLAY_AVAILABLE = false; // Android coming soon

/** True when at least one platform is live. */
export const APP_IS_LIVE: boolean = APP_STORE_AVAILABLE || GOOGLE_PLAY_AVAILABLE;
