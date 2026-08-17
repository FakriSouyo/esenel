-- place_order: insert an order and return its generated number.
--
-- PostgREST's `Prefer: return=representation` on POST /orders needs a
-- SELECT policy for the returning row, but RLS deliberately keeps orders
-- unreadable by anon. This SECURITY DEFINER function inserts as the owner
-- and returns just the order number — RLS on the table stays strict
-- (anon may insert via the RPC, never read).
create or replace function public.place_order(
  p_customer_name    text,
  p_customer_email   text,
  p_customer_phone   text default null,
  p_shipping_address jsonb default '{}'::jsonb,
  p_note             text default null,
  p_subtotal         integer default 0,
  p_shipping         integer default 0,
  p_total            integer default 0,
  p_items            jsonb default '[]'::jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
begin
  insert into public.orders
    (customer_name, customer_email, customer_phone,
     shipping_address, note, subtotal, shipping, total, items)
  values
    (p_customer_name, p_customer_email, p_customer_phone,
     p_shipping_address, p_note, p_subtotal, p_shipping, p_total, p_items)
  returning number into v_number;

  return v_number;
end $$;

revoke all on function public.place_order(text, text, text, jsonb, text, integer, integer, integer, jsonb) from public;
grant execute on function public.place_order(text, text, text, jsonb, text, integer, integer, integer, jsonb) to anon, authenticated;
