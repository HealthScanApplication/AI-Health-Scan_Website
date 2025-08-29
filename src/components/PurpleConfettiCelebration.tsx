"use client";

// This component has been consolidated into ConfettiCelebration.tsx 
// to use only plant green colors as requested.
// Import and use ConfettiCelebration instead.

import { ConfettiCelebration } from "./ConfettiCelebration";

interface GreenFoodConfettiCelebrationProps {
  isActive?: boolean;
  onComplete?: () => void;
}

export function PurpleConfettiCelebration({ isActive = true, onComplete }: GreenFoodConfettiCelebrationProps) {
  // Redirect to the consolidated plant green confetti celebration
  return <ConfettiCelebration isActive={isActive} onComplete={onComplete} />;
}