// Guardian site review.
//   action "request" (signed-in Guardian): mark their profile 'submitted' and email the admin to check the site.
//   action "decide"  (signed-in admin):   approve (publish) or pause (unpublish) a profile and email the Guardian.
// Emails go through Resend (RESEND_API_KEY); the admin inbox is ADMIN_REVIEW_EMAIL (default johnferreira@gmail.com).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SITE = Deno.env.get('PUBLIC_SITE_URL') || 'https://routine3.com';
const ADMIN_EMAIL = Deno.env.get('ADMIN_REVIEW_EMAIL') || 'johnferreira@gmail.com';
const FROM = Deno.env.get('REVIEW_FROM_EMAIL') || 'ROUTINE³ Guardians <noreply@healthscan.live>';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { sent: false, reason: 'RESEND_API_KEY missing' };
  const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to, subject, html }) });
  return { sent: res.ok, reason: res.ok ? null : await res.text() };
}
const isAdmin = (user: any) => [user?.app_metadata?.is_admin, user?.user_metadata?.is_admin].some((v) => ['true', '1', 'yes', true].includes(v)) || user?.app_metadata?.role === 'admin';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await service.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (body.action === 'request') {
    const { data: profile, error } = await service.from('guide_profiles').update({ status: 'submitted', review_requested_at: new Date().toISOString() }).eq('user_id', user.id).in('status', ['draft', 'paused', 'submitted']).select('slug, display_name, contact_email, headline').maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!profile) return json({ status: 'approved', email: { sent: false, reason: 'already published' } });
    const page = `${SITE}/guardians/${encodeURIComponent(profile.slug)}`;
    const email = await sendEmail(ADMIN_EMAIL, `Review: ${profile.display_name}'s Guardian site`, `<p><strong>${esc(profile.display_name)}</strong> (${esc(profile.contact_email || user.email || '')}) asked you to check their Guardian site before it goes live.</p><p>${esc(profile.headline || '')}</p><p><a href="${page}">Open their site</a> · <a href="${SITE}/guardians/workspace?tab=admin">Approve or reject in Guardian admin</a></p>`);
    return json({ status: 'submitted', email });
  }

  if (body.action === 'decide') {
    if (!isAdmin(user)) return json({ error: 'Admins only.' }, 403);
    const status = body.status === 'approved' ? 'approved' : 'paused';
    const { data: profile, error } = await service.from('guide_profiles').update({ status, reviewed_at: new Date().toISOString(), review_note: body.note || null }).eq('user_id', String(body.user_id || '')).select('slug, display_name, contact_email').maybeSingle();
    if (error || !profile) return json({ error: error?.message || 'Profile not found.' }, 404);
    const page = `${SITE}/guardians/${encodeURIComponent(profile.slug)}`;
    const email = profile.contact_email ? await sendEmail(profile.contact_email, status === 'approved' ? 'Your Guardian site is live' : 'Your Guardian site is unpublished', status === 'approved' ? `<p>Hi ${esc(profile.display_name)},</p><p>Your Guardian site has been checked and is now live: <a href="${page}">${page}</a></p>` : `<p>Hi ${esc(profile.display_name)},</p><p>Your Guardian site has been unpublished for now.${body.note ? ` Note from the team: ${esc(String(body.note))}` : ''}</p><p>Update it in your workspace and ask for review again when ready.</p>`) : { sent: false, reason: 'no contact email' };
    return json({ status, email });
  }
  return json({ error: 'Unknown action.' }, 400);
});
