/**
 * Behaviour check for public/unsubscribe/index.html: runs its inline script against a
 * stubbed DOM and a stubbed fetch. No network, no browser, nothing reaches a database.
 *   node scripts/check-unsubscribe-page.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'unsubscribe', 'index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function run(search, fetchImpl) {
  const els = {};
  const mk = (id, hidden = false) => (els[id] = { id, hidden, disabled: false, textContent: '', className: '', _h: {}, addEventListener(t, f) { this._h[t] = f; } });
  ['title','about','go','status','note'].forEach((i) => mk(i, i === 'go' || i === 'status'));
  const calls = [];
  const ctx = { location: { search }, document: { getElementById: (i) => els[i] },
    fetch: (u, o) => { calls.push({ u, o }); return fetchImpl(u, o); }, JSON, Error, Promise };
  vm.runInNewContext(code, ctx);
  return { els, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 5));
const resp = (status, body) => Promise.resolve({ status, json: () => Promise.resolve(body) });
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };

// no token / bad token: no button, no request
for (const q of ['', '?t=', '?t=short', '?t=<script>alert(1)</script>0000', '?x=1']) {
  const r = run(q, () => { throw new Error('must not fetch'); });
  ok(r.els.go.hidden === true && r.calls.length === 0 && /incomplete/.test(r.els.title.textContent), `bad link "${q}" shows incomplete, no button, no request`);
}
// valid token: button, nothing sent until click
let r = run('?t=0123456789abcdef0123456789abcdef', () => resp(200, { ok: true, id: 'x' }));
ok(r.els.go.hidden === false && r.calls.length === 0, 'valid token shows a button and sends nothing on load');
r.els.go._h.click(); await tick();
const c = r.calls[0];
ok(c.u.endsWith('/rest/v1/rpc/unsubscribe_email') && c.o.method === 'POST', 'POSTs to the unsubscribe_email rpc');
ok(JSON.parse(c.o.body).p_token === '0123456789abcdef0123456789abcdef' && Object.keys(JSON.parse(c.o.body)).length === 1, 'body carries only the token');
ok(c.o.referrerPolicy === 'no-referrer' && c.o.credentials === 'omit', 'no referrer, no credentials');
ok(!JSON.stringify(c).includes('@'), 'no address anywhere in the request');
ok(/unsubscribed/.test(r.els.title.textContent) && r.els.status.className === 'status ok' && r.els.go.hidden === true, 'success state');
ok(!/0123456789abcdef/.test(Object.values(r.els).map((e) => e.textContent).join(' ')), 'token never rendered');
// token found in a longer query string
r = run('?utm=1&t=abcDEF12_-xyz&z=2', () => resp(200, { ok: true }));
r.els.go._h.click(); await tick();
ok(JSON.parse(r.calls[0].o.body).p_token === 'abcDEF12_-xyz', 'token parsed from a longer query');
// invalid token answer
r = run('?t=0123456789abcdef0123456789abcdef', () => resp(200, { ok: false, error: 'invalid_token' }));
r.els.go._h.click(); await tick();
ok(/not valid/.test(r.els.title.textContent) && r.els.status.className === 'status bad' && /Nothing was changed/.test(r.els.status.textContent), 'invalid_token -> clear failure, says nothing changed');
// server error, network error: retry possible, no false success
for (const [name, f] of [['HTTP 401', () => resp(401, { message: 'Invalid API key' })], ['HTTP 500 html', () => Promise.resolve({ status: 500, json: () => Promise.reject(new Error('bad json')) })], ['network down', () => Promise.reject(new TypeError('Failed to fetch'))], ['200 but not ok', () => resp(200, { ok: false })], ['200 null', () => resp(200, null)]]) {
  r = run('?t=0123456789abcdef0123456789abcdef', f);
  r.els.go._h.click(); await tick();
  ok(r.els.go.disabled === false && r.els.go.hidden === false && r.els.status.className === 'status bad' && !/unsubscribed/.test(r.els.title.textContent), `${name}: failure shown, button re-enabled, no false success`);
}
process.exit(fails ? 1 : 0);
