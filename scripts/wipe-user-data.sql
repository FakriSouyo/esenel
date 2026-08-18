-- ============================================================
-- ESENEL — WIPE semua data user-generated (jalankan SEKALI saja)
--
-- Menghapus SEMUA data pengguna dari Supabase, tapi MENJAGA asset situs:
-- tabel katalog (categories/products/journal_posts/craft_*) dan bucket
-- katalog/craft TIDAK disentuh (itu konten situs).
--
-- Data yang dihapus:
--   name_stories            — cache cerita "buat bunga dari namamu"
--   newsletter_subscribers  — daftar email
--   orders                  — pesanan
--   storage 'name-bouquets' — gambar buket hasil generate
--   storage 'payments'      — bukti transfer
--
-- Cara menjalankan:
--   1. Buka https://supabase.com/dashboard/project/jimsgyrsgygicxwyuqzo
--   2. Menu SQL Editor → New query
--   3. Paste seluruh file ini → Run
--
-- Catatan: tidak bisa dihapus lewat API anon karena tabel tidak punya
-- policy DELETE (RLS) — hapus lewat dashboard/superuser seperti di atas.
-- ============================================================

delete from public.name_stories;
delete from public.newsletter_subscribers;
delete from public.orders;

delete from storage.objects where bucket_id in ('name-bouquets', 'payments');

-- ============================================================
-- Verifikasi: semua harus 0
-- ============================================================
select 'name_stories' as item, count(*) as jumlah from public.name_stories
union all
select 'newsletter_subscribers', count(*) from public.newsletter_subscribers
union all
select 'orders', count(*) from public.orders
union all
select 'storage name-bouquets', count(*) from storage.objects where bucket_id = 'name-bouquets'
union all
select 'storage payments', count(*) from storage.objects where bucket_id = 'payments';
