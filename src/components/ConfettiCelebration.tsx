"use client";

import { useEffect, useState, useRef } from "react";

interface ConfettiCelebrationProps {
  isActive?: boolean;
  onComplete?: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  gravity: number;
}

export function ConfettiCelebration({ isActive = true, onComplete }: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const animationStateRef = useRef<{
    isRunning: boolean;
    startTime: number;
    shouldComplete: boolean;
  }>({ isRunning: false, startTime: 0, shouldComplete: false });

  // Single plant green color palette - as requested
  const plantGreenColors = [
    '#16a34a', // HealthScan plant green (primary)
    '#15803d', // Darker plant green
    '#166534', // Even darker green
    '#14532d', // Deep forest green
    '#22c55e', // Lighter plant green accent
    '#059669', // Emerald plant shade
    '#047857', // Dark emerald plant
    '#065f46', // Deep emerald plant
  ];

  useEffect(() => {
    if (!isActive || animationStateRef.current.isRunning) return;

    console.log('🎉 Starting confetti animation');
    animationStateRef.current = { isRunning: true, startTime: Date.now(), shouldComplete: false };
    setIsVisible(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles for plant green celebration
    particlesRef.current = [];
    const particleCount = 250; // Moderate amount for single color scheme
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      // Create organic burst effect from center
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const velocity = Math.random() * 12 + 8; // Natural velocity spread
      
      particlesRef.current.push({
        x: centerX + (Math.random() - 0.5) * 80, // Start near center
        y: centerY + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        color: plantGreenColors[Math.floor(Math.random() * plantGreenColors.length)],
        size: Math.random() * 6 + 4, // Consistent size range
        gravity: 0.25 + Math.random() * 0.15,
      });
    }

    const startTime = animationStateRef.current.startTime;
    const duration = 3500; // 3.5 seconds for plant green celebration

    const animate = () => {
      // Check if animation should be stopped
      if (animationStateRef.current.shouldComplete) {
        console.log('🎉 Confetti animation stopped early due to external request');
        animationStateRef.current = { isRunning: false, startTime: 0, shouldComplete: false };
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed > duration) {
        console.log('🎉 Confetti animation completed naturally');
        animationStateRef.current = { isRunning: false, startTime: 0, shouldComplete: false };
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(particle => {
        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.rotation += particle.rotationSpeed;

        // Draw particle with plant green theme
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        
        // Add subtle opacity variation for depth
        const fadeProgress = Math.min(elapsed / duration, 1);
        const alpha = 1 - fadeProgress * 0.2; // Fade to 80% opacity over time
        ctx.globalAlpha = alpha;
        
        // Draw plant-themed shapes for variety
        const shapeRandom = Math.random();
        if (shapeRandom > 0.6) {
          // Draw leaf shapes (plant theme)
          const size = particle.size / 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 1.3, size * 0.7, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (shapeRandom > 0.3) {
          // Draw circles for seeds/berries
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw squares for variety
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        }
        
        ctx.restore();

        // Keep particle if it's still visible
        return particle.y < canvas.height + 50;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, onComplete]);

  // Handle early termination when isActive becomes false
  useEffect(() => {
    if (!isActive && animationStateRef.current.isRunning) {
      console.log('🎉 Confetti early termination requested');
      animationStateRef.current.shouldComplete = true;
    }
  }, [isActive]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 30, // Behind modals but above most content
      }}
    />
  );
}