import { getSupabaseClient } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

export type GuideStatus = 'draft' | 'submitted' | 'approved' | 'paused';

export interface GuideProfile {
  user_id: string;
  slug: string;
  display_name: string;
  headline: string;
  bio: string;
  avatar_url: string | null;
  contact_email: string;
  whatsapp_phone: string;
  social_links: Record<string, string>;
  specialties: string[];
  status: GuideStatus;
  commission_percent: number;
  onboarding_step: number;
}

export interface GuideLead {
  id: string;
  guide_id: string;
  name: string;
  email: string;
  goal: string | null;
  stage: 'new' | 'contacted' | 'client' | 'closed';
  created_at: string;
}

export interface GuideOffer {
  id: string;
  guide_id: string;
  kind: 'lead_magnet' | 'ebook' | 'recipe_book' | 'routine' | 'routine_guidance' | 'one_to_one_call' | 'group_call' | 'in_person' | 'journey' | 'festival' | 'team_program' | 'product' | 'program';
  title: string;
  description: string | null;
  price_cents: number;
  currency: 'GBP' | 'EUR' | 'USD';
  affiliate_url: string | null;
  access_model: 'free' | 'paid';
  file_path: string | null;
  booking_url: string | null;
  status: 'draft' | 'published';
}

export interface GuideRecipe {
  id: string;
  guide_id: string;
  title: string;
  description: string | null;
  meal_slot: string | null;
  ingredients: unknown[];
  instructions: unknown[];
  status: 'draft' | 'submitted' | 'published';
}

export interface ImportedGuideProfile {
  name: string;
  headline: string;
  bio: string;
  avatarUrl: string | null;
  sources: { url: string; site: string }[];
  images: { url: string; sourceUrl: string; kind: 'avatar' | 'page' }[];
  relatedProfiles: { url: string; label: string; platform: string }[];
  topics: string[];
}

export async function uploadGuideImage(userId: string, file: File): Promise<string> {
  const isImage = /^image\/(?:jpeg|png|webp)$/.test(file.type);
  const isVideo = /^video\/(?:mp4|webm)$/.test(file.type);
  if (!isImage && !isVideo) throw new Error('Choose a JPG, PNG, WebP, MP4, or WebM file.');
  const sizeLimit = isVideo ? 25 : 8;
  if (file.size > sizeLimit * 1024 * 1024) throw new Error(`${isVideo ? 'Video' : 'Image'} must be smaller than ${sizeLimit} MB.`);
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'video/mp4' ? 'mp4' : file.type === 'video/webm' ? 'webm' : 'jpg';
  const path = `${userId}/profile-${Date.now()}.${extension}`;
  const { error } = await db().storage.from('guide-assets').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return db().storage.from('guide-assets').getPublicUrl(path).data.publicUrl;
}

export async function uploadGuideFile(userId: string, file: File): Promise<string> {
  const allowed = ['application/pdf', 'application/epub+zip', 'application/zip'];
  if (!allowed.includes(file.type)) throw new Error('Choose a PDF, EPUB, or ZIP file.');
  if (file.size > 50 * 1024 * 1024) throw new Error('File must be smaller than 50 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
  const path = `${userId}/offer-${Date.now()}.${extension}`;
  const { error } = await db().storage.from('guide-files').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

const db = () => getSupabaseClient();

export async function importGuideProfile(urls: string[], accessToken: string): Promise<ImportedGuideProfile> {
  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/guides/import-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publicAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ urls }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Could not import that public profile');
  return payload.profile as ImportedGuideProfile;
}

export async function getGuideProfile(userId: string): Promise<GuideProfile | null> {
  const { data, error } = await db().from('guide_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as GuideProfile | null;
}

export async function getGuideProfileBySlug(slug: string): Promise<GuideProfile | null> {
  const { data, error } = await db().from('guide_profiles').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as GuideProfile | null;
}

export async function saveGuideProfile(profile: Partial<GuideProfile> & { user_id: string }): Promise<GuideProfile> {
  const { data, error } = await db().from('guide_profiles').upsert(profile, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return data as GuideProfile;
}

export async function listGuideLeads(userId: string): Promise<GuideLead[]> {
  const { data, error } = await db().from('guide_leads').select('*').eq('guide_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GuideLead[];
}

export async function createGuideLead(guideId: string, lead: Pick<GuideLead, 'name' | 'email' | 'goal'>): Promise<GuideLead> {
  const { data, error } = await db().from('guide_leads').insert({ guide_id: guideId, ...lead }).select().single();
  if (error) throw error;
  return data as GuideLead;
}

export async function listGuideOffers(userId: string): Promise<GuideOffer[]> {
  const { data, error } = await db().from('guide_offers').select('*').eq('guide_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GuideOffer[];
}

export async function createGuideOffer(guideId: string, offer: Pick<GuideOffer, 'kind' | 'title' | 'description' | 'price_cents' | 'affiliate_url' | 'access_model' | 'file_path' | 'booking_url'> & Partial<Pick<GuideOffer, 'currency'>>): Promise<GuideOffer> {
  const { data, error } = await db().from('guide_offers').insert({ guide_id: guideId, ...offer }).select().single();
  if (error) throw error;
  return data as GuideOffer;
}

export async function listGuideRecipes(userId: string): Promise<GuideRecipe[]> {
  const { data, error } = await db().from('guide_recipes').select('*').eq('guide_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GuideRecipe[];
}

export async function createGuideRecipe(guideId: string, recipe: Pick<GuideRecipe, 'title' | 'description' | 'meal_slot'>): Promise<GuideRecipe> {
  const { data, error } = await db().from('guide_recipes').insert({ guide_id: guideId, ...recipe }).select().single();
  if (error) throw error;
  return data as GuideRecipe;
}

export async function updateGuideRecipe(id: string, recipe: Partial<Pick<GuideRecipe, 'title' | 'description' | 'meal_slot' | 'ingredients' | 'instructions' | 'status'>>): Promise<GuideRecipe> {
  const { data, error } = await db().from('guide_recipes').update(recipe).eq('id', id).select().single();
  if (error) throw error;
  return data as GuideRecipe;
}
