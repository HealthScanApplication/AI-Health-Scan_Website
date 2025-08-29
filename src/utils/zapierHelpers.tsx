import { projectId, publicAnonKey } from './supabase/info';

interface ZapierWebhookPayload {
  trigger: string;
  timestamp: string;
  data: any;
}

interface ZapierConfig {
  config_name: string;
  webhook_url: string;
  auth_token?: string;
  triggers: string[];
  enabled: boolean;
}

// Centralized Zapier webhook sender
export class ZapierWebhookManager {
  private static instance: ZapierWebhookManager;
  private configurations: ZapierConfig[] = [];
  private serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`;

  static getInstance(): ZapierWebhookManager {
    if (!ZapierWebhookManager.instance) {
      ZapierWebhookManager.instance = new ZapierWebhookManager();
    }
    return ZapierWebhookManager.instance;
  }

  // Load configurations from server
  async loadConfigurations(): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/zapier/webhook/config`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.configurations = data.configurations || [];
          console.log('📡 Zapier configurations loaded:', this.configurations.length);
        }
      }
    } catch (error) {
      console.error('Error loading Zapier configurations:', error);
    }
  }

  // Send webhook for user registration
  async triggerUserRegistration(user: any): Promise<void> {
    try {
      await this.loadConfigurations();
      
      const enabledConfigs = this.configurations.filter(
        config => config.enabled && config.triggers.includes('user_registered')
      );

      if (enabledConfigs.length === 0) {
        console.log('🔇 No enabled Zapier webhooks for user registration');
        return;
      }

      console.log(`📡 Triggering user registration webhooks for ${enabledConfigs.length} configurations`);

      const promises = enabledConfigs.map(config =>
        this.sendWebhook('user_registered', {
          webhook_url: config.webhook_url,
          auth_token: config.auth_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
            created_at: user.created_at,
            email_confirmed: !!user.email_confirmed_at,
            metadata: user.user_metadata || {}
          }
        })
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error triggering user registration webhooks:', error);
    }
  }

  // Send webhook for waitlist signup
  async triggerWaitlistJoined(email: string, referralCode?: string, metadata?: any): Promise<void> {
    try {
      await this.loadConfigurations();
      
      const enabledConfigs = this.configurations.filter(
        config => config.enabled && config.triggers.includes('waitlist_joined')
      );

      if (enabledConfigs.length === 0) {
        console.log('🔇 No enabled Zapier webhooks for waitlist signup');
        return;
      }

      console.log(`📡 Triggering waitlist signup webhooks for ${enabledConfigs.length} configurations`);

      const promises = enabledConfigs.map(config =>
        this.sendWebhook('waitlist_joined', {
          webhook_url: config.webhook_url,
          auth_token: config.auth_token,
          email,
          referral_code: referralCode,
          metadata
        })
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error triggering waitlist signup webhooks:', error);
    }
  }

  // Send webhook for scan completion
  async triggerScanCompleted(scanData: any, userId?: string): Promise<void> {
    try {
      await this.loadConfigurations();
      
      const enabledConfigs = this.configurations.filter(
        config => config.enabled && config.triggers.includes('scan_completed')
      );

      if (enabledConfigs.length === 0) {
        console.log('🔇 No enabled Zapier webhooks for scan completion');
        return;
      }

      console.log(`📡 Triggering scan completion webhooks for ${enabledConfigs.length} configurations`);

      const promises = enabledConfigs.map(config =>
        this.sendWebhook('scan_completed', {
          webhook_url: config.webhook_url,
          auth_token: config.auth_token,
          scan_data: scanData,
          user_id: userId
        })
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error triggering scan completion webhooks:', error);
    }
  }

  // Send webhook for referral milestone
  async triggerReferralMilestone(userEmail: string, milestoneType: string, referralCount: number): Promise<void> {
    try {
      await this.loadConfigurations();
      
      const enabledConfigs = this.configurations.filter(
        config => config.enabled && config.triggers.includes('referral_milestone')
      );

      if (enabledConfigs.length === 0) {
        console.log('🔇 No enabled Zapier webhooks for referral milestone');
        return;
      }

      console.log(`📡 Triggering referral milestone webhooks for ${enabledConfigs.length} configurations`);

      const promises = enabledConfigs.map(config =>
        this.sendWebhook('referral_milestone', {
          webhook_url: config.webhook_url,
          auth_token: config.auth_token,
          user_email: userEmail,
          milestone_type: milestoneType,
          referral_count: referralCount
        })
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error triggering referral milestone webhooks:', error);
    }
  }

  // Generic webhook sender
  private async sendWebhook(triggerType: string, payload: any): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/zapier/webhook/${triggerType.replace('_', '-')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`⚠️ Zapier webhook failed for ${triggerType}:`, response.status, response.statusText);
      } else {
        console.log(`✅ Zapier webhook sent successfully for ${triggerType}`);
      }
    } catch (error) {
      console.error(`❌ Error sending Zapier webhook for ${triggerType}:`, error);
    }
  }

  // Test webhook connectivity
  async testWebhookConnection(webhookUrl: string, authToken?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/zapier/webhook/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          auth_token: authToken
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing webhook connection:', error);
      return false;
    }
  }
}

// Convenience functions for common webhook triggers
export const zapierWebhooks = {
  // Trigger user registration webhook
  userRegistered: (user: any) => {
    ZapierWebhookManager.getInstance().triggerUserRegistration(user);
  },

  // Trigger waitlist signup webhook
  waitlistJoined: (email: string, referralCode?: string, metadata?: any) => {
    ZapierWebhookManager.getInstance().triggerWaitlistJoined(email, referralCode, metadata);
  },

  // Trigger scan completion webhook
  scanCompleted: (scanData: any, userId?: string) => {
    ZapierWebhookManager.getInstance().triggerScanCompleted(scanData, userId);
  },

  // Trigger referral milestone webhook
  referralMilestone: (userEmail: string, milestoneType: string, referralCount: number) => {
    ZapierWebhookManager.getInstance().triggerReferralMilestone(userEmail, milestoneType, referralCount);
  },

  // Test webhook connection
  testConnection: (webhookUrl: string, authToken?: string) => {
    return ZapierWebhookManager.getInstance().testWebhookConnection(webhookUrl, authToken);
  }
};

// Hook for React components to easily trigger webhooks
export function useZapierWebhooks() {
  return zapierWebhooks;
}

// Automatic webhook triggers for key application events
export function initializeZapierAutoTriggers() {
  console.log('🔧 Initializing Zapier auto-triggers...');
  
  // These would be called from relevant parts of your application
  // For example, in your AuthContext when a user signs up
  // or in your waitlist signup handler
  
  // Example usage:
  // zapierWebhooks.userRegistered(user);
  // zapierWebhooks.waitlistJoined(email, referralCode, { source: 'homepage' });
}