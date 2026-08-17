-- The generated tsvector column was named `search`, which collides with
-- PostgREST's built-in ?search= parameter. Rename to search_vector so
-- full-text search is queryable via ?search_vector=fts.term.
alter table public.products
  rename column search to search_vector;

alter table public.journal_posts
  rename column search to search_vector;
