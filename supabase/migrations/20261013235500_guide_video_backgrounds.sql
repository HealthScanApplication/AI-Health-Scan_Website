update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
where id = 'guide-assets';
