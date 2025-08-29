import { useEffect, useState } from 'react';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

export function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Handle viewport height changes (mobile browser address bar)
    const updateViewportHeight = () => {
      const vh = window.innerHeight;
      setViewportHeight(vh);
      
      // Update CSS custom property for dynamic viewport height
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    // Prevent iOS bounce scrolling
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as Element;
      
      // Allow scrolling within scrollable containers
      if (target.closest('[data-scroll="true"]') || target.closest('.overflow-auto') || target.closest('.overflow-y-auto')) {
        return;
      }
      
      // Prevent document scroll bounce
      if (target === document.body || target === document.documentElement) {
        e.preventDefault();
      }
    };

    // Optimize touch handling
    const optimizeTouch = () => {
      // Disable touch zoom on specific elements
      const inputElements = document.querySelectorAll('input, textarea, select, button');
      inputElements.forEach(element => {
        element.addEventListener('touchstart', (e) => {
          // Prevent zoom on input focus
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const input = element as HTMLInputElement | HTMLTextAreaElement;
            const currentFontSize = window.getComputedStyle(input).fontSize;
            const fontSize = parseFloat(currentFontSize);
            
            // Ensure minimum 16px to prevent zoom
            if (fontSize < 16) {
              input.style.fontSize = '16px';
            }
          }
        });
      });
    };

    // Handle orientation change
    const handleOrientationChange = () => {
      // Delay viewport update to account for browser UI changes
      setTimeout(() => {
        updateViewportHeight();
        checkMobile();
      }, 100);
    };

    // Initialize
    checkMobile();
    updateViewportHeight();
    optimizeTouch();

    // Add event listeners
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    if (isMobile) {
      document.addEventListener('touchmove', preventOverscroll, { passive: false });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (isMobile) {
        document.removeEventListener('touchmove', preventOverscroll);
      }
    };
  }, [isMobile]);

  // Add CSS custom properties for better mobile handling
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-optimized');
      document.documentElement.style.setProperty('--mobile-vh', `${viewportHeight}px`);
    } else {
      document.body.classList.remove('mobile-optimized');
    }

    return () => {
      document.body.classList.remove('mobile-optimized');
    };
  }, [isMobile, viewportHeight]);

  return <>{children}</>;
}

// Hook for accessing mobile optimization data
export function useMobileOptimizations() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateMobileState = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setViewportHeight(window.innerHeight);

      // Get safe area insets (for devices with notches)
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
      });
    };

    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    window.addEventListener('orientationchange', updateMobileState);

    return () => {
      window.removeEventListener('resize', updateMobileState);
      window.removeEventListener('orientationchange', updateMobileState);
    };
  }, []);

  return {
    isMobile,
    viewportHeight,
    safeAreaInsets,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent)
  };
}