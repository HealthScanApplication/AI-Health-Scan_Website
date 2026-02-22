/**
 * Test script to verify email resend functionality
 * Run with: deno run --allow-net test-email-resend.ts
 */
export {}; // make this a module to avoid global scope redeclaration errors

const SUPABASE_PROJECT_ID = 'ljqlvvbktgiflkxywsld';
const API_BASE_URL = `https://${SUPABASE_PROJECT_ID}.functions.supabase.co`;
const ENDPOINT = `${API_BASE_URL}/make-server-ed0fe4c2/admin/resend-welcome-email`;

// Test email address
const TEST_EMAIL = 'test@example.com';

// You'll need to provide a valid access token from your Supabase auth
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

async function testEmailResend() {
  console.log('🧪 Testing Email Resend Functionality');
  console.log('=====================================\n');

  if (!ACCESS_TOKEN) {
    console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set');
    console.log('\nTo test, run:');
    console.log('SUPABASE_ACCESS_TOKEN=your_token npx ts-node test-email-resend.ts\n');
    process.exit(1);
  }

  try {
    console.log(`📧 Sending test email to: ${TEST_EMAIL}`);
    console.log(`🔑 Using access token: ${ACCESS_TOKEN.substring(0, 20)}...`);
    console.log(`🌐 Endpoint: ${ENDPOINT}\n`);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        recordId: 'test-record-id'
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`📋 Response Body:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Email resend endpoint is working!');
      console.log('📧 Email should be sent to:', data.email);
    } else {
      console.log('\n❌ Email resend failed');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error testing email resend:', error);
  }
}

testEmailResend();
