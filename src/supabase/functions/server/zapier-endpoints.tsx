import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from './kv_store.tsx';

const zapierApp = new Hono();

// Add CORS middleware
zapierApp.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to validate webhook signature (optional security)
function validateWebhookSignature(signature: string, payload: string, secret: string): boolean {
  try {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(payload);
    
    // In a real implementation, you'd use crypto.subtle.importKey and crypto.subtle.sign
    // For now, we'll do a simple comparison
    return signature === secret;
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

// Helper function to format user data for Zapier
function formatUserForZapier(user: any, additionalData?: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
    created_at: user.created_at,
    email_confirmed: !!user.email_confirmed_at,
    last_sign_in: user.last_sign_in_at,
    metadata: user.user_metadata || {},
    ...additionalData
  };
}

// Helper function to format waitlist entry for Zapier
function formatWaitlistForZapier(entry: any) {
  return {
    id: entry.id,
    email: entry.email,
    referral_code: entry.referral_code,
    position: entry.position,
    created_at: entry.created_at,
    source: entry.source || 'direct',
    utm_source: entry.utm_source,
    utm_medium: entry.utm_medium,
    utm_campaign: entry.utm_campaign
  };
}

// Webhook endpoint for new user registrations
zapierApp.post('/webhook/user-registered', async (c) => {
  try {
    const body = await c.req.json();
    const { user, webhook_url, auth_token } = body;

    if (!user || !webhook_url) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: user, webhook_url' 
      }, 400);
    }

    // Format user data for Zapier
    const zapierPayload = {
      trigger: 'user_registered',
      timestamp: new Date().toISOString(),
      data: formatUserForZapier(user, {
        registration_source: 'healthscan_app',
        app_version: '1.0.0'
      })
    };

    // Send to Zapier webhook
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth_token && { 'Authorization': `Bearer ${auth_token}` })
      },
      body: JSON.stringify(zapierPayload)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    // Log the webhook activity
    await kv.set(`zapier_log_${Date.now()}`, {
      trigger: 'user_registered',
      user_id: user.id,
      webhook_url,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      message: 'User registration webhook sent successfully',
      webhook_response_status: response.status
    });

  } catch (error) {
    console.error('User registration webhook error:', error);
    
    // Log the error
    await kv.set(`zapier_error_${Date.now()}`, {
      trigger: 'user_registered',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Webhook endpoint for waitlist submissions
zapierApp.post('/webhook/waitlist-joined', async (c) => {
  try {
    const body = await c.req.json();
    const { email, referral_code, webhook_url, auth_token, metadata } = body;

    if (!email || !webhook_url) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: email, webhook_url' 
      }, 400);
    }

    // Get waitlist entry details
    const waitlistEntries = await kv.getByPrefix('waitlist_');
    const userEntry = waitlistEntries.find(entry => entry.email === email);

    if (!userEntry) {
      return c.json({ 
        success: false, 
        error: 'Waitlist entry not found' 
      }, 404);
    }

    // Format waitlist data for Zapier
    const zapierPayload = {
      trigger: 'waitlist_joined',
      timestamp: new Date().toISOString(),
      data: formatWaitlistForZapier({
        ...userEntry,
        ...metadata
      })
    };

    // Send to Zapier webhook
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth_token && { 'Authorization': `Bearer ${auth_token}` })
      },
      body: JSON.stringify(zapierPayload)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    // Log the webhook activity
    await kv.set(`zapier_log_${Date.now()}`, {
      trigger: 'waitlist_joined',
      email,
      webhook_url,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      message: 'Waitlist webhook sent successfully',
      webhook_response_status: response.status
    });

  } catch (error) {
    console.error('Waitlist webhook error:', error);
    
    // Log the error
    await kv.set(`zapier_error_${Date.now()}`, {
      trigger: 'waitlist_joined',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Webhook endpoint for scan completions
zapierApp.post('/webhook/scan-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { scan_data, user_id, webhook_url, auth_token } = body;

    if (!scan_data || !webhook_url) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: scan_data, webhook_url' 
      }, 400);
    }

    // Format scan data for Zapier
    const zapierPayload = {
      trigger: 'scan_completed',
      timestamp: new Date().toISOString(),
      data: {
        id: scan_data.id,
        user_id: user_id,
        product_name: scan_data.product_name,
        scan_type: scan_data.scan_type,
        results_summary: scan_data.results_summary,
        health_score: scan_data.health_score,
        pollutants_detected: scan_data.pollutants_detected || 0,
        nutrients_analyzed: scan_data.nutrients_analyzed || 0,
        created_at: scan_data.created_at,
        scan_source: 'healthscan_app'
      }
    };

    // Send to Zapier webhook
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth_token && { 'Authorization': `Bearer ${auth_token}` })
      },
      body: JSON.stringify(zapierPayload)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    // Log the webhook activity
    await kv.set(`zapier_log_${Date.now()}`, {
      trigger: 'scan_completed',
      scan_id: scan_data.id,
      user_id,
      webhook_url,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      message: 'Scan completion webhook sent successfully',
      webhook_response_status: response.status
    });

  } catch (error) {
    console.error('Scan completion webhook error:', error);
    
    // Log the error
    await kv.set(`zapier_error_${Date.now()}`, {
      trigger: 'scan_completed',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Webhook endpoint for referral achievements
zapierApp.post('/webhook/referral-milestone', async (c) => {
  try {
    const body = await c.req.json();
    const { user_email, milestone_type, referral_count, webhook_url, auth_token } = body;

    if (!user_email || !milestone_type || !webhook_url) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: user_email, milestone_type, webhook_url' 
      }, 400);
    }

    // Format referral milestone data for Zapier
    const zapierPayload = {
      trigger: 'referral_milestone',
      timestamp: new Date().toISOString(),
      data: {
        user_email,
        milestone_type,
        referral_count,
        achievement_level: milestone_type,
        achieved_at: new Date().toISOString(),
        app_source: 'healthscan_referral_program'
      }
    };

    // Send to Zapier webhook
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth_token && { 'Authorization': `Bearer ${auth_token}` })
      },
      body: JSON.stringify(zapierPayload)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    // Log the webhook activity
    await kv.set(`zapier_log_${Date.now()}`, {
      trigger: 'referral_milestone',
      user_email,
      milestone_type,
      webhook_url,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      message: 'Referral milestone webhook sent successfully',
      webhook_response_status: response.status
    });

  } catch (error) {
    console.error('Referral milestone webhook error:', error);
    
    // Log the error
    await kv.set(`zapier_error_${Date.now()}`, {
      trigger: 'referral_milestone',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Endpoint to test webhook connectivity
zapierApp.post('/webhook/test', async (c) => {
  try {
    const body = await c.req.json();
    const { webhook_url, auth_token } = body;

    if (!webhook_url) {
      return c.json({ 
        success: false, 
        error: 'webhook_url is required' 
      }, 400);
    }

    // Send test payload to Zapier
    const testPayload = {
      trigger: 'test_connection',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from HealthScan',
        test_id: `test_${Date.now()}`,
        app_name: 'HealthScan',
        version: '1.0.0'
      }
    };

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth_token && { 'Authorization': `Bearer ${auth_token}` })
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      throw new Error(`Test webhook failed: ${response.status} ${response.statusText}`);
    }

    return c.json({ 
      success: true, 
      message: 'Test webhook sent successfully',
      webhook_response_status: response.status,
      test_payload: testPayload
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Get webhook logs for debugging
zapierApp.get('/webhook/logs', async (c) => {
  try {
    const logs = await kv.getByPrefix('zapier_log_');
    const errors = await kv.getByPrefix('zapier_error_');
    
    // Sort by timestamp (newest first)
    const allLogs = [...logs, ...errors].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({
      success: true,
      logs: allLogs.slice(0, 50), // Return last 50 entries
      total_logs: logs.length,
      total_errors: errors.length
    });

  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Save/update Zapier configuration
zapierApp.post('/webhook/config', async (c) => {
  try {
    const body = await c.req.json();
    const { config_name, webhook_url, auth_token, triggers, enabled } = body;

    if (!config_name || !webhook_url) {
      return c.json({ 
        success: false, 
        error: 'config_name and webhook_url are required' 
      }, 400);
    }

    const config = {
      config_name,
      webhook_url,
      auth_token: auth_token || null,
      triggers: triggers || [],
      enabled: enabled !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`zapier_config_${config_name}`, config);

    return c.json({
      success: true,
      message: 'Zapier configuration saved successfully',
      config
    });

  } catch (error) {
    console.error('Error saving Zapier config:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Get Zapier configurations
zapierApp.get('/webhook/config', async (c) => {
  try {
    const configs = await kv.getByPrefix('zapier_config_');
    
    return c.json({
      success: true,
      configurations: configs
    });

  } catch (error) {
    console.error('Error fetching Zapier configs:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Delete Zapier configuration
zapierApp.delete('/webhook/config/:configName', async (c) => {
  try {
    const configName = c.req.param('configName');
    await kv.del(`zapier_config_${configName}`);

    return c.json({
      success: true,
      message: 'Zapier configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Zapier config:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export { zapierApp };