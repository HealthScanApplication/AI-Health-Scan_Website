// Download link for a Guardian's uploaded free-offer file (private "guide-files" bucket).
// Only for a published free offer, and only for an email that has opted in to it
// (guide_leads row for that guide + offer, created in the last 24 hours). Links expire after 1 hour.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const offerId = String(body.offer_id || '');
  if (!email || !offerId) return json({ error: 'Missing details.' }, 400);

  const { data: offer } = await db.from('guide_offers').select('id, guide_id, title, file_path, access_model, status').eq('id', offerId).single();
  if (!offer || offer.status !== 'published' || offer.access_model !== 'free' || !offer.file_path) return json({ error: 'No download for this offer.' }, 404);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: lead } = await db.from('guide_leads').select('id').eq('guide_id', offer.guide_id).eq('email', email).eq('source_offer_id', offer.id).gte('created_at', since).limit(1).maybeSingle();
  if (!lead) return json({ error: 'Sign up to get this download.' }, 403);

  const extension = offer.file_path.split('.').pop() || 'pdf';
  const filename = `${String(offer.title).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'download'}.${extension}`;
  const { data, error } = await db.storage.from('guide-files').createSignedUrl(offer.file_path, 60 * 60, { download: filename });
  if (error || !data) return json({ error: 'Could not prepare the download.' }, 500);
  return json({ url: data.signedUrl, expires_in: 3600 });
});
