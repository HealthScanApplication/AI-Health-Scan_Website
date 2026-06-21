/*
 * Protocol admin CRUD — targets the REAL production tables `protocols` and
 * `protocol_items` over Supabase PostgREST.
 *
 * IMPORTANT: the legacy admin "Protocols" tab pointed at `catalog_protocols`,
 * which does NOT exist in the live database (404). Routines/protocols actually
 * live in `protocols` (+ `protocol_items`). This module is the single source of
 * truth for reading and writing them from the admin panel.
 *
 * Writes require a valid admin session (accessToken). Reads of public protocols
 * fall back to the anon key. Both projectId/publicAnonKey follow the selected
 * environment (staging | production) via ../utils/supabase/info.
 */
import { projectId, publicAnonKey } from './supabase/info';

const rest = () => `https://${projectId}.supabase.co/rest/v1`;

export interface AdminProtocol {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  creator: string | null;
  source: string | null;
  image_url: string | null;
  health_score: number | null;
  total_days: number | null;
  is_suggested: boolean | null;
  is_active: boolean | null;
  is_public: boolean | null;
  start_time: string | null;
  sort_order: number | null;
  updated_at?: string | null;
}

export interface AdminProtocolItem {
  id: string;
  protocol_id: string;
  display_name: string | null;
  item_type: string | null;   // supplement | consume | recipe | activity | product
  kind: string | null;        // action | rule_do | rule_dont
  scope: string | null;
  scheduled_time: string | null; // 'HH:MM:SS'
  duration_minutes: number | null;
  group_name: string | null;
  day_number: number | null;
  sort_order: number | null;
}

const PROTOCOL_COLS =
  'id,name,description,category,type,creator,source,image_url,health_score,total_days,is_suggested,is_active,is_public,start_time,sort_order,updated_at';
const ITEM_COLS =
  'id,protocol_id,display_name,item_type,kind,scope,scheduled_time,duration_minutes,group_name,day_number,sort_order';

function headers(accessToken: string, extra: Record<string, string> = {}) {
  return {
    apikey: publicAnonKey,
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function handle(res: Response, ctx: string): Promise<any> {
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`${ctx} failed (${res.status}): ${detail || res.statusText}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function first<T>(rows: T | T[]): T {
  return Array.isArray(rows) ? rows[0] : rows;
}

/** All protocols, suggested ones first, then by sort order / name. */
export async function listProtocols(accessToken: string): Promise<AdminProtocol[]> {
  const url =
    `${rest()}/protocols?select=${PROTOCOL_COLS}` +
    `&order=is_suggested.desc.nullslast,sort_order.asc.nullslast,name.asc`;
  const res = await fetch(url, { headers: headers(accessToken) });
  return (await handle(res, 'List protocols')) || [];
}

/** Steps for one protocol, ordered chronologically like the app's day view. */
export async function listProtocolItems(
  accessToken: string,
  protocolId: string,
): Promise<AdminProtocolItem[]> {
  const url =
    `${rest()}/protocol_items?protocol_id=eq.${protocolId}&select=${ITEM_COLS}` +
    `&order=scheduled_time.asc.nullslast,sort_order.asc.nullslast`;
  const res = await fetch(url, { headers: headers(accessToken) });
  return (await handle(res, 'List protocol steps')) || [];
}

export async function updateProtocol(
  accessToken: string,
  id: string,
  patch: Partial<AdminProtocol>,
): Promise<AdminProtocol> {
  const res = await fetch(`${rest()}/protocols?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return first(await handle(res, 'Update protocol'));
}

export async function updateProtocolItem(
  accessToken: string,
  id: string,
  patch: Partial<AdminProtocolItem>,
): Promise<AdminProtocolItem> {
  const res = await fetch(`${rest()}/protocol_items?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return first(await handle(res, 'Update step'));
}

export async function createProtocolItem(
  accessToken: string,
  item: Partial<AdminProtocolItem>,
): Promise<AdminProtocolItem> {
  const res = await fetch(`${rest()}/protocol_items`, {
    method: 'POST',
    headers: headers(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(item),
  });
  return first(await handle(res, 'Create step'));
}

export async function deleteProtocolItem(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${rest()}/protocol_items?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(accessToken),
  });
  await handle(res, 'Delete step');
}
