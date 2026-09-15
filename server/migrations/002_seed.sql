insert into profiles (id, nickname, avatar_url, bio, city_name, style_tags, level_tag)
values
  ('00000000-0000-4000-8000-000000000001', '91YOYO 官方', '', '悠悠球练习与社区', '上海', array['1A'], '官方'),
  ('00000000-0000-4000-8000-000000000002', 'Alex_Speed1A', '', '速度流练习者', '广州', array['1A', '5A'], '进阶')
on conflict (id) do nothing;

insert into posts (
  id, author_id, body, category, visibility, status, style_tags, hashtags,
  like_count, comment_count, share_count, published_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '91YOYO 的真实 Feed 已连接腾讯云 PostgreSQL。这条内容来自服务器数据库，不再是 App 内置 Mock。',
    'daily', 'public', 'published', array['1A'], array['真实数据', '91YOYO'],
    18, 3, 2, now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    '今天继续练 1A 速度流，后续视频会直接上传到腾讯云 COS，并支持慢放和镜像跟练。',
    'tutorial', 'public', 'published', array['1A'], array['1A', '招式练习'],
    32, 6, 4, now() - interval '10 minutes'
  )
on conflict (id) do nothing;

insert into schema_migrations(version) values ('002_seed') on conflict do nothing;
