import { User } from '@supabase/supabase-js';

export interface AdminUser extends User {
  isAdmin: boolean;
  adminLevel: 'super' | 'editor' | 'viewer';
}

/**
 * Check if a user has admin privileges based on their email domain or specific admin emails
 */
export function isAdminUser(user: User | null): boolean {
  if (!user?.email) return false;
  
  const userEmail = user.email.toLowerCase();
  
  // Check specific admin emails first (for external admins)
  const specificAdminEmails = [
    'johnferreira@gmail.com',
    // Add other external admin emails here
  ];
  
  if (specificAdminEmails.includes(userEmail)) {
    return true;
  }
  
  // Check admin domains
  const adminDomains = [
    'healthscan.live',
    'healthscan.com', // Fallback domain
  ];
  
  const emailDomain = user.email.split('@')[1]?.toLowerCase();
  return adminDomains.includes(emailDomain || '');
}

/**
 * Get admin level based on email and user metadata
 */
export function getAdminLevel(user: User | null): 'super' | 'editor' | 'viewer' | null {
  if (!isAdminUser(user)) return null;
  
  const userEmail = user?.email?.toLowerCase();
  
  // Super admin emails (founders, CTO, external admins, etc.)
  const superAdminEmails = [
    'admin@healthscan.live',
    'founder@healthscan.live',
    'cto@healthscan.live',
    'dev@healthscan.live',
    'johnferreira@gmail.com' // External super admin
  ];
  
  if (userEmail && superAdminEmails.includes(userEmail)) {
    return 'super';
  }
  
  // Check user metadata for custom admin level
  const metadataLevel = user?.user_metadata?.admin_level;
  if (metadataLevel && ['super', 'editor', 'viewer'].includes(metadataLevel)) {
    return metadataLevel;
  }
  
  // Default to editor for healthscan.live domain
  return 'editor';
}

/**
 * Check if user has permission for a specific admin action
 */
export function hasAdminPermission(
  user: User | null, 
  action: 'read' | 'create' | 'update' | 'delete' | 'manage_users'
): boolean {
  const adminLevel = getAdminLevel(user);
  if (!adminLevel) return false;
  
  switch (adminLevel) {
    case 'super':
      return true; // Super admins can do everything
      
    case 'editor':
      return ['read', 'create', 'update', 'delete'].includes(action);
      
    case 'viewer':
      return action === 'read';
      
    default:
      return false;
  }
}

/**
 * Get admin user display info
 */
export function getAdminUserInfo(user: User | null): {
  isAdmin: boolean;
  level: string | null;
  displayName: string;
  canEdit: boolean;
  canManageUsers: boolean;
} {
  const isAdmin = isAdminUser(user);
  const level = getAdminLevel(user);
  
  // Custom display names for specific admin emails
  let displayName = user?.email?.split('@')[0] || 'Unknown';
  const userEmail = user?.email?.toLowerCase();
  
  if (userEmail === 'johnferreira@gmail.com') {
    displayName = 'John Ferreira';
  }
  
  return {
    isAdmin,
    level,
    displayName,
    canEdit: hasAdminPermission(user, 'update'),
    canManageUsers: hasAdminPermission(user, 'manage_users')
  };
}

/**
 * Format admin badge based on level
 */
export function getAdminBadgeColor(level: string | null): string {
  switch (level) {
    case 'super': return 'bg-red-100 text-red-800 border-red-200';
    case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'viewer': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}