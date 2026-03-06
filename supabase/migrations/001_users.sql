-- ============================================
-- TheCommonRoom: Users table + auth trigger
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone text unique not null,
  role text default 'user' check (role in ('user', 'admin')),
  total_points integer default 0,
  rounds_played integer default 0,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

-- Users can read their own row
create policy "Users can read own row" on public.users
  for select using (auth.uid() = id);

-- Users can update their own row
create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);

-- 2. Trigger: auto-create public.users row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, full_name, email, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
