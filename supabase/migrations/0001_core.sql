-- miss_beaute core schema — PostgreSQL / Supabase
create extension if not exists pgcrypto;
create type public.event_status as enum ('draft','scheduled','open','closed','published');
create type public.payment_status as enum ('pending','paid','failed','refunded','disputed');
create type public.admin_role as enum ('super_admin','manager','accountant','reader');

create table public.events (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 description text not null default '', poster_url text, starts_at timestamptz, ends_at timestamptz,
 vote_price_xaf integer not null default 100 check(vote_price_xaf>0), min_votes integer not null default 1 check(min_votes>0),
 max_votes integer not null default 5000 check(max_votes>=min_votes), status public.event_status not null default 'draft',
 ranking_visible boolean not null default true, revenue_goal_xaf bigint, platform_fee_bps integer not null default 0 check(platform_fee_bps between 0 and 10000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.candidates (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete restrict,
 name text not null, slug text not null, candidate_number integer not null check(candidate_number>0), bio text not null default '',
 cover_url text, gallery jsonb not null default '[]'::jsonb, display_order integer not null default 0,
 active boolean not null default true, created_at timestamptz not null default now(),
 unique(event_id,slug), unique(event_id,candidate_number)
);
create table public.pricing_tiers (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 min_paid_votes integer not null check(min_paid_votes>0), bonus_votes integer not null check(bonus_votes>0), active boolean not null default true,
 unique(event_id,min_paid_votes)
);
create table public.sponsors (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 name text not null, logo_url text, website_url text, display_order integer not null default 0, active boolean not null default true
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete restrict,
 candidate_id uuid not null references public.candidates(id) on delete restrict, provider text not null,
 provider_reference text not null unique, idempotency_key text not null unique, status public.payment_status not null default 'pending',
 paid_votes integer not null check(paid_votes>0), bonus_votes integer not null default 0 check(bonus_votes>=0),
 amount_xaf bigint not null check(amount_xaf>0), currency char(3) not null default 'XAF' check(currency='XAF'),
 operator text, phone_ciphertext text, phone_fingerprint text, voter_label text, anonymous boolean not null default false,
 ip_fingerprint text, created_at timestamptz not null default now(), paid_at timestamptz,
 check ((status='paid' and paid_at is not null) or status<>'paid')
);
create index transactions_event_created on public.transactions(event_id,created_at desc);
create index transactions_candidate on public.transactions(candidate_id,created_at desc);
create table public.vote_ledger (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete restrict,
 candidate_id uuid not null references public.candidates(id) on delete restrict,
 transaction_id uuid references public.transactions(id) on delete restrict,
 delta_votes integer not null check(delta_votes<>0), entry_kind text not null check(entry_kind in ('purchase','bonus','reversal','adjustment')),
 created_at timestamptz not null default now(), unique(transaction_id,entry_kind)
);
create index vote_ledger_candidate on public.vote_ledger(candidate_id,created_at);
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade, display_name text not null,
 role public.admin_role not null default 'reader', totp_enrolled_at timestamptz, active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.audit_logs (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null,
 entity_type text not null, entity_id text, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.login_logs (
 id bigint generated always as identity primary key, user_id uuid references auth.users(id), success boolean not null,
 ip_fingerprint text, user_agent text, created_at timestamptz not null default now()
);
create table public.blocklist (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('phone_fingerprint','ip_fingerprint')),
 value_hash text not null unique, reason text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.analytics_events (
 id bigint generated always as identity primary key, event_id uuid references public.events(id), candidate_id uuid references public.candidates(id),
 kind text not null check(kind in ('page_view','candidate_view','checkout_started','payment_success','share')),
 session_hash text, utm_source text, device text, region text, created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true and a.totp_enrolled_at is not null);
$$;
create or replace function public.has_role(allowed public.admin_role[]) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true and a.totp_enrolled_at is not null and a.role=any(allowed));
$$;
-- Audit and ledger are append-only, including for application-level admin sessions.
create or replace function public.reject_immutable_change() returns trigger language plpgsql as $$ begin raise exception 'append-only table'; end $$;
create trigger ledger_immutable before update or delete on public.vote_ledger for each row execute function public.reject_immutable_change();
create trigger audit_immutable before update or delete on public.audit_logs for each row execute function public.reject_immutable_change();

alter table public.events enable row level security;
alter table public.candidates enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.sponsors enable row level security;
alter table public.transactions enable row level security;
alter table public.vote_ledger enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_logs enable row level security;
alter table public.blocklist enable row level security;
alter table public.analytics_events enable row level security;
create policy events_public_read on public.events for select to anon,authenticated using (status in ('open','closed','published'));
create policy candidates_public_read on public.candidates for select to anon,authenticated using (active=true and exists(select 1 from public.events e where e.id=event_id and e.status in ('open','closed','published')));
create policy tiers_public_read on public.pricing_tiers for select to anon,authenticated using (active=true and exists(select 1 from public.events e where e.id=event_id and e.status='open'));
create policy sponsors_public_read on public.sponsors for select to anon,authenticated using (active=true and exists(select 1 from public.events e where e.id=event_id and e.status in ('open','closed','published')));
create policy events_admin_manage on public.events for all to authenticated using (public.has_role(array['super_admin','manager']::public.admin_role[])) with check(public.has_role(array['super_admin','manager']::public.admin_role[]));
create policy candidate_admin_manage on public.candidates for all to authenticated using (public.has_role(array['super_admin','manager']::public.admin_role[])) with check(public.has_role(array['super_admin','manager']::public.admin_role[]));
create policy tier_admin_manage on public.pricing_tiers for all to authenticated using (public.has_role(array['super_admin','manager']::public.admin_role[])) with check(public.has_role(array['super_admin','manager']::public.admin_role[]));
create policy sponsor_admin_manage on public.sponsors for all to authenticated using (public.has_role(array['super_admin','manager']::public.admin_role[])) with check(public.has_role(array['super_admin','manager']::public.admin_role[]));
create policy admin_profile_read on public.admin_users for select to authenticated using (user_id=auth.uid() or public.has_role(array['super_admin']::public.admin_role[]));
create policy transactions_finance_read on public.transactions for select to authenticated using (public.has_role(array['super_admin','accountant']::public.admin_role[]));
create policy ledger_finance_read on public.vote_ledger for select to authenticated using (public.has_role(array['super_admin','accountant','reader','manager']::public.admin_role[]));
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.has_role(array['super_admin','reader']::public.admin_role[]));
-- Deliberately no anon/authenticated write policy on votes, transactions, audit, or analytics.
revoke all on public.transactions,public.vote_ledger,public.audit_logs,public.login_logs,public.blocklist from anon,authenticated;
grant select on public.events,public.candidates,public.pricing_tiers,public.sponsors to anon,authenticated;
revoke insert,update,delete on public.events,public.candidates,public.pricing_tiers,public.sponsors from anon,authenticated;

grant select on public.admin_users,public.transactions,public.vote_ledger,public.audit_logs to authenticated;
