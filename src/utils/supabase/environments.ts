/**
 * Supabase Environment Configuration
 * Supports switching between staging and production environments
 */

export type Environment = 'staging' | 'production';

export interface EnvironmentConfig {
  projectId: string;
  publicAnonKey: string;
  name: string;
  label: string;
}

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  staging: {
    projectId: 'mofhvoudjxinvpplsytd',
    publicAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmh2b3VkanhpbnZwcGxzeXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NDM5MjAsImV4cCI6MjA1NjAxOTkyMH0.zZWhLMur9uKko-3PSQp3aRoMvOt0Ig-GzBsMblelAp0',
    name: 'staging',
    label: 'Staging',
  },
  production: {
    projectId: 'mofhvoudjxinvpplsytd', // TODO: Update with production project ID when available
    publicAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmh2b3VkanhpbnZwcGxzeXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NDM5MjAsImV4cCI6MjA1NjAxOTkyMH0.zZWhLMur9uKko-3PSQp3aRoMvOt0Ig-GzBsMblelAp0', // TODO: Update with production key
    name: 'production',
    label: 'Production',
  },
};

/**
 * Get current environment from localStorage or default to staging
 */
export function getCurrentEnvironment(): Environment {
  if (typeof window === 'undefined') return 'staging';
  const stored = localStorage.getItem('supabase-environment');
  return (stored as Environment) || 'staging';
}

/**
 * Set current environment to localStorage
 */
export function setCurrentEnvironment(env: Environment): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase-environment', env);
    // Reload to apply new environment
    window.location.reload();
  }
}

/**
 * Get config for current environment
 */
export function getCurrentEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  return ENVIRONMENTS[env];
}
