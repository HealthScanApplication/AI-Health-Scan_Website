import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderProps {
  threshold?: number;
  showDelay?: number;
}

export function useScrollHeader({ 
  threshold = 10, 
  showDelay = 150 
}: UseScrollHeaderProps = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [animationState, setAnimationState] = useState<'idle' | 'hiding' | 'showing'>('idle');
  const lastScrollY = useRef(0);
  const scrollTimer = useRef<NodeJS.Timeout>();
  const animationTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
      
      // Only process if scroll difference is significant enough
      if (scrollDifference < threshold) {
        return;
      }

      // Determine scroll direction
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      setScrollDirection(direction);

      // Clear any existing timers
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }

      // Set scrolling state and trigger hide animation when scrolling starts
      setIsScrolling(true);
      
      // Hide header when scrolling (both up and down), except when at top
      if (currentScrollY <= threshold) {
        setIsVisible(true);
        setAnimationState('idle');
      } else {
        // Start hiding animation
        setAnimationState('hiding');
        
        // Set header as hidden after animation starts
        animationTimer.current = setTimeout(() => {
          setIsVisible(false);
        }, 100); // Short delay to allow animation to start
      }

      // Set timer to show header after user stops scrolling
      scrollTimer.current = setTimeout(() => {
        setIsScrolling(false);
        setAnimationState('showing');
        setIsVisible(true);
        
        // Reset to idle state after show animation
        animationTimer.current = setTimeout(() => {
          setAnimationState('idle');
        }, 400);
      }, showDelay);

      lastScrollY.current = currentScrollY;
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, [threshold, showDelay]);

  return {
    isVisible,
    isScrolling,
    scrollDirection,
    animationState
  };
}