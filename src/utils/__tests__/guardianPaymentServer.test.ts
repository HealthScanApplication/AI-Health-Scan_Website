// Execute the Edge Function with only its external Stripe/Postgres boundaries replaced.
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { describe, expect, it } from 'vitest';

type Row = Record<string, any>;
function server(options: { status?: string; updateError?: boolean } = {}) {
  const rows: Row[] = [{ id: 'first', guide_id: 'guardian', offer_id: 'initial', status: 'paid', paid_at: '2026-10-16T12:00:00.000Z', stripe_payment_intent_id: 'pi_first', stripe_customer_id: 'cus_1', customer_email: 'qa@example.invalid' }];
  const intents = new Map<string, Row>([['pi_first', { id: 'pi_first', status: 'succeeded', payment_method: 'pm_saved' }]]);
  const idempotency = new Map<string, Row>();
  let charges = 0;
  const db = { from(table: string) {
    let action = 'select', payload: Row, filters: ((r: Row) => boolean)[] = [], max = Infinity;
    const query: any = {
      select() { return query; }, eq(k: string, v: any) { filters.push(r => r[k] === v); return query; },
      neq(k: string, v: any) { filters.push(r => r[k] !== v); return query; },
      is(k: string, v: any) { filters.push(r => (r[k] ?? null) === v); return query; },
      order() { return query; }, limit(n: number) { max = n; return query; },
      update(value: Row) { action = 'update'; payload = value; return query; },
      insert(value: Row) { action = 'insert'; payload = value; return query; },
      single() { return run(true); }, maybeSingle() { return run(true); },
      then(resolve: any, reject: any) { return run(false).then(resolve, reject); },
    };
    async function run(single: boolean) {
      if (table === 'guide_offers') return { data: { id: 'upsell', guide_id: 'guardian', title: 'Next offer', price_cents: 1000, currency: 'GBP', status: 'published', access_model: 'paid' }, error: null };
      if (table === 'guide_profiles') return { data: { display_name: 'Guardian QA' }, error: null };
      if (action === 'insert') {
        if (rows.some(r => r.stripe_payment_intent_id === payload.stripe_payment_intent_id)) return { data: null, error: { code: '23505', message: 'duplicate intent' } };
        const row = { id: `purchase_${rows.length}`, status: 'pending', paid_at: null, ...payload };
        rows.push(row); return { data: single ? row : [row], error: null };
      }
      const found = rows.filter(r => filters.every(f => f(r))).slice(0, max);
      if (action === 'update') {
        if (options.updateError) return { data: null, error: { message: 'database unavailable' } };
        found.forEach(r => Object.assign(r, payload));
      }
      return { data: single ? found[0] ?? null : found, error: null };
    }
    return query;
  } };
  const stripe = {
    paymentIntents: {
      async retrieve(id: string, params: Row = {}) {
        const intent = intents.get(id);
        return intent?.latest_charge && typeof intent.latest_charge === 'object' && !params.expand?.includes('latest_charge')
          ? { ...intent, latest_charge: 'ch_saved' } : intent;
      },
      async create(params: Row, request: Row = {}) {
        const existing = idempotency.get(request.idempotencyKey);
        if (existing) return existing;
        charges++;
        const intent = { id: `pi_${charges}`, status: options.status ?? 'processing', client_secret: 'test_secret', amount: params.amount, ...params };
        intents.set(intent.id, intent);
        if (request.idempotencyKey) idempotency.set(request.idempotencyKey, intent);
        return intent;
      },
    },
    webhooks: { async constructEventAsync(body: string) { return JSON.parse(body); } },
  };
  let handler: (r: Request) => Promise<Response>;
  const source = readFileSync(new URL('../../../supabase/functions/guardian-payments/index.ts', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  const code = transformSync(source, { loader: 'ts', target: 'es2022' }).code;
  const FakeStripe: any = function () { return stripe; };
  FakeStripe.createFetchHttpClient = () => ({});
  new Function('Stripe', 'createClient', 'Deno', code)(FakeStripe, () => db, {
    env: { get: (key: string) => ({ STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake' } as Row)[key] },
    serve: (value: typeof handler) => { handler = value; },
  });
  return { rows, intents, charges: () => charges,
    async call(body: Row, webhook = false) {
      return handler(new Request('https://staging.invalid', { method: 'POST', headers: webhook ? { 'stripe-signature': 'test' } : {}, body: JSON.stringify(body) }));
    },
  };
}

describe('Guardian Edge payment lifecycle', () => {
  it('does not create another charge when an asynchronous upsell is retried', async () => {
    const s = server();
    const request = { action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' };
    const first = await (await s.call(request)).json();
    const second = await (await s.call(request)).json();
    expect(second.purchase_id).toBe(first.purchase_id);
    expect(second.status).toBe('pending');
    expect(s.charges()).toBe(1);
  });
  it('concurrent upsell requests resolve to one charge and one purchase', async () => {
    const s = server();
    const request = { action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' };
    const responses = await Promise.all([s.call(request), s.call(request)]);
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    expect(s.charges()).toBe(1);
    expect(s.rows).toHaveLength(2);
  });
  it('resumes an authentication-required upsell and later confirms that same order', async () => {
    const s = server({ status: 'requires_action' });
    const request = { action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' };
    const first = await (await s.call(request)).json();
    const resumed = await (await s.call(request)).json();
    expect(resumed).toMatchObject({ purchase_id: first.purchase_id, status: 'requires_action', client_secret: 'test_secret' });
    s.intents.get('pi_1')!.status = 'succeeded';
    expect(await (await s.call({ action: 'confirm', purchase_id: first.purchase_id })).json()).toMatchObject({ status: 'paid' });
    expect(s.rows[1].status).toBe('paid');
    expect(s.charges()).toBe(1);
  });
  it('reconciles processing to paid when a stale webhook arrives after settlement', async () => {
    const s = server();
    s.rows[0].status = 'pending'; s.rows[0].paid_at = null;
    const result = await s.call({ type: 'payment_intent.processing', data: { object: { id: 'pi_first', status: 'processing' } } }, true);
    expect(result.status).toBe(200);
    expect(s.rows[0].status).toBe('paid');
    expect(s.rows[0].paid_at).toEqual(expect.any(String));
  });
  it('does not silently charge again after a declined upsell', async () => {
    const s = server({ status: 'requires_payment_method' });
    const request = { action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' };
    const first = await (await s.call(request)).json();
    const second = await (await s.call(request)).json();
    expect(second).toMatchObject({ purchase_id: first.purchase_id, status: 'failed' });
    expect(s.charges()).toBe(1);
  });
  it('keeps the original paid timestamp on repeated confirmation', async () => {
    const s = server();
    await s.call({ action: 'confirm', purchase_id: 'first' });
    expect(s.rows[0].paid_at).toBe('2026-10-16T12:00:00.000Z');
  });
  it('does not regress a paid order after a stale processing webhook', async () => {
    const s = server();
    await s.call({ type: 'payment_intent.processing', data: { object: { id: 'pi_first', status: 'processing' } } }, true);
    expect(s.rows[0].status).toBe('paid');
    expect(s.rows[0].paid_at).toBe('2026-10-16T12:00:00.000Z');
  });
  it('returns a retriable server error when webhook persistence fails', async () => {
    const s = server({ updateError: true });
    s.rows[0].status = 'pending'; s.rows[0].paid_at = null;
    const response = await s.call({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_first', status: 'succeeded' } } }, true);
    expect(response.status).toBe(500);
    expect(s.rows[0].status).toBe('pending');
  });
  it('expires the discount at ten minutes rather than fifteen', async () => {
    const s = server();
    s.rows[0].paid_at = new Date(Date.now() - 11 * 60_000).toISOString();
    const result = await (await s.call({ action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' })).json();
    expect(result.amount_cents).toBe(1000);
    expect(result.discount_code).toBeNull();
  });
  it('returns the original absolute discount deadline on confirmation', async () => {
    const s = server();
    const result = await (await s.call({ action: 'confirm', purchase_id: 'first' })).json();
    expect(result.discount_ends_at).toBe(Date.parse('2026-10-16T12:10:00.000Z'));
  });
  it('refuses to charge a changed price until the customer reviews it', async () => {
    const s = server();
    s.rows[0].paid_at = new Date(Date.now() - 11 * 60_000).toISOString();
    const response = await s.call({ action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell', expected_amount_cents: 700 });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Offer price changed. Review the updated price before paying.' });
    expect(s.charges()).toBe(0);
    expect(s.rows).toHaveLength(1);
  });
  it('still recovers an existing order when a retry carries an old price', async () => {
    const s = server();
    const request = { action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' };
    const first = await (await s.call(request)).json();
    const response = await s.call({ ...request, expected_amount_cents: 1 });
    expect(response.status).toBe(200);
    expect((await response.json()).purchase_id).toBe(first.purchase_id);
    expect(s.charges()).toBe(1);
  });
  it('does not create a charge while looking up a lost upsell response', async () => {
    const s = server();
    const response = await s.call({ action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell', lookup_only: true });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ purchase_id: '', status: 'pending', client_secret: null });
    expect(s.charges()).toBe(0);
    expect(s.rows).toHaveLength(1);
  });
  it('finds the same pending order in lookup-only recovery without charging again', async () => {
    const s = server();
    const request = { action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' };
    const first = await (await s.call(request)).json();
    const result = await (await s.call({ ...request, lookup_only: true })).json();
    expect(result).toMatchObject({ purchase_id: first.purchase_id, status: 'pending' });
    expect(s.charges()).toBe(1);
  });
  it.each(['bancontact', 'ideal', 'sofort'])('uses the reusable SEPA mandate generated by %s rather than charging a single-use method', async (method) => {
    const s = server();
    s.intents.get('pi_first')!.payment_method = 'pm_single_use_redirect';
    s.intents.get('pi_first')!.latest_charge = { id: 'ch_saved', payment_method_details: { type: method, [method]: { generated_sepa_debit: 'pm_reusable_sepa' } } };
    const response = await s.call({ action: 'upsell', previous_purchase_id: 'first', offer_id: 'upsell' });
    expect(response.status).toBe(200);
    expect(s.intents.get('pi_1')?.payment_method).toBe('pm_reusable_sepa');
    expect(s.intents.get('pi_1')?.automatic_payment_methods).toEqual({ enabled: true, allow_redirects: 'never' });
    expect((await response.json()).status).toBe('pending');
  });
});
