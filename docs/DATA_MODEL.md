# 91YOYO 共享数据模型

版本：v0.1  
数据库：PostgreSQL 16 / 腾讯云轻量服务器

## 1. 设计约定

- 表名和列名统一 `snake_case`，API JSON 统一 `camelCase`。
- 时间统一 `timestamptz`，服务端存 UTC，客户端负责本地化显示。
- 金额使用最小货币单位 `bigint`（如分）和独立 `currency`，不使用浮点数。
- 公开实体使用 `uuid`。若部署环境支持 UUIDv7，则新业务表使用时间有序 UUIDv7；`profiles.id` 保持与 `auth.users.id` 一致。
- 所有外键列建索引；Feed 等组合查询按“等值列在前、时间范围列在后”建立复合索引。
- 计数缓存只是派生值，点赞/评论事实仍以关系表为准。
- 客户端不直连数据库；只有最小权限的 `yoyo_app` 数据库账号可由本机 API 使用。

## 2. 核心枚举

| 枚举 | 值 |
| --- | --- |
| `post_category` | `daily`, `music`, `tutorial`, `contest`, `event_news`, `product`, `meetup` |
| `style_tag` | `1a`, `2a`, `3a`, `4a`, `5a` |
| `visibility` | `public`, `followers`, `private` |
| `content_status` | `draft`, `processing`, `published`, `rejected`, `deleted` |
| `media_type` | `image`, `video`, `audio` |
| `gear_status` | `draft`, `active`, `reserved`, `sold`, `withdrawn` |
| `gear_grade` | `s`, `a`, `b`, `c` |
| `message_type` | `text`, `image`, `gear_card`, `system` |
| `jam_status` | `draft`, `open`, `full`, `cancelled`, `finished` |

数据库可用 text + check constraint 表达这些枚举，便于后续非破坏性增加值。

## 3. 身份与社交关系

### `profiles`

| 列 | 类型 | 约束/说明 |
| --- | --- | --- |
| `id` | uuid | PK，FK → `auth.users.id`，级联删除由注销任务控制 |
| `nickname` | text | 1-30 字符，必填 |
| `avatar_path` | text | Storage 对象路径，不存临时签名 URL |
| `bio` | text | 最多 200 字符 |
| `city_code` / `city_name` | text | 可空；code 用于筛选，name 用于显示快照 |
| `style_tags` | text[] | 仅允许 1A-5A，最多 5 个 |
| `status` | text | `active`, `suspended`, `deleted` |
| `created_at` / `updated_at` | timestamptz | 服务端生成 |

索引：`profiles(status, created_at desc)`；昵称搜索使用 `pg_trgm` GIN 索引。

### `user_identities`

用于后续微信、Apple 等外部身份绑定：`id`, `profile_id`, `provider`, `subject`, `provider_tenant`, `created_at`, `last_used_at`。唯一约束 `(provider, provider_tenant, subject)`；仅认证服务可写。

### `follows` / `blocks`

- `follows(follower_id, followed_id, created_at)`，复合主键，禁止自己关注自己。
- `blocks(blocker_id, blocked_id, created_at)`，复合主键，禁止自己拉黑自己。
- 两张表都为正反向查询建立索引；拉黑会让双方内容和私信按产品规则不可见。

## 4. 内容模型

### `posts`

| 列 | 类型 | 约束/说明 |
| --- | --- | --- |
| `id` | uuid | PK |
| `author_id` | uuid | FK → `profiles.id` |
| `body` | text | 1-2000 字符 |
| `category` | text | `post_category` check |
| `visibility` | text | `visibility` check |
| `status` | text | `content_status` check |
| `style_tags` | text[] | 最多 5 个 |
| `allow_download` | boolean | 只对视频原文件有效，默认 false |
| `like_count` / `comment_count` / `bookmark_count` / `share_count` | bigint | 非负缓存计数，默认 0 |
| `published_at` | timestamptz | 发布后必填 |
| `created_at` / `updated_at` / `deleted_at` | timestamptz | 服务端维护 |

索引：

- `posts(status, visibility, published_at desc, id desc)`，用于公开 Feed 游标分页。
- `posts(author_id, published_at desc, id desc)`，用于用户主页。
- `posts(category, status, published_at desc, id desc)`，用于探索分类。
- 已删除记录较多后使用 `where deleted_at is null` 的部分索引。

### `media_assets`

字段：`id`, `owner_id`, `type`, `bucket`, `object_path`, `mime_type`, `size_bytes`, `width`, `height`, `duration_ms`, `checksum`, `status`, `poster_path`, `waveform`, `created_at`, `ready_at`, `deleted_at`。

约束：`object_path` 唯一；size/duration 非负；`status` 为 `pending`, `uploaded`, `processing`, `ready`, `rejected`, `deleted`。`waveform` 可用 jsonb，但只存固定结构的采样数组并限制长度。

### `post_media`

`post_id`, `media_id`, `position`, `created_at`。复合主键 `(post_id, media_id)`，唯一约束 `(post_id, position)`。数据库函数保证一帖只能是最多 9 图，或 1 视频，或 1 音频。

### `hashtags` / `post_hashtags`

- `hashtags(id, normalized_name, display_name, post_count, created_at)`，`normalized_name` 唯一。
- `post_hashtags(post_id, hashtag_id)` 为复合主键。
- 不把 `#` 存入 normalized name；搜索时统一大小写和 Unicode 规范化。

### `comments`

字段：`id`, `post_id`, `author_id`, `body`, `status`, `created_at`, `updated_at`, `deleted_at`。MVP 只允许一级评论。索引 `(post_id, created_at asc, id asc)` 和 `(author_id, created_at desc)`。

### `post_likes` / `bookmarks`

- `post_likes(post_id, profile_id, created_at)`，复合主键，重复请求自然幂等。
- `bookmarks(profile_id, post_id, created_at)`，复合主键，收藏列表索引 `(profile_id, created_at desc, post_id)`。
- 点赞/取消点赞与计数变更在同一数据库事务内完成。

## 5. 装备模型

### `gear_items`

个人装备柜：`id`, `owner_id`, `brand`, `model_name`, `structure`, `bearing`, `description`, `visibility`, `created_at`, `updated_at`, `deleted_at`。

### `gear_listings`

出售快照：`id`, `gear_item_id`, `seller_id`, `title`, `description`, `grade`, `grade_description`, `price_minor`, `currency`, `city_code`, `city_name`, `status`, `reserved_for_id`, `published_at`, `created_at`, `updated_at`, `deleted_at`。

索引 `(status, published_at desc, id desc)`、`(seller_id, created_at desc)`、`(city_code, status, published_at desc)`。状态只能按 `draft → active → reserved/sold/withdrawn` 规则由服务端更新。

装备图片/视频复用 `media_assets`，通过 `gear_listing_media(listing_id, media_id, position)` 关联。

## 6. 私聊模型

### `conversations` / `conversation_members`

- `conversations(id, kind, gear_listing_id, created_at, updated_at, last_message_at)`；MVP 后续阶段仅支持 `direct`。
- `conversation_members(conversation_id, profile_id, last_read_message_id, joined_at, left_at)`，复合主键。
- 两人同一装备咨询的重复建会话通过服务端幂等键合并。

### `messages`

字段：`id`, `conversation_id`, `sender_id`, `client_message_id`, `type`, `body`, `media_id`, `gear_listing_id`, `created_at`, `deleted_at`。唯一约束 `(sender_id, client_message_id)` 防止弱网重发重复消息；索引 `(conversation_id, created_at desc, id desc)`。

## 7. Jam 模型

- `jams(id, host_id, title, description, city_code, place_name, latitude, longitude, starts_at, ends_at, capacity, status, visibility, created_at, updated_at)`。
- `jam_participants(jam_id, profile_id, role, status, joined_at)`，复合主键。
- 坐标只用于用户主动发布的公共活动地点；不保存参与者实时位置。

## 8. 安全与运营模型

- `reports(id, reporter_id, target_type, target_id, reason, details, status, created_at, resolved_at)`；同一用户对同一目标的未处理举报限制重复提交。
- `content_moderation(id, target_type, target_id, provider, decision, labels, reviewed_by, created_at)`；原始供应商响应放受限 schema。
- `notifications(id, profile_id, type, actor_id, target_type, target_id, payload, read_at, created_at)`；索引 `(profile_id, read_at, created_at desc)`。
- `audit_events(id, actor_id, action, target_type, target_id, request_id, metadata, created_at)`；只允许服务端写入，metadata 不保存令牌或私聊正文。

## 9. API 权限摘要

| 数据 | 匿名用户 | 登录用户 | 所有者/成员 |
| --- | --- | --- | --- |
| 已发布公开帖子/公开资料 | 读 | 读 | 读 |
| 关注者帖子 | 无 | 已关注者读 | 作者读写 |
| 私密帖子/收藏 | 无 | 无 | 本人读写 |
| 点赞/评论/关注 | 无 | 创建和删除自己的关系 | 同左 |
| 装备在售列表 | 读 | 读 | 卖家写 |
| 会话/消息 | 无 | 无 | 会话成员读，发送者写 |
| 举报 | 无 | 只能创建和读自己的 | 管理角色处理 |

任何管理读取都走单独服务端角色；数据库端口不开放公网，客户端无法绕过 API 权限检查。
