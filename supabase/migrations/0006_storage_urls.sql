-- Rewrite the local catalog paths seeded in 0002 (which used the app's
-- legacy /katalog_esenel/ paths) to their Supabase Storage public URLs, so
-- the DB rows agree with what the app now serves.
--
--   /katalog_esenel/<Folder>/<file>.webp
--     -> https://<ref>.supabase.co/storage/v1/object/public/katalog/<Folder>/<file>.webp
do $$
declare
  base text := 'https://jimsgyrsgygicxwyuqzo.supabase.co/storage/v1/object/public';
begin
  update public.categories
  set image = base || '/katalog/' ||
              replace(substring(image from '/katalog_esenel/(.*)$'), ' ', '%20')
  where image like '/katalog_esenel/%';

  update public.products
  set image = base || '/katalog/' ||
              replace(substring(image from '/katalog_esenel/(.*)$'), ' ', '%20')
  where image like '/katalog_esenel/%';

  update public.products
  set gallery = array(
        select base || '/katalog/' ||
               replace(substring(g from '/katalog_esenel/(.*)$'), ' ', '%20')
        from unnest(gallery) g
      )
  where array_length(gallery, 1) > 0;
end $$;
