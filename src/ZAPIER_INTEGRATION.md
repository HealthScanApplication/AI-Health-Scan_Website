# HealthScan Zapier Integration

Connect HealthScan with 6,000+ apps through Zapier to automate your workflows.

## 🚀 Quick Start

1. **Access Admin Dashboard**
   - Log in to HealthScan as an admin user
   - Navigate to Admin Dashboard → Zapier tab

2. **Get Your Zapier Webhook URL**
   - Create a new Zap in Zapier
   - Choose "Webhooks by Zapier" as trigger
   - Select "Catch Hook" event
   - Copy the provided webhook URL

3. **Configure HealthScan Integration**
   - Click "Add Integration" in HealthScan
   - Paste your webhook URL
   - Select which events to trigger
   - Save and test the connection

## 📡 Available Webhooks

### User Registration
**Trigger:** `user_registered`
**When:** New user creates an account

```json
{
  "trigger": "user_registered",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "user_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z",
    "email_confirmed": false,
    "metadata": {
      "signup_source": "homepage"
    }
  }
}
```

### Waitlist Signup
**Trigger:** `waitlist_joined`
**When:** Someone joins the waitlist

```json
{
  "trigger": "waitlist_joined",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "email": "sarah@example.com",
    "referral_code": "hs_abc123",
    "position": 2847,
    "source": "referral",
    "utm_source": "facebook",
    "total_waitlist": 2847
  }
}
```

### Health Scan Completed
**Trigger:** `scan_completed`
**When:** User completes a health scan

```json
{
  "trigger": "scan_completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "scan_789ghi",
    "user_id": "user_123abc",
    "product_name": "Organic Apple",
    "health_score": 85,
    "pollutants_detected": 0,
    "nutrients_analyzed": 12
  }
}
```

### Referral Milestone
**Trigger:** `referral_milestone`
**When:** User reaches referral goals

```json
{
  "trigger": "referral_milestone",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_email": "john@example.com",
    "milestone_type": "5_referrals",
    "referral_count": 5,
    "achieved_at": "2024-01-15T10:30:00Z"
  }
}
```

## 🔧 Server Endpoints

All webhook endpoints are available at:
`https://[project-id].supabase.co/functions/v1/make-server-ed0fe4c2/zapier/`

- `POST /webhook/user-registered` - Trigger user registration webhook
- `POST /webhook/waitlist-joined` - Trigger waitlist signup webhook  
- `POST /webhook/scan-completed` - Trigger scan completion webhook
- `POST /webhook/referral-milestone` - Trigger referral milestone webhook
- `POST /webhook/test` - Test webhook connectivity
- `GET /webhook/logs` - View webhook activity logs
- `POST /webhook/config` - Save webhook configuration
- `GET /webhook/config` - Get webhook configurations

## 💡 Popular Use Cases

### Email Marketing
- **ConvertKit:** Add waitlist signups to email sequences
- **Mailchimp:** Create targeted campaigns based on health scores
- **ActiveCampaign:** Trigger automation workflows

### CRM Integration
- **HubSpot:** Create contacts and deals from user signups
- **Salesforce:** Log health scan results as activities
- **Pipedrive:** Track referral program performance

### Communication
- **Slack:** Get real-time notifications of new signups
- **Discord:** Post scan achievements to community channels
- **SMS:** Send milestone rewards via Twilio

### Data & Analytics
- **Google Sheets:** Log all activity for analysis
- **Airtable:** Track user engagement metrics
- **Zapier Tables:** Build custom dashboards

## 🛠️ Programming Integration

### React Hook Usage
```tsx
import { useZapierWebhooks } from './utils/zapierHelpers';

function MyComponent() {
  const zapier = useZapierWebhooks();
  
  const handleUserSignup = async (user) => {
    // Your signup logic...
    
    // Trigger Zapier webhook
    zapier.userRegistered(user);
  };
}
```

### Direct Integration
```tsx
import { zapierWebhooks } from './utils/zapierHelpers';

// Trigger webhooks anywhere in your app
zapierWebhooks.waitlistJoined(email, referralCode, metadata);
zapierWebhooks.scanCompleted(scanData, userId);
zapierWebhooks.referralMilestone(email, milestoneType, count);
```

## 🔒 Security & Authentication

### Webhook Security
- All webhooks use HTTPS
- Optional Bearer token authentication
- Request signature validation available
- Rate limiting and error handling

### Access Control
- Admin-only configuration interface
- Server-side webhook validation
- Encrypted credential storage

## 🐛 Troubleshooting

### Common Issues

**Webhook not receiving data?**
- Verify webhook URL starts with `https://hooks.zapier.com`
- Check that integration is enabled in HealthScan
- Ensure correct triggers are selected
- Test connection using built-in test button

**Authentication errors?**
- Verify webhook URL is current and not expired
- Check Zap is turned on in Zapier
- Remove and re-add auth token if using one

**Data formatting issues?**
- Reference payload examples above
- Use Zapier's formatter tools for data transformation
- Check webhook activity logs for debugging

### Debug Tools
- **Activity Logs:** View all webhook attempts in admin dashboard
- **Test Button:** Send sample data to verify connectivity
- **Error Tracking:** Detailed error logs with timestamps
- **Payload Inspector:** View exact data sent to webhooks

## 📞 Support

For help with Zapier integration:

1. Check the Setup Guide in HealthScan admin dashboard
2. Review webhook activity logs for errors
3. Test connections using built-in tools
4. Contact support for custom webhook requirements

## 🔄 Automatic Triggers

Webhooks are automatically triggered for:
- ✅ Waitlist signups (already integrated)
- 🔄 User registrations (integrate in AuthContext)
- 🔄 Scan completions (integrate in scan components)
- 🔄 Referral milestones (integrate in referral system)

The waitlist integration is already working! Other triggers can be added by importing `zapierWebhooks` and calling the appropriate function in your components.