import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { adminApiService, type PopulateOptions } from '../services/adminApiService';
import { fixBrokenImageUrls, checkBrokenImageStats } from '../utils/fixBrokenImages';
import { 
  DetailedStats, 
  ServerStatus, 
  TARGET_COUNTS, 
  DEFAULT_STATS,
  AUTO_POPULATION_THRESHOLD,
  PRIORITY_DATA_TYPES,
  SECONDARY_DATA_TYPES,
  TIMEOUTS
} from '../constants/adminConstants';

export interface UseAdminDataReturn {
  // State
  detailedStats: DetailedStats;
  realTimeStats: typeof DEFAULT_STATS;
  serverStatus: ServerStatus;
  isLoadingDetails: boolean;
  autoPopulationInProgress: boolean;
  autoPopulationComplete: boolean;
  isFixingImages: boolean;
  brokenImageStats: any;

  // Actions
  fetchRealTimeStats: () => Promise<typeof DEFAULT_STATS>;
  fetchDetailedStats: () => Promise<void>;
  populateDataType: (dataType: string, showToast?: boolean) => Promise<void>;
  exportDataType: (dataType: string) => Promise<void>;
  autoPopulateAllDataTypes: () => Promise<void>;
  handleFixBrokenImages: () => Promise<void>;
  refreshAllStats: () => Promise<void>;
  
  // Utilities
  getCurrentCount: (key: string) => number;
}

export function useAdminData(): UseAdminDataReturn {
  // State
  const [detailedStats, setDetailedStats] = useState<DetailedStats>({});
  const [realTimeStats, setRealTimeStats] = useState<typeof DEFAULT_STATS>(DEFAULT_STATS);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [autoPopulationInProgress, setAutoPopulationInProgress] = useState(false);
  const [autoPopulationComplete, setAutoPopulationComplete] = useState(false);
  const [isFixingImages, setIsFixingImages] = useState(false);
  const [brokenImageStats, setBrokenImageStats] = useState<any>(null);

  // Fetch real-time stats with server health check
  const fetchRealTimeStats = useCallback(async (): Promise<typeof DEFAULT_STATS> => {
    try {
      // Check server health first
      const healthCheck = await adminApiService.checkServerHealth();
      setServerStatus(healthCheck.status);

      if (!healthCheck.available) {
        console.warn('⚠️ Server unavailable, using default stats');
        setRealTimeStats(DEFAULT_STATS);
        return DEFAULT_STATS;
      }

      // Fetch stats if server is healthy
      const stats = await adminApiService.fetchDatabaseStats();
      setRealTimeStats(stats);
      return stats;
    } catch (error) {
      console.error('❌ Error in fetchRealTimeStats:', error);
      setServerStatus('offline');
      setRealTimeStats(DEFAULT_STATS);
      return DEFAULT_STATS;
    }
  }, []);

  // Fetch detailed statistics
  const fetchDetailedStats = useCallback(async (): Promise<void> => {
    setIsLoadingDetails(true);
    try {
      const detailed = await adminApiService.fetchDetailedStats();
      setDetailedStats(detailed);
    } catch (error) {
      console.error('❌ Error fetching detailed stats:', error);
      toast.error('Failed to fetch detailed statistics');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Populate data type with target records
  const populateDataType = useCallback(async (dataType: string, showToast: boolean = true): Promise<void> => {
    if (showToast) {
      console.log(`🚀 Populating ${dataType} with target records...`);
    }

    const options: PopulateOptions = {
      dataType,
      targetCount: TARGET_COUNTS[dataType as keyof typeof TARGET_COUNTS] || 50,
      includeImages: true,
      includeMetadata: true
    };

    try {
      const result = await adminApiService.populateDataType(options);
      
      if (result.success) {
        if (showToast) {
          toast.success(`✅ Successfully populated ${result.imported} ${dataType} records!`);
        }
        
        // Refresh stats after successful population
        await Promise.all([
          fetchRealTimeStats(),
          fetchDetailedStats()
        ]);
      } else {
        if (showToast) {
          toast.error(`❌ Failed to populate ${dataType}: ${result.error}`);
        }
      }
    } catch (error: any) {
      console.error(`Failed to populate ${dataType}:`, error);
      if (showToast) {
        toast.error(`❌ Failed to populate ${dataType}: ${error.message}`);
      }
    }
  }, [fetchRealTimeStats, fetchDetailedStats]);

  // Export data type to CSV
  const exportDataType = useCallback(async (dataType: string): Promise<void> => {
    try {
      console.log(`📥 Exporting ${dataType} data...`);
      
      const result = await adminApiService.exportDataType(dataType);
      
      if (result.success && result.content && result.filename) {
        adminApiService.downloadBlob(result.content, result.filename);
        toast.success(`✅ ${dataType} data exported successfully!`);
      } else {
        toast.error(`❌ Failed to export ${dataType}: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`Failed to export ${dataType}:`, error);
      toast.error(`❌ Failed to export ${dataType}: ${error.message}`);
    }
  }, []);

  // Auto-populate all data types to targets
  const autoPopulateAllDataTypes = useCallback(async (): Promise<void> => {
    if (autoPopulationComplete) {
      console.log('✅ Auto-population already complete');
      return;
    }
    
    setAutoPopulationInProgress(true);
    console.log('🚀 Starting auto-population of all data types...');
    
    try {
      // Get current stats first
      const currentStats = await fetchRealTimeStats();
      const totalRecords = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
      
      if (totalRecords >= AUTO_POPULATION_THRESHOLD) {
        console.log('✅ Sufficient data already exists, skipping auto-population');
        setAutoPopulationComplete(true);
        return;
      }

      toast.info('🔄 Auto-populating database with production data including 100 ingredients and 100 parasites/pathogens...');

      // Populate priority data types first
      for (const dataType of PRIORITY_DATA_TYPES) {
        const current = currentStats[dataType as keyof typeof currentStats] || 0;
        const target = TARGET_COUNTS[dataType as keyof typeof TARGET_COUNTS];
        
        if (current < target) {
          console.log(`📊 Populating ${dataType}: ${current}/${target}`);
          try {
            await populateDataType(dataType, false);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to populate ${dataType}:`, error);
          }
        }
      }

      // Populate secondary data types
      for (const dataType of SECONDARY_DATA_TYPES) {
        const current = currentStats[dataType as keyof typeof currentStats] || 0;
        const target = TARGET_COUNTS[dataType as keyof typeof TARGET_COUNTS];
        
        if (current < target) {
          console.log(`📊 Populating ${dataType}: ${current}/${target}`);
          try {
            await populateDataType(dataType, false);
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (error) {
            console.error(`Failed to populate ${dataType}:`, error);
          }
        }
      }

      // Final refresh
      await Promise.all([
        fetchRealTimeStats(),
        fetchDetailedStats()
      ]);
      
      setAutoPopulationComplete(true);
      toast.success('✅ Database auto-population complete! You now have 100+ real records for each critical data type including comprehensive parasites & pathogens.');
      
    } catch (error) {
      console.error('❌ Auto-population failed:', error);
      toast.error('❌ Auto-population encountered issues. Some data may be populated.');
    } finally {
      setAutoPopulationInProgress(false);
    }
  }, [autoPopulationComplete, fetchRealTimeStats, fetchDetailedStats, populateDataType]);

  // Fix broken image URLs
  const handleFixBrokenImages = useCallback(async (): Promise<void> => {
    setIsFixingImages(true);
    toast.info('🔧 Checking for broken image URLs...');
    
    try {
      // First check for broken images
      const statsResult = await checkBrokenImageStats();
      if (statsResult.success) {
        setBrokenImageStats(statsResult.stats);
        
        const totalBroken = Object.values(statsResult.stats).reduce((total: number, dataTypeStats: any) => 
          total + (dataTypeStats.brokenImages || 0), 0
        );
        
        if (totalBroken > 0) {
          toast.info(`🔍 Found ${totalBroken} broken images. Fixing now...`);
          
          // Fix the broken images
          const fixResult = await fixBrokenImageUrls();
          if (fixResult.success) {
            toast.success(`✅ Successfully fixed ${fixResult.fixed} broken image URLs!`);
            
            // Refresh stats after fixing
            await refreshAllStats();
          } else {
            toast.error(`❌ Failed to fix images: ${fixResult.error}`);
          }
        } else {
          toast.success('✅ No broken images found - all image URLs are working properly!');
        }
      } else {
        toast.error(`❌ Failed to check image stats: ${statsResult.error}`);
      }
    } catch (error: any) {
      console.error('Failed to fix broken images:', error);
      toast.error(`❌ Failed to fix broken images: ${error.message}`);
    } finally {
      setIsFixingImages(false);
    }
  }, []);

  // Refresh all stats
  const refreshAllStats = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchRealTimeStats(),
      fetchDetailedStats()
    ]);
  }, [fetchRealTimeStats, fetchDetailedStats]);

  // Get current count for a data type
  const getCurrentCount = useCallback((key: string): number => {
    return realTimeStats[key as keyof typeof realTimeStats] || 
           detailedStats[key]?.current || 
           0;
  }, [realTimeStats, detailedStats]);

  // Initial data loading
  useEffect(() => {
    fetchDetailedStats();
  }, [fetchDetailedStats]);

  // Auto-populate on first load
  useEffect(() => {
    if (serverStatus === 'online' && !autoPopulationInProgress && !autoPopulationComplete) {
      const timer = setTimeout(() => {
        autoPopulateAllDataTypes();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [serverStatus, autoPopulationInProgress, autoPopulationComplete, autoPopulateAllDataTypes]);

  // Periodic stats refresh
  useEffect(() => {
    if (serverStatus === 'online' && !autoPopulationInProgress) {
      const interval = setInterval(() => {
        fetchRealTimeStats();
      }, TIMEOUTS.STATS_REFRESH_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [serverStatus, autoPopulationInProgress, fetchRealTimeStats]);

  return {
    // State
    detailedStats,
    realTimeStats,
    serverStatus,
    isLoadingDetails,
    autoPopulationInProgress,
    autoPopulationComplete,
    isFixingImages,
    brokenImageStats,

    // Actions
    fetchRealTimeStats,
    fetchDetailedStats,
    populateDataType,
    exportDataType,
    autoPopulateAllDataTypes,
    handleFixBrokenImages,
    refreshAllStats,

    // Utilities
    getCurrentCount
  };
}