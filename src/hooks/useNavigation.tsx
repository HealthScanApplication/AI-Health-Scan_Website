import { useState, useCallback, useMemo } from 'react';
import { toast } from "sonner@2.0.3";
import { PageType, NavigationProps } from '../types/app';

interface UseNavigationProps {
  isAdmin: boolean;
}

export function useNavigation({ isAdmin }: UseNavigationProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const navigateToPage = useCallback((page: PageType) => {
    console.log('🔗 Navigation requested to:', page);
    console.log('🔍 Current isAdmin status:', isAdmin);
    
    // Check admin access
    if (page === 'admin' && !isAdmin) {
      toast.error('🚫 Access denied. Admin privileges required.');
      console.warn('❌ Admin access denied for page:', page);
      return;
    }
    
    console.log('✅ Navigating to page:', page);
    setCurrentPage(page);
  }, [isAdmin]);

  const navigateToHome = useCallback(() => {
    console.log('🏠 Navigating to home');
    setCurrentPage('home');
  }, []);

  // Create admin navigation callback that includes debugging
  const navigateToAdmin = useCallback(() => {
    console.log('🛡️ Admin navigation callback triggered');
    console.log('🔍 isAdmin check:', isAdmin);
    
    if (isAdmin) {
      navigateToPage('admin');
    } else {
      toast.error('🚫 Admin access denied');
      console.error('❌ Admin navigation blocked - not admin user');
    }
  }, [isAdmin, navigateToPage]);

  const getPageClassName = () => {
    if (currentPage === 'home') {
      return 'pt-16'; // Add padding to account for fixed header
    }
    if (currentPage === 'referral-test' || currentPage === 'admin' || currentPage === 'diagnostic' || currentPage === 'blog') {
      return 'pt-16'; // Add padding for test page, admin, diagnostic, and blog
    }
    return '';
  };

  // Memoize header navigation props to prevent unnecessary re-renders
  const headerProps: NavigationProps = useMemo(() => {
    const props: NavigationProps = {
      onNavigateToProfile: () => navigateToPage('profile'),
      onNavigateToSettings: () => navigateToPage('settings'),
      onNavigateToHome: navigateToHome,
      onNavigateToBlog: () => navigateToPage('blog')
    };

    // Always provide admin navigation callback if user is admin
    if (isAdmin) {
      props.onNavigateToAdmin = navigateToAdmin;
      console.log('✅ Admin navigation callback added to header props');
    } else {
      console.log('ℹ️ Admin navigation callback not added - user is not admin');
    }

    return props;
  }, [navigateToPage, navigateToHome, navigateToAdmin, isAdmin]);

  return {
    currentPage,
    setCurrentPage,
    navigateToPage,
    navigateToHome,
    getPageClassName,
    headerProps
  };
}