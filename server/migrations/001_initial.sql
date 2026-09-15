create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text unique,
  nickname text not null check (char_length(nickname) between 1 and 30),
  avatar_url text,
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

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  category text not null check (category in ('daily', 'music', 'tutorial', 'contest', 'event_news', 'product', 'meetup')),
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  status text not null default 'draft' check (status in ('draft', 'processing', 'published', 'rejected', 'deleted')),
  style_tags text[] not null default '{}',
  hashtags text[] not null default '{}',
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

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete restrict,
  type text not null check (type in ('image', 'video', 'audio')),
  bucket text not null,
  object_key text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  title text,
  bpm integer check (bpm is null or bpm > 0),
  status text not null default 'pending' check (status in ('pending', 'uploaded', 'processing', 'ready', 'rejected', 'deleted')),
  poster_key text,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  deleted_at timestamptz
);

create table if not exists post_media (
  post_id uuid not null references posts(id) on delete cascade,
  media_id uuid not null references media_assets(id) on delete restrict,
  position integer not null check (position between 0 and 8),
  created_at timestamptz not null default now(),
  primary key (post_id, media_id),
  unique (post_id, position)
);

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create index if not exists profiles_status_created_idx on profiles (status, created_at desc);
create index if not exists profiles_nickname_trgm_idx on profiles using gin (nickname gin_trgm_ops);
create index if not exists posts_public_feed_idx on posts (published_at desc, id desc)
  where status = 'published' and visibility = 'public' and deleted_at is null;
create index if not exists posts_author_feed_idx on posts (author_id, published_at desc, id desc)
  where deleted_at is null;
create index if not exists media_assets_owner_status_idx on media_assets (owner_id, status, created_at desc);
create index if not exists post_media_media_idx on post_media (media_id);

insert into schema_migrations(version) values ('001_initial') on conflict do nothing;
