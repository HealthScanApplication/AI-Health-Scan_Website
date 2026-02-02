/**
 * Test script to send a test email via Resend API
 * Run with: node test-resend-email.js
 */

const RESEND_API_KEY = 're_L1onCe4R_NhaEwgcdukwgz9UP3DYEFiR4';
const TEST_EMAIL = 'test@healthscan.live';

async function sendTestEmail() {
  console.log('📧 Testing Resend Email Service');
  console.log('================================\n');

  try {
    console.log(`Sending test email to: ${TEST_EMAIL}`);
    console.log(`Using Resend API key: ${RESEND_API_KEY.substring(0, 20)}...\n`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@healthscan.live',
        to: TEST_EMAIL,
        subject: '🧪 HealthScan Test Email',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1>Test Email from HealthScan</h1>
            <p>This is a test email to verify the Resend email service is working correctly.</p>
            <p><strong>Status:</strong> ✅ Email service is operational</p>
            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        `,
        text: `
Test Email from HealthScan

This is a test email to verify the Resend email service is working correctly.

Status: Email service is operational

Sent at: ${new Date().toISOString()}
        `
      })
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Test email sent successfully!');
      console.log(`📧 Email ID: ${data.id}`);
      console.log(`📬 Check ${TEST_EMAIL} for the test email`);
    } else {
      console.log('\n❌ Failed to send test email');
      console.log(`Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Error sending test email:', error.message);
  }
}

sendTestEmail();
