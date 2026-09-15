create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  avatar_path text,
  bio text not null default '' check (char_length(bio) <= 200),
  city_code text,
  city_name text,
  style_tags text[] not null default '{}',
  level_tag text,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_style_tags_valid check (
    cardinality(style_tags) <= 5
    and style_tags <@ array['1A', '2A', '3A', '4A', '5A']::text[]
  )
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('image', 'video', 'audio')),
  bucket text not null,
  object_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  checksum text,
  title text,
  bpm integer check (bpm is null or bpm > 0),
  status text not null default 'pending' check (status in ('pending', 'uploaded', 'processing', 'ready', 'rejected', 'deleted')),
  poster_path text,
  waveform jsonb,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  category text not null check (category in ('daily', 'music', 'tutorial', 'contest', 'event_news', 'product', 'meetup')),
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  status text not null default 'draft' check (status in ('draft', 'processing', 'published', 'rejected', 'deleted')),
  style_tags text[] not null default '{}',
  allow_download boolean not null default false,
  like_count bigint not null default 0 check (like_count >= 0),
  comment_count bigint not null default 0 check (comment_count >= 0),
  bookmark_count bigint not null default 0 check (bookmark_count >= 0),
  share_count bigint not null default 0 check (share_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint posts_style_tags_valid check (
    cardinality(style_tags) <= 5
    and style_tags <@ array['1A', '2A', '3A', '4A', '5A']::text[]
  )
);

create table if not exists public.post_media (
  post_id uuid not null references public.posts(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  position integer not null check (position between 0 and 8),
  created_at timestamptz not null default now(),
  primary key (post_id, media_id),
  unique (post_id, position)
);

create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  normalized_name text not null unique,
  display_name text not null,
  post_count bigint not null default 0 check (post_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.post_hashtags (
  post_id uuid not null references public.posts(id) on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete cascade,
  primary key (post_id, hashtag_id)
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.bookmarks (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'published' check (status in ('published', 'rejected', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('post-media', 'post-media', false),
  ('gear-media', 'gear-media', false)
on conflict (id) do nothing;

create index if not exists profiles_status_created_idx on public.profiles (status, created_at desc);
create index if not exists profiles_nickname_trgm_idx on public.profiles using gin (nickname gin_trgm_ops);
create index if not exists media_assets_owner_status_idx on public.media_assets (owner_id, status, created_at desc);
create index if not exists posts_public_feed_idx on public.posts (published_at desc, id desc)
  where status = 'published' and visibility = 'public' and deleted_at is null;
create index if not exists posts_author_feed_idx on public.posts (author_id, published_at desc, id desc)
  where deleted_at is null;
create index if not exists posts_category_feed_idx on public.posts (category, published_at desc, id desc)
  where status = 'published' and visibility = 'public' and deleted_at is null;
create index if not exists post_media_media_idx on public.post_media (media_id);
create index if not exists post_hashtags_hashtag_idx on public.post_hashtags (hashtag_id, post_id);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at asc, id asc);
create index if not exists comments_author_created_idx on public.comments (author_id, created_at desc);
create index if not exists follows_followed_idx on public.follows (followed_id, follower_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id, blocker_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at before update on public.comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), '91YOYO 球友'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.can_view_post(target_author_id uuid, target_visibility text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
begin
  if viewer_id is null then
    return target_visibility = 'public';
  end if;

  if viewer_id = target_author_id then
    return true;
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = viewer_id and b.blocked_id = target_author_id)
       or (b.blocker_id = target_author_id and b.blocked_id = viewer_id)
  ) then
    return false;
  end if;

  return target_visibility = 'public'
    or (target_visibility = 'followers' and exists (
      select 1 from public.follows f
      where f.follower_id = viewer_id and f.followed_id = target_author_id
    ));
end;
$$;

alter table public.profiles enable row level security;
alter table public.media_assets enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.post_likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select
using (status = 'active' or id = (select auth.uid()));

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists media_owner_read on public.media_assets;
create policy media_owner_read on public.media_assets for select
using (owner_id = (select auth.uid()));

drop policy if exists media_visible_read on public.media_assets;
create policy media_visible_read on public.media_assets for select
using (exists (
  select 1
  from public.post_media pm
  join public.posts p on p.id = pm.post_id
  where pm.media_id = id
    and p.status = 'published'
    and p.deleted_at is null
    and public.can_view_post(p.author_id, p.visibility)
));

drop policy if exists media_owner_insert on public.media_assets;
create policy media_owner_insert on public.media_assets for insert
with check (owner_id = (select auth.uid()));

drop policy if exists media_owner_update on public.media_assets;
create policy media_owner_update on public.media_assets for update
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists posts_public_or_owner_read on public.posts;
create policy posts_public_or_owner_read on public.posts for select
using (
  (status = 'published' and deleted_at is null and public.can_view_post(author_id, visibility))
  or author_id = (select auth.uid())
);

drop policy if exists posts_owner_insert on public.posts;
create policy posts_owner_insert on public.posts for insert
with check (author_id = (select auth.uid()));

drop policy if exists posts_owner_update on public.posts;
create policy posts_owner_update on public.posts for update
using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

drop policy if exists post_media_visible_read on public.post_media;
create policy post_media_visible_read on public.post_media for select
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and p.status = 'published'
    and public.can_view_post(p.author_id, p.visibility)
));

drop policy if exists post_media_owner_write on public.post_media;
create policy post_media_owner_write on public.post_media for all
using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

drop policy if exists hashtags_public_read on public.hashtags;
create policy hashtags_public_read on public.hashtags for select using (true);

drop policy if exists post_hashtags_public_read on public.post_hashtags;
create policy post_hashtags_public_read on public.post_hashtags for select
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and p.status = 'published'
    and public.can_view_post(p.author_id, p.visibility)
));

drop policy if exists likes_public_read on public.post_likes;
create policy likes_public_read on public.post_likes for select using (true);

drop policy if exists likes_owner_write on public.post_likes;
create policy likes_owner_write on public.post_likes for all
using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

drop policy if exists bookmarks_owner_all on public.bookmarks;
create policy bookmarks_owner_all on public.bookmarks for all
using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

drop policy if exists comments_published_read on public.comments;
create policy comments_published_read on public.comments for select
using (status = 'published' and deleted_at is null);

drop policy if exists comments_owner_insert on public.comments;
create policy comments_owner_insert on public.comments for insert
with check (author_id = (select auth.uid()));

drop policy if exists comments_owner_update on public.comments;
create policy comments_owner_update on public.comments for update
using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

drop policy if exists follows_public_read on public.follows;
create policy follows_public_read on public.follows for select using (true);

drop policy if exists follows_owner_write on public.follows;
create policy follows_owner_write on public.follows for all
using (follower_id = (select auth.uid())) with check (follower_id = (select auth.uid()));

drop policy if exists blocks_owner_read on public.blocks;
create policy blocks_owner_read on public.blocks for select
using (blocker_id = (select auth.uid()));

drop policy if exists blocks_owner_write on public.blocks;
create policy blocks_owner_write on public.blocks for all
using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

drop policy if exists public_media_read on storage.objects;
create policy public_media_read on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists visible_post_media_read on storage.objects;
create policy visible_post_media_read on storage.objects for select
using (
  bucket_id = 'post-media'
  and exists (
    select 1
    from public.media_assets ma
    join public.post_media pm on pm.media_id = ma.id
    join public.posts p on p.id = pm.post_id
    where ma.bucket = bucket_id
      and ma.object_path = name
      and p.status = 'published'
      and p.deleted_at is null
      and public.can_view_post(p.author_id, p.visibility)
  )
);

drop policy if exists owner_media_read on storage.objects;
create policy owner_media_read on storage.objects for select to authenticated
using ((storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists owner_media_insert on storage.objects;
create policy owner_media_insert on storage.objects for insert to authenticated
with check (
  bucket_id in ('avatars', 'post-media', 'gear-media')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists owner_media_update on storage.objects;
create policy owner_media_update on storage.objects for update to authenticated
using ((storage.foldername(name))[1] = (select auth.uid())::text)
with check ((storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists owner_media_delete on storage.objects;
create policy owner_media_delete on storage.objects for delete to authenticated
using ((storage.foldername(name))[1] = (select auth.uid())::text);
