import { useEffect } from 'react';

interface UseWindowEventHandlersProps {
  setCurrentPage: (page: string) => void;
  navigateToPage: (page: string) => void;
}

export function useWindowEventHandlers({ setCurrentPage, navigateToPage }: UseWindowEventHandlersProps) {
  useEffect(() => {
    const handleAuthReset = () => {
      setCurrentPage('home');
    };

    const handleNavigationEvent = (event: CustomEvent) => {
      const targetPage = event.detail;
      navigateToPage(targetPage);
    };

    // Add all event listeners
    window.addEventListener('authNavigateToHome', handleAuthReset);
    window.addEventListener('navigateToPage', handleNavigationEvent as EventListener);
    
    return () => {
      // Clean up all event listeners
      window.removeEventListener('authNavigateToHome', handleAuthReset);
      window.removeEventListener('navigateToPage', handleNavigationEvent as EventListener);
    };
  }, [setCurrentPage, navigateToPage]);

  // Handle cleanup of any existing intervals/timeouts
  useEffect(() => {
    const cleanupHealthMonitoring = () => {
      if (typeof window !== 'undefined') {
        // Clear any potential health check intervals more efficiently
        const maxId = 1000; // Reasonable upper bound instead of 9999
        for (let i = 1; i < maxId; i++) {
          window.clearInterval(i);
          window.clearTimeout(i);
        }
      }
    };

    cleanupHealthMonitoring();
  }, []);
}