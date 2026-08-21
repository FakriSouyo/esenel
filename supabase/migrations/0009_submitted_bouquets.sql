-- ============================================================
-- ESENEL — community bouquet gallery (migration 0009)
-- Craft builder "Save" flow (/craft):
--   submitted_bouquets — bouquet the visitor names & shares (bouquet name,
--                        maker name, captured image, size/wrapping, flowers)
--   bouquet-gallery    — public bucket for the captured bouquet PNG
-- Siapa pun boleh membaca (biar galeri tampil untuk semua) dan menambah.
-- ============================================================

create table public.submitted_bouquets (
  id           uuid primary key default gen_random_uuid(),
  bouquet_name text not null,
  maker_name   text,
  image_url    text,
  size         text,
  wrapping     text,
  flowers      jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

alter table public.submitted_bouquets enable row level security;

-- siapa pun boleh melihat galeri + menambah karya baru (tanpa update/delete).
create policy "submitted bouquets read"   on public.submitted_bouquets for select using (true);
create policy "submitted bouquets insert" on public.submitted_bouquets for insert with check (true);

-- ---------- storage: bouquet-gallery ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bouquet-gallery', 'bouquet-gallery', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "bouquet-gallery read"   on storage.objects
  for select using (bucket_id = 'bouquet-gallery');
create policy "bouquet-gallery upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'bouquet-gallery');