-- ReadRise — Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/_/sql

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type subscription_tier as enum ('free', 'reader', 'bibliophile');
create type subscription_status as enum ('active', 'canceled', 'past_due', 'trialing');
create type shelf as enum ('reading', 'want_to_read', 'finished', 'abandoned');
create type book_format as enum ('physical', 'ebook', 'audiobook');
create type goal_type as enum ('book_count');

-- ─── Users ───────────────────────────────────────────────────────────────────

create table public.users (
  id                  uuid primary key default uuid_generate_v4(),
  auth_id             uuid not null unique references auth.users(id) on delete cascade,
  email               text not null unique,
  display_name        text not null,
  avatar_url          text,
  subscription_tier   subscription_tier not null default 'free',
  subscription_status subscription_status not null default 'active',
  stripe_customer_id  text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Books ───────────────────────────────────────────────────────────────────

create table public.books (
  id              uuid primary key default uuid_generate_v4(),
  google_books_id text not null unique,
  isbn_10         text,
  isbn_13         text,
  title           text not null,
  subtitle        text,
  authors         text[] not null default '{}',
  description     text,
  cover_url       text,
  page_count      integer,
  genres          text[] not null default '{}',
  published_date  date,
  publisher       text,
  language        text,
  created_at      timestamptz not null default now()
);

-- ─── User Books ──────────────────────────────────────────────────────────────

create table public.user_books (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  book_id        uuid not null references public.books(id) on delete restrict,
  shelf          shelf not null,
  format         book_format not null default 'physical',
  started_at     date,
  finished_at    date,
  abandoned_at   date,
  reread_number  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(user_id, book_id, reread_number)
);

-- ─── Progress Entries ────────────────────────────────────────────────────────

create table public.progress_entries (
  id           uuid primary key default uuid_generate_v4(),
  user_book_id uuid not null references public.user_books(id) on delete cascade,
  page         integer not null,
  percent      double precision not null,
  logged_at    timestamptz not null default now(),
  note         text
);

-- ─── Reading Sessions ────────────────────────────────────────────────────────

create table public.reading_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_book_id     uuid not null references public.user_books(id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_seconds integer,
  pages_start      integer,
  pages_end        integer,
  pages_read       integer,
  pages_per_hour   double precision,
  note             text
);

-- ─── Reviews ─────────────────────────────────────────────────────────────────

create table public.reviews (
  id           uuid primary key default uuid_generate_v4(),
  user_book_id uuid not null unique references public.user_books(id) on delete cascade,
  rating       double precision not null,
  body         text,
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── User Goals ──────────────────────────────────────────────────────────────

create table public.user_goals (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  year       integer not null,
  goal_type  goal_type not null default 'book_count',
  target     integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, year, goal_type)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index on public.user_books(user_id);
create index on public.user_books(book_id);
create index on public.user_books(shelf);
create index on public.progress_entries(user_book_id);
create index on public.reading_sessions(user_book_id);
create index on public.reading_sessions(started_at);
create index on public.reviews(user_book_id);
create index on public.user_goals(user_id, year);

-- ─── Trigger: auto-create users row on signup ────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (auth_id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.progress_entries enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.reviews enable row level security;
alter table public.user_goals enable row level security;

-- books: public read, authenticated insert
create policy "books_select" on public.books for select using (true);
create policy "books_insert" on public.books for insert with check (auth.role() = 'authenticated');

-- users: own row only
create policy "users_select" on public.users for select using (auth_id = auth.uid());
create policy "users_update" on public.users for update using (auth_id = auth.uid());

-- helper: get internal user id from auth id
create or replace function public.my_user_id()
returns uuid as $$
  select id from public.users where auth_id = auth.uid()
$$ language sql stable security definer;

-- user_books
create policy "ub_select" on public.user_books for select using (user_id = public.my_user_id());
create policy "ub_insert" on public.user_books for insert with check (user_id = public.my_user_id());
create policy "ub_update" on public.user_books for update using (user_id = public.my_user_id());
create policy "ub_delete" on public.user_books for delete using (user_id = public.my_user_id());

-- progress_entries
create policy "pe_select" on public.progress_entries for select using (
  user_book_id in (select id from public.user_books where user_id = public.my_user_id())
);
create policy "pe_insert" on public.progress_entries for insert with check (
  user_book_id in (select id from public.user_books where user_id = public.my_user_id())
);

-- reading_sessions
create policy "rs_all" on public.reading_sessions for all using (
  user_book_id in (select id from public.user_books where user_id = public.my_user_id())
);

-- reviews
create policy "rev_all" on public.reviews for all using (
  user_book_id in (select id from public.user_books where user_id = public.my_user_id())
);

-- user_goals
create policy "ug_all" on public.user_goals for all using (user_id = public.my_user_id());
