# 91YOYO App

91YOYO 是面向悠悠球玩家的社区与练习工具。当前仓库是 App 主线，使用 Expo + React Native + TypeScript；微信小程序位于相邻目录 `../91YOYO`，后续接入同一套账号、数据库、对象存储和业务接口。

> 当前状态：可运行的 UI 原型。首页、探索、装备、个人主页、发帖、帖子详情和用户主页已有界面；数据仍为本地 Mock，登录、上传、真实播放、评论、私聊、地图和推送尚未接入生产能力。

## 技术栈

- Expo 57 / React Native 0.86 / React 19
- React Navigation 7
- Zustand 5
- Node.js + Fastify API（`server/`）
- PostgreSQL 16 + 腾讯云 COS
- TypeScript 严格模式

## 本地启动

```bash
npm ci
cp .env.example .env.local
npm run start
```

当前 Expo CLI 要求 Node.js `>= 20.19.4`。完整环境和 iOS/Android 步骤见 [开发环境](docs/SETUP.md)。

## 文档入口

- [文档索引](docs/README.md)
- [App 产品需求](docs/APP_PRD.md)
- [现状与路线图](docs/ROADMAP.md)
- [技术架构](docs/ARCHITECTURE.md)
- [数据模型](docs/DATA_MODEL.md)
- [API 契约](docs/API_CONTRACT.md)
- [移动端能力规格](docs/MOBILE_FEATURE_SPEC.md)
- [测试策略](docs/TEST_STRATEGY.md)

## 跨端原则

```text
React Native App ─┐
                  ├── 91YOYO API / PostgreSQL / 腾讯云 COS
微信小程序 ────────┘
```

两端共享业务数据和接口契约，不共享页面组件。任何页面都不应直接拼装数据库查询；访问后端统一经过各端的 service/repository 层，以便小程序用 `uni.request` 实现相同契约。

## 上线前必须处理

- 将 `app.json` 中默认应用名、slug、Bundle Identifier 和 Android Package 改为正式值。
- 将 `userInterfaceStyle` 改为与纯黑主题一致的 `dark`。
- 配置 API 开发、预发布、生产三个隔离环境。
- 补齐隐私政策、用户协议、内容举报、账号注销和内容审核流程。
- 完成真机媒体、弱网、后台播放、推送和权限回归。
