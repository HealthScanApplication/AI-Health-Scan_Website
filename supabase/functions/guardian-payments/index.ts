// Guardian offer payments on the platform Stripe account.
//   action "intent":  first paid purchase → PaymentIntent that saves the card for later (setup_future_usage).
//   action "confirm": client tells us the PaymentIntent finished → we verify with Stripe and mark it paid.
//   action "upsell":  one click → charge the saved card off-session for the next offer (30% off inside the window).
//   Stripe webhook (stripe-signature header): payment_intent.succeeded / payment_failed keep rows in sync.
// Prices always come from guide_offers, never from the browser.
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2025-02-24.acacia', httpClient: Stripe.createFetchHttpClient() });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const UPSELL_WINDOW_MS = 15 * 60 * 1000; // a little longer than the 10-minute on-page timer
const UPSELL_RATE = 0.3;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const fail = (message: string, status = 400) => json({ error: message }, status);

async function loadOffer(offerId: string) {
  const { data, error } = await db.from('guide_offers').select('id, guide_id, title, price_cents, currency, access_model, status').eq('id', offerId).single();
  if (error || !data) throw new Error('Offer not found.');
  if (data.status !== 'published' || data.access_model !== 'paid' || !(data.price_cents > 0)) throw new Error('This offer is not for sale.');
  return data;
}
const couponFor = async (guideId: string) => {
  const { data } = await db.from('guide_profiles').select('display_name').eq('user_id', guideId).single();
  const first = String(data?.display_name || 'Guardian').split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10) || 'GUARDIAN';
  return `${first}30`;
};

async function customerFor(email: string, name?: string) {
  const found = await stripe.customers.list({ email, limit: 1 });
  return found.data[0] ?? await stripe.customers.create({ email, name: name || undefined });
}

async function markFromIntent(pi: Stripe.PaymentIntent) {
  const status = pi.status === 'succeeded' ? 'paid' : pi.status === 'requires_action' ? 'requires_action' : pi.status === 'canceled' || pi.status === 'requires_payment_method' ? 'failed' : 'pending';
  await db.from('guardian_purchases').update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null }).eq('stripe_payment_intent_id', pi.id);
  return status;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Method not allowed', 405);
  if (!Deno.env.get('STRIPE_SECRET_KEY')) return fail('Payments are not configured yet.', 503);
  // Safety: live keys only when explicitly allowed (ALLOW_LIVE_PAYMENTS=true), so staging can never take real money by accident.
  if (/_live_/.test(Deno.env.get('STRIPE_SECRET_KEY')!) && Deno.env.get('ALLOW_LIVE_PAYMENTS') !== 'true') return fail('Live payments are switched off on this environment.', 503);

  // Stripe webhook
  const signature = req.headers.get('stripe-signature');
  if (signature) {
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) return fail('Webhook secret missing', 500);
    let event: Stripe.Event;
    try { event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret); }
    catch { return fail('Bad signature', 400); }
    if (event.type.startsWith('payment_intent.')) await markFromIntent(event.data.object as Stripe.PaymentIntent);
    return json({ received: true });
  }

  let body: any;
  try { body = await req.json(); } catch { return fail('Invalid JSON'); }
  try {
    if (body.action === 'intent') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email.');
      const offer = await loadOffer(String(body.offer_id || ''));
      const customer = await customerFor(email, body.name);
      const pi = await stripe.paymentIntents.create({
        amount: offer.price_cents, currency: offer.currency.toLowerCase(), customer: customer.id,
        setup_future_usage: 'off_session', automatic_payment_methods: { enabled: true },
        description: offer.title, receipt_email: email, metadata: { offer_id: offer.id, guide_id: offer.guide_id },
      });
      const { data, error } = await db.from('guardian_purchases').insert({ guide_id: offer.guide_id, offer_id: offer.id, customer_email: email, customer_name: body.name || null, stripe_customer_id: customer.id, stripe_payment_intent_id: pi.id, amount_cents: offer.price_cents, list_amount_cents: offer.price_cents, currency: offer.currency }).select('id').single();
      if (error) throw error;
      return json({ purchase_id: data.id, client_secret: pi.client_secret, amount_cents: offer.price_cents, currency: offer.currency });
    }

    if (body.action === 'confirm') {
      const { data: purchase } = await db.from('guardian_purchases').select('stripe_payment_intent_id').eq('id', body.purchase_id).single();
      if (!purchase?.stripe_payment_intent_id) return fail('Purchase not found.', 404);
      const pi = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id);
      return json({ status: await markFromIntent(pi) });
    }

    if (body.action === 'upsell') {
      const { data: previous } = await db.from('guardian_purchases').select('*').eq('id', body.previous_purchase_id).single();
      if (!previous || previous.status !== 'paid' || !previous.paid_at) return fail('Finish your first purchase before adding more.');
      const offer = await loadOffer(String(body.offer_id || ''));
      if (offer.guide_id !== previous.guide_id) return fail('This offer belongs to another Guardian.');
      const { data: dup } = await db.from('guardian_purchases').select('id').eq('previous_purchase_id', previous.id).eq('offer_id', offer.id).eq('status', 'paid').maybeSingle();
      if (dup) return json({ purchase_id: dup.id, status: 'paid' });
      const pi0 = await stripe.paymentIntents.retrieve(previous.stripe_payment_intent_id);
      const paymentMethod = typeof pi0.payment_method === 'string' ? pi0.payment_method : pi0.payment_method?.id;
      if (!paymentMethod) return fail('No saved card for this order.');
      const inWindow = Date.now() - new Date(previous.paid_at).getTime() < UPSELL_WINDOW_MS;
      const code = inWindow ? await couponFor(offer.guide_id) : null;
      const amount = inWindow ? Math.round(offer.price_cents * (1 - UPSELL_RATE)) : offer.price_cents;
      let pi: Stripe.PaymentIntent;
      try {
        pi = await stripe.paymentIntents.create({ amount, currency: offer.currency.toLowerCase(), customer: previous.stripe_customer_id, payment_method: paymentMethod, off_session: true, confirm: true, description: offer.title, receipt_email: previous.customer_email, metadata: { offer_id: offer.id, guide_id: offer.guide_id, upsell_of: previous.id, discount_code: code ?? '' } });
      } catch (err: any) {
        // Card needs authentication (3DS) or was declined: hand the intent back so the page can finish it.
        pi = err?.raw?.payment_intent ?? null;
        if (!pi) throw err;
      }
      const { data, error } = await db.from('guardian_purchases').insert({ guide_id: offer.guide_id, offer_id: offer.id, previous_purchase_id: previous.id, customer_email: previous.customer_email, customer_name: previous.customer_name, stripe_customer_id: previous.stripe_customer_id, stripe_payment_intent_id: pi.id, amount_cents: amount, list_amount_cents: offer.price_cents, currency: offer.currency, discount_code: code }).select('id').single();
      if (error) throw error;
      const status = await markFromIntent(pi);
      return json({ purchase_id: data.id, status, client_secret: status === 'paid' ? null : pi.client_secret, amount_cents: amount, discount_code: code });
    }
    return fail('Unknown action.');
  } catch (err: any) {
    console.error('guardian-payments', err?.message || err);
    return fail(err?.message || 'Payment failed.', 500);
  }
});
