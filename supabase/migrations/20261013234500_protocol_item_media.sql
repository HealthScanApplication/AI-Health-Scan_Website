alter table public.protocol_items
  add column if not exists media_image_url text,
  add column if not exists media_audio_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'protocol-media',
  'protocol-media',
  true,
  26214400,
  array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
