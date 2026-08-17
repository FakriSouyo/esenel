-- ============================================================
-- ESENEL — name-story cache + generated bouquet images (migration 0008)
-- Flow "buat bunga dari namamu" (/craft/name):
--   name_stories  — cache hasil DeepSeek per nama (kunci = normalizeName)
--   name-bouquets — bucket publik tempat gambar buket hasil generate
--                   (pollinations) disimpan dengan kunci deterministik
--                   <normalized-name>.jpg  → nama yang sama = gambar sama.
-- ============================================================

create table public.name_stories (
  name_key   text primary key,          -- normalizeName(nama): huruf kecil, tanpa spasi/karakter khusus
  name       text not null,
  story      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger name_stories_touch_updated
  before update on public.name_stories
  for each row execute function public.touch_updated_at();

alter table public.name_stories enable row level security;

-- siapa pun boleh membaca cache (biar nama yang sama tinggal tarik),
-- menulis hasil baru, dan memperbarui (image_url / story refresh).
create policy "name stories read"  on public.name_stories for select using (true);
create policy "name stories write" on public.name_stories for insert with check (true);
create policy "name stories update" on public.name_stories for update using (true);

-- ---------- storage: name-bouquets ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('name-bouquets', 'name-bouquets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- x-upsert (kunci deterministik, bisa bentrok saat dua orang pakai nama
-- yang sama) butuh SELECT + INSERT + UPDATE pada storage.objects bucket ini.
create policy "name-bouquets read"   on storage.objects
  for select using (bucket_id = 'name-bouquets');
create policy "name-bouquets upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'name-bouquets');
create policy "name-bouquets update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'name-bouquets');
-- DELETE untuk anon: bucket ini hanya berisi gambar buket hasil generate yang
-- bisa di-regenerate otomatis (kalau file dihapus, /api/name-image membuat
-- ulang). Dibutuhkan supaya dummy/test data bisa dibersihkan via Storage API.
create policy "name-bouquets delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'name-bouquets');
