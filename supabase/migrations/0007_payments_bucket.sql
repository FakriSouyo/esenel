-- Public storage bucket for payment-proof screenshots sent from checkout.
-- Object keys are random uuids so the URLs are unguessable, and the bucket
-- is public so the florist can open the proof straight from the WhatsApp
-- message. Only INSERT is granted to anon — nothing can list or overwrite.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payments', 'payments', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "payments upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'payments');
