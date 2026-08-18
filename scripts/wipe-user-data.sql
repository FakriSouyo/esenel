-- ============================================================
-- ESENEL — WIPE semua data user-generated (jalankan SEKALI saja)
--
-- Menghapus SEMUA data pengguna dari Supabase, tapi MENJAGA asset situs:
-- tabel katalog (categories/products/journal_posts/craft_*) TIDAK disentuh
-- (itu konten situs).
--
-- Data yang dihapus (tabel):
--   name_stories            — cache cerita "buat bunga dari namamu"
--   newsletter_subscribers  — daftar email
--   orders                  — pesanan
--
-- Data storage (bucket) TIDAK boleh dihapus lewat SQL — Supabase memblokir
-- `delete from storage.objects` (trigger protect_delete: "Use the Storage
-- API instead"). Hapus bucket lewat Storage API / dashboard UI:
--   - bucket 'name-bouquets' — sudah dikosongkan lewat Storage API
--     (anon punya policy delete di bucket ini, via DELETE /storage/v1/
--     object/name-bouquets/<key>).
--   - bucket 'payments'      — sudah kosong (0 objek); kalau nanti ada,
--     hapus via Dashboard → Storage → payments → pilih semua → Delete.
--
-- Cara menjalankan:
--   1. Buka https://supabase.com/dashboard/project/jimsgyrsgygicxwyuqzo
--   2. Menu SQL Editor → New query
--   3. Paste seluruh file ini → Run
--
-- Catatan: tabel tidak bisa dihapus lewat API anon karena RLS tidak punya
-- policy DELETE — hapus lewat dashboard/superuser seperti di atas.
-- ============================================================

delete from public.name_stories;
delete from public.newsletter_subscribers;
delete from public.orders;

-- ============================================================
-- Verifikasi: ketiganya harus 0
-- ============================================================
select 'name_stories' as item, count(*) as jumlah from public.name_stories
union all
select 'newsletter_subscribers', count(*) from public.newsletter_subscribers
union all
select 'orders', count(*) from public.orders;
