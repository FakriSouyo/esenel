-- Public storage buckets for site images.
--   katalog — product photos (public/katalog_esenel, 85 webp)
--   craft   — flower pose assets (public/flowers, 24 webp)
--   journal — article covers (currently external URLs; bucket ready for future uploads)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('katalog', 'katalog', true, 5242880, array['image/webp', 'image/png', 'image/jpeg']),
  ('craft',   'craft',   true, 5242880, array['image/webp', 'image/png', 'image/jpeg']),
  ('journal', 'journal', true, 10485760, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;
