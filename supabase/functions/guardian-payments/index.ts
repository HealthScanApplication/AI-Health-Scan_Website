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
const UPSELL_WINDOW_MS = 10 * 60 * 1000;
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
  // A completed payment is terminal. Conditional writes also protect against a
  // concurrent confirm/webhook, not just replayed events in one request.
  const update = status === 'paid'
    ? db.from('guardian_purchases').update({ status, paid_at: new Date().toISOString() }).eq('stripe_payment_intent_id', pi.id).is('paid_at', null)
    : db.from('guardian_purchases').update({ status }).eq('stripe_payment_intent_id', pi.id).neq('status', 'paid');
  const { error } = await update;
  if (error) throw error;
  const { data: purchase, error: readError } = await db.from('guardian_purchases').select('status').eq('stripe_payment_intent_id', pi.id).maybeSingle();
  if (readError) throw readError;
  return purchase?.status ?? status;
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
    try {
      if (event.type.startsWith('payment_intent.')) {
        // Stripe can deliver events out of order. Reconcile the current intent,
        // rather than replacing current state with an old event snapshot.
        const current = await stripe.paymentIntents.retrieve((event.data.object as Stripe.PaymentIntent).id);
        await markFromIntent(current);
      }
      return json({ received: true });
    } catch (err: any) {
      console.error('guardian-payments webhook', err?.message || err);
      return fail('Payment update could not be saved. Stripe will retry.', 500);
    }
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
      const { data: purchase, error } = await db.from('guardian_purchases').select('stripe_payment_intent_id').eq('id', body.purchase_id).single();
      if (error) throw error;
      if (!purchase?.stripe_payment_intent_id) return fail('Purchase not found.', 404);
      const pi = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id);
      const status = await markFromIntent(pi);
      const { data: updated, error: updatedError } = await db.from('guardian_purchases').select('paid_at').eq('id', body.purchase_id).single();
      if (updatedError) throw updatedError;
      return json({ status, discount_ends_at: updated?.paid_at ? new Date(updated.paid_at).getTime() + UPSELL_WINDOW_MS : null });
    }

    if (body.action === 'upsell') {
      const { data: previous, error: previousError } = await db.from('guardian_purchases').select('*').eq('id', body.previous_purchase_id).single();
      if (previousError) throw previousError;
      if (!previous || previous.status !== 'paid' || !previous.paid_at) return fail('Finish your first purchase before adding more.');
      const offer = await loadOffer(String(body.offer_id || ''));
      if (offer.guide_id !== previous.guide_id) return fail('This offer belongs to another Guardian.');
      const { data: existing, error: existingError } = await db.from('guardian_purchases').select('*').eq('previous_purchase_id', previous.id).eq('offer_id', offer.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
        const status = await markFromIntent(intent);
        return json({ purchase_id: existing.id, status, client_secret: status === 'paid' ? null : intent.client_secret, amount_cents: existing.amount_cents, discount_code: existing.discount_code });
      }
      // Recovery after a lost response is read-only: never turn a status check
      // into a new off-session charge the customer has not just approved.
      // An absent row is not proof of failure: the original charge may still be
      // in flight, or Stripe may have accepted it before a database write failed.
      if (body.lookup_only === true) return json({ purchase_id: '', status: 'pending', client_secret: null });
      const pi0 = await stripe.paymentIntents.retrieve(previous.stripe_payment_intent_id, { expand: ['latest_charge'] });
      // Bank redirects are single-use. With setup_future_usage, Stripe creates
      // a reusable SEPA method on the successful charge for later payments.
      const details = typeof pi0.latest_charge === 'object' ? pi0.latest_charge?.payment_method_details : null;
      const generatedSepa = details?.bancontact?.generated_sepa_debit ?? details?.ideal?.generated_sepa_debit ?? details?.sofort?.generated_sepa_debit;
      const reusableMethod = generatedSepa ?? pi0.payment_method;
      const paymentMethod = typeof reusableMethod === 'string' ? reusableMethod : reusableMethod?.id;
      if (!paymentMethod) return fail('No saved card for this order.');
      const elapsed = Date.now() - new Date(previous.paid_at).getTime();
      const inWindow = elapsed >= 0 && elapsed < UPSELL_WINDOW_MS;
      const code = inWindow ? await couponFor(offer.guide_id) : null;
      const amount = inWindow ? Math.round(offer.price_cents * (1 - UPSELL_RATE)) : offer.price_cents;
      if (body.expected_amount_cents !== undefined && body.expected_amount_cents !== amount) {
        return fail('Offer price changed. Review the updated price before paying.', 409);
      }
      let pi: Stripe.PaymentIntent;
      try {
        pi = await stripe.paymentIntents.create({ amount, currency: offer.currency.toLowerCase(), customer: previous.stripe_customer_id, payment_method: paymentMethod, automatic_payment_methods: { enabled: true, allow_redirects: 'never' }, off_session: true, confirm: true, description: offer.title, receipt_email: previous.customer_email, metadata: { offer_id: offer.id, guide_id: offer.guide_id, upsell_of: previous.id, discount_code: code ?? '' } }, { idempotencyKey: `guardian-upsell:${previous.id}:${offer.id}` });
      } catch (err: any) {
        // Card needs authentication (3DS) or was declined: hand the intent back so the page can finish it.
        pi = err?.raw?.payment_intent ?? null;
        if (!pi) throw err;
      }
      const { data, error } = await db.from('guardian_purchases').insert({ guide_id: offer.guide_id, offer_id: offer.id, previous_purchase_id: previous.id, customer_email: previous.customer_email, customer_name: previous.customer_name, stripe_customer_id: previous.stripe_customer_id, stripe_payment_intent_id: pi.id, amount_cents: amount, list_amount_cents: offer.price_cents, currency: offer.currency, discount_code: code }).select('id').single();
      // A concurrent request can insert the same idempotent intent first. The
      // existing unique Stripe intent constraint is the final database guard.
      let purchase = data;
      if (error?.code === '23505') {
        const recovered = await db.from('guardian_purchases').select('id').eq('stripe_payment_intent_id', pi.id).single();
        if (recovered.error) throw recovered.error;
        purchase = recovered.data;
      } else if (error) throw error;
      if (!purchase) throw new Error('Payment order could not be saved. Please check its status before retrying.');
      const status = await markFromIntent(pi);
      return json({ purchase_id: purchase.id, status, client_secret: status === 'paid' ? null : pi.client_secret, amount_cents: amount, discount_code: code });
    }
    return fail('Unknown action.');
  } catch (err: any) {
    console.error('guardian-payments', err?.message || err);
    return fail(err?.message || 'Payment failed.', 500);
  }
});
