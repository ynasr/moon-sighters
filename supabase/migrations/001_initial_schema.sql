-- ======================
-- COUNTIES
-- ======================
create table public.counties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  center_lat double precision not null,
  center_lng double precision not null,
  created_at timestamptz not null default now()
);

alter table public.counties enable row level security;

create policy "Counties are viewable by everyone"
  on public.counties for select using (true);

-- ======================
-- PROFILES
-- ======================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ======================
-- COUNTY ADMINS (many-to-many)
-- ======================
create table public.county_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  county_id uuid not null references public.counties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, county_id)
);

alter table public.county_admins enable row level security;

create policy "County admins are viewable by everyone"
  on public.county_admins for select using (true);

-- ======================
-- FORUM WINDOWS
-- ======================
create table public.forum_windows (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.counties(id),
  hijri_month text not null,
  hijri_year int not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  decision text check (decision in ('sighted', 'not_sighted')),
  decided_at timestamptz,
  opened_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (county_id, hijri_month, hijri_year)
);

alter table public.forum_windows enable row level security;

create policy "Forum windows are viewable by everyone"
  on public.forum_windows for select using (true);

create policy "County admins can insert forum windows"
  on public.forum_windows for insert with check (
    exists (
      select 1 from public.county_admins
      where county_admins.user_id = auth.uid()
        and county_admins.county_id = forum_windows.county_id
    )
  );

create policy "County admins can update forum windows"
  on public.forum_windows for update using (
    exists (
      select 1 from public.county_admins
      where county_admins.user_id = auth.uid()
        and county_admins.county_id = forum_windows.county_id
    )
  );

-- ======================
-- POSTS
-- ======================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  forum_window_id uuid not null references public.forum_windows(id),
  author_id uuid not null references public.profiles(id),
  parent_id uuid references public.posts(id),
  body text not null check (char_length(body) between 1 and 10000),
  image_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Authenticated users can create posts in open forums"
  on public.posts for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.forum_windows
      where forum_windows.id = forum_window_id
        and forum_windows.closed_at is null
    )
  );

create policy "County admins can moderate posts"
  on public.posts for update
  using (
    exists (
      select 1 from public.county_admins ca
      join public.forum_windows fw on fw.county_id = ca.county_id
      where ca.user_id = auth.uid()
        and fw.id = posts.forum_window_id
    )
  )
  with check (
    exists (
      select 1 from public.county_admins ca
      join public.forum_windows fw on fw.county_id = ca.county_id
      where ca.user_id = auth.uid()
        and fw.id = posts.forum_window_id
    )
  );

-- ======================
-- RATE LIMIT TRIGGER
-- ======================
create or replace function public.check_post_rate_limit()
returns trigger as $$
declare
  post_count int;
  reply_count int;
  image_count int;
  is_admin boolean;
  today_start timestamptz := date_trunc('day', now() at time zone 'UTC');
begin
  -- Skip rate limits for admins
  select exists (
    select 1 from public.county_admins ca
    join public.forum_windows fw on fw.county_id = ca.county_id
    where ca.user_id = new.author_id
      and fw.id = new.forum_window_id
  ) into is_admin;

  if is_admin then
    return new;
  end if;

  if new.parent_id is null then
    -- Count today's top-level posts
    select count(*) into post_count
    from public.posts
    where author_id = new.author_id
      and parent_id is null
      and created_at >= today_start
      and deleted_at is null;

    if post_count >= 3 then
      raise exception 'Daily post limit reached (3 posts per day)';
    end if;
  else
    -- Count today's replies
    select count(*) into reply_count
    from public.posts
    where author_id = new.author_id
      and parent_id is not null
      and created_at >= today_start
      and deleted_at is null;

    if reply_count >= 3 then
      raise exception 'Daily reply limit reached (3 replies per day)';
    end if;
  end if;

  -- Check image limit
  if new.image_url is not null then
    select count(*) into image_count
    from public.posts
    where author_id = new.author_id
      and image_url is not null
      and created_at >= today_start
      and deleted_at is null;

    if image_count >= 1 then
      raise exception 'Daily image post limit reached (1 image per day)';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_post_rate_limit
  before insert on public.posts
  for each row
  execute function public.check_post_rate_limit();

-- ======================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ======================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ======================
-- ENABLE REALTIME
-- ======================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.forum_windows;

-- ======================
-- SEED DATA: SoCal Counties
-- ======================
insert into public.counties (name, slug, center_lat, center_lng) values
  ('Los Angeles',    'los-angeles',    34.0522, -118.2437),
  ('Orange',         'orange',         33.7175, -117.8311),
  ('San Diego',      'san-diego',      32.7157, -117.1611),
  ('Riverside',      'riverside',      33.9533, -117.3962),
  ('San Bernardino', 'san-bernardino', 34.1083, -117.2898);
