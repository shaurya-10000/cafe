-- ============================================================================
-- Business platform database v5.1.2 — COMPLETE PRODUCTION INSTALL
-- ============================================================================
-- Single-file install: migrations 0001–0026 in dependency order, then the seed.
-- Idempotent. Runs in one transaction: if anything fails, NOTHING is applied.
--
--   Contents:
--     0001  foundation (extensions, helpers)
--     0002  profiles + business_settings
--     0003  locations + catalog
--     0004  coupons + orders
--     0005  bookings (resources, hours, capacity)
--     0006  customer features (favorites, cart, reviews, chat, rewards)
--     0007  notifications + push
--     0008  order engine
--     0009  audit log
--     0010  Clerk webhook
--     0011  automation (reminders, expiry, retention, cron)
--     0012  integrity constraints
--     0013  views + RLS
--     0014  realtime + storage
--     0015  privileges + final assertions
--     0016  privacy + surface drift guard
--     0017  Stripe payments
--     0018  secure defaults (currency rounding, trusted roles)
--     0019  production hardening #1 (currency, throttle, capacity)
--     0020  currency/capacity fixes #2
--     0021  catalog_items_public.created_at
--     0022  hardening #4 (Stripe grants, coupon RLS, guard symmetry)
--     0023  hardening #5 (catalog lockdown, coupon RPC, capacity clamp)
--     0024  world-class hardening (admin views, prod-ready assertions)
--     0025  fresh-install ordering fixes + admin_catalog_items gate
--     0026  ops_health() ambiguous-column fix
--     SEED
--
-- BEFORE RUNNING (first deploy only): edit the SEED block at the bottom
-- (business_name, business_type, currency).
--
-- REQUIRES: pg_cron and pgvector enabled on hosted Supabase (Dashboard →
--           Database → Extensions).
--
-- AFTER DEPLOY:
--   select * from public.assert_production_ready();   -- all ok = true
--   select * from public.ops_health();                -- all ok = true
--   select * from public.api_surface_violations();    -- empty
-- ============================================================================

begin;

-- ############################################################################
-- # 0001 — FOUNDATION
-- ############################################################################
-- Every SECURITY DEFINER function pins search_path.
-- Browser exposure is an explicit allow-list (0015 + 0024).
-- Tunable business rules live in business_settings, not in code.

create extension if not exists vector with schema extensions;
create extension if not exists pg_cron;
create extension if not exists btree_gist with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.requesting_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt()->>'sub','');
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt()->>'role','') = 'service_role';
$$;

-- NOTE: redefined in 0018 with an explicit allow-list of DB roles.
create or replace function public.is_trusted_caller()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt()->>'role','') = 'service_role'
      or not (
        session_user in ('authenticator','anon','authenticated')
        or coalesce(nullif(current_setting('role', true), ''), 'none')
             in ('anon','authenticated','authenticator')
      );
$$;


-- ############################################################################
-- # 0002 — PROFILES + BUSINESS_SETTINGS
-- ############################################################################
create table if not exists public.profiles (
  id text primary key,
  email text,
  full_name text,
  avatar_url text,
  username text,
  phone text,
  role text not null default 'customer'
    check (role in ('customer','admin')),
  has_claimed_welcome_reward boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'customer';
alter table public.profiles add column if not exists has_claimed_welcome_reward boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.is_admin_v2()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = public.requesting_user_id() and role = 'admin'
  );
$$;

create unique index if not exists profiles_username_unique_lower
on public.profiles(lower(btrim(username)))
where username is not null and btrim(username) <> '';

create index if not exists profiles_admin_idx
on public.profiles(id) where role = 'admin';

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and new.role is distinct from old.role
     and not public.is_trusted_caller()
     and not public.is_admin_v2()
  then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect_role on public.profiles;
create trigger trg_profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid text := public.requesting_user_id();
  out_row public.profiles%rowtype;
begin
  if uid is null then raise exception 'Authentication required'; end if;

  insert into public.profiles(id, email)
  values (uid, nullif(auth.jwt()->>'email',''))
  on conflict (id) do nothing;

  select * into out_row from public.profiles where id = uid;
  return out_row;
end;
$$;

create or replace function public.admin_set_user_role(p_user_id text, p_role text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admins integer;
  v_current text;
begin
  if not public.is_admin_v2() and not public.is_trusted_caller() then
    raise exception 'Admin only';
  end if;
  if p_role not in ('customer','admin') then
    raise exception 'Invalid role: %', p_role;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('admin_role_change', 0));

  select role into v_current from public.profiles where id = p_user_id;
  if not found then raise exception 'User not found'; end if;

  if v_current = 'admin' and p_role = 'customer' then
    select count(*) into v_admins from public.profiles where role = 'admin';
    if v_admins <= 1 then raise exception 'Cannot demote the last remaining admin'; end if;
  end if;

  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

create table if not exists public.business_settings (
  id boolean primary key default true,
  business_name text not null default 'Your Business Name',
  business_type text not null default 'general'
    check(business_type in ('cafe','restaurant','salon','spa','retail','fitness','general','other')),
  currency text not null default 'USD' check(char_length(currency)=3),
  support_email text,
  support_phone text,
  tax_rate_percent numeric(5,2) not null default 0 check (tax_rate_percent between 0 and 100),
  tax_inclusive boolean not null default false,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold > 0),
  max_tip_percent numeric(5,2) not null default 100 check (max_tip_percent between 0 and 1000),
  max_party_size integer not null default 20 check (max_party_size between 1 and 100),
  order_rate_limit_per_hour integer not null default 10 check (order_rate_limit_per_hour >= 0),
  order_status_link_ttl_hours integer not null default 48 check (order_status_link_ttl_hours >= 1),
  unpaid_online_order_expiry_minutes integer not null default 30 check (unpaid_online_order_expiry_minutes between 5 and 1440),
  coupon_attempt_limit integer not null default 20 check (coupon_attempt_limit >= 1),
  coupon_attempt_window_minutes integer not null default 10 check (coupon_attempt_window_minutes >= 1),
  max_active_bookings_per_user integer not null default 5 check (max_active_bookings_per_user >= 0),
  max_booking_horizon_days integer not null default 90 check (max_booking_horizon_days >= 0),
  pending_booking_expiry_hours integer not null default 24 check (pending_booking_expiry_hours >= 0),
  stale_order_expiry_hours integer not null default 24 check (stale_order_expiry_hours >= 0),
  max_push_subscriptions_per_user integer not null default 5 check (max_push_subscriptions_per_user between 1 and 50),
  booking_reminder_lead_minutes integer not null default 60 check (booking_reminder_lead_minutes between 5 and 1440),
  retention_notification_days integer not null default 90 check (retention_notification_days >= 7),
  retention_log_days integer not null default 30 check (retention_log_days >= 7),
  retention_audit_days integer not null default 400 check (retention_audit_days >= 30),
  updated_at timestamptz not null default now(),
  constraint business_settings_singleton check(id)
);

alter table public.business_settings add column if not exists support_email text;
alter table public.business_settings add column if not exists support_phone text;
alter table public.business_settings add column if not exists updated_at timestamptz not null default now();
alter table public.business_settings add column if not exists tax_rate_percent numeric(5,2) not null default 0 check (tax_rate_percent between 0 and 100);
alter table public.business_settings add column if not exists tax_inclusive boolean not null default false;
alter table public.business_settings add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0);
alter table public.business_settings add column if not exists free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold > 0);
alter table public.business_settings add column if not exists max_tip_percent numeric(5,2) not null default 100 check (max_tip_percent between 0 and 1000);
alter table public.business_settings add column if not exists max_party_size integer not null default 20 check (max_party_size between 1 and 100);
alter table public.business_settings add column if not exists order_rate_limit_per_hour integer not null default 10 check (order_rate_limit_per_hour >= 0);
alter table public.business_settings add column if not exists order_status_link_ttl_hours integer not null default 48 check (order_status_link_ttl_hours >= 1);
alter table public.business_settings add column if not exists unpaid_online_order_expiry_minutes integer not null default 30 check (unpaid_online_order_expiry_minutes between 5 and 1440);
alter table public.business_settings add column if not exists coupon_attempt_limit integer not null default 20 check (coupon_attempt_limit >= 1);
alter table public.business_settings add column if not exists coupon_attempt_window_minutes integer not null default 10 check (coupon_attempt_window_minutes >= 1);
alter table public.business_settings add column if not exists max_active_bookings_per_user integer not null default 5 check (max_active_bookings_per_user >= 0);
alter table public.business_settings add column if not exists max_booking_horizon_days integer not null default 90 check (max_booking_horizon_days >= 0);
alter table public.business_settings add column if not exists pending_booking_expiry_hours integer not null default 24 check (pending_booking_expiry_hours >= 0);
alter table public.business_settings add column if not exists stale_order_expiry_hours integer not null default 24 check (stale_order_expiry_hours >= 0);
alter table public.business_settings add column if not exists max_push_subscriptions_per_user integer not null default 5 check (max_push_subscriptions_per_user between 1 and 50);
alter table public.business_settings add column if not exists booking_reminder_lead_minutes integer not null default 60 check (booking_reminder_lead_minutes between 5 and 1440);
alter table public.business_settings add column if not exists retention_notification_days integer not null default 90 check (retention_notification_days >= 7);
alter table public.business_settings add column if not exists retention_log_days integer not null default 30 check (retention_log_days >= 7);
alter table public.business_settings add column if not exists retention_audit_days integer not null default 400 check (retention_audit_days >= 30);

insert into public.business_settings(id) values(true) on conflict(id) do nothing;

drop trigger if exists trg_business_settings_updated_at on public.business_settings;
create trigger trg_business_settings_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

create or replace function public.format_money(p_amount numeric)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select to_char(p_amount,'FM999999990.00') || ' ' ||
         coalesce((select currency from public.business_settings where id),'USD');
$$;


-- ############################################################################
-- # 0003 — LOCATIONS + CATALOG
-- ############################################################################
create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  phone text,
  timezone text not null default 'UTC',
  hours_weekday text not null default 'Mon-Fri: 9am - 6pm',
  hours_weekend text not null default 'Sat-Sun: 10am - 4pm',
  image_url text,
  max_capacity integer not null default 20 check (max_capacity > 0),
  default_booking_duration_minutes integer not null default 60 check (default_booking_duration_minutes > 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_locations add column if not exists phone text;
alter table public.business_locations add column if not exists image_url text;
alter table public.business_locations add column if not exists timezone text not null default 'UTC';
alter table public.business_locations add column if not exists max_capacity integer not null default 20;
alter table public.business_locations add column if not exists default_booking_duration_minutes integer not null default 60;
alter table public.business_locations add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_business_locations_active_order
on public.business_locations(is_active,display_order);

create or replace function public.validate_location_timezone()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid IANA timezone: %', new.timezone;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_business_locations_timezone on public.business_locations;
create trigger trg_business_locations_timezone
before insert or update of timezone on public.business_locations
for each row execute function public.validate_location_timezone();

drop trigger if exists trg_business_locations_updated_at on public.business_locations;
create trigger trg_business_locations_updated_at
before update on public.business_locations
for each row execute function public.set_updated_at();

-- FINAL version (0024 supersedes 0019's fix): locks both locations in id
-- order, so concurrent swaps can never deadlock.
create or replace function public.swap_location_display_order(
  p_location_id_a uuid,
  p_location_id_b uuid
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_a integer;
  v_b integer;
  v_first uuid;
  v_second uuid;
begin
  if not public.is_admin_v2() then raise exception 'Admin only'; end if;
  if p_location_id_a = p_location_id_b then return; end if;

  if p_location_id_a < p_location_id_b then
    v_first := p_location_id_a; v_second := p_location_id_b;
  else
    v_first := p_location_id_b; v_second := p_location_id_a;
  end if;

  perform 1 from public.business_locations where id = v_first for update;
  perform 1 from public.business_locations where id = v_second for update;

  select display_order into v_a from public.business_locations where id = p_location_id_a;
  select display_order into v_b from public.business_locations where id = p_location_id_b;

  if v_a is null or v_b is null then
    raise exception 'One or both locations do not exist (% / %)',
      p_location_id_a, p_location_id_b;
  end if;

  update public.business_locations
  set display_order = case id when p_location_id_a then v_b else v_a end
  where id in (p_location_id_a, p_location_id_b);
end;
$$;

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  price text,
  numeric_price numeric(12,2) not null check (numeric_price > 0),
  description text,
  category text not null default 'general',
  item_type text not null default 'product'
    check (item_type in ('product','service')),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media)='array'),
  is_popular boolean not null default false,
  rating numeric(2,1) check (rating is null or rating between 0 and 5),
  stripe_product_id text,
  stripe_price_id text,
  requires_resource boolean not null default false,
  track_stock boolean not null default false,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_items_service_duration_check
    check (item_type <> 'service' or duration_minutes is not null),
  constraint catalog_items_stock_check
    check (not track_stock or stock_quantity is not null)
);

alter table public.catalog_items add column if not exists numeric_price numeric(12,2);
alter table public.catalog_items add column if not exists updated_at timestamptz not null default now();
alter table public.catalog_items add column if not exists is_active boolean not null default true;
alter table public.catalog_items add column if not exists item_type text not null default 'product';
alter table public.catalog_items add column if not exists duration_minutes integer;
alter table public.catalog_items add column if not exists requires_resource boolean not null default false;
alter table public.catalog_items add column if not exists track_stock boolean not null default false;
alter table public.catalog_items add column if not exists stock_quantity integer
  check (stock_quantity is null or stock_quantity >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'catalog_items_stock_check'
      and conrelid = 'public.catalog_items'::regclass
  ) then
    alter table public.catalog_items
      add constraint catalog_items_stock_check
      check (not track_stock or stock_quantity is not null);
  end if;
end $$;

update public.catalog_items ci
set numeric_price = case
      when cleaned.v ~ '^([0-9]+(\.[0-9]*)?|\.[0-9]+)$' then cleaned.v::numeric
    end
from (
  select id, regexp_replace(btrim(price), '[,$\s]', '', 'g') as v
  from public.catalog_items
  where (numeric_price is null or numeric_price <= 0)
    and price is not null
) cleaned
where ci.id = cleaned.id
  and cleaned.v ~ '^([0-9]+(\.[0-9]*)?|\.[0-9]+)$'
  and cleaned.v <> '.';

do $$
begin
  if exists(
    select 1 from public.catalog_items
    where numeric_price is null or numeric_price <= 0
  ) then
    raise exception
      'Unsafe catalog data: every catalog_items.numeric_price must be > 0. Correct the remaining rows and rerun.';
  end if;
end $$;

alter table public.catalog_items drop constraint if exists catalog_items_numeric_price_check;
alter table public.catalog_items
  add constraint catalog_items_numeric_price_check check (numeric_price > 0);
alter table public.catalog_items alter column numeric_price set not null;

update public.catalog_items
set price = to_char(numeric_price,'FM999999990.00')
where price is distinct from to_char(numeric_price,'FM999999990.00');

create or replace function public.sync_catalog_price_display()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.price := to_char(new.numeric_price,'FM999999990.00');
  return new;
end;
$$;

drop trigger if exists trg_catalog_price_display on public.catalog_items;
create trigger trg_catalog_price_display
before insert or update of numeric_price on public.catalog_items
for each row execute function public.sync_catalog_price_display();

drop trigger if exists trg_catalog_items_updated_at on public.catalog_items;
create trigger trg_catalog_items_updated_at
before update on public.catalog_items
for each row execute function public.set_updated_at();

create index if not exists idx_catalog_items_active_category
on public.catalog_items(is_active,category);

create index if not exists idx_catalog_items_type
on public.catalog_items(item_type,is_active);


-- ############################################################################
-- # 0004 — COUPONS + ORDERS
-- ############################################################################
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null check(discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check(discount_value > 0),
  min_order_amount numeric(12,2) not null default 0 check(min_order_amount >= 0),
  max_discount_amount numeric(12,2) check(max_discount_amount is null or max_discount_amount > 0),
  usage_limit integer check(usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check(used_count >= 0),
  max_uses_per_user integer check(max_uses_per_user is null or max_uses_per_user > 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percentage_limit check(discount_type <> 'percentage' or discount_value <= 100),
  constraint coupons_date_order check(expires_at is null or expires_at > starts_at)
);

alter table public.coupons add column if not exists max_uses_per_user integer
  check(max_uses_per_user is null or max_uses_per_user > 0);

create or replace function public.normalize_coupon_code()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.code := upper(btrim(new.code));
  if new.code = '' then raise exception 'Coupon code cannot be empty'; end if;
  return new;
end;
$$;

drop trigger if exists trg_coupons_normalize on public.coupons;
create trigger trg_coupons_normalize
before insert or update of code on public.coupons
for each row execute function public.normalize_coupon_code();

update public.coupons
set code = upper(btrim(code))
where code is distinct from upper(btrim(code));

do $$
begin
  if exists(select code from public.coupons group by code having count(*) > 1) then
    raise exception 'Duplicate normalized coupon codes exist. Resolve them before production hardening.';
  end if;
end $$;

create unique index if not exists coupons_code_unique on public.coupons(code);
create index if not exists coupons_active_lookup on public.coupons(is_active,starts_at,expires_at);

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create table if not exists public.coupon_attempts (
  id bigint generated always as identity primary key,
  user_id text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_coupon_attempts_user_time
on public.coupon_attempts(user_id, attempted_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  customer_name text,
  order_type text not null default 'pickup'
    check(order_type in ('delivery','pickup','scheduled')),
  payment_method text not null default 'in_person'
    check(payment_method in ('online','in_person')),
  address text,
  phone text,
  coupon_id uuid references public.coupons(id) on delete set null,
  subtotal_amount numeric(12,2) not null default 0 check(subtotal_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check(discount_amount >= 0),
  total_amount numeric(12,2) not null default 0 check(total_amount >= 0),
  total_price numeric(12,2) not null default 0 check(total_price >= 0),
  tax_rate_percent numeric(5,2) not null default 0 check(tax_rate_percent between 0 and 100),
  tax_inclusive boolean not null default false,
  tax_amount numeric(12,2) not null default 0 check(tax_amount >= 0),
  delivery_fee_amount numeric(12,2) not null default 0 check(delivery_fee_amount >= 0),
  tip_amount numeric(12,2) not null default 0 check(tip_amount >= 0),
  -- Declared here (not only in 0019) so triggers that list it in an
  -- UPDATE OF column list can be created on a fresh install. Made NOT NULL
  -- in 0019 after the backfill.
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  stock_restored boolean not null default false,
  refund_required boolean not null default false,
  refund_flagged_at timestamptz,
  status text not null default 'incoming'
    check(status in ('incoming','pending','approved','preparing','ready',
                     'completed','declined','refunded')),
  is_paid boolean not null default false,
  items jsonb not null default '[]'::jsonb check(jsonb_typeof(items)='array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists tax_rate_percent numeric(5,2) not null default 0
  check(tax_rate_percent between 0 and 100);
alter table public.orders add column if not exists tax_inclusive boolean not null default false;
alter table public.orders add column if not exists tax_amount numeric(12,2) not null default 0
  check(tax_amount >= 0);
alter table public.orders add column if not exists delivery_fee_amount numeric(12,2) not null default 0
  check(delivery_fee_amount >= 0);
alter table public.orders add column if not exists tip_amount numeric(12,2) not null default 0
  check(tip_amount >= 0);
alter table public.orders add column if not exists stock_restored boolean not null default false;
alter table public.orders add column if not exists refund_required boolean not null default false;
alter table public.orders add column if not exists refund_flagged_at timestamptz;
-- currency: snapshot column; set NOT NULL + trigger-managed in 0019/0020.

create index if not exists idx_orders_user_created on public.orders(user_id,created_at desc);
create index if not exists idx_orders_status_created on public.orders(status,created_at desc);
create index if not exists idx_orders_payment_created on public.orders(payment_method,is_paid,created_at desc);
create index if not exists idx_orders_refund_required on public.orders(created_at desc) where refund_required;
create index if not exists idx_orders_coupon on public.orders(coupon_id) where coupon_id is not null;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id text,
  discount_amount numeric(12,2) not null check(discount_amount >= 0),
  redeemed_at timestamptz not null default now(),
  released_at timestamptz
);

alter table public.coupon_redemptions add column if not exists released_at timestamptz;

do $$
begin
  if exists(select 1 from public.coupon_redemptions where order_id is null) then
    raise exception 'Unsafe coupon_redemptions data: order_id cannot be null.';
  end if;
end $$;

alter table public.coupon_redemptions alter column order_id set not null;
alter table public.coupon_redemptions drop constraint if exists coupon_redemptions_order_id_key;
alter table public.coupon_redemptions drop constraint if exists coupon_redemptions_coupon_id_order_id_key;

create unique index if not exists coupon_redemptions_active_order_uq
on public.coupon_redemptions(order_id) where released_at is null;

create index if not exists coupon_redemptions_order_idx on public.coupon_redemptions(order_id);
create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions(coupon_id,redeemed_at desc);
create index if not exists coupon_redemptions_user_idx on public.coupon_redemptions(user_id,redeemed_at desc);


-- ############################################################################
-- # 0005 — BOOKINGS
-- ############################################################################
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.business_locations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resources_location
on public.resources(location_id, is_active, display_order);

drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

create table if not exists public.location_opening_hours (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.business_locations(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  constraint location_opening_hours_order check (closes_at > opens_at)
);

create index if not exists idx_location_opening_hours_lookup
on public.location_opening_hours(location_id, weekday);

create table if not exists public.location_closures (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.business_locations(id) on delete cascade,
  closed_on date not null,
  reason text check (reason is null or char_length(reason) <= 300),
  unique (location_id, closed_on)
);

create or replace function public.set_booking_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tz text;
  v_location_default integer;
  v_item_duration integer;
  v_requires_resource boolean := false;
  v_max_party integer;
  v_override boolean := public.is_trusted_caller() or public.is_admin_v2();
  v_limit integer;
  v_horizon integer;
  v_active integer;
begin
  select timezone, default_booking_duration_minutes
  into v_tz, v_location_default
  from public.business_locations
  where id = new.location_id and is_active = true;

  if v_tz is null then raise exception 'Booking location is missing or inactive'; end if;

  select max_party_size into v_max_party from public.business_settings where id;
  if new.party_size > coalesce(v_max_party, 20) then
    raise exception 'Party size exceeds the maximum of %', coalesce(v_max_party, 20);
  end if;

  if new.catalog_item_id is not null then
    select duration_minutes, requires_resource
    into v_item_duration, v_requires_resource
    from public.catalog_items
    where id = new.catalog_item_id and is_active = true;

    if v_item_duration is null then
      raise exception 'Booked item is unavailable or has no duration configured';
    end if;
  end if;

  if new.resource_id is not null then
    perform 1 from public.resources
    where id = new.resource_id and location_id = new.location_id and is_active = true;
    if not found then
      raise exception 'Selected resource is unavailable at this location';
    end if;
  elsif v_requires_resource then
    raise exception 'This service requires choosing a staff member or resource';
  end if;

  new.duration_minutes := coalesce(v_item_duration, v_location_default);

  begin
    new.booking_at := (new.booking_date + new.booking_time) at time zone v_tz;
  exception when invalid_parameter_value then
    raise exception 'Invalid location timezone: %', v_tz;
  end;

  if new.booking_at <= now() then raise exception 'Booking must be in the future'; end if;

  if not v_override and tg_op = 'INSERT' then
    select max_active_bookings_per_user, max_booking_horizon_days
    into v_limit, v_horizon
    from public.business_settings where id;

    if coalesce(v_horizon, 0) > 0
       and new.booking_at > now() + make_interval(days => v_horizon) then
      raise exception 'Bookings can only be made up to % days ahead', v_horizon;
    end if;

    if coalesce(v_limit, 0) > 0 and new.user_id is not null then
      perform pg_advisory_xact_lock(hashtextextended('booking_user:' || new.user_id, 0));

      select count(*) into v_active
      from public.bookings
      where user_id = new.user_id
        and status in ('pending','confirmed')
        and booking_at > now();

      if v_active >= v_limit then
        raise exception 'You already have % upcoming bookings; cancel one to book another', v_active
          using errcode = '23514';
      end if;
    end if;
  end if;

  if not v_override then
    if exists (
      select 1 from public.location_closures
      where location_id = new.location_id and closed_on = new.booking_date
    ) then
      raise exception 'The location is closed on that date';
    end if;

    if exists (
      select 1 from public.location_opening_hours where location_id = new.location_id
    ) and not exists (
      select 1 from public.location_opening_hours h
      where h.location_id = new.location_id
        and h.weekday = extract(dow from new.booking_date)::int
        and new.booking_time >= h.opens_at
        and extract(epoch from new.booking_time) + new.duration_minutes * 60
              <= extract(epoch from h.closes_at)
    ) then
      raise exception 'That time is outside opening hours';
    end if;
  end if;

  new.booking_range := tstzrange(
    new.booking_at,
    new.booking_at + make_interval(mins => new.duration_minutes),
    '[)'
  );

  return new;
end;
$$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_name text,
  user_email text,
  location_id uuid not null references public.business_locations(id) on delete restrict,
  catalog_item_id uuid references public.catalog_items(id) on delete restrict,
  resource_id uuid references public.resources(id) on delete restrict,
  booking_date date not null,
  booking_time time not null,
  booking_at timestamptz,
  duration_minutes integer not null default 30 check(duration_minutes > 0),
  party_size integer not null default 1 check(party_size between 1 and 100),
  status text not null default 'pending'
    check(status in ('pending','confirmed','completed','cancelled')),
  special_requests text check(special_requests is null or char_length(special_requests)<=500),
  reminder_sent boolean not null default false,
  cancelled_at timestamptz,
  cancelled_reason text check(cancelled_reason is null or char_length(cancelled_reason)<=300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  r record;
  v_cast time;
  v_type text;
begin
  select data_type into v_type
  from information_schema.columns
  where table_schema='public' and table_name='bookings' and column_name='booking_time';

  if v_type is not null and v_type <> 'time without time zone' then
    for r in execute 'select id,booking_time from public.bookings' loop
      begin
        v_cast := btrim(r.booking_time::text)::time;
      exception when others then
        raise exception 'Invalid legacy booking_time for booking %: "%". Fix this row and rerun.',
          r.id, r.booking_time;
      end;
    end loop;

    execute 'alter table public.bookings alter column booking_time type time using btrim(booking_time::text)::time';
  end if;
end $$;

alter table public.bookings add column if not exists booking_at timestamptz;
alter table public.bookings add column if not exists duration_minutes integer not null default 30;
alter table public.bookings add column if not exists updated_at timestamptz not null default now();
alter table public.bookings add column if not exists booking_range tstzrange;
alter table public.bookings add column if not exists catalog_item_id uuid
  references public.catalog_items(id) on delete restrict;
alter table public.bookings add column if not exists special_requests text
  check (special_requests is null or char_length(special_requests) <= 500);
alter table public.bookings add column if not exists reminder_sent boolean not null default false;
alter table public.bookings add column if not exists cancelled_at timestamptz;
alter table public.bookings add column if not exists cancelled_reason text
  check (cancelled_reason is null or char_length(cancelled_reason) <= 300);
alter table public.bookings add column if not exists resource_id uuid
  references public.resources(id) on delete restrict;

alter table public.bookings drop constraint if exists bookings_party_size_check;
alter table public.bookings add constraint bookings_party_size_check
  check (party_size between 1 and 100);

do $$
begin
  if exists(select 1 from public.bookings where location_id is null) then
    raise exception 'Unsafe booking data: location_id cannot be null. Repair existing bookings and rerun.';
  end if;
end $$;

alter table public.bookings alter column location_id set not null;

drop trigger if exists trg_bookings_timestamp on public.bookings;
drop trigger if exists trg_bookings_1_timestamp on public.bookings;
drop trigger if exists trg_bookings_rules on public.bookings;
drop trigger if exists trg_bookings_2_rules on public.bookings;
drop trigger if exists trg_bookings_capacity on public.bookings;
drop trigger if exists trg_bookings_3_capacity on public.bookings;
drop trigger if exists trg_bookings_updated_at on public.bookings;
drop trigger if exists trg_bookings_9_updated_at on public.bookings;

update public.bookings b
set booking_at = (b.booking_date + b.booking_time) at time zone l.timezone,
    duration_minutes = coalesce(
      (select ci.duration_minutes from public.catalog_items ci where ci.id = b.catalog_item_id),
      l.default_booking_duration_minutes
    )
from public.business_locations l
where l.id = b.location_id
  and b.booking_at is null;

do $$
begin
  if exists(select 1 from public.bookings where booking_at is null) then
    raise exception 'Could not derive booking_at for one or more bookings';
  end if;
end $$;

alter table public.bookings alter column booking_at set not null;

update public.bookings
set booking_range = tstzrange(booking_at, booking_at + make_interval(mins => duration_minutes), '[)')
where booking_range is null;

alter table public.bookings alter column booking_range set not null;

create index if not exists idx_bookings_location_range_active
on public.bookings using gist (location_id, booking_range)
where status in ('pending','confirmed');

create index if not exists idx_bookings_location_at on public.bookings(location_id,booking_at);
create index if not exists idx_bookings_location_date_time on public.bookings(location_id,booking_date,booking_time);
create index if not exists idx_bookings_reminders on public.bookings(status,reminder_sent,booking_at);
create index if not exists idx_bookings_user_created on public.bookings(user_id,created_at desc);
create index if not exists idx_bookings_catalog_item on public.bookings(catalog_item_id) where catalog_item_id is not null;

create unique index if not exists uq_booking_user_slot
on public.bookings(user_id,location_id,booking_date,booking_time)
where user_id is not null and status in ('pending','confirmed');

create index if not exists idx_bookings_resource on public.bookings(resource_id) where resource_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_resource_no_overlap'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_resource_no_overlap
      exclude using gist (resource_id with =, booking_range with &&)
      where (resource_id is not null and status in ('pending','confirmed'));
  end if;
end $$;

create trigger trg_bookings_1_timestamp
before insert or update of location_id,catalog_item_id,resource_id,party_size,booking_date,booking_time,duration_minutes,booking_at,booking_range
on public.bookings
for each row execute function public.set_booking_timestamp();

create or replace function public.enforce_booking_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_privileged boolean := public.is_trusted_caller() or public.is_admin_v2();
begin
  if tg_op = 'INSERT' and not v_privileged then
    new.status := 'pending';
    new.reminder_sent := false;
    new.cancelled_at := null;
    new.cancelled_reason := null;
    new.created_at := now();
  end if;

  if tg_op = 'UPDATE'
     and old.status in ('cancelled','completed')
     and new.status is distinct from old.status
     and not public.is_trusted_caller()
  then
    raise exception 'Cannot change status of a % booking', old.status;
  end if;

  if tg_op = 'UPDATE' and not v_privileged then
    if old.status in ('cancelled','completed') then
      raise exception 'This booking is closed and can no longer be edited';
    end if;

    if new.status is distinct from old.status
       and not (new.status = 'cancelled' and old.status in ('pending','confirmed'))
    then
      raise exception 'Customers may only cancel pending or confirmed bookings';
    end if;

    if old.status = 'confirmed'
       and (
         new.location_id is distinct from old.location_id
         or new.catalog_item_id is distinct from old.catalog_item_id
         or new.resource_id is distinct from old.resource_id
         or new.booking_date is distinct from old.booking_date
         or new.booking_time is distinct from old.booking_time
         or new.party_size is distinct from old.party_size
       )
    then
      raise exception 'Confirmed bookings cannot be edited; cancel and create a new booking';
    end if;

    new.reminder_sent := old.reminder_sent;
  end if;

  if tg_op = 'UPDATE'
     and new.status = 'cancelled'
     and old.status <> 'cancelled'
  then
    new.cancelled_at := coalesce(new.cancelled_at, now());
  end if;

  return new;
end;
$$;

create trigger trg_bookings_2_rules
before insert or update on public.bookings
for each row execute function public.enforce_booking_rules();

-- FINAL: 0023's clamped sweep. No regression risk from earlier iterations.
create or replace function public.location_peak_occupancy(
  p_location_id uuid,
  p_window tstzrange,
  p_exclude_booking_id uuid default null
)
returns bigint
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_peak bigint := 0;
  v_running bigint := 0;
  r record;
begin
  for r in
    select t, delta
    from (
      select greatest(lower(b.booking_range), lower(p_window)) as t,
             b.party_size as delta
      from public.bookings b
      where b.location_id = p_location_id
        and b.status in ('pending','confirmed')
        and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
        and b.booking_range && p_window

      union all

      select least(upper(b.booking_range), upper(p_window)) as t,
             -b.party_size as delta
      from public.bookings b
      where b.location_id = p_location_id
        and b.status in ('pending','confirmed')
        and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
        and b.booking_range && p_window
        and upper(b.booking_range) > lower(p_window)
    ) events
    order by t, delta
  loop
    v_running := v_running + r.delta;
    if v_running > v_peak then v_peak := v_running; end if;
  end loop;

  return v_peak;
end;
$$;

create or replace function public.enforce_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_capacity integer;
  v_peak bigint;
  v_start timestamptz;
  v_end timestamptz;
  v_window tstzrange;
  v_first uuid;
  v_second uuid;
begin
  if new.status not in ('pending','confirmed') then return new; end if;

  if tg_op = 'UPDATE' and old.location_id <> new.location_id then
    if old.location_id < new.location_id then
      v_first := old.location_id; v_second := new.location_id;
    else
      v_first := new.location_id; v_second := old.location_id;
    end if;
    perform 1 from public.business_locations where id = v_first for update;
    perform 1 from public.business_locations where id = v_second for update;
  else
    perform 1 from public.business_locations where id = new.location_id for update;
  end if;

  select max_capacity into v_capacity
  from public.business_locations
  where id = new.location_id and is_active = true;

  if v_capacity is null then raise exception 'Location is missing or inactive'; end if;
  if new.booking_at is null or new.booking_range is null then
    raise exception 'Booking timestamp could not be resolved';
  end if;
  if new.duration_minutes is null or new.duration_minutes <= 0 then
    raise exception 'Booking duration must be positive';
  end if;
  if new.party_size is null or new.party_size <= 0 then
    raise exception 'Party size must be positive';
  end if;

  v_start := new.booking_at;
  v_end := new.booking_at + make_interval(mins => new.duration_minutes);
  v_window := tstzrange(v_start, v_end, '[)');

  v_peak := public.location_peak_occupancy(
    new.location_id,
    v_window,
    case when new.id is not null then new.id else null end
  );

  if v_peak + new.party_size > v_capacity then
    raise exception
      'Location capacity exceeded: % requested, % already committed, % capacity',
      new.party_size, v_peak, v_capacity
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger trg_bookings_3_capacity
before insert or update of location_id,catalog_item_id,booking_date,booking_time,booking_at,duration_minutes,party_size,status
on public.bookings
for each row execute function public.enforce_booking_capacity();

create trigger trg_bookings_9_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

do $$
declare
  v_order text[];
begin
  select array_agg(tgname order by tgname) into v_order
  from pg_trigger
  where tgrelid = 'public.bookings'::regclass
    and tgname like 'trg_bookings_%'
    and not tgisinternal;

  if v_order is distinct from array[
    'trg_bookings_1_timestamp','trg_bookings_2_rules',
    'trg_bookings_3_capacity','trg_bookings_9_updated_at'
  ] then
    raise exception 'bookings trigger order is wrong (got %); capacity enforcement would silently no-op.', v_order;
  end if;
end $$;

-- FINAL: 0019's guard re-declared with 0023's clamp via location_peak_occupancy.
create or replace function public.guard_location_capacity_reduction()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_peak bigint;
  v_window tstzrange;
begin
  if new.max_capacity >= old.max_capacity then return new; end if;

  select tstzrange(now(), coalesce(max(upper(b.booking_range)), now() + interval '1 minute'), '[)')
  into v_window
  from public.bookings b
  where b.location_id = new.id
    and b.status in ('pending','confirmed')
    and upper(b.booking_range) > now();

  v_peak := public.location_peak_occupancy(new.id, v_window, null);

  if v_peak > new.max_capacity then
    raise exception
      'Cannot reduce capacity to %: existing future bookings need up to % seats. Move or cancel them first.',
      new.max_capacity, v_peak
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_business_locations_capacity_guard on public.business_locations;
create trigger trg_business_locations_capacity_guard
before update of max_capacity on public.business_locations
for each row execute function public.guard_location_capacity_reduction();


-- ############################################################################
-- # 0006 — CUSTOMER FEATURES
-- ############################################################################
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id,item_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  quantity integer not null default 1 check(quantity between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,item_id)
);

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create index if not exists idx_favorites_user on public.favorites(user_id,created_at desc);
create index if not exists idx_favorites_item on public.favorites(item_id);
create index if not exists idx_cart_items_user on public.cart_items(user_id,created_at desc);
create index if not exists idx_cart_items_item on public.cart_items(item_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  catalog_item_id uuid references public.catalog_items(id) on delete restrict,
  item_name text not null,
  rating integer not null check(rating between 1 and 5),
  remark text check(remark is null or char_length(remark)<=2000),
  user_id text not null,
  created_at timestamptz not null default now()
);

alter table public.reviews add column if not exists catalog_item_id uuid references public.catalog_items(id) on delete restrict;
alter table public.reviews add column if not exists item_name text;
alter table public.reviews add column if not exists rating integer;
alter table public.reviews add column if not exists remark text;
alter table public.reviews add column if not exists created_at timestamptz not null default now();

update public.reviews r
set item_name = ci.name
from public.catalog_items ci
where r.item_name is null and r.catalog_item_id = ci.id;

do $$
begin
  if exists(select 1 from public.reviews where item_name is null or btrim(item_name) = '') then
    raise exception 'Unsafe review data: item_name is null/empty with no catalog_item_id to backfill from. Populate it and rerun.';
  end if;
  if exists(select 1 from public.reviews where rating is null) then
    raise exception 'Unsafe review data: rating is null for existing reviews. Populate a rating (1-5) and rerun.';
  end if;
  if exists(select 1 from public.reviews where user_id is null or order_id is null) then
    raise exception 'Unsafe review data: existing reviews must have user_id and order_id.';
  end if;
end $$;

alter table public.reviews alter column item_name set not null;
alter table public.reviews alter column rating set not null;
alter table public.reviews alter column user_id set not null;
alter table public.reviews alter column order_id set not null;

alter table public.reviews drop constraint if exists reviews_rating_check;
alter table public.reviews add constraint reviews_rating_check check(rating between 1 and 5);
alter table public.reviews drop constraint if exists reviews_remark_check;
alter table public.reviews add constraint reviews_remark_check check(remark is null or char_length(remark)<=2000);

create unique index if not exists uq_reviews_user_order_item
on public.reviews(user_id,order_id,lower(btrim(item_name)));

create unique index if not exists uq_reviews_user_order_catalog_item
on public.reviews(user_id,order_id,catalog_item_id)
where catalog_item_id is not null;

create index if not exists idx_reviews_item on public.reviews(lower(item_name),created_at desc);
create index if not exists idx_reviews_catalog_item_id on public.reviews(catalog_item_id,created_at desc);
create index if not exists idx_reviews_order on public.reviews(order_id);

create or replace function public.validate_review()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trusted boolean := public.is_trusted_caller();
  v_uid text := public.requesting_user_id();
  v_order record;
  v_name text;
  v_has_item boolean;
begin
  if tg_op = 'UPDATE' and not v_trusted then
    new.user_id := old.user_id;
    new.order_id := old.order_id;
    new.catalog_item_id := old.catalog_item_id;
    new.item_name := old.item_name;
    new.created_at := old.created_at;
    return new;
  end if;

  if not v_trusted and new.user_id is distinct from v_uid then
    raise exception 'You can only review as yourself';
  end if;

  select user_id, status, items into v_order
  from public.orders where id = new.order_id;

  if not found or v_order.status <> 'completed' then
    raise exception 'Reviews require a completed order';
  end if;

  if not v_trusted and v_order.user_id is distinct from v_uid then
    raise exception 'You can only review your own order';
  end if;

  if new.catalog_item_id is not null then
    select name into v_name from public.catalog_items where id = new.catalog_item_id;
    if v_name is null then raise exception 'Unknown catalog item'; end if;
    new.item_name := v_name;

    select exists(
      select 1
      from jsonb_to_recordset(v_order.items) as x(item_id uuid, quantity integer)
      where x.item_id = new.catalog_item_id
    ) into v_has_item;
  else
    if not v_trusted then raise exception 'catalog_item_id is required'; end if;

    select exists(
      select 1 from jsonb_array_elements(v_order.items) x
      where lower(btrim(coalesce(x->>'name',''))) = lower(btrim(new.item_name))
         or lower(btrim(coalesce(x->>'product_name',''))) = lower(btrim(new.item_name))
    ) into v_has_item;
  end if;

  if not v_has_item then raise exception 'Item was not part of the order'; end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_review on public.reviews;
create trigger trg_validate_review
before insert or update on public.reviews
for each row execute function public.validate_review();

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  assistant_type text not null default 'customer',
  title text not null default 'New Conversation',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check(role in('user','assistant')),
  content text not null,
  action jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_chats_updated_at on public.chats;
create trigger trg_chats_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

create index if not exists idx_chats_user_updated on public.chats(user_id,updated_at desc);
create index if not exists idx_chat_messages_chat_created on public.chat_messages(chat_id,created_at);

create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  content text not null,
  embedding vector(1536),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_knowledge_base_updated_at on public.knowledge_base;
create trigger trg_knowledge_base_updated_at
before update on public.knowledge_base
for each row execute function public.set_updated_at();

create index if not exists knowledge_base_embedding_hnsw
on public.knowledge_base using hnsw(embedding vector_cosine_ops)
where embedding is not null;

create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count integer
)
returns table(id uuid,category text,content text,similarity float)
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select kb.id, kb.category, kb.content,
         1-(kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where kb.embedding is not null
    and 1-(kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit greatest(1,least(match_count,100));
$$;

create table if not exists public.game_rewards (
  id uuid primary key default gen_random_uuid(),
  reward_key text unique not null,
  title text not null,
  promo_code text not null,
  discount_value text not null,
  description text,
  requires_play boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_claimed_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  reward_id uuid not null references public.game_rewards(id) on delete restrict,
  reward_key text,
  title text not null,
  promo_code text not null,
  discount_value text not null,
  claimed_at timestamptz not null default now(),
  unique(user_id,reward_id)
);

alter table public.user_claimed_rewards add column if not exists reward_key text;

update public.user_claimed_rewards c
set reward_key = g.reward_key
from public.game_rewards g
where g.id = c.reward_id and c.reward_key is null;

alter table public.user_claimed_rewards alter column reward_key set not null;

create index if not exists idx_user_claimed_rewards_user on public.user_claimed_rewards(user_id,claimed_at desc);
create index if not exists idx_user_claimed_rewards_reward on public.user_claimed_rewards(reward_id);

drop trigger if exists trg_game_rewards_updated_at on public.game_rewards;
create trigger trg_game_rewards_updated_at
before update on public.game_rewards
for each row execute function public.set_updated_at();

do $$
begin
  if to_regclass('public.user_game_rewards') is not null then
    execute $q$
      insert into public.user_claimed_rewards
        (user_id, reward_id, reward_key, title, promo_code, discount_value, claimed_at)
      select u.user_id, g.id, g.reward_key, u.title, u.promo_code, u.discount_value, u.claimed_at
      from public.user_game_rewards u
      join public.game_rewards g on g.reward_key = u.reward_key
      on conflict (user_id, reward_id) do nothing
    $q$;
    execute 'alter table public.user_game_rewards rename to user_game_rewards_legacy';
    execute 'alter table public.user_game_rewards_legacy enable row level security';
    execute 'revoke all on public.user_game_rewards_legacy from anon, authenticated';
  end if;
end $$;

alter table public.game_rewards
  add column if not exists requires_play boolean not null default false;

create table if not exists public.game_plays (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  reward_key text not null,
  outcome text not null check (outcome in ('won','lost')),
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index if not exists idx_game_plays_user
on public.game_plays(user_id, reward_key, created_at desc);

drop function if exists public.claim_game_reward(uuid);

-- FINAL: 0019's race-safe insert-then-consume.
create or replace function public.claim_game_reward(
  p_reward_id uuid,
  p_play_id uuid default null
)
returns public.user_claimed_rewards
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.game_rewards%rowtype;
  out_row public.user_claimed_rewards%rowtype;
  uid text := public.requesting_user_id();
  v_inserted boolean := false;
  v_consumed boolean := false;
begin
  if uid is null then raise exception 'Authentication required'; end if;

  select * into r
  from public.game_rewards
  where id = p_reward_id and is_active = true
  for share;

  if not found then raise exception 'Reward unavailable'; end if;

  insert into public.user_claimed_rewards(
    user_id, reward_id, reward_key, title, promo_code, discount_value
  )
  values(uid, r.id, r.reward_key, r.title, r.promo_code, r.discount_value)
  on conflict (user_id, reward_id) do nothing
  returning * into out_row;

  v_inserted := out_row.id is not null;

  if not v_inserted then
    select * into out_row
    from public.user_claimed_rewards
    where user_id = uid and reward_id = r.id;
    return out_row;
  end if;

  if r.requires_play then
    if p_play_id is null then
      raise exception 'A recent winning game play is required to claim this reward';
    end if;

    update public.game_plays
    set consumed_at = now()
    where id = p_play_id
      and user_id = uid
      and reward_key = r.reward_key
      and outcome = 'won'
      and consumed_at is null
      and created_at > now() - interval '1 hour'
    returning true into v_consumed;

    if not coalesce(v_consumed, false) then
      delete from public.user_claimed_rewards
      where user_id = uid and reward_id = r.id;
      raise exception 'A recent winning game play is required to claim this reward';
    end if;
  end if;

  if r.reward_key = 'welcome_reward' then
    update public.profiles set has_claimed_welcome_reward = true where id = uid;
  end if;

  return out_row;
end;
$$;


-- ############################################################################
-- # 0007 — NOTIFICATIONS + PUSH
-- ############################################################################
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null check(char_length(title) between 1 and 200),
  message text not null check(char_length(message) between 1 and 4000),
  type text not null default 'info',
  order_id uuid references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
on public.notifications(user_id,is_read,created_at desc);
create index if not exists idx_notifications_order
on public.notifications(order_id) where order_id is not null;

create table if not exists public.notification_settings (
  user_id text primary key,
  muted boolean not null default false,
  muted_types text[] not null default '{}',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_notification_settings_updated_at on public.notification_settings;
create trigger trg_notification_settings_updated_at
before update on public.notification_settings
for each row execute function public.set_updated_at();

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.push_subscriptions add column if not exists last_seen_at timestamptz not null default now();

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

create or replace function public.is_allowed_push_endpoint(p_endpoint text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_endpoint is not null
     and char_length(p_endpoint) <= 2048
     and p_endpoint ~* (
       '^https://('
       || 'fcm\.googleapis\.com'
       || '|android\.googleapis\.com'
       || '|updates\.push\.services\.mozilla\.com'
       || '|[a-z0-9-]+(\.[a-z0-9-]+)*\.notify\.windows\.com'
       || '|web\.push\.apple\.com'
       || '|[a-z0-9-]+(\.[a-z0-9-]+)*\.push\.apple\.com'
       || ')(:443)?/[^[:space:]]*$'
     );
$$;

create or replace function public.claim_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns public.push_subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid text := public.requesting_user_id();
  out_row public.push_subscriptions%rowtype;
  v_max integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not public.is_allowed_push_endpoint(p_endpoint) then
    raise exception 'Unsupported push endpoint';
  end if;
  if p_p256dh is null or btrim(p_p256dh) = '' or char_length(p_p256dh) > 256
     or p_auth is null or btrim(p_auth) = '' or char_length(p_auth) > 128
  then
    raise exception 'Invalid push subscription payload';
  end if;

  insert into public.push_subscriptions(user_id, endpoint, p256dh, auth, last_seen_at)
  values (uid, p_endpoint, p_p256dh, p_auth, clock_timestamp())
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    last_seen_at = clock_timestamp()
  returning * into out_row;

  select max_push_subscriptions_per_user into v_max
  from public.business_settings where id;

  delete from public.push_subscriptions
  where user_id = uid
    and id not in (
      select id from public.push_subscriptions
      where user_id = uid
      order by last_seen_at desc, id
      limit coalesce(v_max, 5)
    );

  return out_row;
end;
$$;

create table if not exists public.push_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete set null,
  user_id text,
  endpoint text,
  status text not null check(status in('sent','failed','skipped_muted','skipped_no_subscription')),
  http_status integer,
  error_detail text check (error_detail is null or char_length(error_detail) <= 4000),
  created_at timestamptz not null default now()
);

alter table public.push_delivery_log add column if not exists http_status integer;

create index if not exists idx_push_delivery_log_created on public.push_delivery_log(created_at desc);
create index if not exists idx_push_delivery_log_notification
on public.push_delivery_log(notification_id) where notification_id is not null;

drop trigger if exists on_notification_push on public.notifications;
drop function if exists public.notify_push_webhook();
drop function if exists public.push_queue_read(integer, integer);
drop function if exists public.push_queue_ack(bigint);


-- ############################################################################
-- # 0008 — ORDER ENGINE
-- ############################################################################
create or replace function public.reserve_coupon_for_order_internal(
  p_coupon_id uuid,
  p_order_id uuid,
  p_user_id text,
  p_discount numeric(12,2)
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c public.coupons%rowtype;
  v_uses integer;
begin
  select * into c from public.coupons where id = p_coupon_id for update;

  if not found
     or not c.is_active
     or c.starts_at > now()
     or (c.expires_at is not null and c.expires_at <= now())
     or (c.usage_limit is not null and c.used_count >= c.usage_limit)
  then
    raise exception 'Coupon unavailable';
  end if;

  if c.max_uses_per_user is not null then
    if p_user_id is null then
      raise exception 'This coupon requires a signed-in customer';
    end if;

    select count(*) into v_uses
    from public.coupon_redemptions
    where coupon_id = p_coupon_id and user_id = p_user_id and released_at is null;

    if v_uses >= c.max_uses_per_user then
      raise exception 'Coupon already used the maximum number of times';
    end if;
  end if;

  insert into public.coupon_redemptions(coupon_id,order_id,user_id,discount_amount)
  values(p_coupon_id,p_order_id,p_user_id,p_discount);

  update public.coupons
  set used_count = used_count + 1, updated_at = now()
  where id = p_coupon_id and (usage_limit is null or used_count < usage_limit);

  if not found then raise exception 'Coupon usage limit reached'; end if;
end;
$$;

create or replace function public.release_coupon_redemption_internal(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.coupon_redemptions%rowtype;
begin
  select * into r
  from public.coupon_redemptions
  where order_id = p_order_id and released_at is null
  for update;

  if not found then return; end if;

  update public.coupon_redemptions set released_at = now() where id = r.id;

  update public.coupons
  set used_count = greatest(used_count - 1, 0), updated_at = now()
  where id = r.coupon_id;
end;
$$;

-- NOTE: superseded by 0019 §16 (which adds the currency snapshot) and
-- preserved verbatim here so the final CREATE OR REPLACE is the 0019 version.
-- We inline the 0019 version below.
create or replace function public.validate_order_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trusted boolean := public.is_trusted_caller();
  v_admin boolean := public.is_admin_v2();
  s public.business_settings%rowtype;
  v_lines integer;
  v_valid_lines integer;
  v_qty integer;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_taxable numeric(12,2);
  v_tax numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_tip numeric(12,2);
  v_snapshot jsonb;
  v_coupon public.coupons%rowtype;
  v_user_uses integer;
begin
  if tg_op = 'UPDATE' then
    if not v_trusted then
      new.stock_restored := old.stock_restored;
      new.refund_flagged_at := old.refund_flagged_at;
    end if;

    if not v_trusted and not v_admin then
      new.is_paid := old.is_paid;
      new.status := old.status;
    end if;

    if not v_trusted and (
         new.items is distinct from old.items
      or new.coupon_id is distinct from old.coupon_id
      or new.subtotal_amount is distinct from old.subtotal_amount
      or new.discount_amount is distinct from old.discount_amount
      or new.tax_amount is distinct from old.tax_amount
      or new.tax_rate_percent is distinct from old.tax_rate_percent
      or new.tax_inclusive is distinct from old.tax_inclusive
      or new.delivery_fee_amount is distinct from old.delivery_fee_amount
      or new.tip_amount is distinct from old.tip_amount
      or new.total_amount is distinct from old.total_amount
      or new.total_price is distinct from old.total_price
    ) then
      raise exception
        'Order contents and amounts cannot be changed after creation; decline it and create a new order';
    end if;

    if new.status is distinct from old.status then
      if not v_trusted then
        if old.status in ('declined','refunded') then
          raise exception 'Order is % and its status can no longer change', old.status;
        end if;
        if old.status = 'completed' and new.status <> 'refunded' then
          raise exception 'A completed order can only be refunded';
        end if;
      end if;

      if new.status = 'declined' and old.status <> 'declined' and not old.stock_restored then
        new.stock_restored := true;
      end if;
    end if;

    if new.payment_method = 'online' and new.is_paid and new.status = 'declined'
       and old.refund_flagged_at is null then
      new.refund_required := true;
      new.refund_flagged_at := now();
    end if;

    return new;
  end if;

  if not v_trusted then
    new.is_paid := false;
    new.status := 'incoming';
    new.stock_restored := false;
    new.refund_required := false;
    new.refund_flagged_at := null;
  end if;

  select * into s from public.business_settings where id;

  -- Currency snapshot: authoritative business currency, never the caller's.
  -- Note: the currency column is only added in 0019; we write it only if it
  -- exists, so this block stays correct on both sides of the 0019 boundary.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'currency'
  ) then
    new.currency := coalesce(upper(s.currency), 'USD');
  end if;

  if jsonb_typeof(new.items) <> 'array' then
    raise exception 'Order items must be a JSON array';
  end if;

  select count(*) into v_lines
  from jsonb_to_recordset(new.items) as x(item_id uuid, quantity integer);

  if v_lines = 0 then raise exception 'Order must contain at least one item'; end if;
  if v_lines > 100 then raise exception 'Too many order lines'; end if;

  with lines as (
    select x.item_id, x.quantity, ci.name, ci.numeric_price
    from jsonb_to_recordset(new.items) as x(item_id uuid, quantity integer)
    join public.catalog_items ci
      on ci.id = x.item_id and ci.is_active = true and ci.numeric_price > 0
    where x.quantity between 1 and 100
  )
  select count(*),
         coalesce(sum(quantity), 0),
         coalesce(sum(numeric_price * quantity), 0),
         coalesce(jsonb_agg(
           jsonb_build_object(
             'item_id', item_id,
             'quantity', quantity,
             'name', name,
             'unit_price', numeric_price,
             'line_total', round(numeric_price * quantity, 2)
           ) order by item_id
         ), '[]'::jsonb)
  into v_valid_lines, v_qty, v_subtotal, v_snapshot
  from lines;

  if v_valid_lines <> v_lines then
    raise exception 'One or more order items are invalid, unavailable, or have an invalid quantity';
  end if;

  v_subtotal := round(v_subtotal, 2);

  if new.coupon_id is not null then
    select * into v_coupon from public.coupons where id = new.coupon_id;

    if not found
       or not v_coupon.is_active
       or v_coupon.starts_at > now()
       or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
       or v_subtotal < v_coupon.min_order_amount
       or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit)
    then
      raise exception 'Coupon is invalid for this order';
    end if;

    if v_coupon.max_uses_per_user is not null then
      if new.user_id is null then
        raise exception 'This coupon requires a signed-in customer';
      end if;

      select count(*) into v_user_uses
      from public.coupon_redemptions cr
      where cr.coupon_id = v_coupon.id
        and cr.user_id = new.user_id
        and cr.released_at is null;

      if v_user_uses >= v_coupon.max_uses_per_user then
        raise exception 'Coupon already used the maximum number of times';
      end if;
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
    else
      v_discount := v_coupon.discount_value;
    end if;

    if v_coupon.max_discount_amount is not null then
      v_discount := least(v_discount, v_coupon.max_discount_amount);
    end if;

    v_discount := least(v_discount, v_subtotal);
  end if;

  v_taxable := v_subtotal - v_discount;

  if s.tax_rate_percent > 0 then
    if s.tax_inclusive then
      v_tax := round(v_taxable * s.tax_rate_percent / (100 + s.tax_rate_percent), 2);
    else
      v_tax := round(v_taxable * s.tax_rate_percent / 100, 2);
    end if;
  end if;

  if new.order_type = 'delivery' then
    v_delivery := s.delivery_fee;
    if s.free_delivery_threshold is not null and v_subtotal >= s.free_delivery_threshold then
      v_delivery := 0;
    end if;
  end if;

  v_tip := coalesce(new.tip_amount, 0);
  if v_tip > round(v_subtotal * s.max_tip_percent / 100, 2) then
    raise exception 'Tip exceeds the allowed maximum';
  end if;

  new.items := v_snapshot;
  new.subtotal_amount := v_subtotal;
  new.discount_amount := v_discount;
  new.tax_rate_percent := s.tax_rate_percent;
  new.tax_inclusive := s.tax_inclusive;
  new.tax_amount := v_tax;
  new.delivery_fee_amount := v_delivery;
  new.tip_amount := v_tip;
  new.total_amount := round(
    v_taxable + case when s.tax_inclusive then 0 else v_tax end + v_delivery + v_tip, 2
  );
  new.total_price := new.total_amount;

  return new;
end;
$$;

drop trigger if exists trg_validate_order_integrity on public.orders;
create trigger trg_validate_order_integrity
before insert or update of items,coupon_id,is_paid,status,subtotal_amount,discount_amount,
  total_amount,total_price,tax_amount,tax_rate_percent,tax_inclusive,delivery_fee_amount,tip_amount,stock_restored,refund_flagged_at
on public.orders
for each row execute function public.validate_order_integrity();

create or replace function public.sync_order_coupon()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and old.coupon_id is not null
     and new.coupon_id is distinct from old.coupon_id
  then
    perform public.release_coupon_redemption_internal(new.id);
  end if;

  if new.coupon_id is not null
     and (tg_op = 'INSERT' or new.coupon_id is distinct from old.coupon_id)
  then
    perform public.reserve_coupon_for_order_internal(
      new.coupon_id, new.id, new.user_id, new.discount_amount
    );
  elsif tg_op = 'UPDATE'
        and new.coupon_id is not null
        and new.coupon_id = old.coupon_id
        and new.discount_amount is distinct from old.discount_amount
  then
    update public.coupon_redemptions
    set discount_amount = new.discount_amount
    where order_id = new.id and released_at is null;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_orders_coupon_sync on public.orders;
create trigger trg_orders_coupon_sync
after insert or update of coupon_id,items on public.orders
for each row execute function public.sync_order_coupon();

create or replace function public.sync_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  if tg_op = 'INSERT' then
    for r in
      select x.item_id, sum(x.quantity)::integer as qty
      from jsonb_to_recordset(new.items) as x(item_id uuid, quantity integer)
      group by x.item_id
      order by x.item_id
    loop
      update public.catalog_items
      set stock_quantity = stock_quantity - r.qty
      where id = r.item_id and track_stock and stock_quantity >= r.qty;

      if not found and exists (
        select 1 from public.catalog_items where id = r.item_id and track_stock
      ) then
        raise exception 'Insufficient stock for item %', r.item_id using errcode = '23514';
      end if;
    end loop;

  elsif tg_op = 'UPDATE' and new.stock_restored and not old.stock_restored then
    for r in
      select x.item_id, sum(x.quantity)::integer as qty
      from jsonb_to_recordset(new.items) as x(item_id uuid, quantity integer)
      group by x.item_id
      order by x.item_id
    loop
      update public.catalog_items
      set stock_quantity = stock_quantity + r.qty
      where id = r.item_id and track_stock;
    end loop;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_orders_stock_sync on public.orders;
create trigger trg_orders_stock_sync
after insert or update of status on public.orders
for each row execute function public.sync_order_stock();

create or replace function public.enforce_order_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_recent integer;
begin
  if public.is_trusted_caller() then return new; end if;

  new.created_at := now();
  new.updated_at := now();

  if new.user_id is null then return new; end if;

  select order_rate_limit_per_hour into v_limit
  from public.business_settings where id;

  if coalesce(v_limit, 10) = 0 then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended('order_rate:' || new.user_id, 0));

  select count(*) into v_recent
  from public.orders
  where user_id = new.user_id and created_at > now() - interval '1 hour';

  if v_recent >= coalesce(v_limit, 10) then
    raise exception
      'Too many orders placed in the last hour: limit is % per user. Please try again later.',
      coalesce(v_limit, 10)
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_rate_limit on public.orders;
create trigger trg_orders_rate_limit
before insert on public.orders
for each row execute function public.enforce_order_rate_limit();

create or replace function public.validate_coupon_code(
  p_code text,
  p_subtotal numeric default 0
)
returns table (
  coupon_id uuid,
  discount_type text,
  discount_value numeric,
  discount_amount numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid text := public.requesting_user_id();
  s public.business_settings%rowtype;
  v_attempts integer;
  v_uses integer;
  c public.coupons%rowtype;
  d numeric(12,2);
begin
  if uid is null then raise exception 'Authentication required'; end if;

  select * into s from public.business_settings where id;

  perform pg_advisory_xact_lock(hashtextextended('coupon_attempt:' || uid, 0));

  select count(*) into v_attempts
  from public.coupon_attempts ca
  where ca.user_id = uid
    and ca.attempted_at > now() - make_interval(mins => s.coupon_attempt_window_minutes);

  if v_attempts >= s.coupon_attempt_limit then
    raise exception 'Too many coupon attempts. Please try again later.' using errcode = '23514';
  end if;

  insert into public.coupon_attempts(user_id) values (uid);

  select * into c
  from public.coupons cp
  where cp.code = upper(btrim(coalesce(p_code,'')))
    and cp.is_active
    and cp.starts_at <= now()
    and (cp.expires_at is null or cp.expires_at > now())
    and (cp.usage_limit is null or cp.used_count < cp.usage_limit)
    and coalesce(p_subtotal,0) >= cp.min_order_amount;

  if not found then return; end if;

  if c.max_uses_per_user is not null then
    select count(*) into v_uses
    from public.coupon_redemptions cr
    where cr.coupon_id = c.id and cr.user_id = uid and cr.released_at is null;

    if v_uses >= c.max_uses_per_user then return; end if;
  end if;

  if c.discount_type = 'percentage' then
    d := round(coalesce(p_subtotal,0) * c.discount_value / 100, 2);
  else
    d := c.discount_value;
  end if;

  if c.max_discount_amount is not null then d := least(d, c.max_discount_amount); end if;
  d := least(d, coalesce(p_subtotal,0));

  return query select c.id, c.discount_type, c.discount_value, d::numeric;
end;
$$;

create or replace function public.consume_coupon_for_order(
  p_coupon_id uuid,
  p_order_id uuid
)
returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders%rowtype;
  c public.coupons%rowtype;
  v_discount numeric(12,2);
begin
  if not public.is_service_role() then raise exception 'Service role required'; end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.coupon_id is distinct from p_coupon_id then
    raise exception 'Coupon does not match the order';
  end if;

  select discount_amount into v_discount
  from public.coupon_redemptions
  where order_id = p_order_id and released_at is null;
  if found then return v_discount; end if;

  select * into c from public.coupons where id = p_coupon_id for update;
  if not found or not c.is_active
     or c.starts_at > now()
     or (c.expires_at is not null and c.expires_at <= now())
     or (c.usage_limit is not null and c.used_count >= c.usage_limit)
  then
    raise exception 'Coupon unavailable';
  end if;

  update public.coupons
  set used_count = used_count + 1, updated_at = now()
  where id = c.id and (usage_limit is null or used_count < usage_limit);
  if not found then raise exception 'Coupon usage limit reached'; end if;

  insert into public.coupon_redemptions(coupon_id,order_id,user_id,discount_amount)
  values(c.id,o.id,o.user_id,o.discount_amount);

  return o.discount_amount;
end;
$$;

create or replace function public.release_coupon_for_declined_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_service_role() then raise exception 'Service role required'; end if;
  perform public.release_coupon_redemption_internal(p_order_id);
end;
$$;

-- order_status_lookups (caller_key version). Created here, before the RLS and
-- privilege sections (0013 / 0015) that reference it.
drop table if exists public.order_status_lookups cascade;

create table public.order_status_lookups (
  order_id uuid not null references public.orders(id) on delete cascade,
  caller_key text not null,
  bucket timestamptz not null,
  hits integer not null default 1,
  primary key (order_id, caller_key, bucket)
);

create index if not exists idx_order_status_lookups_bucket
on public.order_status_lookups(bucket);

alter table public.order_status_lookups enable row level security;
revoke all on table public.order_status_lookups from anon, authenticated;


-- ############################################################################
-- # 0009 — AUDIT LOG
-- ############################################################################
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id text,
  actor_kind text not null check (actor_kind in ('user','admin','system')),
  table_name text not null,
  record_id text,
  action text not null check (action in ('insert','update','delete')),
  changes jsonb not null default '{}'::jsonb,
  db_session_user text not null default session_user,
  client_app text default nullif(current_setting('application_name', true), '')
);

create index if not exists idx_audit_log_record
on public.audit_log(table_name, record_id, occurred_at desc);
create index if not exists idx_audit_log_time on public.audit_log(occurred_at desc);

create or replace function public.audit_log_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then raise exception 'audit_log is append-only'; end if;
  if coalesce(current_setting('app.audit_purge', true), '') <> 'on' then
    raise exception 'audit_log rows can only be removed by the retention job';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_audit_log_guard on public.audit_log;
create trigger trg_audit_log_guard
before update or delete on public.audit_log
for each row execute function public.audit_log_guard();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_id text;
  k text;
  v_noise text[] := array['updated_at','created_at','stock_quantity','used_count'];
  v_kind text;
begin
  v_kind := case
    when public.is_admin_v2() then 'admin'
    when public.requesting_user_id() is not null then 'user'
    else 'system'
  end;

  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_changes := v_new - v_noise;
    v_id := v_new->>'id';
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_changes := v_old - v_noise;
    v_id := v_old->>'id';
  else
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_id := v_new->>'id';

    for k in select jsonb_object_keys(v_new) loop
      if k <> all (v_noise) and (v_new->k) is distinct from (v_old->k) then
        v_changes := v_changes || jsonb_build_object(k, jsonb_build_object('old', v_old->k, 'new', v_new->k));
      end if;
    end loop;

    if v_changes = '{}'::jsonb then return null; end if;
  end if;

  insert into public.audit_log(actor_id, actor_kind, table_name, record_id, action, changes)
  values (public.requesting_user_id(), v_kind, tg_table_name, v_id, lower(tg_op), v_changes);

  return null;
end;
$$;

create or replace function public.audit_order_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_changes jsonb := '{}'::jsonb;
  v_kind text;
begin
  if new.status is distinct from old.status then
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', old.status, 'new', new.status));
  end if;
  if new.is_paid is distinct from old.is_paid then
    v_changes := v_changes || jsonb_build_object('is_paid', jsonb_build_object('old', old.is_paid, 'new', new.is_paid));
  end if;
  if v_changes = '{}'::jsonb then return null; end if;

  v_kind := case
    when public.is_admin_v2() then 'admin'
    when public.requesting_user_id() is not null then 'user'
    else 'system'
  end;

  insert into public.audit_log(actor_id, actor_kind, table_name, record_id, action, changes)
  values (public.requesting_user_id(), v_kind, 'orders', new.id::text, 'update', v_changes);
  return null;
end;
$$;

create or replace function public.audit_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_log(actor_id, actor_kind, table_name, record_id, action, changes)
  values (
    public.requesting_user_id(),
    case when public.is_admin_v2() then 'admin'
         when public.requesting_user_id() is not null then 'user'
         else 'system' end,
    'profiles', new.id, 'update',
    jsonb_build_object('role', jsonb_build_object('old', old.role, 'new', new.role))
  );
  return null;
end;
$$;

drop trigger if exists trg_audit_order_change on public.orders;
create trigger trg_audit_order_change
after update of status, is_paid on public.orders
for each row execute function public.audit_order_change();

drop trigger if exists trg_audit_profile_role on public.profiles;
create trigger trg_audit_profile_role
after update of role on public.profiles
for each row
when (old.role is distinct from new.role)
execute function public.audit_profile_role_change();

create or replace function public.refresh_audit_triggers()
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  t text;
  v_cols text;
  v_noise text[] := array['updated_at','created_at','stock_quantity','used_count'];
begin
  foreach t in array array[
    'business_settings','business_locations','location_opening_hours',
    'location_closures','resources','catalog_items','coupons','game_rewards'
  ]
  loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_cols
    from information_schema.columns
    where table_schema = 'public' and table_name = t and column_name <> all (v_noise);

    execute format('drop trigger if exists trg_audit_row on public.%I', t);
    execute format('drop trigger if exists trg_audit_ins_del on public.%I', t);
    execute format('drop trigger if exists trg_audit_upd on public.%I', t);

    execute format(
      'create trigger trg_audit_ins_del after insert or delete on public.%I
         for each row execute function public.audit_row_change()', t);
    execute format(
      'create trigger trg_audit_upd after update of %s on public.%I
         for each row execute function public.audit_row_change()', v_cols, t);
  end loop;
end;
$$;

select public.refresh_audit_triggers();


-- ############################################################################
-- # 0010 — CLERK WEBHOOK
-- ############################################################################
create table if not exists public.webhook_events (
  id text primary key,
  provider text not null check(provider='clerk'),
  event_type text not null check(length(btrim(event_type))>0),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists webhook_events_unprocessed_idx
on public.webhook_events(processed_at) where processed_at is null;

create table if not exists public.clerk_user_sync_state (
  clerk_user_id text primary key,
  last_event_at timestamptz not null,
  last_event_id text not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

-- NOTE: superseded by 0016 (adds scrub on user.deleted). Both versions are
-- equivalent for create/update; only delete differs. The 0016 version wins.
create or replace function public.process_clerk_webhook(
  p_event_id text,
  p_event_type text,
  p_event_timestamp timestamptz,
  p_user_id text,
  p_profile jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  inserted_event_id text;
  s public.clerk_user_sync_state%rowtype;
  should_apply boolean;
begin
  if not public.is_service_role() then raise exception 'Service role required'; end if;
  if p_event_id is null or btrim(p_event_id) = ''
     or p_event_type is null or btrim(p_event_type) = ''
     or p_event_timestamp is null
     or p_user_id is null or btrim(p_user_id) = ''
  then
    raise exception 'Invalid Clerk webhook arguments';
  end if;
  if p_event_type not in('user.created','user.updated','user.deleted') then
    raise exception 'Unsupported Clerk webhook event: %', p_event_type;
  end if;

  insert into public.webhook_events(id,provider,event_type)
  values(p_event_id,'clerk',p_event_type)
  on conflict(id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return jsonb_build_object('status','duplicate','event_id',p_event_id);
  end if;

  select * into s from public.clerk_user_sync_state where clerk_user_id = p_user_id for update;

  should_apply := s.clerk_user_id is null
    or p_event_timestamp > s.last_event_at
    or (p_event_timestamp = s.last_event_at and p_event_id > s.last_event_id);

  if should_apply then
    if p_event_type in('user.created','user.updated') then
      if p_profile is null then raise exception 'Profile payload required'; end if;

      begin
        insert into public.profiles(id,email,full_name,avatar_url,username,phone,role,updated_at)
        values(
          p_user_id,
          nullif(p_profile->>'email',''),
          nullif(p_profile->>'full_name',''),
          nullif(p_profile->>'avatar_url',''),
          nullif(p_profile->>'username',''),
          nullif(p_profile->>'phone',''),
          'customer',
          p_event_timestamp
        )
        on conflict(id) do update set
          email = excluded.email,
          full_name = excluded.full_name,
          avatar_url = excluded.avatar_url,
          username = excluded.username,
          phone = excluded.phone,
          role = public.profiles.role,
          updated_at = excluded.updated_at;
      exception when unique_violation then
        raise warning 'clerk webhook %: username % is already taken; username left unchanged',
          p_event_id, p_profile->>'username';

        insert into public.profiles(id,email,full_name,avatar_url,phone,role,updated_at)
        values(
          p_user_id,
          nullif(p_profile->>'email',''),
          nullif(p_profile->>'full_name',''),
          nullif(p_profile->>'avatar_url',''),
          nullif(p_profile->>'phone',''),
          'customer',
          p_event_timestamp
        )
        on conflict(id) do update set
          email = excluded.email,
          full_name = excluded.full_name,
          avatar_url = excluded.avatar_url,
          phone = excluded.phone,
          role = public.profiles.role,
          updated_at = excluded.updated_at;
      end;

      insert into public.clerk_user_sync_state(clerk_user_id,last_event_at,last_event_id,deleted,updated_at)
      values(p_user_id,p_event_timestamp,p_event_id,false,now())
      on conflict(clerk_user_id) do update set
        last_event_at = excluded.last_event_at,
        last_event_id = excluded.last_event_id,
        deleted = false,
        updated_at = now();
    else
      update public.profiles
      set email = null, full_name = null, avatar_url = null,
          username = null, phone = null, role = 'customer', updated_at = now()
      where id = p_user_id;

      insert into public.clerk_user_sync_state(clerk_user_id,last_event_at,last_event_id,deleted,updated_at)
      values(p_user_id,p_event_timestamp,p_event_id,true,now())
      on conflict(clerk_user_id) do update set
        last_event_at = excluded.last_event_at,
        last_event_id = excluded.last_event_id,
        deleted = true,
        updated_at = now();
    end if;
  end if;

  update public.webhook_events set processed_at = now() where id = p_event_id;

  return jsonb_build_object(
    'status', case when should_apply then 'processed' else 'stale' end,
    'event_id', p_event_id,
    'event_type', p_event_type,
    'user_id', p_user_id
  );
end;
$$;


-- ############################################################################
-- # 0011 — AUTOMATION
-- ############################################################################
create or replace function public.notify_admins(
  p_title text,
  p_message text,
  p_type text,
  p_order_id uuid default null,
  p_exclude_user_id text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications(user_id,title,message,type,order_id)
  select id,p_title,p_message,p_type,p_order_id
  from public.profiles
  where role = 'admin'
    and (p_exclude_user_id is null or id <> p_exclude_user_id);
end;
$$;

create or replace function public.handle_new_order_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.payment_method = 'in_person' then
    perform public.notify_admins(
      'New Order Received',
      format('%s placed a %s order — %s',
        coalesce(new.customer_name,'A customer'),
        new.order_type,
        public.format_money(new.total_amount)),
      'new_order', new.id, null);

    if new.user_id is not null then
      insert into public.notifications(user_id,title,message,type,order_id)
      values(new.user_id,'Order Placed',
        'Your order has been placed successfully. We''ll keep you posted.',
        'order_placed', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
after insert on public.orders
for each row execute function public.handle_new_order_notify();

create or replace function public.handle_order_status_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  msg text;
begin
  if new.status is distinct from old.status then
    if new.status = 'declined' and old.status <> 'declined' then
      perform public.release_coupon_redemption_internal(new.id);
    end if;

    msg := case new.status
      when 'preparing' then 'Your order is being prepared.'
      when 'ready' then 'Your order is ready!'
      when 'completed' then 'Your order has been completed. Thanks for stopping by!'
      when 'declined' then 'Unfortunately your order was declined.'
      when 'refunded' then 'Your order has been refunded.'
      else 'Your order status was updated to "' || new.status || '".'
    end;

    if new.user_id is not null then
      insert into public.notifications(user_id,title,message,type,order_id)
      values(new.user_id,'Order Update',msg,'order_status',new.id);

      if new.status = 'completed' then
        insert into public.notifications(user_id,title,message,type,order_id)
        values(new.user_id,'Rate Your Order',
          'Tell us how it went — your feedback helps us improve.',
          'review_prompt', new.id);
      end if;
    end if;

    perform public.notify_admins(
      'Order Status Changed',
      format('Order #%s is now "%s".', substr(new.id::text,1,8), new.status),
      'order_status', new.id, public.requesting_user_id()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
after update of status on public.orders
for each row execute function public.handle_order_status_notify();

create or replace function public.handle_order_payment_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.is_paid and not old.is_paid and new.payment_method = 'online' and new.status <> 'declined' then
    if new.user_id is not null then
      insert into public.notifications(user_id,title,message,type,order_id)
      values(new.user_id,'Order Placed',
        'Your payment was successful and your order has been placed!',
        'order_placed', new.id);
    end if;

    perform public.notify_admins(
      'New Order Received',
      format('%s placed a %s order — %s',
        coalesce(new.customer_name,'A customer'),
        new.order_type,
        public.format_money(new.total_amount)),
      'new_order', new.id, null);
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_payment_change on public.orders;
create trigger on_order_payment_change
after update of is_paid on public.orders
for each row execute function public.handle_order_payment_notify();

create or replace function public.handle_new_booking_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.notify_admins(
    'New Booking',
    format('%s requested a booking for %s on %s at %s.',
      coalesce(new.user_name,'A guest'),
      new.party_size,
      new.booking_date,
      to_char(new.booking_time,'HH12:MI AM')),
    'new_booking', null, null);
  return new;
end;
$$;

drop trigger if exists on_booking_created on public.bookings;
create trigger on_booking_created
after insert on public.bookings
for each row execute function public.handle_new_booking_notify();

create or replace function public.handle_booking_status_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status and new.user_id is not null then
    insert into public.notifications(user_id,title,message,type)
    values(
      new.user_id,
      'Booking Update',
      case new.status
        when 'confirmed' then format('Your booking on %s at %s is confirmed!',
          new.booking_date, to_char(new.booking_time,'HH12:MI AM'))
        when 'cancelled' then 'Your booking was cancelled.'
        when 'completed' then 'Thanks for visiting! Hope it went well.'
        else 'Your booking status was updated to "' || new.status || '".'
      end,
      'booking_status'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_status_change on public.bookings;
create trigger on_booking_status_change
after update of status on public.bookings
for each row execute function public.handle_booking_status_notify();

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.notifications
  set is_read = true
  where id = p_notification_id and user_id = public.requesting_user_id();
end;
$$;

create or replace function public.send_booking_reminders()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_lead integer;
begin
  select booking_reminder_lead_minutes into v_lead from public.business_settings where id;

  for r in
    select b.id, b.user_id, b.booking_at, l.timezone
    from public.bookings b
    join public.business_locations l on l.id = b.location_id
    where b.status = 'confirmed'
      and b.reminder_sent = false
      and b.user_id is not null
      and b.booking_at between now() and now() + make_interval(mins => coalesce(v_lead, 60))
    for update of b skip locked
  loop
    insert into public.notifications(user_id,title,message,type)
    values(r.user_id,'Booking Reminder',
      format('Your booking is coming up at %s. See you soon!',
             to_char(r.booking_at at time zone r.timezone, 'HH12:MI AM')),
      'booking_reminder');

    update public.bookings set reminder_sent = true where id = r.id;
  end loop;
end;
$$;

-- NOTE: 0019 §7 supersedes this with a deterministic lock order. Kept here as
-- a placeholder that will be replaced at 0019.

create or replace function public.expire_unpaid_orders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.business_settings%rowtype;
  v_ids uuid[];
  v_items uuid[];
  v_count integer;
begin
  select * into s from public.business_settings where id;

  select array_agg(o.id order by o.created_at) into v_ids
  from (
    select id, created_at from public.orders
    where (
        payment_method = 'online' and not is_paid
        and status in ('incoming','pending')
        and created_at < now() - make_interval(mins => s.unpaid_online_order_expiry_minutes)
      ) or (
        s.stale_order_expiry_hours > 0
        and payment_method = 'in_person'
        and order_type <> 'scheduled'
        and status in ('incoming','pending')
        and created_at < now() - make_interval(hours => s.stale_order_expiry_hours)
      )
    order by created_at
    limit 500
    for update skip locked
  ) o;

  if v_ids is null or array_length(v_ids, 1) = 0 then return 0; end if;

  select array_agg(distinct x.item_id order by x.item_id) into v_items
  from public.orders o2,
       jsonb_to_recordset(o2.items) as x(item_id uuid, quantity integer)
  where o2.id = any (v_ids);

  if v_items is not null and array_length(v_items, 1) > 0 then
    perform 1 from public.catalog_items
    where id = any (v_items) and track_stock
    order by id for update;
  end if;

  update public.orders set status = 'declined' where id = any (v_ids);
  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

create or replace function public.expire_stale_bookings()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hours integer;
  v_count integer;
begin
  select pending_booking_expiry_hours into v_hours from public.business_settings where id;

  with stale as (
    update public.bookings
    set status = 'cancelled', cancelled_reason = 'Expired without confirmation'
    where status = 'pending'
      and (
        booking_at < now()
        or (coalesce(v_hours, 0) > 0
            and created_at < now() - make_interval(hours => v_hours))
      )
    returning 1
  )
  select count(*) into v_count from stale;

  return v_count;
end;
$$;

create or replace function public.cleanup_operational_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.business_settings%rowtype;
begin
  select * into s from public.business_settings where id;

  delete from public.webhook_events
  where processed_at is not null
    and processed_at < now() - make_interval(days => s.retention_log_days);

  delete from public.push_delivery_log
  where created_at < now() - make_interval(days => s.retention_log_days);

  delete from public.coupon_attempts where attempted_at < now() - interval '1 day';
  delete from public.game_plays where created_at < now() - interval '30 days';

  delete from public.notifications
  where is_read and created_at < now() - make_interval(days => s.retention_notification_days);

  perform set_config('app.audit_purge', 'on', true);
  delete from public.audit_log
  where occurred_at < now() - make_interval(days => s.retention_audit_days);
  perform set_config('app.audit_purge', 'off', true);

  delete from public.order_status_lookups where bucket < now() - interval '1 day';
end;
$$;

create or replace function public.notify_refund_required()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.notify_admins(
    'Refund required',
    format('Order #%s is paid (%s) but %s. Refund the customer.',
           substr(new.id::text, 1, 8), public.format_money(new.total_amount), new.status),
    'refund_required', new.id, null);
  return null;
end;
$$;

drop trigger if exists trg_orders_refund_required on public.orders;
create trigger trg_orders_refund_required
after update of is_paid, status on public.orders
for each row
when (new.refund_required and not old.refund_required)
execute function public.notify_refund_required();

-- NOTE: ops_health is redefined several times; the FINAL version is in 0024 §J.

-- cron jobs: the 4 that exist before Stripe; a 5th is added in 0017.
do $cron$
declare
  j record;
begin
  for j in
    select * from (values
      ('booking-reminders',   '*/5 * * * *', 'select public.send_booking_reminders();'),
      ('expire-unpaid-orders','*/5 * * * *', 'select public.expire_unpaid_orders();'),
      ('expire-stale-bookings','*/10 * * * *','select public.expire_stale_bookings();'),
      ('operational-cleanup', '15 3 * * *',  'select public.cleanup_operational_data();')
    ) as t(jobname, schedule, command)
  loop
    if exists (select 1 from cron.job where jobname = j.jobname) then
      perform cron.unschedule(j.jobname);
    end if;
    perform cron.schedule(j.jobname, j.schedule, j.command);
  end loop;
end $cron$;


-- ############################################################################
-- # 0012 — INTEGRITY CONSTRAINTS
-- ############################################################################
do $$
declare
  r record;
  v_orphans bigint;
begin
  for r in
    select * from (values
      ('orders','orders_user_id_fkey','set null'),
      ('bookings','bookings_user_id_fkey','set null'),
      ('favorites','favorites_user_id_fkey','cascade'),
      ('cart_items','cart_items_user_id_fkey','cascade'),
      ('reviews','reviews_user_id_fkey','restrict'),
      ('notifications','notifications_user_id_fkey','cascade'),
      ('notification_settings','notification_settings_user_id_fkey','cascade'),
      ('push_subscriptions','push_subscriptions_user_id_fkey','cascade'),
      ('chats','chats_user_id_fkey','cascade'),
      ('coupon_redemptions','coupon_redemptions_user_id_fkey','set null'),
      ('user_claimed_rewards','user_claimed_rewards_user_id_fkey','cascade')
    ) as t(tbl, cname, action)
  loop
    if not exists (
      select 1 from pg_constraint
      where conname = r.cname and conrelid = format('public.%I', r.tbl)::regclass
    ) then
      execute format(
        'select count(*) from public.%I t where t.user_id is not null and not exists (select 1 from public.profiles p where p.id = t.user_id)',
        r.tbl) into v_orphans;

      if v_orphans > 0 then
        raise exception
          'Unsafe data: % row(s) in public.% reference a user_id with no matching profiles row. Repair before adding the foreign key.',
          v_orphans, r.tbl;
      end if;

      execute format(
        'alter table public.%I add constraint %I foreign key (user_id) references public.profiles(id) on delete %s',
        r.tbl, r.cname, r.action);
    end if;
  end loop;
end $$;

do $$
declare c record;
begin
  for c in
    select * from (values
      ('orders','orders_delivery_address_check',
        $c$order_type <> 'delivery' or nullif(btrim(address),'') is not null$c$),
      ('orders','orders_customer_name_len_check',
        $c$customer_name is null or char_length(customer_name) <= 120$c$),
      ('orders','orders_address_len_check',
        $c$address is null or char_length(address) <= 500$c$),
      ('orders','orders_phone_len_check',
        $c$phone is null or char_length(phone) <= 32$c$),
      ('bookings','bookings_user_name_len_check',
        $c$user_name is null or char_length(user_name) <= 120$c$),
      ('bookings','bookings_user_email_len_check',
        $c$user_email is null or char_length(user_email) <= 320$c$),
      ('chat_messages','chat_messages_content_len_check',
        $c$char_length(content) <= 32000$c$),
      ('chat_messages','chat_messages_action_shape_check',
        $c$action is null or (jsonb_typeof(action) = 'object' and coalesce(jsonb_typeof(action->'type'), '') = 'string' and char_length(action::text) <= 20000)$c$),
      ('notification_settings','notification_settings_muted_types_check',
        $c$muted_types <@ array['info','new_order','order_placed','order_status','review_prompt','new_booking','booking_status','booking_reminder','refund_required']::text[]$c$),
      ('push_subscriptions','push_subscriptions_endpoint_check',
        $c$public.is_allowed_push_endpoint(endpoint)$c$)
    ) as t(tbl, cname, expr)
  loop
    if not exists (
      select 1 from pg_constraint
      where conname = c.cname and conrelid = format('public.%I', c.tbl)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I check (%s) not valid',
        c.tbl, c.cname, c.expr);
    end if;
  end loop;
end $$;


-- ############################################################################
-- # 0013 — VIEWS + RLS
-- ############################################################################
-- FINAL view definitions (0021's catalog view + admin view added in 0024).

create or replace view public.catalog_item_review_stats as
select catalog_item_id, count(*)::int as review_count,
       round(avg(rating)::numeric, 1) as average_rating
from public.reviews
where catalog_item_id is not null
group by catalog_item_id;

create or replace view public.catalog_item_public_reviews as
select id, catalog_item_id, item_name, rating, remark, created_at
from public.reviews
where catalog_item_id is not null;

create or replace view public.game_rewards_public as
select id, reward_key, title, discount_value, description, requires_play
from public.game_rewards
where is_active;

create or replace view public.business_public_settings as
select business_name, business_type, currency, support_email, support_phone,
       tax_rate_percent, tax_inclusive, delivery_fee, free_delivery_threshold,
       max_tip_percent, max_party_size, updated_at
from public.business_settings;

create or replace view public.catalog_items_public as
select id, name, price, numeric_price, description, category, item_type,
       duration_minutes, media, is_popular, rating, requires_resource,
       (not track_stock or coalesce(stock_quantity, 0) > 0) as in_stock,
       created_at
from public.catalog_items
where is_active;

-- RLS enabled on every template table.
alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.business_locations enable row level security;
alter table public.catalog_items enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_attempts enable row level security;
alter table public.order_status_lookups enable row level security;
alter table public.resources enable row level security;
alter table public.location_opening_hours enable row level security;
alter table public.location_closures enable row level security;
alter table public.audit_log enable row level security;
alter table public.game_plays enable row level security;
alter table public.orders enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.cart_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_delivery_log enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.game_rewards enable row level security;
alter table public.user_claimed_rewards enable row level security;
alter table public.webhook_events enable row level security;
alter table public.clerk_user_sync_state enable row level security;

-- Drop all existing policies on the tables we manage so re-runs are clean.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in(
        'profiles','business_settings','business_locations','catalog_items',
        'coupons','coupon_attempts','orders','coupon_redemptions','bookings',
        'favorites','cart_items','reviews','notifications',
        'notification_settings','push_subscriptions','push_delivery_log',
        'chats','chat_messages','knowledge_base','game_rewards',
        'user_claimed_rewards','webhook_events','clerk_user_sync_state',
        'resources','location_opening_hours','location_closures','audit_log','game_plays'
      )
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using ((select public.requesting_user_id()) = id or (select public.is_admin_v2()));

create policy business_settings_admin_select on public.business_settings
for select to authenticated using ((select public.is_admin_v2()));

create policy business_settings_admin_update on public.business_settings
for update to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy locations_select_public on public.business_locations
for select to anon, authenticated
using (is_active or (select public.is_admin_v2()));

create policy locations_admin_write on public.business_locations
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy catalog_select_public on public.catalog_items
for select to anon, authenticated
using (is_active or (select public.is_admin_v2()));

create policy catalog_admin_write on public.catalog_items
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy coupons_admin_all on public.coupons
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy orders_select_own_or_admin on public.orders
for select to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

create policy orders_insert_own on public.orders
for insert to authenticated
with check (user_id = (select public.requesting_user_id()));

create policy orders_admin_update on public.orders
for update to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy coupon_redemptions_select_own_or_admin on public.coupon_redemptions
for select to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

create policy bookings_select_own_or_admin on public.bookings
for select to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

-- FINAL: 0024 §H tightens this to pending-only.
create policy bookings_insert_own on public.bookings
for insert to authenticated
with check (
  user_id = (select public.requesting_user_id())
  and status = 'pending'
  and reminder_sent = false
  and cancelled_at is null
  and cancelled_reason is null
);

create policy bookings_update_own_or_admin on public.bookings
for update to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()))
with check (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

create policy bookings_delete_admin on public.bookings
for delete to authenticated using ((select public.is_admin_v2()));

create policy favorites_owner_all on public.favorites
for all to authenticated
using (user_id = (select public.requesting_user_id()))
with check (user_id = (select public.requesting_user_id()));

create policy cart_owner_all on public.cart_items
for all to authenticated
using (user_id = (select public.requesting_user_id()))
with check (user_id = (select public.requesting_user_id()));

create policy reviews_owner_select on public.reviews
for select to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

create policy reviews_owner_insert on public.reviews
for insert to authenticated
with check (
  user_id = (select public.requesting_user_id())
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = (select public.requesting_user_id())
      and o.status = 'completed'
  )
);

-- FINAL: 0024 §H.
create policy reviews_owner_update on public.reviews
for update to authenticated
using (user_id = (select public.requesting_user_id()))
-- Column grants limit UPDATE to (rating, remark) and validate_review() pins
-- order_id / catalog_item_id / item_name, so only ownership needs checking.
with check (user_id = (select public.requesting_user_id()));

create policy reviews_owner_delete on public.reviews
for delete to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

create policy notifications_owner_select on public.notifications
for select to authenticated using (user_id = (select public.requesting_user_id()));

create policy notifications_owner_update on public.notifications
for update to authenticated
using (user_id = (select public.requesting_user_id()))
with check (user_id = (select public.requesting_user_id()));

create policy notifications_owner_delete on public.notifications
for delete to authenticated using (user_id = (select public.requesting_user_id()));

create policy notifications_admin_insert on public.notifications
for insert to authenticated with check ((select public.is_admin_v2()));

create policy notification_settings_owner_select on public.notification_settings
for select to authenticated using (user_id = (select public.requesting_user_id()));

create policy notification_settings_owner_insert on public.notification_settings
for insert to authenticated with check (user_id = (select public.requesting_user_id()));

create policy notification_settings_owner_update on public.notification_settings
for update to authenticated
using (user_id = (select public.requesting_user_id()))
with check (user_id = (select public.requesting_user_id()));

create policy push_subscriptions_owner_select on public.push_subscriptions
for select to authenticated using (user_id = (select public.requesting_user_id()));

create policy push_subscriptions_owner_delete on public.push_subscriptions
for delete to authenticated using (user_id = (select public.requesting_user_id()));

create policy push_delivery_log_admin_select on public.push_delivery_log
for select to authenticated using ((select public.is_admin_v2()));

create policy chats_owner_all on public.chats
for all to authenticated
using (user_id = (select public.requesting_user_id()))
with check (user_id = (select public.requesting_user_id()));

-- FINAL: 0018 splits this into select/insert/delete (no update).
drop policy if exists chat_messages_owner_all on public.chat_messages;
drop policy if exists chat_messages_owner_select on public.chat_messages;
drop policy if exists chat_messages_owner_insert on public.chat_messages;
drop policy if exists chat_messages_owner_delete on public.chat_messages;

create policy chat_messages_owner_select on public.chat_messages
for select to authenticated
using (exists (select 1 from public.chats c
               where c.id = chat_id and c.user_id = (select public.requesting_user_id())));

create policy chat_messages_owner_insert on public.chat_messages
for insert to authenticated
with check (role = 'user' and exists (select 1 from public.chats c
               where c.id = chat_id and c.user_id = (select public.requesting_user_id())));

create policy chat_messages_owner_delete on public.chat_messages
for delete to authenticated
using (exists (select 1 from public.chats c
               where c.id = chat_id and c.user_id = (select public.requesting_user_id())));

create policy knowledge_public_read on public.knowledge_base
for select to anon, authenticated using (true);

create policy knowledge_admin_write on public.knowledge_base
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy game_rewards_admin_all on public.game_rewards
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy claimed_rewards_owner_select on public.user_claimed_rewards
for select to authenticated
using (user_id = (select public.requesting_user_id()) or (select public.is_admin_v2()));

create policy resources_select_public on public.resources
for select to anon, authenticated
using (is_active or (select public.is_admin_v2()));

create policy resources_admin_write on public.resources
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy opening_hours_select_public on public.location_opening_hours
for select to anon, authenticated using (true);

create policy opening_hours_admin_write on public.location_opening_hours
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy closures_select_public on public.location_closures
for select to anon, authenticated using (true);

create policy closures_admin_write on public.location_closures
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create policy audit_log_admin_select on public.audit_log
for select to authenticated using ((select public.is_admin_v2()));


-- ############################################################################
-- # 0014 — REALTIME + STORAGE
-- ############################################################################
do $$
declare t text;
begin
  foreach t in array array[
    'catalog_items','orders','bookings','favorites','notifications',
    'cart_items','business_locations','business_settings','chats','chat_messages'
  ]
  loop
    execute format('alter table public.%I replica identity full', t);
    if not exists(
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'catalog-media','catalog-media',true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm']
)
on conflict(id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists catalog_media_public_read on storage.objects;
drop policy if exists catalog_media_admin_select on storage.objects;
drop policy if exists catalog_media_admin_insert on storage.objects;
drop policy if exists catalog_media_admin_update on storage.objects;
drop policy if exists catalog_media_admin_delete on storage.objects;

create policy catalog_media_admin_select on storage.objects
for select to authenticated
using (bucket_id = 'catalog-media' and (select public.is_admin_v2()));

create policy catalog_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'catalog-media' and (select public.is_admin_v2()));

create policy catalog_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'catalog-media' and (select public.is_admin_v2()))
with check (bucket_id = 'catalog-media' and (select public.is_admin_v2()));

create policy catalog_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'catalog-media' and (select public.is_admin_v2()));


-- ############################################################################
-- # 0015 — PRIVILEGES + ASSERTIONS
-- ############################################################################
do $$
declare
  v_tables text[] := array['audit_log', 'bookings', 'business_locations', 'business_settings', 'cart_items', 'catalog_items', 'chat_messages', 'chats', 'clerk_user_sync_state', 'coupon_attempts', 'coupon_redemptions', 'coupons', 'favorites', 'game_plays', 'game_rewards', 'knowledge_base', 'location_closures', 'location_opening_hours', 'notification_settings', 'notifications', 'order_status_lookups', 'orders', 'profiles', 'push_delivery_log', 'push_subscriptions', 'resources', 'reviews', 'user_claimed_rewards', 'webhook_events'];
  v_views text[] := array[
    'catalog_item_review_stats','catalog_item_public_reviews','game_rewards_public',
    'business_public_settings','catalog_items_public'
  ];
  v_functions text[] := array['admin_set_user_role', 'audit_log_guard', 'audit_order_change', 'audit_profile_role_change', 'audit_row_change', 'claim_game_reward', 'claim_push_subscription', 'cleanup_operational_data', 'consume_coupon_for_order', 'enforce_booking_capacity', 'enforce_booking_rules', 'enforce_order_rate_limit', 'ensure_my_profile', 'expire_stale_bookings', 'expire_unpaid_orders', 'format_money', 'get_order_status', 'guard_location_capacity_reduction', 'handle_booking_status_notify', 'handle_new_booking_notify', 'handle_new_order_notify', 'handle_order_payment_notify', 'handle_order_status_notify', 'is_admin_v2', 'is_allowed_push_endpoint', 'is_service_role', 'is_trusted_caller', 'mark_notification_read', 'match_knowledge', 'normalize_coupon_code', 'notify_admins', 'notify_refund_required', 'ops_health', 'process_clerk_webhook', 'protect_profile_role', 'refresh_audit_triggers', 'release_coupon_for_declined_order', 'release_coupon_redemption_internal', 'requesting_user_id', 'reserve_coupon_for_order_internal', 'send_booking_reminders', 'set_booking_timestamp', 'set_updated_at', 'swap_location_display_order', 'sync_catalog_price_display', 'sync_order_coupon', 'sync_order_stock', 'validate_coupon_code', 'validate_location_timezone', 'validate_order_integrity', 'validate_review'];
  t text;
  f record;
begin
  foreach t in array v_tables loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
  foreach t in array v_views loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (v_functions)
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant select on
  public.business_locations,
  public.location_opening_hours,
  public.location_closures,
  public.resources,
  public.catalog_items,
  public.knowledge_base
to anon;

grant select on
  public.catalog_item_review_stats,
  public.catalog_item_public_reviews,
  public.game_rewards_public,
  public.business_public_settings,
  public.catalog_items_public
to anon, authenticated;

grant select on
  public.profiles,
  public.business_settings,
  public.business_locations,
  public.location_opening_hours,
  public.location_closures,
  public.resources,
  public.catalog_items,
  public.coupons,
  public.orders,
  public.coupon_redemptions,
  public.bookings,
  public.favorites,
  public.cart_items,
  public.reviews,
  public.notifications,
  public.notification_settings,
  public.push_subscriptions,
  public.push_delivery_log,
  public.chats,
  public.chat_messages,
  public.knowledge_base,
  public.game_rewards,
  public.user_claimed_rewards,
  public.audit_log
to authenticated;

grant insert, update, delete on public.favorites, public.cart_items to authenticated;
grant insert, update, delete on public.chats, public.chat_messages to authenticated;
grant insert, update on public.notification_settings to authenticated;
grant insert, delete on public.reviews to authenticated;
grant update (rating, remark) on public.reviews to authenticated;
grant delete on public.notifications, public.push_subscriptions to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant insert on public.orders to authenticated;
grant insert, update on public.bookings to authenticated;

grant insert on public.notifications to authenticated;
grant update on public.orders to authenticated;
grant delete on public.bookings to authenticated;
grant update on public.business_settings to authenticated;
grant insert, update, delete on
  public.business_locations,
  public.location_opening_hours,
  public.location_closures,
  public.resources,
  public.catalog_items,
  public.coupons,
  public.knowledge_base,
  public.game_rewards
to authenticated;

grant execute on function public.requesting_user_id() to anon, authenticated, service_role;
grant execute on function public.is_service_role() to anon, authenticated, service_role;
grant execute on function public.is_admin_v2() to anon, authenticated, service_role;
grant execute on function public.is_trusted_caller() to anon, authenticated, service_role;

-- get_order_status() is granted where it is defined (0019).
grant execute on function public.is_allowed_push_endpoint(text) to authenticated, service_role;
grant execute on function public.claim_push_subscription(text,text,text) to authenticated, service_role;
grant execute on function public.claim_game_reward(uuid,uuid) to authenticated, service_role;
grant execute on function public.mark_notification_read(uuid) to authenticated, service_role;
grant execute on function public.match_knowledge(vector,float,integer) to authenticated, service_role;
grant execute on function public.ensure_my_profile() to authenticated, service_role;
grant execute on function public.validate_coupon_code(text,numeric) to authenticated, service_role;
grant execute on function public.swap_location_display_order(uuid,uuid) to authenticated, service_role;
grant execute on function public.admin_set_user_role(text,text) to authenticated, service_role;
-- ops_health() is granted where it is defined (0024).

grant execute on function public.process_clerk_webhook(text,text,timestamptz,text,jsonb) to service_role;
grant execute on function public.consume_coupon_for_order(uuid,uuid) to service_role;
grant execute on function public.release_coupon_for_declined_order(uuid) to service_role;
grant execute on function public.notify_admins(text,text,text,uuid,text) to service_role;
grant execute on function public.send_booking_reminders() to service_role;
grant execute on function public.expire_unpaid_orders() to service_role;
grant execute on function public.expire_stale_bookings() to service_role;
grant execute on function public.cleanup_operational_data() to service_role;

revoke all on function public.reserve_coupon_for_order_internal(uuid,uuid,text,numeric)
  from public, anon, authenticated, service_role;
revoke all on function public.release_coupon_redemption_internal(uuid)
  from public, anon, authenticated, service_role;
-- SECURITY DEFINER helper used only by the booking triggers. Left callable, it
-- would let any browser role read per-slot occupancy (and would fail the
-- api_surface_clean assertion below).
revoke all on function public.location_peak_occupancy(uuid, tstzrange, uuid)
  from public, anon, authenticated, service_role;

-- Final assertions run at the very end of this file (0024 §K).


-- ############################################################################
-- # 0016 — PRIVACY + SURFACE GUARD
-- ############################################################################
do $$
declare r text;
begin
  foreach r in array array['postgres', 'supabase_admin'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      begin
        execute format('alter default privileges for role %I in schema public revoke all on tables from anon, authenticated', r);
        execute format('alter default privileges for role %I in schema public revoke all on sequences from anon, authenticated', r);
        execute format('alter default privileges for role %I in schema public revoke execute on functions from anon, authenticated', r);
      exception when insufficient_privilege then
        raise notice 'default privileges for role % not changed (insufficient privilege)', r;
      end;
    end if;
  end loop;
end $$;

-- Identity sequences are not needed by browser roles (all writes that use them
-- run inside SECURITY DEFINER code).
revoke all on all sequences in schema public from anon, authenticated;

create table if not exists public.api_surface_exceptions (
  object_kind text not null check (object_kind in ('relation', 'function')),
  object_name text not null check (char_length(btrim(object_name)) > 0),
  reason text not null check (char_length(btrim(reason)) >= 10),
  created_at timestamptz not null default now(),
  primary key (object_kind, object_name)
);

alter table public.api_surface_exceptions enable row level security;
revoke all on table public.api_surface_exceptions from anon, authenticated;

create or replace function public.scrub_user_personal_data(p_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
  v_orders integer := 0;
  v_bookings_scrubbed integer := 0;
  v_bookings_cancelled integer := 0;
  v_deleted jsonb := '{}'::jsonb;
begin
  if not public.is_trusted_caller() then raise exception 'Trusted caller required'; end if;
  if p_user_id is null or btrim(p_user_id) = '' then raise exception 'user id required'; end if;

  update public.orders
     set customer_name = null,
         -- orders_delivery_address_check (enforced even though NOT VALID) forbids a
         -- NULL address on delivery orders, so those get a placeholder instead.
         address = case when order_type = 'delivery' then '[redacted]' else null end,
         phone = null
   where user_id = p_user_id
     and (customer_name is not null
          or address is distinct from (case when order_type = 'delivery' then '[redacted]' else null end)
          or phone is not null);
  get diagnostics v_orders = row_count;

  update public.bookings
     set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now())
   where user_id = p_user_id
     and status in ('pending', 'confirmed')
     and booking_at > now();
  get diagnostics v_bookings_cancelled = row_count;

  update public.bookings
     set user_name = null, user_email = null,
         special_requests = null, cancelled_reason = null
   where user_id = p_user_id
     and (user_name is not null or user_email is not null
          or special_requests is not null or cancelled_reason is not null);
  get diagnostics v_bookings_scrubbed = row_count;

  delete from public.reviews where user_id = p_user_id;
  get diagnostics n = row_count; v_deleted := v_deleted || jsonb_build_object('reviews', n);

  delete from public.chats where user_id = p_user_id;
  get diagnostics n = row_count; v_deleted := v_deleted || jsonb_build_object('chats', n);

  delete from public.notifications where user_id = p_user_id;
  get diagnostics n = row_count; v_deleted := v_deleted || jsonb_build_object('notifications', n);

  delete from public.push_subscriptions where user_id = p_user_id;
  get diagnostics n = row_count; v_deleted := v_deleted || jsonb_build_object('push_subscriptions', n);

  delete from public.push_delivery_log where user_id = p_user_id;
  get diagnostics n = row_count; v_deleted := v_deleted || jsonb_build_object('push_delivery_log', n);

  delete from public.notification_settings where user_id = p_user_id;
  delete from public.cart_items where user_id = p_user_id;
  delete from public.favorites where user_id = p_user_id;
  delete from public.game_plays where user_id = p_user_id;
  delete from public.coupon_attempts where user_id = p_user_id;

  return jsonb_build_object(
    'user_id', p_user_id,
    'orders_scrubbed', v_orders,
    'bookings_scrubbed', v_bookings_scrubbed,
    'bookings_cancelled', v_bookings_cancelled,
    'deleted', v_deleted
  );
end;
$$;

revoke all on function public.scrub_user_personal_data(text) from public, anon, authenticated;
grant execute on function public.scrub_user_personal_data(text) to service_role;

-- FINAL Clerk webhook: identical to 0010 but scrubs on user.deleted.
create or replace function public.process_clerk_webhook(
  p_event_id text,
  p_event_type text,
  p_event_timestamp timestamptz,
  p_user_id text,
  p_profile jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  inserted_event_id text;
  s public.clerk_user_sync_state%rowtype;
  should_apply boolean;
begin
  if not public.is_service_role() then raise exception 'Service role required'; end if;
  if p_event_id is null or btrim(p_event_id) = ''
     or p_event_type is null or btrim(p_event_type) = ''
     or p_event_timestamp is null
     or p_user_id is null or btrim(p_user_id) = ''
  then
    raise exception 'Invalid Clerk webhook arguments';
  end if;
  if p_event_type not in('user.created','user.updated','user.deleted') then
    raise exception 'Unsupported Clerk webhook event: %', p_event_type;
  end if;

  insert into public.webhook_events(id,provider,event_type)
  values(p_event_id,'clerk',p_event_type)
  on conflict(id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return jsonb_build_object('status','duplicate','event_id',p_event_id);
  end if;

  select * into s from public.clerk_user_sync_state where clerk_user_id = p_user_id for update;

  should_apply := s.clerk_user_id is null
    or p_event_timestamp > s.last_event_at
    or (p_event_timestamp = s.last_event_at and p_event_id > s.last_event_id);

  if should_apply then
    if p_event_type in('user.created','user.updated') then
      if p_profile is null then raise exception 'Profile payload required'; end if;

      begin
        insert into public.profiles(id,email,full_name,avatar_url,username,phone,role,updated_at)
        values(
          p_user_id,
          nullif(p_profile->>'email',''),
          nullif(p_profile->>'full_name',''),
          nullif(p_profile->>'avatar_url',''),
          nullif(p_profile->>'username',''),
          nullif(p_profile->>'phone',''),
          'customer',
          p_event_timestamp
        )
        on conflict(id) do update set
          email = excluded.email,
          full_name = excluded.full_name,
          avatar_url = excluded.avatar_url,
          username = excluded.username,
          phone = excluded.phone,
          role = public.profiles.role,
          updated_at = excluded.updated_at;
      exception when unique_violation then
        raise warning 'clerk webhook %: username % is already taken; username left unchanged',
          p_event_id, p_profile->>'username';

        insert into public.profiles(id,email,full_name,avatar_url,phone,role,updated_at)
        values(
          p_user_id,
          nullif(p_profile->>'email',''),
          nullif(p_profile->>'full_name',''),
          nullif(p_profile->>'avatar_url',''),
          nullif(p_profile->>'phone',''),
          'customer',
          p_event_timestamp
        )
        on conflict(id) do update set
          email = excluded.email,
          full_name = excluded.full_name,
          avatar_url = excluded.avatar_url,
          phone = excluded.phone,
          role = public.profiles.role,
          updated_at = excluded.updated_at;
      end;

      insert into public.clerk_user_sync_state(clerk_user_id,last_event_at,last_event_id,deleted,updated_at)
      values(p_user_id,p_event_timestamp,p_event_id,false,now())
      on conflict(clerk_user_id) do update set
        last_event_at = excluded.last_event_at,
        last_event_id = excluded.last_event_id,
        deleted = false,
        updated_at = now();
    else
      update public.profiles
      set email = null, full_name = null, avatar_url = null,
          username = null, phone = null, role = 'customer', updated_at = now()
      where id = p_user_id;

      perform public.scrub_user_personal_data(p_user_id);

      insert into public.clerk_user_sync_state(clerk_user_id,last_event_at,last_event_id,deleted,updated_at)
      values(p_user_id,p_event_timestamp,p_event_id,true,now())
      on conflict(clerk_user_id) do update set
        last_event_at = excluded.last_event_at,
        last_event_id = excluded.last_event_id,
        deleted = true,
        updated_at = now();
    end if;
  end if;

  update public.webhook_events set processed_at = now() where id = p_event_id;

  return jsonb_build_object(
    'status', case when should_apply then 'processed' else 'stale' end,
    'event_id', p_event_id,
    'event_type', p_event_type,
    'user_id', p_user_id
  );
end;
$$;

create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid text := public.requesting_user_id();
begin
  if uid is null then raise exception 'Authentication required'; end if;

  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = uid),
    'orders', (select coalesce(jsonb_agg(to_jsonb(o)), '[]'::jsonb)
                 from (select * from public.orders where user_id = uid order by created_at desc limit 1000) o),
    'bookings', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
                   from (select * from public.bookings where user_id = uid order by created_at desc limit 1000) b),
    'reviews', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
                  from (select * from public.reviews where user_id = uid order by created_at desc limit 1000) r),
    'favorites', (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
                    from (select * from public.favorites where user_id = uid limit 1000) f),
    'cart_items', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
                     from (select * from public.cart_items where user_id = uid limit 1000) c),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb)
                        from (select * from public.notifications where user_id = uid order by created_at desc limit 1000) n),
    'notification_settings', (select to_jsonb(s) from public.notification_settings s where s.user_id = uid),
    'claimed_rewards', (select coalesce(jsonb_agg(to_jsonb(k)), '[]'::jsonb)
                          from (select * from public.user_claimed_rewards where user_id = uid limit 1000) k),
    'push_subscriptions', (select coalesce(jsonb_agg(jsonb_build_object(
                                'endpoint', x.endpoint, 'created_at', x.created_at, 'last_seen_at', x.last_seen_at)), '[]'::jsonb)
                             from (select endpoint, created_at, last_seen_at
                                     from public.push_subscriptions where user_id = uid limit 100) x),
    'chats', (select coalesce(jsonb_agg(jsonb_build_object(
                  'chat', to_jsonb(ch),
                  'messages', (select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]'::jsonb)
                                 from (select * from public.chat_messages
                                        where chat_id = ch.id order by created_at limit 5000) m)
              )), '[]'::jsonb)
                from (select * from public.chats where user_id = uid order by created_at desc limit 200) ch)
  );
end;
$$;

revoke all on function public.export_my_data() from public, anon, authenticated;
grant execute on function public.export_my_data() to authenticated, service_role;

-- NOTE: api_surface_violations and ops_health are re-declared here and then
-- AGAIN in 0017, 0019, 0022, 0023, 0024. The FINAL version is in 0024.


-- ############################################################################
-- # 0017 — STRIPE
-- ############################################################################
create or replace function public.stripe_currency_exponent(p_currency text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when upper(p_currency) in ('BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF',
                               'VND','VUV','XAF','XOF','XPF') then 0
    when upper(p_currency) in ('BHD','JOD','KWD','OMR','TND') then null
    else 2
  end;
$$;

create or replace function public.stripe_minor_to_major(p_amount bigint, p_currency text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_exp integer;
begin
  if p_amount is null or p_amount < 0 or p_currency is null or p_currency !~ '^[A-Za-z]{3}$' then
    raise exception 'Invalid Stripe amount or currency';
  end if;
  v_exp := public.stripe_currency_exponent(p_currency);
  if v_exp is null then raise exception 'Currency % is not supported (three-decimal currencies)', upper(p_currency); end if;
  return round(p_amount::numeric / power(10::numeric, v_exp), v_exp);
end;
$$;

create or replace function public.stripe_major_to_minor(p_amount numeric, p_currency text)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_exp integer;
begin
  if p_amount is null or p_amount < 0 or p_currency is null or p_currency !~ '^[A-Za-z]{3}$' then
    raise exception 'Invalid amount or currency';
  end if;
  v_exp := public.stripe_currency_exponent(p_currency);
  if v_exp is null then raise exception 'Currency % is not supported (three-decimal currencies)', upper(p_currency); end if;
  if v_exp = 0 and p_amount <> trunc(p_amount) then
    raise exception 'Amount % has fractional units in zero-decimal currency %', p_amount, upper(p_currency);
  end if;
  return round(p_amount * power(10::numeric, v_exp))::bigint;
end;
$$;

create or replace function public.stripe_id_text(p_val jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(p_val) = 'string' then p_val #>> '{}' end;
$$;

create or replace function public.stripe_order_ref(p_obj jsonb)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when x.v ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then x.v::uuid
  end
  from (select coalesce(public.stripe_id_text(p_obj->'client_reference_id'),
                        public.stripe_id_text(p_obj->'metadata'->'order_id')) as v) x;
$$;

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  stripe_checkout_session_id text unique
    check (stripe_checkout_session_id is null or stripe_checkout_session_id ~ '^cs_(test|live)_[A-Za-z0-9]+$'),
  stripe_payment_intent_id text unique
    check (stripe_payment_intent_id is null or stripe_payment_intent_id ~ '^pi_[A-Za-z0-9_]+$'),
  stripe_charge_id text,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','expired','partially_refunded','refunded')),
  amount numeric(12,2) not null check (amount > 0),
  amount_refunded numeric(12,2) not null default 0 check (amount_refunded >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  livemode boolean not null default false,
  refund_due boolean not null default false,
  refund_reason text,
  failed_refund_ids text[] not null default '{}',
  refund_due_amount numeric(12,2) not null default 0 check (refund_due_amount >= 0),
  dispute_id text,
  dispute_status text,
  last_refund_event_at timestamptz,
  last_dispute_event_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_payments_has_stripe_id
    check (stripe_checkout_session_id is not null or stripe_payment_intent_id is not null),
  constraint order_payments_refund_bounds check (amount_refunded <= amount),
  constraint order_payments_refund_reason_consistent
    check (refund_reason is not null or not refund_due)
);

alter table public.order_payments add column if not exists failed_refund_ids text[] not null default '{}';
alter table public.order_payments add column if not exists refund_due_amount numeric(12,2) not null default 0
  check (refund_due_amount >= 0);
alter table public.order_payments drop constraint if exists order_payments_refund_reason_check;
alter table public.order_payments add constraint order_payments_refund_reason_check
  check (refund_reason is null or refund_reason in
    ('late_payment','amount_mismatch','currency_mismatch','duplicate_payment','refund_failed'));

create index if not exists idx_order_payments_order on public.order_payments(order_id);
create index if not exists idx_order_payments_refund_due
on public.order_payments(created_at) where refund_due;

drop trigger if exists trg_order_payments_updated_at on public.order_payments;
create trigger trg_order_payments_updated_at
before update on public.order_payments
for each row execute function public.set_updated_at();

create table if not exists public.stripe_events (
  id text primary key check (id ~ '^evt_[A-Za-z0-9_]+$'),
  event_type text not null check (char_length(btrim(event_type)) > 0),
  livemode boolean not null default false,
  stripe_created timestamptz not null,
  object_id text,
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'processing'
    check (status in ('processing','processed','ignored','deferred','failed')),
  detail text,
  deferred jsonb,
  attempts integer not null default 1 check (attempts >= 1),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_stripe_events_attention
on public.stripe_events(received_at) where status in ('failed','deferred');
create index if not exists idx_stripe_events_deferred_pi
on public.stripe_events((deferred->>'payment_intent')) where status = 'deferred';
create index if not exists idx_stripe_events_processed_at
on public.stripe_events(processed_at) where processed_at is not null;

alter table public.order_payments enable row level security;
alter table public.stripe_events enable row level security;

revoke all on table public.order_payments from anon, authenticated;
revoke all on table public.stripe_events from anon, authenticated;
grant all on table public.order_payments to service_role;
grant all on table public.stripe_events to service_role;

drop policy if exists order_payments_select_own_or_admin on public.order_payments;
create policy order_payments_select_own_or_admin on public.order_payments
for select to authenticated
using (
  (select public.is_admin_v2())
  or exists (
    select 1 from public.orders o
    where o.id = order_payments.order_id
      and o.user_id = (select public.requesting_user_id())
  )
);

grant select (id, order_id, status, amount, amount_refunded, currency,
              refund_due, refund_reason, paid_at, created_at)
on public.order_payments to authenticated;

create or replace function public.order_checkout_amount(p_order_id uuid)
returns table (amount_minor bigint, currency text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders%rowtype;
  v_currency text;
begin
  if not public.is_trusted_caller() then raise exception 'Service role required'; end if;

  select * into o from public.orders where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  if o.payment_method <> 'online' then raise exception 'Order is not an online-payment order'; end if;
  if o.is_paid then raise exception 'Order is already paid'; end if;
  if o.status not in ('incoming','pending') then raise exception 'Order is % and can no longer be paid', o.status; end if;
  if o.total_amount <= 0 then raise exception 'Order total must be positive'; end if;

  -- FINAL: 0019 §17 uses the order's snapshotted currency.
  v_currency := coalesce(
    o.currency,
    (select upper(bs.currency) from public.business_settings bs where bs.id),
    'USD');

  return query select public.stripe_major_to_minor(o.total_amount, v_currency), lower(v_currency);
end;
$$;

create or replace function public.register_checkout_session(
  p_order_id uuid,
  p_session_id text,
  p_amount_minor bigint,
  p_currency text,
  p_livemode boolean,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expected record;
  v_id uuid;
begin
  if not public.is_trusted_caller() then raise exception 'Service role required'; end if;
  if p_session_id is null or p_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$' then
    raise exception 'Invalid Checkout Session id';
  end if;

  select * into v_expected from public.order_checkout_amount(p_order_id);

  if p_amount_minor is distinct from v_expected.amount_minor
     or lower(p_currency) is distinct from v_expected.currency then
    raise exception 'Checkout Session amount does not match the order total';
  end if;

  insert into public.order_payments(
    order_id, stripe_checkout_session_id, status, amount, currency, livemode, expires_at
  )
  values (
    p_order_id, p_session_id, 'pending',
    public.stripe_minor_to_major(p_amount_minor, p_currency),
    upper(p_currency), coalesce(p_livemode, false), p_expires_at
  )
  on conflict (stripe_checkout_session_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.order_payments
    where stripe_checkout_session_id = p_session_id and order_id = p_order_id;
    if v_id is null then raise exception 'Checkout Session is registered for a different order'; end if;
  end if;

  return v_id;
end;
$$;

-- FINAL: 0019 §9 (surfaces the clamp) — this is the operative version.
create or replace function public.stripe_apply_refund_internal(
  p_created timestamptz,
  p_payment_intent_id text,
  p_charge_id text,
  p_amount_refunded_minor bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  l public.order_payments%rowtype;
  o public.orders%rowtype;
  v_refunded numeric(12,2);
  v_reported numeric(12,2);
  v_clamped boolean := false;
  v_full boolean;
  v_due numeric(12,2);
  v_settled boolean;
begin
  select * into l from public.order_payments where stripe_payment_intent_id = p_payment_intent_id;
  if not found then return jsonb_build_object('status', 'deferred', 'detail', 'payment_not_recorded_yet'); end if;

  select * into o from public.orders where id = l.order_id for update;
  select * into l from public.order_payments where id = l.id for update;

  if l.status not in ('paid','partially_refunded','refunded') then
    return jsonb_build_object('status', 'deferred', 'detail', 'payment_not_settled_yet');
  end if;

  if l.last_refund_event_at is not null and p_created < l.last_refund_event_at then
    return jsonb_build_object('status', 'ignored', 'detail', 'stale_refund_event', 'order_id', l.order_id);
  end if;

  v_reported := public.stripe_minor_to_major(p_amount_refunded_minor, l.currency);
  v_refunded := least(v_reported, l.amount);
  v_clamped := v_reported > l.amount;

  if l.last_refund_event_at is not null and p_created = l.last_refund_event_at then
    v_refunded := greatest(v_refunded, l.amount_refunded);
  end if;

  v_full := v_refunded >= l.amount;
  v_due := case when l.refund_reason = 'refund_failed'
                then greatest(l.refund_due_amount - greatest(v_refunded - l.amount_refunded, 0), 0)
                else l.refund_due_amount end;
  v_settled := v_full or (l.refund_reason = 'refund_failed' and v_due = 0);

  update public.order_payments
  set amount_refunded = v_refunded,
      status = case when v_full then 'refunded'
                    when v_refunded > 0 then 'partially_refunded'
                    else 'paid' end,
      refund_due = case when v_settled then false else refund_due end,
      refund_reason = case when v_settled and refund_reason = 'refund_failed' then null else refund_reason end,
      refund_due_amount = case when v_settled then 0 else v_due end,
      stripe_charge_id = coalesce(p_charge_id, stripe_charge_id),
      last_refund_event_at = p_created
  where id = l.id;

  if v_clamped then
    perform public.notify_admins(
      'Refund discrepancy',
      format('Order #%s: Stripe reports %s refunded, ledger records %s. Investigate.',
        substr(l.order_id::text, 1, 8),
        public.format_money(v_reported),
        public.format_money(l.amount)),
      'refund_required', l.order_id, null);
  end if;

  if v_full and (l.refund_reason is null or l.refund_reason in ('late_payment', 'refund_failed')) then
    update public.orders
    set status = case when status in ('declined','refunded') then status else 'refunded' end,
        refund_required = false
    where id = o.id
      and (refund_required or status not in ('declined','refunded'));
  end if;

  return jsonb_build_object(
    'status', 'processed',
    'detail', case when v_clamped then 'refund_recorded_clamped' else 'refund_recorded' end,
    'order_id', l.order_id, 'payment_id', l.id,
    'amount_refunded', v_refunded,
    'reported_amount', v_reported,
    'clamped', v_clamped
  );
end;
$$;

-- FINAL: 0019 §8 (adds the stale-event guard on reverse).
create or replace function public.stripe_reverse_refund_internal(
  p_created timestamptz,
  p_payment_intent_id text,
  p_refund_id text,
  p_amount_minor bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  l public.order_payments%rowtype;
  v_amount numeric(12,2);
  v_refunded numeric(12,2);
begin
  select * into l from public.order_payments where stripe_payment_intent_id = p_payment_intent_id;
  if not found then return jsonb_build_object('status', 'ignored', 'detail', 'unknown_payment'); end if;

  perform 1 from public.orders where id = l.order_id for update;
  select * into l from public.order_payments where id = l.id for update;

  if p_refund_id = any (l.failed_refund_ids) then
    return jsonb_build_object('status', 'ignored', 'detail', 'refund_already_reversed', 'order_id', l.order_id);
  end if;
  if l.status not in ('paid','partially_refunded','refunded') then
    return jsonb_build_object('status', 'ignored', 'detail', 'payment_not_settled', 'order_id', l.order_id);
  end if;
  if l.last_refund_event_at is not null and p_created < l.last_refund_event_at then
    return jsonb_build_object('status', 'ignored', 'detail', 'stale_refund_event', 'order_id', l.order_id);
  end if;

  v_amount := public.stripe_minor_to_major(p_amount_minor, l.currency);
  v_refunded := greatest(l.amount_refunded - v_amount, 0);

  update public.order_payments
  set amount_refunded = v_refunded,
      status = case when v_refunded >= amount then 'refunded'
                    when v_refunded > 0 then 'partially_refunded'
                    else 'paid' end,
      refund_due = true,
      refund_due_amount = case when refund_reason is null or refund_reason = 'refund_failed'
                               then least(refund_due_amount + v_amount, amount)
                               else refund_due_amount end,
      refund_reason = coalesce(refund_reason, 'refund_failed'),
      failed_refund_ids = array_append(failed_refund_ids, p_refund_id),
      last_refund_event_at = greatest(last_refund_event_at, p_created)
  where id = l.id;

  perform public.notify_admins(
    'Refund failed',
    format('Order #%s: a refund of %s failed and will be retried.',
           substr(l.order_id::text, 1, 8), public.format_money(v_amount)),
    'refund_required', l.order_id, null);

  return jsonb_build_object('status', 'processed', 'detail', 'refund_reversed',
                            'order_id', l.order_id, 'payment_id', l.id,
                            'amount_refunded', v_refunded);
end;
$$;

create or replace function public.stripe_replay_deferred_refunds_internal(p_payment_intent_id text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d record;
  r jsonb;
  v_n integer := 0;
begin
  for d in
    select id, deferred from public.stripe_events
    where status = 'deferred' and deferred is not null
      and (p_payment_intent_id is null or deferred->>'payment_intent' = p_payment_intent_id)
    order by stripe_created, id
    for update skip locked
  loop
    r := public.stripe_apply_refund_internal(
      to_timestamp((d.deferred->>'created')::double precision),
      d.deferred->>'payment_intent',
      d.deferred->>'charge',
      (d.deferred->>'amount_refunded')::bigint
    );
    if r->>'status' <> 'deferred' then
      update public.stripe_events
      set status = 'processed', detail = 'deferred_refund_applied',
          order_id = nullif(r->>'order_id', '')::uuid,
          deferred = null, processed_at = now()
      where id = d.id;
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end;
$$;

-- FINAL: 0020 §2b (uses the order's currency, not the live setting).
create or replace function public.stripe_payment_success_internal(
  p_event_created timestamptz,
  p_livemode boolean,
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_minor bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders%rowtype;
  l public.order_payments%rowtype;
  v_currency text;
  v_amount numeric(12,2);
  v_reason text;
  v_due boolean;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('status', 'ignored', 'detail', 'order_not_found'); end if;
  if o.payment_method <> 'online' then
    return jsonb_build_object('status', 'ignored', 'detail', 'order_not_online', 'order_id', p_order_id);
  end if;

  select upper(bs.currency) into v_currency from public.business_settings bs where bs.id;
  v_currency := coalesce(o.currency, v_currency, 'USD');

  if p_session_id is not null then
    select * into l from public.order_payments where stripe_checkout_session_id = p_session_id for update;
  end if;
  if l.id is null and p_payment_intent_id is not null then
    select * into l from public.order_payments where stripe_payment_intent_id = p_payment_intent_id for update;
  end if;

  if l.id is not null then
    if l.order_id <> p_order_id then
      return jsonb_build_object('status', 'ignored', 'detail', 'ledger_order_mismatch', 'order_id', p_order_id);
    end if;
    if l.livemode <> p_livemode then
      return jsonb_build_object('status', 'ignored', 'detail', 'livemode_mismatch', 'order_id', p_order_id);
    end if;
    if l.status in ('paid','partially_refunded','refunded') then
      return jsonb_build_object('status', 'processed', 'detail', 'already_recorded',
                                'order_id', p_order_id, 'payment_id', l.id,
                                'payment_intent', l.stripe_payment_intent_id,
                                'refund_due', l.refund_due, 'refund_reason', l.refund_reason);
    end if;
  end if;

  v_amount := public.stripe_minor_to_major(p_amount_minor, p_currency);

  if upper(p_currency) <> v_currency then v_reason := 'currency_mismatch';
  elsif v_amount <> o.total_amount then v_reason := 'amount_mismatch';
  elsif o.is_paid then v_reason := 'duplicate_payment';
  elsif o.status in ('declined','refunded') then v_reason := 'late_payment';
  end if;

  if l.id is null then
    insert into public.order_payments(
      order_id, stripe_checkout_session_id, stripe_payment_intent_id, status, amount,
      currency, livemode, refund_due, refund_reason, paid_at)
    values (
      p_order_id, p_session_id, p_payment_intent_id, 'paid', v_amount,
      upper(p_currency), p_livemode, v_reason is not null, v_reason, p_event_created)
    returning * into l;
  else
    update public.order_payments
    set stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_payment_intent_id),
        status = 'paid', amount = v_amount, currency = upper(p_currency), livemode = p_livemode,
        refund_due = v_reason is not null, refund_reason = v_reason,
        paid_at = coalesce(paid_at, p_event_created)
    where id = l.id
    returning * into l;
  end if;

  if v_reason is null or (v_reason = 'late_payment' and o.status = 'declined') then
    update public.orders set is_paid = true where id = o.id;
  else
    perform public.notify_admins(
      'Payment needs a refund',
      format('Order #%s received a payment of %s that cannot be applied (%s). It must be refunded.',
             substr(o.id::text, 1, 8), public.format_money(v_amount), replace(v_reason, '_', ' ')),
      'refund_required', o.id, null);
  end if;

  if p_payment_intent_id is not null then
    perform public.stripe_replay_deferred_refunds_internal(p_payment_intent_id);
  end if;

  select refund_due into v_due from public.order_payments where id = l.id;

  return jsonb_build_object('status', 'processed', 'detail', 'payment_recorded',
                            'order_id', o.id, 'payment_id', l.id,
                            'payment_intent', l.stripe_payment_intent_id,
                            'refund_due', v_due, 'refund_reason', l.refund_reason);
end;
$$;

create or replace function public.apply_stripe_event(
  p_type text,
  p_created timestamptz,
  p_livemode boolean,
  p_obj jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  l public.order_payments%rowtype;
  v_order_id uuid;
  v_pi text;
  v_n integer;
  v_res jsonb;
begin
  if p_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded') then
    if p_type = 'checkout.session.completed' and coalesce(p_obj->>'payment_status', '') <> 'paid' then
      return jsonb_build_object('status', 'ignored',
        'detail', 'payment_not_settled:' || coalesce(p_obj->>'payment_status', 'unknown'));
    end if;

    v_order_id := public.stripe_order_ref(p_obj);
    if v_order_id is null then return jsonb_build_object('status', 'ignored', 'detail', 'no_order_reference'); end if;
    if p_obj->>'amount_total' is null or p_obj->>'currency' is null then
      raise exception 'Stripe session is missing amount_total or currency';
    end if;

    return public.stripe_payment_success_internal(
      p_created, p_livemode, v_order_id, p_obj->>'id',
      public.stripe_id_text(p_obj->'payment_intent'),
      (p_obj->>'amount_total')::bigint, p_obj->>'currency');

  elsif p_type in ('checkout.session.async_payment_failed', 'checkout.session.expired') then
    update public.order_payments
    set status = case when p_type = 'checkout.session.expired' then 'expired' else 'failed' end
    where stripe_checkout_session_id = p_obj->>'id' and status = 'pending';
    get diagnostics v_n = row_count;
    return jsonb_build_object(
      'status', case when v_n > 0 then 'processed' else 'ignored' end,
      'detail', case when v_n > 0 then 'session_closed' else 'unknown_or_settled_session' end);

  elsif p_type = 'charge.refunded' then
    v_pi := public.stripe_id_text(p_obj->'payment_intent');
    if v_pi is null then return jsonb_build_object('status', 'ignored', 'detail', 'charge_without_payment_intent'); end if;
    if p_obj->>'amount_refunded' is null then raise exception 'Stripe charge is missing amount_refunded'; end if;

    v_res := public.stripe_apply_refund_internal(
      p_created, v_pi, p_obj->>'id', (p_obj->>'amount_refunded')::bigint);

    if v_res->>'status' = 'deferred' then
      v_res := v_res || jsonb_build_object('deferred', jsonb_build_object(
        'payment_intent', v_pi,
        'charge', p_obj->>'id',
        'amount_refunded', (p_obj->>'amount_refunded')::bigint,
        'created', extract(epoch from p_created)));
    end if;
    return v_res;

  elsif p_type in ('charge.refund.updated', 'refund.updated', 'refund.failed') then
    if coalesce(p_obj->>'status', '') not in ('failed', 'canceled') then
      return jsonb_build_object('status', 'ignored', 'detail', 'refund_not_failed');
    end if;
    v_pi := public.stripe_id_text(p_obj->'payment_intent');
    if v_pi is null or p_obj->>'id' is null or p_obj->>'amount' is null then
      return jsonb_build_object('status', 'ignored', 'detail', 'refund_without_payment_intent');
    end if;
    return public.stripe_reverse_refund_internal(
      p_created, v_pi, p_obj->>'id', (p_obj->>'amount')::bigint);

  elsif p_type in ('charge.dispute.created', 'charge.dispute.closed') then
    v_pi := public.stripe_id_text(p_obj->'payment_intent');
    if v_pi is null then return jsonb_build_object('status', 'ignored', 'detail', 'dispute_without_payment_intent'); end if;

    select * into l from public.order_payments where stripe_payment_intent_id = v_pi for update;
    if not found then return jsonb_build_object('status', 'ignored', 'detail', 'unknown_payment'); end if;
    if l.last_dispute_event_at is not null and p_created < l.last_dispute_event_at then
      return jsonb_build_object('status', 'ignored', 'detail', 'stale_dispute_event', 'order_id', l.order_id);
    end if;

    update public.order_payments
    set dispute_id = p_obj->>'id', dispute_status = p_obj->>'status', last_dispute_event_at = p_created
    where id = l.id;

    perform public.notify_admins(
      case when p_type = 'charge.dispute.created' then 'Payment disputed' else 'Dispute closed' end,
      format('Order #%s: dispute is "%s" (reason: %s).',
             substr(l.order_id::text, 1, 8),
             coalesce(p_obj->>'status', 'unknown'), coalesce(p_obj->>'reason', 'n/a')),
      'payment_dispute', l.order_id, null);

    return jsonb_build_object('status', 'processed', 'detail', 'dispute_recorded',
                              'order_id', l.order_id, 'payment_id', l.id);
  end if;

  return jsonb_build_object('status', 'ignored', 'detail', 'unhandled_event_type');
end;
$$;

create or replace function public.process_stripe_event(p_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id text := p_event->>'id';
  v_type text := p_event->>'type';
  v_obj jsonb := p_event->'data'->'object';
  v_created timestamptz;
  v_livemode boolean;
  e public.stripe_events%rowtype;
  v_result jsonb;
  v_err text;
begin
  if not public.is_trusted_caller() then raise exception 'Service role required'; end if;

  if jsonb_typeof(p_event) is distinct from 'object'
     or v_id is null or v_id !~ '^evt_[A-Za-z0-9_]+$'
     or v_type is null or btrim(v_type) = ''
     or jsonb_typeof(v_obj) is distinct from 'object'
     or jsonb_typeof(p_event->'created') is distinct from 'number'
  then
    raise exception 'Invalid Stripe event';
  end if;

  v_created := to_timestamp((p_event->>'created')::double precision);
  v_livemode := coalesce((p_event->>'livemode')::boolean, false);

  insert into public.stripe_events(id, event_type, livemode, stripe_created, object_id)
  values (v_id, v_type, v_livemode, v_created, left(v_obj->>'id', 100))
  on conflict (id) do nothing
  returning * into e;

  if not found then
    select * into e from public.stripe_events where id = v_id for update;
    if e.status in ('processed', 'ignored', 'deferred') then
      return jsonb_build_object('status', 'duplicate', 'event_id', v_id, 'previous_status', e.status);
    end if;
    update public.stripe_events
    set attempts = attempts + 1, status = 'processing', detail = null
    where id = v_id;
  end if;

  begin
    v_result := public.apply_stripe_event(v_type, v_created, v_livemode, v_obj);
  exception when others then
    get stacked diagnostics v_err = message_text;
    update public.stripe_events
    set status = 'failed', detail = left(v_err, 500)
    where id = v_id;
    return jsonb_build_object('status', 'failed', 'event_id', v_id, 'error', left(v_err, 500));
  end;

  update public.stripe_events
  set status = v_result->>'status',
      detail = left(v_result->>'detail', 500),
      order_id = nullif(v_result->>'order_id', '')::uuid,
      deferred = case when v_result->>'status' = 'deferred' then v_result->'deferred' end,
      processed_at = case when v_result->>'status' in ('processed', 'ignored') then now() end
  where id = v_id;

  return (v_result - 'deferred') || jsonb_build_object('event_id', v_id);
end;
$$;

drop function if exists public.refunds_due(integer);
create or replace function public.refunds_due(p_older_than_minutes integer default 5)
returns table (
  payment_id uuid,
  order_id uuid,
  payment_intent_id text,
  refundable_minor bigint,
  currency text,
  reason text,
  idempotency_key text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_trusted_caller() then raise exception 'Service role required'; end if;

  return query
  select p.id, p.order_id, p.stripe_payment_intent_id,
         public.stripe_major_to_minor(
           case when p.refund_reason = 'refund_failed'
                then least(p.refund_due_amount, p.amount - p.amount_refunded)
                else p.amount - p.amount_refunded end,
           p.currency),
         lower(p.currency), p.refund_reason,
         'refund_' || p.id::text || '_' || cardinality(p.failed_refund_ids)::text
  from public.order_payments p
  where p.refund_due
    and p.amount > p.amount_refunded
    and (p.refund_reason is distinct from 'refund_failed' or p.refund_due_amount > 0)
    and p.stripe_payment_intent_id is not null
    and p.updated_at <= now() - make_interval(mins => greatest(p_older_than_minutes, 0))
  order by p.created_at
  limit 200;
end;
$$;

create or replace function public.replay_deferred_stripe_refunds()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_trusted_caller() then raise exception 'Service role required'; end if;
  return public.stripe_replay_deferred_refunds_internal(null);
end;
$$;

do $cron$
begin
  if exists (select 1 from cron.job where jobname = 'stripe-reconcile') then
    perform cron.unschedule('stripe-reconcile');
  end if;
  perform cron.schedule('stripe-reconcile', '*/5 * * * *',
                        'select public.replay_deferred_stripe_refunds();');
end $cron$;

-- FINAL: 0022 §5 (symmetric guard).
create or replace function public.guard_online_order_paid()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_caller() then return new; end if;

  if new.is_paid and not old.is_paid and new.payment_method = 'online' then
    if not exists (
      select 1 from public.order_payments p
      where p.order_id = new.id
        and p.status in ('paid', 'partially_refunded')
        and not p.refund_due
        and p.amount_refunded < p.amount
    ) then
      raise exception 'Online orders are marked paid by Stripe payments only';
    end if;
    return new;
  end if;

  if not new.is_paid and old.is_paid and new.payment_method = 'online' then
    if not exists (
      select 1 from public.order_payments p
      where p.order_id = new.id and p.amount_refunded > 0
    ) then
      raise exception 'Cannot un-mark an online order as unpaid: no refunded payment exists for this order';
    end if;
    return new;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_online_order_paid() from public, anon, authenticated;

drop trigger if exists trg_orders_online_paid_guard on public.orders;
create trigger trg_orders_online_paid_guard
before update of is_paid on public.orders
for each row
when (new.is_paid is distinct from old.is_paid and new.payment_method = 'online')
execute function public.guard_online_order_paid();

revoke all on function public.stripe_currency_exponent(text) from public, anon, authenticated;
revoke all on function public.stripe_minor_to_major(bigint, text) from public, anon, authenticated;
revoke all on function public.stripe_major_to_minor(numeric, text) from public, anon, authenticated;
revoke all on function public.stripe_id_text(jsonb) from public, anon, authenticated;
revoke all on function public.stripe_order_ref(jsonb) from public, anon, authenticated;
revoke all on function public.order_checkout_amount(uuid) from public, anon, authenticated;
revoke all on function public.register_checkout_session(uuid, text, bigint, text, boolean, timestamptz)
  from public, anon, authenticated;
revoke all on function public.process_stripe_event(jsonb) from public, anon, authenticated;
revoke all on function public.refunds_due(integer) from public, anon, authenticated;
revoke all on function public.replay_deferred_stripe_refunds() from public, anon, authenticated;

revoke all on function public.stripe_apply_refund_internal(timestamptz, text, text, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.stripe_reverse_refund_internal(timestamptz, text, text, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.stripe_replay_deferred_refunds_internal(text)
  from public, anon, authenticated, service_role;
revoke all on function public.stripe_payment_success_internal(timestamptz, boolean, uuid, text, text, bigint, text)
  from public, anon, authenticated, service_role;
revoke all on function public.apply_stripe_event(text, timestamptz, boolean, jsonb)
  from public, anon, authenticated, service_role;

-- 0022 grants all five Stripe helpers to service_role; 0023 revokes the two
-- that live only inside SECURITY DEFINER. Final state: 0023's revokes.
grant execute on function public.stripe_currency_exponent(text) to service_role;
grant execute on function public.stripe_minor_to_major(bigint, text) to service_role;
grant execute on function public.stripe_major_to_minor(numeric, text) to service_role;
revoke execute on function public.stripe_id_text(jsonb) from service_role;
revoke execute on function public.stripe_order_ref(jsonb) from service_role;

grant execute on function public.order_checkout_amount(uuid) to service_role;
grant execute on function public.register_checkout_session(uuid, text, bigint, text, boolean, timestamptz)
  to service_role;
grant execute on function public.process_stripe_event(jsonb) to service_role;
grant execute on function public.refunds_due(integer) to service_role;
grant execute on function public.replay_deferred_stripe_refunds() to service_role;


-- ############################################################################
-- # 0018 — SECURE DEFAULTS
-- ############################################################################
drop policy if exists catalog_select_public on public.catalog_items;
revoke select on public.catalog_items from anon;

drop policy if exists chat_messages_owner_all on public.chat_messages;
drop policy if exists chat_messages_owner_select on public.chat_messages;
drop policy if exists chat_messages_owner_insert on public.chat_messages;
drop policy if exists chat_messages_owner_delete on public.chat_messages;

create policy chat_messages_owner_select on public.chat_messages
for select to authenticated
using (exists (select 1 from public.chats c
               where c.id = chat_id and c.user_id = (select public.requesting_user_id())));

create policy chat_messages_owner_insert on public.chat_messages
for insert to authenticated
with check (role = 'user' and exists (select 1 from public.chats c
               where c.id = chat_id and c.user_id = (select public.requesting_user_id())));

create policy chat_messages_owner_delete on public.chat_messages
for delete to authenticated
using (exists (select 1 from public.chats c
               where c.id = chat_id and c.user_id = (select public.requesting_user_id())));

revoke update on public.chat_messages from authenticated;

create or replace function public.is_trusted_caller()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt()->>'role','') = 'service_role'
      or (
        not (
          session_user in ('authenticator','anon','authenticated')
          or coalesce(nullif(current_setting('role', true), ''), 'none')
               in ('anon','authenticated','authenticator')
        )
        and session_user = any (
          string_to_array(
            replace(coalesce(nullif(current_setting('app.trusted_db_roles', true), ''),
                             'postgres,supabase_admin'), ' ', ''),
            ',')
        )
      );
$$;

create or replace function public.round_order_total_to_currency_units()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_currency text;
begin
  select bs.currency into v_currency from public.business_settings bs where bs.id;
  if public.stripe_currency_exponent(v_currency) = 0 then
    new.total_amount := round(new.total_amount);
    new.total_price := new.total_amount;
  end if;
  return new;
end;
$$;

revoke all on function public.round_order_total_to_currency_units() from public, anon, authenticated;

drop trigger if exists trg_zz_round_order_total on public.orders;
create trigger trg_zz_round_order_total
before insert or update of items, coupon_id, is_paid, status, subtotal_amount, discount_amount,
  total_amount, total_price, tax_amount, tax_rate_percent, tax_inclusive, delivery_fee_amount,
  tip_amount, stock_restored, refund_flagged_at, currency
on public.orders
for each row execute function public.round_order_total_to_currency_units();


-- ############################################################################
-- # 0019 — PRODUCTION HARDENING #1
-- ############################################################################
alter table public.orders
  add column if not exists currency text
  check (currency is null or currency ~ '^[A-Z]{3}$');

update public.orders o
set currency = coalesce(
  (select upper(bs.currency) from public.business_settings bs where bs.id),
  'USD')
where o.currency is null;

alter table public.orders alter column currency set not null;

-- FINAL: 0020 §1 removed the default and made the trigger authoritative.
-- The trigger is re-declared below with the business-currency snapshot.
create or replace function public.set_order_currency()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_currency text;
begin
  if tg_op = 'INSERT' then
    select upper(bs.currency) into v_currency from public.business_settings bs where bs.id;
    new.currency := coalesce(v_currency, 'USD');
  else
    new.currency := old.currency;
  end if;
  return new;
end;
$$;

revoke all on function public.set_order_currency() from public, anon, authenticated;

drop trigger if exists trg_orders_currency on public.orders;
create trigger trg_orders_currency
before insert or update of currency on public.orders
for each row execute function public.set_order_currency();

create or replace function public.format_money(p_amount numeric)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select to_char(
           p_amount,
           case when public.stripe_currency_exponent(
                     coalesce((select currency from public.business_settings where id), 'USD')
                   ) = 0
                then 'FM999999990'
                else 'FM999999990.00'
           end
         )
         || ' ' ||
         coalesce((select currency from public.business_settings where id), 'USD');
$$;

-- FINAL round trigger (0019 §3).
create or replace function public.round_order_total_to_currency_units()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_currency text := coalesce(new.currency, 'USD');
  v_exp integer := public.stripe_currency_exponent(v_currency);
begin
  if v_exp = 0 then
    new.subtotal_amount     := round(new.subtotal_amount);
    new.discount_amount     := round(new.discount_amount);
    new.tax_amount          := round(new.tax_amount);
    new.delivery_fee_amount := round(new.delivery_fee_amount);
    new.tip_amount          := round(new.tip_amount);
    new.total_amount        := round(new.total_amount);
    new.total_price         := new.total_amount;
  end if;
  return new;
end;
$$;

revoke all on function public.round_order_total_to_currency_units() from public, anon, authenticated;

drop trigger if exists trg_zz_round_order_total on public.orders;
create trigger trg_zz_round_order_total
before insert or update of items, coupon_id, is_paid, status, subtotal_amount, discount_amount,
  total_amount, total_price, tax_amount, tax_rate_percent, tax_inclusive, delivery_fee_amount,
  tip_amount, stock_restored, refund_flagged_at, currency
on public.orders
for each row execute function public.round_order_total_to_currency_units();

-- order_status_lookups is created earlier (0008) so RLS and privileges can be
-- applied in 0013 / 0015 on a fresh install.

-- FINAL: 0023 §3 (returns NULL when request.headers is unset).
create or replace function public.order_status_caller_key()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt()->>'sub', ''),
    case
      when nullif(current_setting('request.headers', true), '') is null then null
      else 'guest-h:' || substr(md5(current_setting('request.headers', true)), 1, 16)
    end
  );
$$;

revoke all on function public.order_status_caller_key() from public, anon, authenticated;
grant execute on function public.order_status_caller_key() to anon, authenticated, service_role;

-- FINAL: 0024 §C (NOTICE -> debug).
create or replace function public.get_order_status(p_order_id uuid)
returns table (
  is_paid boolean,
  payment_method text,
  status text
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  o record;
  v_owner boolean;
  v_ttl integer;
  v_hits integer;
  v_key text;
  v_bucket timestamptz;
  v_uid text := public.requesting_user_id();
begin
  select ord.user_id, ord.is_paid, ord.payment_method, ord.status, ord.created_at
  into o
  from public.orders ord
  where ord.id = p_order_id;

  if not found then return; end if;

  v_owner := public.is_trusted_caller()
          or public.is_admin_v2()
          or (o.user_id is not null and o.user_id = v_uid);

  if not v_owner then
    select order_status_link_ttl_hours into v_ttl
    from public.business_settings where id;

    if o.created_at < now() - make_interval(hours => coalesce(v_ttl, 48)) then return; end if;

    v_key := case
      when v_uid is not null then 'user:' || v_uid
      else coalesce('guest:' || public.order_status_caller_key(), 'guest:global')
    end;

    v_bucket := date_trunc('minute', now());

    insert into public.order_status_lookups(order_id, caller_key, bucket)
    values (p_order_id, v_key, v_bucket)
    on conflict (order_id, caller_key, bucket)
    do update set hits = public.order_status_lookups.hits + 1
    returning public.order_status_lookups.hits into v_hits;

    if v_hits > 60 then
      raise exception 'Too many status checks. Please wait a moment.' using errcode = '23514';
    end if;

    if v_key = 'guest:global' and v_hits = 1 then
      raise debug 'get_order_status: per-guest key unavailable; sharing the global bucket. '
                  'Configure pgrst.db_pre_request to fix.';
    end if;
  end if;

  return query select o.is_paid, o.payment_method, o.status;
end;
$$;

revoke all on function public.get_order_status(uuid) from public, anon, authenticated;
grant execute on function public.get_order_status(uuid) to anon, authenticated, service_role;

-- FINAL: 0024 §G indexes (idempotent; also created here for single-run installs).
create index if not exists idx_bookings_user_status_future
on public.bookings(user_id, status, booking_at)
where user_id is not null and status in ('pending','confirmed');

create index if not exists idx_notifications_user_unread_recent
on public.notifications(user_id, created_at desc)
where is_read = false;

create index if not exists idx_orders_user_status
on public.orders(user_id, status, created_at desc)
where user_id is not null;

create index if not exists idx_order_payments_refund_lookup
on public.order_payments(stripe_payment_intent_id)
where stripe_payment_intent_id is not null and refund_due = true;

create or replace function public.protect_business_settings()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'business_settings is a singleton; DELETE is not allowed';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'business_settings.id cannot change';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_business_settings() from public, anon, authenticated;

drop trigger if exists trg_business_settings_protect on public.business_settings;
create trigger trg_business_settings_protect
before update or delete on public.business_settings
for each row execute function public.protect_business_settings();

drop policy if exists business_settings_admin_update on public.business_settings;
drop policy if exists business_settings_admin_all on public.business_settings;

create policy business_settings_admin_all on public.business_settings
for all to authenticated
using ((select public.is_admin_v2())) with check ((select public.is_admin_v2()));

create unique index if not exists coupon_redemptions_active_order_coupon_uq
on public.coupon_redemptions(order_id, coupon_id)
where released_at is null;

-- FINAL: 0019 §14 (keep failed push deliveries 4x longer).
create or replace function public.cleanup_operational_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.business_settings%rowtype;
begin
  select * into s from public.business_settings where id;

  delete from public.webhook_events
  where processed_at is not null
    and processed_at < now() - make_interval(days => s.retention_log_days);

  delete from public.stripe_events
  where status in ('processed', 'ignored')
    and processed_at < now() - make_interval(days => s.retention_log_days);

  delete from public.push_delivery_log
  where status in ('sent', 'skipped_muted', 'skipped_no_subscription')
    and created_at < now() - make_interval(days => s.retention_log_days);

  delete from public.push_delivery_log
  where status = 'failed'
    and created_at < now() - make_interval(days => greatest(s.retention_log_days * 4, 30));

  delete from public.coupon_attempts where attempted_at < now() - interval '1 day';
  delete from public.game_plays where created_at < now() - interval '30 days';

  delete from public.notifications
  where is_read and created_at < now() - make_interval(days => s.retention_notification_days);

  perform set_config('app.audit_purge', 'on', true);
  delete from public.audit_log
  where occurred_at < now() - make_interval(days => s.retention_audit_days);
  perform set_config('app.audit_purge', 'off', true);

  delete from public.order_status_lookups where bucket < now() - interval '1 day';
end;
$$;

-- NOTE: api_surface_violations and ops_health are re-declared in 0022, 0023,
-- 0024. FINAL in 0024.

-- FINAL validate_order_integrity: 0019 §16 (currency snapshot on INSERT).
create or replace function public.validate_order_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trusted boolean := public.is_trusted_caller();
  v_admin boolean := public.is_admin_v2();
  s public.business_settings%rowtype;
  v_lines integer;
  v_valid_lines integer;
  v_qty integer;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_taxable numeric(12,2);
  v_tax numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_tip numeric(12,2);
  v_snapshot jsonb;
  v_coupon public.coupons%rowtype;
  v_user_uses integer;
begin
  if tg_op = 'UPDATE' then
    if not v_trusted then
      new.stock_restored := old.stock_restored;
      new.refund_flagged_at := old.refund_flagged_at;
    end if;

    if not v_trusted and not v_admin then
      new.is_paid := old.is_paid;
      new.status := old.status;
    end if;

    if not v_trusted and (
         new.items is distinct from old.items
      or new.coupon_id is distinct from old.coupon_id
      or new.subtotal_amount is distinct from old.subtotal_amount
      or new.discount_amount is distinct from old.discount_amount
      or new.tax_amount is distinct from old.tax_amount
      or new.tax_rate_percent is distinct from old.tax_rate_percent
      or new.tax_inclusive is distinct from old.tax_inclusive
      or new.delivery_fee_amount is distinct from old.delivery_fee_amount
      or new.tip_amount is distinct from old.tip_amount
      or new.total_amount is distinct from old.total_amount
      or new.total_price is distinct from old.total_price
    ) then
      raise exception
        'Order contents and amounts cannot be changed after creation; decline it and create a new order';
    end if;

    if new.status is distinct from old.status then
      if not v_trusted then
        if old.status in ('declined','refunded') then
          raise exception 'Order is % and its status can no longer change', old.status;
        end if;
        if old.status = 'completed' and new.status <> 'refunded' then
          raise exception 'A completed order can only be refunded';
        end if;
      end if;

      if new.status = 'declined' and old.status <> 'declined' and not old.stock_restored then
        new.stock_restored := true;
      end if;
    end if;

    if new.payment_method = 'online' and new.is_paid and new.status = 'declined'
       and old.refund_flagged_at is null then
      new.refund_required := true;
      new.refund_flagged_at := now();
    end if;

    return new;
  end if;

  if not v_trusted then
    new.is_paid := false;
    new.status := 'incoming';
    new.stock_restored := false;
    new.refund_required := false;
    new.refund_flagged_at := null;
  end if;

  select * into s from public.business_settings where id;

  new.currency := coalesce(new.currency, upper(s.currency), 'USD');

  if jsonb_typeof(new.items) <> 'array' then
    raise exception 'Order items must be a JSON array';
  end if;

  select count(*) into v_lines
  from jsonb_to_recordset(new.items) as x(item_id uuid, quantity integer);

  if v_lines = 0 then raise exception 'Order must contain at least one item'; end if;
  if v_lines > 100 then raise exception 'Too many order lines'; end if;

  with lines as (
    select x.item_id, x.quantity, ci.name, ci.numeric_price
    from jsonb_to_recordset(new.items) as x(item_id uuid, quantity integer)
    join public.catalog_items ci
      on ci.id = x.item_id and ci.is_active = true and ci.numeric_price > 0
    where x.quantity between 1 and 100
  )
  select count(*),
         coalesce(sum(quantity), 0),
         coalesce(sum(numeric_price * quantity), 0),
         coalesce(jsonb_agg(
           jsonb_build_object(
             'item_id', item_id,
             'quantity', quantity,
             'name', name,
             'unit_price', numeric_price,
             'line_total', round(numeric_price * quantity, 2)
           ) order by item_id
         ), '[]'::jsonb)
  into v_valid_lines, v_qty, v_subtotal, v_snapshot
  from lines;

  if v_valid_lines <> v_lines then
    raise exception 'One or more order items are invalid, unavailable, or have an invalid quantity';
  end if;

  v_subtotal := round(v_subtotal, 2);

  if new.coupon_id is not null then
    select * into v_coupon from public.coupons where id = new.coupon_id;

    if not found
       or not v_coupon.is_active
       or v_coupon.starts_at > now()
       or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
       or v_subtotal < v_coupon.min_order_amount
       or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit)
    then
      raise exception 'Coupon is invalid for this order';
    end if;

    if v_coupon.max_uses_per_user is not null then
      if new.user_id is null then
        raise exception 'This coupon requires a signed-in customer';
      end if;

      select count(*) into v_user_uses
      from public.coupon_redemptions cr
      where cr.coupon_id = v_coupon.id
        and cr.user_id = new.user_id
        and cr.released_at is null;

      if v_user_uses >= v_coupon.max_uses_per_user then
        raise exception 'Coupon already used the maximum number of times';
      end if;
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
    else
      v_discount := v_coupon.discount_value;
    end if;

    if v_coupon.max_discount_amount is not null then
      v_discount := least(v_discount, v_coupon.max_discount_amount);
    end if;

    v_discount := least(v_discount, v_subtotal);
  end if;

  v_taxable := v_subtotal - v_discount;

  if s.tax_rate_percent > 0 then
    if s.tax_inclusive then
      v_tax := round(v_taxable * s.tax_rate_percent / (100 + s.tax_rate_percent), 2);
    else
      v_tax := round(v_taxable * s.tax_rate_percent / 100, 2);
    end if;
  end if;

  if new.order_type = 'delivery' then
    v_delivery := s.delivery_fee;
    if s.free_delivery_threshold is not null and v_subtotal >= s.free_delivery_threshold then
      v_delivery := 0;
    end if;
  end if;

  v_tip := coalesce(new.tip_amount, 0);
  if v_tip > round(v_subtotal * s.max_tip_percent / 100, 2) then
    raise exception 'Tip exceeds the allowed maximum';
  end if;

  new.items := v_snapshot;
  new.subtotal_amount := v_subtotal;
  new.discount_amount := v_discount;
  new.tax_rate_percent := s.tax_rate_percent;
  new.tax_inclusive := s.tax_inclusive;
  new.tax_amount := v_tax;
  new.delivery_fee_amount := v_delivery;
  new.tip_amount := v_tip;
  new.total_amount := round(
    v_taxable + case when s.tax_inclusive then 0 else v_tax end + v_delivery + v_tip, 2
  );
  new.total_price := new.total_amount;

  return new;
end;
$$;

drop trigger if exists trg_validate_order_integrity on public.orders;
create trigger trg_validate_order_integrity
before insert or update of items,coupon_id,is_paid,status,subtotal_amount,discount_amount,
  total_amount,total_price,tax_amount,tax_rate_percent,tax_inclusive,delivery_fee_amount,tip_amount,stock_restored,refund_flagged_at,currency
on public.orders
for each row execute function public.validate_order_integrity();


-- ############################################################################
-- # 0020 — CURRENCY + CAPACITY FIXES
-- ############################################################################
-- FINAL: default dropped (the trigger is authoritative).
alter table public.orders alter column currency drop default;

-- Repair orders stamped with the wrong currency (no payment record yet).
do $$
declare
  v_business text;
  v_fixed bigint;
  v_kept bigint;
begin
  select upper(bs.currency) into v_business from public.business_settings bs where bs.id;
  v_business := coalesce(v_business, 'USD');

  alter table public.orders disable trigger trg_orders_currency;

  update public.orders o
  set currency = v_business
  where o.currency <> v_business
    and not exists (select 1 from public.order_payments p where p.order_id = o.id);
  get diagnostics v_fixed = row_count;

  alter table public.orders enable trigger trg_orders_currency;

  select count(*) into v_kept
  from public.orders o
  where o.currency <> v_business
    and exists (select 1 from public.order_payments p where p.order_id = o.id);

  raise notice 'orders re-stamped to %: %', v_business, v_fixed;
  if v_kept > 0 then
    raise notice '% order(s) have payment records in another currency; left untouched - review them manually', v_kept;
  end if;
end $$;


-- ############################################################################
-- # 0021 — catalog_items_public.created_at
-- ############################################################################
-- Already applied above (FINAL view definition in 0013).


-- ############################################################################
-- # 0022 — HARDENING #4
-- ############################################################################
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'coupons'
      and policyname = 'coupons_select_redeemable'
  ) then
    create policy coupons_select_redeemable on public.coupons
    for select to authenticated
    using (
      is_active
      and starts_at <= now()
      and (expires_at is null or expires_at > now())
      and (usage_limit is null or used_count < usage_limit)
    );
  end if;
end $$;

drop table if exists public.api_surface_expected;
-- (also created + dropped within 0019 for single-run installs; final state = gone.)


-- ############################################################################
-- # 0023 — HARDENING #5
-- ############################################################################
-- FINAL: catalog_items locked down (customers read only catalog_items_public).
drop policy if exists catalog_select_public on public.catalog_items;
revoke select on public.catalog_items from authenticated;

drop policy if exists coupons_select_redeemable on public.coupons;

-- FINAL: 0024 §B (uid guard).
create or replace function public.list_my_redeemable_coupons()
returns table (
  id uuid,
  code text,
  discount_type text,
  discount_value numeric(12,2),
  min_order_amount numeric(12,2),
  max_discount_amount numeric(12,2),
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  uid text := public.requesting_user_id();
begin
  if uid is null then raise exception 'Authentication required'; end if;

  return query
  select c.id, c.code, c.discount_type, c.discount_value,
         c.min_order_amount, c.max_discount_amount, c.expires_at
  from public.coupons c
  where c.is_active
    and c.starts_at <= now()
    and (c.expires_at is null or c.expires_at > now())
    and (c.usage_limit is null or c.used_count < c.usage_limit)
    and (
      c.max_uses_per_user is null
      or (
        select count(*)
        from public.coupon_redemptions cr
        where cr.coupon_id = c.id
          and cr.user_id = uid
          and cr.released_at is null
      ) < c.max_uses_per_user
    );
end;
$$;

revoke all on function public.list_my_redeemable_coupons() from public, anon, authenticated;
grant execute on function public.list_my_redeemable_coupons() to authenticated, service_role;

comment on column public.orders.currency is
  'Snapshot of business_settings.currency at insert time; immutable thereafter. '
  'Payments are validated against this, not the live setting.';


-- ############################################################################
-- # 0024 — WORLD-CLASS HARDENING
-- ############################################################################
-- FINAL admin catalog read.
--
-- This is deliberately a DEFINER-rights view (security_invoker = false): browser
-- roles hold no privilege on public.catalog_items (0023), so the view reads the
-- base table with its owner's rights and enforces admin-only access itself with
-- the WHERE gate below. A plain view without that gate (or with
-- security_invoker = true and no table grant) is wrong in one direction or the
-- other: the first leaks stock counts and Stripe ids to every signed-in user,
-- the second fails with "permission denied for table catalog_items".
--
-- security_barrier stops a caller-supplied (leaky) function in a query's WHERE
-- clause from being evaluated before the gate. The gate is an uncorrelated
-- subselect, so for non-admins the planner returns zero rows without scanning.
-- Supabase's advisor will flag this as a "security definer view"; that is the
-- intended design here and is covered by assert_production_ready().
create or replace view public.admin_catalog_items
with (security_invoker = false, security_barrier = true) as
select id, name, price, numeric_price, description, category, item_type,
       duration_minutes, media, is_popular, rating, stripe_product_id,
       stripe_price_id, requires_resource, track_stock, stock_quantity,
       is_active, created_at, updated_at
from public.catalog_items
where (select public.is_admin_v2());

revoke all on public.admin_catalog_items from public, anon, authenticated;
grant select on public.admin_catalog_items to authenticated;

-- Admin Stripe error triage.
create or replace function public.admin_stripe_events(
  p_status text default 'failed',
  p_limit integer default 50
)
returns table (
  id text,
  event_type text,
  status text,
  detail text,
  attempts integer,
  order_id uuid,
  received_at timestamptz,
  processed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin_v2() and not public.is_trusted_caller() then
    raise exception 'Admin only';
  end if;

  return query
  select e.id, e.event_type, e.status, e.detail, e.attempts,
         e.order_id, e.received_at, e.processed_at
  from public.stripe_events e
  where (p_status is null or e.status = p_status)
  order by e.received_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 500));
end;
$$;

revoke all on function public.admin_stripe_events(text, integer)
  from public, anon, authenticated;
grant execute on function public.admin_stripe_events(text, integer)
  to authenticated, service_role;

-- FINAL api_surface_violations: includes admin_catalog_items + new RPCs.
create or replace function public.api_surface_violations()
returns table (kind text, object_name text, detail text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_relations text[] := array[
    'audit_log', 'bookings', 'business_locations', 'business_settings',
    'cart_items', 'catalog_items', 'chat_messages', 'chats',
    'clerk_user_sync_state', 'coupon_attempts', 'coupon_redemptions',
    'coupons', 'favorites', 'game_plays', 'game_rewards', 'knowledge_base',
    'location_closures', 'location_opening_hours', 'notification_settings',
    'notifications', 'order_payments', 'order_status_lookups', 'orders',
    'profiles', 'push_delivery_log', 'push_subscriptions', 'resources',
    'reviews', 'stripe_events', 'user_claimed_rewards', 'webhook_events',
    'api_surface_exceptions',
    'catalog_item_review_stats', 'catalog_item_public_reviews',
    'game_rewards_public', 'business_public_settings',
    'catalog_items_public', 'admin_catalog_items'
  ];
  c_anon_fn text[] := array[
    'requesting_user_id', 'is_service_role', 'is_admin_v2',
    'is_trusted_caller', 'get_order_status', 'order_status_caller_key'
  ];
  c_auth_fn text[] := array[
    'requesting_user_id', 'is_service_role', 'is_admin_v2',
    'is_trusted_caller', 'get_order_status', 'order_status_caller_key',
    'is_allowed_push_endpoint', 'claim_push_subscription',
    'claim_game_reward', 'mark_notification_read', 'match_knowledge',
    'ensure_my_profile', 'validate_coupon_code', 'swap_location_display_order',
    'admin_set_user_role', 'ops_health', 'export_my_data',
    'list_my_redeemable_coupons', 'admin_stripe_events',
    'assert_production_ready'
  ];
  c_protected_profile_cols text[] := array[
    'role', 'has_claimed_welcome_reward', 'full_name', 'username',
    'email', 'phone', 'avatar_url'
  ];
  c_protected_payment_cols text[] := array[
    'stripe_checkout_session_id', 'stripe_payment_intent_id',
    'stripe_charge_id', 'refund_due_amount', 'failed_refund_ids',
    'dispute_id', 'dispute_status', 'last_refund_event_at',
    'last_dispute_event_at', 'livemode'
  ];
begin
  if not public.is_admin_v2() and not public.is_trusted_caller() then
    raise exception 'Admin only';
  end if;

  return query
  select 'table_without_rls'::text, c.relname::text,
         'anon/authenticated hold privileges but row level security is OFF'::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity
    and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
    and (has_table_privilege('anon', c.oid, 'select,insert,update,delete')
         or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete'));

  return query
  select 'unreviewed_relation'::text, c.relname::text,
         ('relkind ' || c.relkind::text ||
          ' is reachable by anon/authenticated and is not part of the template; ' ||
          'revoke it or record a reason in public.api_surface_exceptions')::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'm', 'f')
    and c.relname <> all (c_relations)
    and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
    and not exists (select 1 from public.api_surface_exceptions e
                    where e.object_kind = 'relation' and e.object_name = c.relname)
    and (has_table_privilege('anon', c.oid, 'select,insert,update,delete')
         or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete'));

  return query
  select 'function_exposed_to_anon'::text, p.oid::regprocedure::text,
         'SECURITY DEFINER function is executable by anon (directly or through PUBLIC)'::text
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
    and p.proname <> all (c_anon_fn)
    and has_function_privilege('anon', p.oid, 'execute')
    and not exists (select 1 from public.api_surface_exceptions e
                    where e.object_kind = 'function' and e.object_name = p.proname);

  return query
  select 'function_exposed_to_authenticated'::text, p.oid::regprocedure::text,
         'SECURITY DEFINER function is executable by signed-in users (directly or through PUBLIC)'::text
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
    and p.proname <> all (c_auth_fn)
    and has_function_privilege('authenticated', p.oid, 'execute')
    and not exists (select 1 from public.api_surface_exceptions e
                    where e.object_kind = 'function' and e.object_name = p.proname);

  return query
  select 'sensitive_table_exposed'::text, (x.role_name || ' -> ' || x.rel)::text,
         'a browser role can read a table that must stay private'::text
  from (values
    ('anon','coupons'), ('anon','game_rewards'), ('anon','orders'),
    ('anon','profiles'), ('anon','reviews'), ('anon','audit_log'),
    ('anon','business_settings'), ('anon','order_payments'),
    ('anon','stripe_events'), ('anon','catalog_items'),
    ('authenticated','webhook_events'), ('authenticated','game_plays'),
    ('authenticated','coupon_attempts'), ('authenticated','clerk_user_sync_state'),
    ('authenticated','api_surface_exceptions'), ('authenticated','stripe_events'),
    ('authenticated','catalog_items')
  ) as x(role_name, rel)
  where to_regclass('public.' || x.rel) is not null
    and has_table_privilege(x.role_name, ('public.' || x.rel)::regclass, 'select');

  return query
  select 'profile_column_writable'::text, ('profiles.' || col)::text,
         'customers must not be able to write this column'::text
  from unnest(c_protected_profile_cols) as col
  where has_column_privilege('authenticated', 'public.profiles', col, 'update');

  return query
  select 'payment_column_readable'::text, ('order_payments.' || col)::text,
         'a browser role can read a Stripe-bookkeeping column from order_payments'::text
  from unnest(c_protected_payment_cols) as col
  where has_column_privilege('authenticated', 'public.order_payments', col, 'select');

  return query
  select 'order_status_contract'::text, 'get_order_status(uuid)'::text,
         ('return type changed: ' ||
          pg_get_function_result('public.get_order_status(uuid)'::regprocedure))::text
  where pg_get_function_result('public.get_order_status(uuid)'::regprocedure)
        is distinct from 'TABLE(is_paid boolean, payment_method text, status text)';
end;
$$;

revoke all on function public.api_surface_violations() from public, anon, authenticated;
grant execute on function public.api_surface_violations() to service_role;

-- FINAL ops_health: adds stripe error text + 5-cron check + API drift.
create or replace function public.ops_health()
returns table (check_name text, ok boolean, detail text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_n bigint;
  v_total bigint;
  v_failed bigint;
  v_err text;
begin
  if not public.is_admin_v2() and not public.is_trusted_caller() then
    raise exception 'Admin only';
  end if;

  select count(*) into v_n
  from cron.job
  where active and jobname in (
    'booking-reminders','expire-unpaid-orders','expire-stale-bookings',
    'operational-cleanup','stripe-reconcile');
  return query select 'cron_jobs_active'::text, v_n = 5,
                      v_n::text || ' of 5 scheduled jobs are active';

  select count(*) into v_n
  from cron.job_run_details d
  where d.status = 'failed' and d.start_time > now() - interval '24 hours';
  return query select 'cron_failures_24h'::text, v_n = 0,
                      v_n::text || ' failed job runs in the last 24h';

  select count(*) into v_n from public.orders where refund_required;
  return query select 'refund_backlog'::text, v_n = 0,
                      v_n::text || ' paid orders need a refund';

  select count(*) into v_n
  from public.orders where status = 'incoming' and created_at < now() - interval '2 hours';
  return query select 'stale_incoming_orders'::text, v_n = 0,
                      v_n::text || ' orders unactioned for over 2h';

  select count(*) filter (where status = 'failed'), count(*)
  into v_failed, v_total
  from public.push_delivery_log where created_at > now() - interval '1 hour';
  return query select 'push_failure_rate_1h'::text,
                      (v_total < 10 or v_failed::numeric / v_total < 0.1),
                      v_failed::text || ' failed of ' || v_total::text || ' push deliveries in the last hour';

  if to_regclass('net._http_response') is not null then
    execute 'select count(*) from net._http_response
             where created > now() - interval ''1 hour''
               and (status_code is null or status_code >= 400)' into v_n;
    return query select 'webhook_failures_1h'::text, v_n = 0,
                        v_n::text || ' failed Database Webhook calls in the last hour';
  end if;

  select count(*) into v_n from public.stripe_events where status = 'failed';
  -- Qualified: `detail` is also an OUT column of this function, so an unqualified
  -- reference raises 42702 (ambiguous column reference) at run time.
  select coalesce(string_agg(distinct left(e.detail, 120), ' | '), '')
  into v_err
  from public.stripe_events e
  where e.status = 'failed' and e.received_at > now() - interval '24 hours';
  return query select 'stripe_events_failed'::text, v_n = 0,
                      v_n::text || ' failed'
                      || case when v_err <> '' then ' — ' || v_err else '' end;

  select count(*) into v_n
  from public.stripe_events
  where status = 'deferred' and received_at < now() - interval '1 hour';
  return query select 'stripe_events_deferred'::text, v_n = 0,
                      v_n::text || ' Stripe refund events waiting over 1h for their payment';

  select count(*) into v_n from public.order_payments where refund_due;
  return query select 'stripe_refunds_due'::text, v_n = 0,
                      v_n::text || ' Stripe payments must be refunded';

  select count(*) into v_n from public.api_surface_violations();
  return query select 'api_surface_drift'::text, v_n = 0,
                      v_n::text || ' unreviewed exposures';
end;
$$;

revoke all on function public.ops_health() from public, anon, authenticated;
grant execute on function public.ops_health() to authenticated, service_role;

-- assert_production_ready: single call, every invariant.
create or replace function public.assert_production_ready()
returns table (check_name text, ok boolean, detail text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_n bigint;
  v_arr text[];
begin
  if not public.is_admin_v2() and not public.is_trusted_caller() then
    raise exception 'Admin only';
  end if;

  return query
  select 'rls_enabled_on_template_tables'::text,
         not exists (
           select 1 from pg_class c
           join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public'
             and c.relkind in ('r','p')
             and c.relname = any (array[
               'audit_log','bookings','business_locations','business_settings',
               'cart_items','catalog_items','chat_messages','chats',
               'clerk_user_sync_state','coupon_attempts','coupon_redemptions',
               'coupons','favorites','game_plays','game_rewards','knowledge_base',
               'location_closures','location_opening_hours','notification_settings',
               'notifications','order_payments','order_status_lookups','orders',
               'profiles','push_delivery_log','push_subscriptions','resources',
               'reviews','stripe_events','user_claimed_rewards','webhook_events'
             ])
             and not c.relrowsecurity
             and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
         ),
         'every template table has RLS on';

  return query
  select 'sensitive_tables_not_readable_by_browser_roles'::text,
         not exists (
           select 1 from (values
             ('anon','coupons'), ('anon','game_rewards'), ('anon','orders'),
             ('anon','profiles'), ('anon','reviews'), ('anon','audit_log'),
             ('anon','business_settings'), ('anon','order_payments'),
             ('anon','stripe_events'), ('anon','catalog_items'),
             ('authenticated','webhook_events'),
             ('authenticated','game_plays'),
             ('authenticated','coupon_attempts'),
             ('authenticated','clerk_user_sync_state'),
             ('authenticated','api_surface_exceptions'),
             ('authenticated','stripe_events'),
             ('authenticated','catalog_items')
           ) as x(role_name, rel)
           where to_regclass('public.' || x.rel) is not null
             and has_table_privilege(x.role_name, ('public.' || x.rel)::regclass, 'select')
         ),
         'no sensitive base table is readable by a browser role';

  return query
  select 'stripe_checkout_chain'::text,
         has_function_privilege('service_role','public.stripe_currency_exponent(text)','execute')
         and has_function_privilege('service_role','public.stripe_minor_to_major(bigint,text)','execute')
         and has_function_privilege('service_role','public.stripe_major_to_minor(numeric,text)','execute')
         and has_function_privilege('service_role','public.order_checkout_amount(uuid)','execute')
         and has_function_privilege('service_role','public.register_checkout_session(uuid,text,bigint,text,boolean,timestamptz)','execute'),
         'service_role can call every function in the online-checkout chain';

  return query
  select 'stripe_internals_not_callable_by_browser_roles'::text,
         not exists (
           select 1 from unnest(array[
             'public.stripe_id_text(jsonb)',
             'public.stripe_order_ref(jsonb)',
             'public.process_stripe_event(jsonb)',
             'public.apply_stripe_event(text,timestamptz,boolean,jsonb)',
             'public.stripe_payment_success_internal(timestamptz,boolean,uuid,text,text,bigint,text)',
             'public.stripe_reverse_refund_internal(timestamptz,text,text,bigint)',
             'public.stripe_apply_refund_internal(timestamptz,text,text,bigint)'
           ]) as sig
           where has_function_privilege('anon', sig, 'execute')
              or has_function_privilege('authenticated', sig, 'execute')
         ),
         'Stripe internals are reachable only via SECURITY DEFINER entry points';

  return query
  select 'get_order_status_contract'::text,
         pg_get_function_result('public.get_order_status(uuid)'::regprocedure)
           is not distinct from 'TABLE(is_paid boolean, payment_method text, status text)',
         coalesce('return type: ' || pg_get_function_result('public.get_order_status(uuid)'::regprocedure),
                  'function missing');

  return query
  select 'coupons_not_directly_readable'::text,
         not exists (
           select 1 from pg_policies
           where schemaname = 'public' and tablename = 'coupons'
             and policyname = 'coupons_select_redeemable'
         )
         and not has_table_privilege('anon','public.coupons','select'),
         'coupons are reachable only via validate_coupon_code() / list_my_redeemable_coupons()';

  select array_agg(tgname::text order by tgname::text) into v_arr
  from pg_trigger
  where tgrelid = 'public.bookings'::regclass
    and tgname::text like 'trg_bookings_%'
    and not tgisinternal;
  return query
  select 'bookings_trigger_order'::text,
         v_arr is not distinct from array[
           'trg_bookings_1_timestamp','trg_bookings_2_rules',
           'trg_bookings_3_capacity','trg_bookings_9_updated_at'
         ]::text[],
         coalesce(v_arr::text, 'no triggers');

  select count(*) into v_n
  from cron.job
  where active
    and jobname in ('booking-reminders','expire-unpaid-orders',
                    'expire-stale-bookings','operational-cleanup',
                    'stripe-reconcile');
  return query select 'cron_jobs_active'::text, v_n = 5, v_n::text || ' of 5 scheduled jobs are active';

  select count(*) into v_n
  from public.stripe_events
  where status = 'failed' and received_at < now() - interval '1 hour';
  return query select 'stripe_events_failed_old'::text, v_n = 0, v_n::text || ' Stripe events failed > 1h ago';

  select count(*) into v_n
  from public.stripe_events
  where status = 'deferred' and received_at < now() - interval '1 hour';
  return query select 'stripe_events_deferred_old'::text, v_n = 0, v_n::text || ' Stripe events deferred > 1h ago';

  select count(*) into v_n from public.api_surface_violations();
  return query select 'api_surface_clean'::text, v_n = 0, v_n::text || ' unreviewed exposures';

  return query
  select 'admin_catalog_view_gated'::text,
         coalesce((
           select not coalesce(c.reloptions @> array['security_invoker=true'], false)
              and pg_get_viewdef(c.oid) ilike '%is_admin_v2%'
              and not has_table_privilege('anon', c.oid, 'select')
           from pg_class c
           where c.oid = to_regclass('public.admin_catalog_items')
         ), false),
         'admin_catalog_items is definer-rights, gated by is_admin_v2(), and closed to anon';

  return query
  select 'profiles_role_protected'::text,
         not has_column_privilege('authenticated','public.profiles','role','update')
         and not has_column_privilege('authenticated','public.profiles','has_claimed_welcome_reward','update'),
         'customers cannot change role or welcome-reward flag';
end;
$$;

revoke all on function public.assert_production_ready() from public, anon, authenticated;
grant execute on function public.assert_production_ready() to authenticated, service_role;

-- Final assertion block: fails the transaction if any invariant is broken.
do $$
declare
  v_failed text[];
  v_count bigint;
  v_order text[];
begin
  select array_agg(check_name || ': ' || detail)
  into v_failed
  from public.assert_production_ready()
  where not ok;

  if v_failed is not null and array_length(v_failed, 1) > 0 then
    raise exception 'Production readiness checks failed: %', array_to_string(v_failed, '; ');
  end if;

  select count(*) into v_count
  from public.bookings where booking_at is null or booking_range is null;
  if v_count <> 0 then
    raise exception 'Production invariant failed: % bookings have null booking_at/booking_range', v_count;
  end if;

  select array_agg(tgname::text order by tgname::text) into v_order
  from pg_trigger
  where tgrelid = 'public.bookings'::regclass
    and tgname::text like 'trg_bookings_%' and not tgisinternal;
  if v_order is distinct from array[
    'trg_bookings_1_timestamp','trg_bookings_2_rules',
    'trg_bookings_3_capacity','trg_bookings_9_updated_at'
  ]::text[] then
    raise exception 'Final booking trigger order invalid: %', v_order;
  end if;

  if pg_get_function_result('public.get_order_status(uuid)'::regprocedure)
       is distinct from 'TABLE(is_paid boolean, payment_method text, status text)' then
    raise exception 'get_order_status() return type changed: %',
      pg_get_function_result('public.get_order_status(uuid)'::regprocedure);
  end if;
end $$;


-- ############################################################################
-- # 0025 - admin_catalog_items behavioral probe
-- ############################################################################
-- Proves the view's gate with real role switches, then rolls every probe row
-- back (the sentinel exception undoes the inserts AND the SET LOCALs). If the
-- migration role may not SET ROLE, the probe is skipped with a notice; the
-- structural check in assert_production_ready() still runs.
do $$
declare
  v_non_admin bigint := -1;
  v_admin bigint := -1;
begin
  begin
    insert into public.catalog_items(name, numeric_price) values ('__gate_probe__', 1);
    insert into public.profiles(id, role) values ('__gate_probe_admin__', 'admin');

    set local role authenticated;

    perform set_config('request.jwt.claims',
      '{"sub":"__gate_probe_nobody__","role":"authenticated"}', true);
    select count(*) into v_non_admin from public.admin_catalog_items;

    perform set_config('request.jwt.claims',
      '{"sub":"__gate_probe_admin__","role":"authenticated"}', true);
    select count(*) into v_admin from public.admin_catalog_items;

    reset role;
    raise exception '__gate_probe_rollback__';
  exception
    when raise_exception then
      if sqlerrm <> '__gate_probe_rollback__' then
        raise notice 'admin_catalog_items probe skipped: %', sqlerrm;
      end if;
    when others then
      raise notice 'admin_catalog_items probe skipped: %', sqlerrm;
  end;

  if v_non_admin > 0 then
    raise exception 'SECURITY: admin_catalog_items is readable by non-admin users (% rows)', v_non_admin;
  end if;
  if v_admin = 0 then
    raise exception 'admin_catalog_items returned no rows for an admin user';
  end if;
  if v_non_admin = -1 then
    raise notice 'admin_catalog_items gate probe did not run; verify manually after deploy';
  end if;
end $$;


-- ############################################################################
-- # SEED
-- ############################################################################
-- Edit the identity block before the first run. Re-runs never overwrite your
-- edits (guarded by `business_name = 'Your Business Name'`).

update public.business_settings
set business_name = 'Your Business Name',
    business_type = 'cafe',
    currency      = 'USD'
where id = true
  and business_name = 'Your Business Name';

insert into public.coupons(code, discount_type, discount_value, max_uses_per_user)
values ('WELCOME10', 'percentage', 10, 1)
on conflict (code) do nothing;

insert into public.game_rewards(reward_key, title, promo_code, discount_value, description)
values (
  'welcome_reward', 'Welcome Reward', 'WELCOME10', '10%',
  'Welcome reward for new customers — edit or remove in admin settings.'
)
on conflict (reward_key) do nothing;

-- First admin (run after the person has signed in once):
--   update public.profiles set role = 'admin' where id = '<clerk user id>';
-- Afterwards manage roles with rpc('admin_set_user_role').

commit;

-- ============================================================================
-- AFTER DEPLOY — run these:
--
--   select * from public.assert_production_ready();   -- every ok = true
--   select * from public.ops_health();                -- every ok = true
--   select * from public.api_surface_violations();    -- empty
--
-- Admin catalog:   select * from public.admin_catalog_items;   -- admin JWT only; zero rows otherwise
-- Stripe triage:   select * from public.admin_stripe_events('failed', 50);
-- ============================================================================