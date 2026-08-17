-- ============================================================
-- ESENEL — Supabase schema (migration 0001)
-- PostgreSQL-specific: generated tsvector columns, GIN indexes,
-- pg_trgm fuzzy search, enums, JSONB order snapshots, text arrays.
-- ============================================================

create extension if not exists pg_trgm;

-- ---------- catalog ----------

create table public.categories (
  slug     text primary key,
  label    text not null,
  subtitle text,
  image    text,
  "order"  integer not null default 0
);

create table public.products (
  id           bigint generated always as identity primary key,
  slug         text not null unique,
  name         text not null,
  category_slug text not null references public.categories (slug) on delete cascade,
  subtitle     text,
  price        integer not null check (price >= 0),
  image        text not null,
  gallery      text[] not null default '{}',
  composition  text[] not null default '{}',
  description  text not null default '',
  featured     boolean not null default false,
  is_new       boolean not null default false,
  best_seller  boolean not null default false,
  -- generated column: full-text search vector kept in sync automatically
  search       tsvector generated always as (
                 to_tsvector('english', name || ' ' || coalesce(subtitle, '') || ' ' || description)
               ) stored,
  created_at   timestamptz not null default now()
);

-- index strategies
create index idx_products_category on public.products (category_slug);
create index idx_products_search on public.products using gin (search);
-- trigram index for fuzzy "did you mean" suggestions
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
-- partial indexes for the featured / best-seller filters
create index idx_products_featured on public.products (featured) where featured;
create index idx_products_best_seller on public.products (best_seller) where best_seller;

-- ---------- journal ----------

create table public.journal_posts (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  title      text not null,
  category   text not null,
  published_on date,
  read_time  text,
  image      text,
  excerpt    text not null default '',
  featured   boolean not null default false,
  body       text[] not null default '{}',
  search     tsvector generated always as (
               to_tsvector('english', title || ' ' || excerpt)
             ) stored,
  created_at timestamptz not null default now()
);

create index idx_journal_search on public.journal_posts using gin (search);
create index idx_journal_category on public.journal_posts (category);

-- ---------- newsletter ----------

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique
             check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  created_at timestamptz not null default now()
);

-- ---------- craft catalog ----------

create table public.craft_sizes (
  id         text primary key,
  label      text not null,
  base_price integer not null check (base_price >= 0),
  stem_count integer not null default 0,
  "order"    integer not null default 0
);

create table public.craft_flowers (
  id             text primary key,
  name           text not null,
  price_per_stem integer not null check (price_per_stem >= 0),
  image          text not null default '',
  "order"        integer not null default 0
);

create table public.craft_wrappings (
  id    text primary key,
  name  text not null,
  hex   text not null default '#FFFFFF',
  "order" integer not null default 0
);

-- ---------- orders (checkout / fulfillment) ----------

create type public.order_status as enum
  ('pending', 'confirmed', 'in_progress', 'delivered', 'cancelled');

create sequence public.order_number_seq;

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique
                  default ('ES-' || to_char(nextval('public.order_number_seq'), 'FM000000')),
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,
  shipping_address jsonb not null default '{}'::jsonb,
  note            text,
  status          public.order_status not null default 'pending',
  subtotal        integer not null default 0 check (subtotal >= 0),
  shipping        integer not null default 0 check (shipping >= 0),
  total           integer not null default 0 check (total >= 0),
  -- snapshot of the cart at purchase time (product id, name, qty, price)
  items           jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_orders_status on public.orders (status);
create index idx_orders_created on public.orders (created_at desc);

-- keep updated_at fresh on every update
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger orders_touch_updated
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------- row level security ----------

alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.journal_posts     enable row level security;
alter table public.craft_sizes       enable row level security;
alter table public.craft_flowers     enable row level security;
alter table public.craft_wrappings   enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.orders            enable row level security;

-- catalog is public read-only
create policy "catalog read" on public.categories for select using (true);
create policy "catalog read" on public.products for select using (true);
create policy "journal read" on public.journal_posts for select using (true);
create policy "craft read" on public.craft_sizes for select using (true);
create policy "craft read" on public.craft_flowers for select using (true);
create policy "craft read" on public.craft_wrappings for select using (true);

-- anyone may subscribe (dedupe handled by unique email); nobody reads the list
create policy "subscribe" on public.newsletter_subscribers
  for insert with check (true);

-- anyone may place an order; only the owner reads their own via email
create policy "place order" on public.orders
  for insert with check (true);

create policy "read own order" on public.orders
  for select using (customer_email = current_setting('request.jwt.claims', true)::jsonb ->> 'email');
