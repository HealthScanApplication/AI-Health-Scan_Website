import React, { useEffect, useState } from 'react';
import { fixBrokenImageUrls, checkBrokenImageStats } from '../utils/fixBrokenImages';
import { toast } from 'sonner';

export function ImageFixUtility() {
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only run once when the app loads
    if (!hasChecked) {
      setHasChecked(true);
      runImageFix();
    }
  }, [hasChecked]);

  const runImageFix = async () => {
    try {
      console.log('🔍 Checking for broken images...');
      
      // First check if there are broken images
      const statsResult = await checkBrokenImageStats();
      if (statsResult.success) {
        const totalBroken = Object.values(statsResult.stats).reduce((total: number, dataTypeStats: any) => 
          total + (dataTypeStats.brokenImages || 0), 0
        );
        
        if (totalBroken > 0) {
          console.log(`🔧 Found ${totalBroken} broken placeholder images, fixing automatically...`);
          
          // Show toast notification
          toast.info(`🔧 Fixing ${totalBroken} broken image URLs...`, {
            duration: 3000,
          });
          
          // Fix the broken images
          const fixResult = await fixBrokenImageUrls();
          if (fixResult.success) {
            console.log(`✅ Successfully fixed ${fixResult.fixed} broken image URLs`);
            toast.success(`✅ Fixed ${fixResult.fixed} broken image URLs!`, {
              duration: 5000,
            });
          } else {
            console.error(`❌ Failed to fix images: ${fixResult.error}`);
            toast.error(`❌ Failed to fix images: ${fixResult.error}`, {
              duration: 5000,
            });
          }
        } else {
          console.log('✅ No broken images found');
        }
      } else {
        console.error(`❌ Failed to check image stats: ${statsResult.error}`);
      }
    } catch (error: any) {
      console.error('❌ Image fix utility failed:', error);
      toast.error(`❌ Image fix failed: ${error.message}`, {
        duration: 5000,
      });
    }
  };

  // This component doesn't render anything, it's just a utility
  return null;
}