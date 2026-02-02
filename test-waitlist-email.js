/**
 * Test script to send a welcome email to waitlist@healthscan.live
 * Run with: node test-waitlist-email.js
 */

const RESEND_API_KEY = 're_L1onCe4R_NhaEwgcdukwgz9UP3DYEFiR4';
const TEST_EMAIL = 'waitlist@healthscan.live';
const POSITION = 1;
const REFERRAL_CODE = 'TEST-REFERRAL-CODE';

async function sendWaitlistEmail() {
  console.log('📧 Testing Waitlist Welcome Email');
  console.log('==================================\n');

  try {
    console.log(`Sending welcome email to: ${TEST_EMAIL}`);
    console.log(`Queue Position: #${POSITION}`);
    console.log(`Referral Code: ${REFERRAL_CODE}\n`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@healthscan.live',
        to: TEST_EMAIL,
        subject: `Welcome to HealthScan! You're #${POSITION} in queue`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header with gradient background -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                HealthScan
              </h1>
              <p style="color: #cbd5e1; font-size: 14px; margin: 8px 0 0 0;">AI-Powered Health Scanning</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <!-- Welcome Message -->
              <h2 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
                Welcome to HealthScan!
              </h2>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 32px 0; line-height: 1.6;">
                You're on your way to early access to our revolutionary AI-powered health scanner.
              </p>

              <!-- Queue Position Card -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0284c7; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                <p style="color: #0c4a6e; font-size: 13px; margin: 0 0 8px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                  Queue Position
                </p>
                <p style="color: #0284c7; font-size: 32px; font-weight: 700; margin: 0;">
                  #${POSITION}
                </p>
              </div>

              <!-- Key Info -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                <p style="color: #1e293b; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>Launch Date:</strong> February 27th, 2026<br>
                  <strong>Status:</strong> Early Access Confirmed
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="https://healthscan.live/confirm?email=${encodeURIComponent(TEST_EMAIL)}" 
                   style="display: inline-block; background: #0284c7; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background 0.2s;">
                  Confirm Email Address
                </a>
              </div>

              <!-- Referral Section -->
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h3 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  Earn Early Access Faster
                </h3>
                <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                  Share your referral code with friends. Each person who signs up moves you up in the queue!
                </p>
                <div style="background: white; border-radius: 6px; padding: 12px; margin-bottom: 12px; border: 1px solid #fcd34d;">
                  <p style="color: #92400e; font-size: 12px; margin: 0 0 4px 0; font-weight: 500;">Your Referral Code</p>
                  <p style="color: #b45309; font-size: 18px; font-weight: 700; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                    ${REFERRAL_CODE}
                  </p>
                </div>
                <a href="https://healthscan.live/refer?code=${REFERRAL_CODE}" 
                   style="display: inline-block; background: #b45309; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Share Link
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
                  Questions? Reply to this email or visit our website.
                </p>
                <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                  © 2026 HealthScan. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
Welcome to HealthScan! 🌱

You're #${POSITION} in the queue 📍

You're so close to getting early access to HealthScan - our revolutionary AI-powered health scanner launching February 27th, 2026.

All you have to do is confirm your email and you're all set!

Confirm: https://healthscan.live/confirm?email=${encodeURIComponent(TEST_EMAIL)}

🚀 Move Up Faster!

Share your referral link with friends. For each person who joins using your code, you'll move up in the queue!

Your referral code: ${REFERRAL_CODE}
Share: https://healthscan.live/refer?code=${REFERRAL_CODE}

Questions? Reply to this email!

HealthScan Team
        `
      })
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Welcome email sent successfully!');
      console.log(`📧 Email ID: ${data.id}`);
      console.log(`📬 Check ${TEST_EMAIL} for the welcome email`);
      console.log(`\n📊 Email Details:`);
      console.log(`   - To: ${TEST_EMAIL}`);
      console.log(`   - Queue Position: #${POSITION}`);
      console.log(`   - Referral Code: ${REFERRAL_CODE}`);
    } else {
      console.log('\n❌ Failed to send welcome email');
      console.log(`Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Error sending welcome email:', error.message);
  }
}

sendWaitlistEmail();
