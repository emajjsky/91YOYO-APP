# 91YOYO 跨端 API 契约

版本：v1-draft  
适用客户端：React Native App、微信小程序

## 1. 契约原则

- 本文定义业务语义；App 与小程序都通过 HTTPS 调用相同的 91YOYO REST API。
- 页面只调用 repository/adapter，不直接依赖数据库列名。
- 数据库使用 `snake_case`，对外 DTO 使用 `camelCase`。
- 所有时间为 UTC ISO 8601，例如 `2026-09-15T08:30:00.000Z`。
- 所有 ID 在 JSON 中使用 string；金额使用整数最小单位。
- 新增可选字段属于向后兼容；删除字段、改变类型或枚举语义必须发布新版本。

## 2. 请求约定

登录请求携带：

```http
Authorization: Bearer <access-token>
X-Request-Id: <uuid>
X-Client-Platform: ios | android | wechat-mini
X-Client-Version: 1.0.0
```

创建帖子、消息、点赞等可重试写入额外携带 `Idempotency-Key`。客户端重试同一用户动作时必须复用原 key，服务端返回第一次成功结果。

## 3. 响应与错误

成功的单资源响应：

```json
{
  "data": {},
  "meta": { "requestId": "018f..." }
}
```

错误响应：

```json
{
  "error": {
    "code": "MEDIA_NOT_READY",
    "message": "媒体仍在处理中",
    "retryable": true,
    "fieldErrors": {}
  },
  "meta": { "requestId": "018f..." }
}
```

稳定错误码至少包括：`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`, `VERSION_CONFLICT`, `UPLOAD_EXPIRED`, `MEDIA_NOT_READY`, `CONTENT_REJECTED`, `BLOCKED_RELATION`, `INTERNAL_ERROR`。

客户端只根据 `code` 分支；`message` 可由服务端调整，不参与逻辑判断。

## 4. 游标分页

```json
{
  "data": [],
  "page": {
    "nextCursor": "opaque-base64-value",
    "hasMore": true
  },
  "meta": { "requestId": "018f..." }
}
```

- `limit` 默认 20，最大 50。
- `cursor` 是不透明字符串，客户端不得解析或修改。
- Feed 游标包含 `publishedAt + id`，保证同一时间戳下顺序稳定。
- 刷新从空 cursor 开始；加载更多只能使用上一响应的 `nextCursor`。

## 5. 核心 DTO

### `ProfileSummary`

```ts
interface ProfileSummary {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  styleTags: Array<'1A' | '2A' | '3A' | '4A' | '5A'>;
  levelTag?: string;
  brandCertification?: {
    brandName: string;
    role: 'member' | 'ambassador';
    logoUrl?: string;
  };
}
```

### `MediaAsset`

```ts
interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  posterUrl?: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  title?: string;
  bpm?: number;
  waveform?: number[];
  canDownload: boolean;
}
```

`url` 是可访问 URL，可能过期。客户端持久化 `id`，不要把签名 URL 当永久标识。

### `Post`

```ts
interface Post {
  id: string;
  author: ProfileSummary;
  body: string;
  category:
    | 'daily' | 'music' | 'tutorial' | 'contest'
    | 'event_news' | 'product' | 'meetup';
  styleTags: Array<'1A' | '2A' | '3A' | '4A' | '5A'>;
  hashtags: string[];
  visibility: 'public' | 'followers' | 'private';
  media: MediaAsset[];
  stats: {
    likeCount: number;
    commentCount: number;
    bookmarkCount: number;
    shareCount: number;
  };
  viewerState: {
    liked: boolean;
    bookmarked: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  createdAt: string;
  publishedAt: string;
}
```

服务端保证媒体组合只有三种：0-9 张图片、1 个视频、1 个音频。客户端仍需容忍未知/失败媒体并显示占位，不能让整个 Feed 崩溃。

## 6. 端点清单

下表是 91YOYO API 的逻辑端点。数据库与 COS 凭据只存在于服务器端。

| 方法 | 路径 | 鉴权 | 阶段 | 说明 |
| --- | --- | --- | --- | --- |
| POST | `/v1/auth/send-otp` | 否 | MVP | 发送手机验证码，包含限流 |
| POST | `/v1/auth/verify-otp` | 否 | MVP | 验证并返回会话 |
| POST | `/v1/auth/wechat/exchange` | 微信 code | 后续 | 交换微信身份并绑定账号 |
| GET | `/v1/me` | 是 | MVP | 当前资料与设置 |
| PATCH | `/v1/me` | 是 | MVP | 修改昵称、头像、城市、简介和花式 |
| DELETE | `/v1/me` | 是 | MVP | 发起账号注销 |
| GET | `/v1/feed` | 可选 | MVP | 公开/关注 Feed 游标分页 |
| GET | `/v1/posts/:id` | 可选 | MVP | 帖子详情和 viewerState |
| POST | `/v1/posts` | 是 | MVP | 发布已 ready 的媒体 |
| DELETE | `/v1/posts/:id` | 是 | MVP | 删除自己的帖子 |
| PUT/DELETE | `/v1/posts/:id/like` | 是 | MVP | 幂等点赞/取消 |
| PUT/DELETE | `/v1/posts/:id/bookmark` | 是 | MVP | 幂等收藏/取消 |
| GET/POST | `/v1/posts/:id/comments` | 读可选/写必需 | MVP | 一级评论分页与创建 |
| DELETE | `/v1/comments/:id` | 是 | MVP | 删除自己的评论 |
| GET | `/v1/search` | 可选 | MVP | `type=posts|users|hashtags` |
| GET | `/v1/profiles/:id` | 可选 | MVP | 用户主页 |
| PUT/DELETE | `/v1/profiles/:id/follow` | 是 | MVP | 关注/取消关注 |
| PUT/DELETE | `/v1/profiles/:id/block` | 是 | MVP | 拉黑/取消拉黑 |
| POST | `/v1/media/uploads` | 是 | MVP | 创建 pending 媒体和上传目标 |
| POST | `/v1/media/:id/complete` | 是 | MVP | 校验上传并进入处理流程 |
| DELETE | `/v1/media/:id` | 是 | MVP | 取消未关联上传 |
| GET | `/v1/gear` | 可选 | MVP | 只读装备列表 |
| GET | `/v1/profiles/:id/gear` | 可选 | MVP | 个人装备柜 |
| POST/PATCH | `/v1/gear` | 是 | v1.1 | 发布/编辑装备 |
| GET/POST | `/v1/conversations` | 是 | v1.1 | 会话列表/建会话 |
| GET/POST | `/v1/conversations/:id/messages` | 是 | v1.1 | 消息分页/发送 |
| GET/POST | `/v1/jams` | 可选/是 | v1.2 | 活动浏览/发布 |
| PUT/DELETE | `/v1/jams/:id/participation` | 是 | v1.2 | 报名/取消 |
| POST | `/v1/reports` | 是 | MVP | 举报内容或用户 |

## 7. Feed 查询

```http
GET /v1/feed?scope=public&category=tutorial&styleTag=1A&limit=20&cursor=...
```

参数：

- `scope`: `public` 或 `following`；匿名只能使用 `public`。
- `category`: 可选，使用 `Post.category` 枚举。
- `styleTag`: 可选，1A-5A。
- `authorId`: 可选，用于用户主页列表。

单次查询应返回作者、媒体、计数和当前用户状态，禁止客户端对每条帖子再发作者/点赞查询造成 N+1。

## 8. 媒体与发帖事务

### 创建上传

```json
{
  "fileName": "practice.mov",
  "mimeType": "video/quicktime",
  "sizeBytes": 48392012,
  "durationMs": 32700,
  "checksum": "sha256-base64"
}
```

响应包含 `mediaId`, `uploadUrl`/上传 token、允许的 headers 和 `expiresAt`。客户端上传完成后调用 complete；服务端必须验证 Storage 对象路径、所有者、大小和 MIME。

### 发布帖子

```json
{
  "body": "今天的 1A 搭线练习",
  "category": "tutorial",
  "styleTags": ["1A"],
  "hashtags": ["招式教学", "慢放拆解"],
  "visibility": "public",
  "mediaIds": ["018f..."],
  "allowDownload": false
}
```

服务端在单个事务中验证媒体 `ready`、媒体归属和组合数量，创建帖子与关联。失败不应留下半篇帖子。

## 9. 并发与同步

- 点赞、收藏、关注使用关系表唯一键和 PUT/DELETE 语义，重复请求返回当前状态。
- 编辑资料和装备使用 `updatedAt` 做乐观并发；冲突返回 `409 VERSION_CONFLICT` 并附最新资源。
- 消息使用客户端生成的 `clientMessageId` 去重。
- WebSocket/推送事件只提示“资源发生变化”，客户端仍以授权后的查询结果为准。

## 10. 契约变更流程

1. 先修改本文件和共享契约测试样例。
2. 数据库 migration 采用向后兼容的新增阶段。
3. 后端同时兼容当前线上 App/小程序版本。
4. 两端都迁移后才能删除旧字段或枚举。
5. 破坏性改动发布 `/v2`，不能依靠客户端版本猜测字段语义。
