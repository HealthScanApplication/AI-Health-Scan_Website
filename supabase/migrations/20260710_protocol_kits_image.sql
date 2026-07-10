-- Kit image (optional; the admin falls back to the protocol's image when null).
alter table public.protocol_kits add column if not exists image_url text;
