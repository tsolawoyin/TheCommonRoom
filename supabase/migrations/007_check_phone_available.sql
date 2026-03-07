create or replace function check_phone_available(p_phone text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.users where phone = p_phone
  );
$$;
