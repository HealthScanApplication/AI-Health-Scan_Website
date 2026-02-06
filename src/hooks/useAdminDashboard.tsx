/**
 * Admin Dashboard Hook
 * Manages state and logic for the admin dashboard
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminDashboardStats {
  totalRecords: number;
  dataQuality: number;
  recentActivity: number;
  categoryBreakdown: {
    nutrients: number;
    pollutants: number;
    ingredients: number;
    products: number;
    parasites: number;
    scans: number;
    meals: number;
    waitlist: number;
  };
}

export function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dataTypeFilter, setDataTypeFilter] = useState('');
  const [currentView, setCurrentView] = useState('overview');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRecords: 0,
    dataQuality: 0,
    recentActivity: 0,
    categoryBreakdown: {
      nutrients: 0,
      pollutants: 0,
      ingredients: 0,
      products: 0,
      parasites: 0,
      scans: 0,
      meals: 0,
      waitlist: 0
    }
  });

  // Fetch database statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Admin stats response:', data);
        
        // The server response already has the structure we need
        setStats({
          totalRecords: Number(data?.totalRecords) || 0,
          dataQuality: Number(data?.dataQuality) || 0,
          recentActivity: Number(data?.recentActivity) || 0,
          categoryBreakdown: data?.categoryBreakdown || {
            nutrients: 0,
            pollutants: 0,
            ingredients: 0,
            products: 0,
            parasites: 0,
            scans: 0,
            meals: 0,
            waitlist: 0
          }
        });
      } else {
        console.warn('Failed to fetch database stats:', response.status);
        // Keep default values if fetch fails
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      // Keep default values if fetch fails
    }
  };

  // Refresh stats function
  const refreshStats = async () => {
    try {
      console.log('🔄 Refreshing admin dashboard stats...');
      await fetchStats();
      toast.success('📊 Dashboard stats refreshed!');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('❌ Failed to refresh dashboard stats');
    }
  };

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        await fetchStats();
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        // Ensure stats have default values even on error
        setStats({
          totalRecords: 0,
          dataQuality: 0,
          recentActivity: 0,
          categoryBreakdown: {
            nutrients: 0,
            pollutants: 0,
            ingredients: 0,
            products: 0,
            parasites: 0,
            scans: 0,
            meals: 0,
            waitlist: 0
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        fetchStats();
      } catch (error) {
        console.warn('Error during auto-refresh:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    activeTab,
    setActiveTab,
    dataTypeFilter,
    setDataTypeFilter,
    currentView,
    setCurrentView,
    selectedItemId,
    setSelectedItemId,
    isLoading,
    stats,
    refreshStats
  };
}