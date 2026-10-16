// Explicitly staging-only runtime smoke test. Never reads server credentials.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const project = 'mofhvoudjxinvpplsytd';
const endpoint = `https://${project}.supabase.co/functions/v1/guardian-payments`;
const owner = '67ac6963-dfad-4044-b5d0-376d6ceb7f31';
const offer = randomUUID();
const slug = `qa-stripe-${offer}`;
const declined = process.env.QA_PAYMENT_CASE === 'decline';
function sql(query) {
  return execFileSync('supabase', ['db', 'query', '--linked', '--project-ref', project, query, '--output', 'json'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
}
async function action(body) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(`Staging endpoint HTTP ${response.status}: ${data.error || 'request failed'}`);
  return data;
}
let created = false;
try {
  const html = await (await fetch('https://routine3.com')).text();
  const main = html.match(/src="([^"]+\.js)"/)[1];
  const index = await (await fetch(new URL(main, 'https://routine3.com'))).text();
  const chunk = index.match(/GuidePortal-[A-Za-z0-9_-]+\.js/)[0];
  const bundle = await (await fetch(`https://routine3.com/assets/${chunk}`)).text();
  const pk = bundle.match(/pk_test_[A-Za-z0-9]+/)?.[0];
  if (!pk || !bundle.includes('Live payments are disabled pending full staging verification')) throw new Error('Missing test key or production hold');
  sql(`begin; insert into public.guide_profiles(user_id,slug,display_name,status) values('${owner}','${slug}','QA Stripe runtime','submitted'); insert into public.guide_offers(id,guide_id,kind,title,status,access_model,price_cents,currency) values('${offer}','${owner}','ebook','QA staging only','published','paid',100,'GBP'); commit;`);
  created = true;
  console.log('Fixture visibility:', sql(`select id, status, access_model from public.guide_offers where id='${offer}';`));
  const intent = await action({ action: 'intent', offer_id: offer, email: `guardian-qa-${offer}@example.invalid`, name: 'Staging QA' });
  console.log(JSON.stringify({ check: 'server_intent_creation', passed: true, amount: intent.amount_cents, currency: intent.currency }));
  const pi = intent.client_secret?.split('_secret_')[0];
  if (!pi?.startsWith('pi_')) throw new Error('Missing payment intent client secret');
  const url = new URL(`https://api.stripe.com/v1/payment_intents/${pi}`);
  url.searchParams.set('client_secret', intent.client_secret);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${pk}` } });
  const data = await response.json();
  console.log(JSON.stringify({ check: 'public_server_key_pair', http: response.status, livemode: data.livemode, status: data.status, errorType: data.error?.type, errorCode: data.error?.code }));
  if (!response.ok || data.livemode !== false) throw new Error('Could not prove a matching test-mode key pair; no payment attempted');
  const confirmation = await fetch(`https://api.stripe.com/v1/payment_intents/${pi}/confirm`, {
    method: 'POST', headers: { Authorization: `Bearer ${pk}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_secret: intent.client_secret, payment_method: declined ? 'pm_card_visa_chargeDeclined' : 'pm_card_visa', return_url: 'https://routine3.com/guardians' }),
  });
  const confirmed = await confirmation.json();
  console.log(JSON.stringify({ check: 'test_card_confirmation', http: confirmation.status, livemode: confirmed.livemode, status: confirmed.status, errorType: confirmed.error?.type, errorCode: confirmed.error?.code }));
  if (declined) {
    if (confirmation.status !== 402 || confirmed.error?.code !== 'card_declined') throw new Error('Expected Stripe test decline');
    let webhookFailed = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const state = JSON.parse(sql(`select status, paid_at is null as unpaid from public.guardian_purchases where offer_id='${offer}';`));
      if (state.rows?.[0]?.status === 'failed' && state.rows[0].unpaid) { webhookFailed = true; break; }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log(JSON.stringify({ check: 'webhook_failed_before_client_confirmation', passed: webhookFailed }));
    const result = await action({ action: 'confirm', purchase_id: intent.purchase_id });
    if (result.status !== 'failed') throw new Error('Declined payment was not recorded as failed');
    console.log(JSON.stringify({ check: 'decline_not_fulfilled', passed: true, status: result.status }));
    if (!webhookFailed) throw new Error('Declined test payment did not reconcile through webhook within the bounded wait');
  } else {
  if (!confirmation.ok || confirmed.status !== 'succeeded' || confirmed.livemode !== false) throw new Error('Test confirmation did not succeed');
  let webhookPaid = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    const state = JSON.parse(sql(`select status, paid_at is not null as paid_at_set from public.guardian_purchases where offer_id='${offer}';`));
    if (state.rows?.[0]?.status === 'paid' && state.rows[0].paid_at_set) { webhookPaid = true; break; }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log(JSON.stringify({ check: 'webhook_paid_before_client_confirmation', passed: webhookPaid }));
  const verified = await action({ action: 'confirm', purchase_id: intent.purchase_id });
  console.log(JSON.stringify({ check: 'server_confirmation', status: verified.status, passed: verified.status === 'paid' }));
  if (verified.status !== 'paid') throw new Error('Server confirmation did not verify the successful test purchase as paid');
  if (!webhookPaid) throw new Error('Stripe test payment succeeded, but webhook did not reconcile the purchase within the bounded wait');
  }
} catch (error) {
  // Only emit our bounded error text, never Stripe bodies/client secrets.
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (created) {
    sql(`begin; delete from public.guardian_purchases where offer_id='${offer}'; delete from public.guide_offers where id='${offer}' and guide_id='${owner}'; delete from public.guide_profiles where user_id='${owner}' and slug='${slug}'; commit;`);
    console.log(JSON.stringify({ check: 'staging_fixture_cleanup', passed: true, offer }));
  }
}
