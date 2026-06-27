/*
 * aiImage — client wrapper for the admin/ai-generate-image edge endpoint.
 * Generates an image (OpenAI gpt-image-1 today; provider-extensible) and returns
 * the public URL of the uploaded result.
 */
import { projectId } from './supabase/info';

export async function aiGenerateImage(
  accessToken: string,
  prompt: string,
  opts: { provider?: string; size?: string } = {},
): Promise<string> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-generate-image`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider: opts.provider || 'openai', size: opts.size || '1024x1024' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    if (res.status === 404) throw new Error('Image endpoint not deployed — redeploy make-server-ed0fe4c2');
    throw new Error(data.error || `Image generation failed (${res.status})`);
  }
  return data.publicUrl as string;
}
