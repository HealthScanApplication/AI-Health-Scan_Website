"use client";

// Referral utility functions that don't depend on React hooks
// These can be used anywhere in the app without hook constraints

export const ReferralHelpers = {
  // Get current pending referral code
  getPendingReferral: (): string | null => {
    try {
      return localStorage.getItem('healthscan_pending_referral');
    } catch {
      return null;
    }
  },
  
  // Clear pending referral after successful signup
  clearPendingReferral: (): void => {
    try {
      localStorage.removeItem('healthscan_pending_referral');
      localStorage.removeItem('healthscan_referral_timestamp');
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('referralStatusChanged'));
    } catch (error) {
      console.warn('Failed to clear pending referral:', error);
    }
  },
  
  // Set a referral code manually
  setPendingReferral: (code: string): void => {
    try {
      localStorage.setItem('healthscan_pending_referral', code);
      localStorage.setItem('healthscan_referral_timestamp', Date.now().toString());
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('referralStatusChanged'));
    } catch (error) {
      console.warn('Failed to set pending referral:', error);
    }
  },
  
  // Check if URL has referral parameter
  hasReferralInUrl: (): boolean => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('ref');
    } catch {
      return false;
    }
  },
  
  // Get referral code from URL
  getReferralFromUrl: (): string | null => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('ref');
    } catch {
      return null;
    }
  },
  
  // Check if referral is still valid/active
  isReferralActive: (): boolean => {
    try {
      const pendingReferral = localStorage.getItem('healthscan_pending_referral');
      const referralTimestamp = localStorage.getItem('healthscan_referral_timestamp');
      const userHasJoined = localStorage.getItem('healthscan_user_email') || 
                           localStorage.getItem('healthscan_referral_code');
      
      if (!pendingReferral || userHasJoined) return false;
      
      if (referralTimestamp) {
        const isRecent = (Date.now() - parseInt(referralTimestamp)) < (7 * 24 * 60 * 60 * 1000);
        return isRecent;
      }
      
      return false;
    } catch {
      return false;
    }
  },

  // Generate a referral link
  generateReferralLink: (code: string, baseUrl?: string): string => {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}?ref=${encodeURIComponent(code)}`;
  },

  // Clean URL of referral parameters
  cleanReferralFromUrl: (): void => {
    try {
      if (typeof window !== 'undefined' && window.history) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (error) {
      console.warn('Failed to clean referral from URL:', error);
    }
  },

  // Get referral age in days
  getReferralAge: (): number | null => {
    try {
      const referralTimestamp = localStorage.getItem('healthscan_referral_timestamp');
      if (!referralTimestamp) return null;
      
      const ageMs = Date.now() - parseInt(referralTimestamp);
      return Math.floor(ageMs / (24 * 60 * 60 * 1000));
    } catch {
      return null;
    }
  },

  // Debug: Get all referral data
  getAllReferralData: () => {
    try {
      return {
        pendingReferral: localStorage.getItem('healthscan_pending_referral'),
        referralTimestamp: localStorage.getItem('healthscan_referral_timestamp'),
        userEmail: localStorage.getItem('healthscan_user_email'),
        userReferralCode: localStorage.getItem('healthscan_referral_code'),
        urlReferral: new URLSearchParams(window.location.search).get('ref'),
        isActive: ReferralHelpers.isReferralActive(),
        ageInDays: ReferralHelpers.getReferralAge()
      };
    } catch (error) {
      console.warn('Failed to get referral data:', error);
      return null;
    }
  }
};

// Legacy export for backward compatibility
export const ReferralUtils = ReferralHelpers;