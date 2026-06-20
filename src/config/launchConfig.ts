/*
 * Single source of truth for the launch date / countdown.
 *
 * IMPORTANT: update LAUNCH_DATE_ISO to the real launch moment. If this date is
 * in the past and the app is NOT yet live, the UI degrades gracefully to a
 * "Launching soon" state — it will never falsely tell visitors the app is live
 * with nothing to download.
 */
import { APP_IS_LIVE } from './appLinks';

// 9pm CEST = 8pm UTC. Change this to the real launch date.
export const LAUNCH_DATE_ISO = '2026-03-21T20:00:00Z';

export const LAUNCH_LABEL = 'Mar 21, 2026';

export function getLaunchTime(): number {
  return new Date(LAUNCH_DATE_ISO).getTime();
}

/**
 * True only when the launch moment has passed AND the app is actually live
 * (i.e. real store links are configured). Prevents the "we're Live!" message
 * from showing while there's nothing to download.
 */
export function hasLaunched(now: number = Date.now()): boolean {
  return now >= getLaunchTime() && APP_IS_LIVE;
}

/** Countdown reached zero but the app isn't live yet. */
export function isAwaitingLaunch(now: number = Date.now()): boolean {
  return now >= getLaunchTime() && !APP_IS_LIVE;
}
