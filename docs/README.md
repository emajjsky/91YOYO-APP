# 91YOYO App 文档索引

版本：v0.1  
基线日期：2026-09-15

本目录是 App 主线的事实来源。`../91YOYO/docs` 中的旧文档继续描述微信小程序原型，但其中的微信 API、分包和提审方案不适用于 React Native App。

| 文档 | 解决的问题 | 主要读者 |
| --- | --- | --- |
| [APP_PRD.md](APP_PRD.md) | App 先做什么、暂时不做什么、如何验收 | 产品、设计、研发 |
| [ROADMAP.md](ROADMAP.md) | 当前完成度、阶段顺序和阶段出口 | 项目负责人、研发 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | App、小程序和共享后端如何协作 | 客户端、后端 |
| [DATA_MODEL.md](DATA_MODEL.md) | 跨端共享的数据实体、约束、索引和权限 | 后端、客户端 |
| [API_CONTRACT.md](API_CONTRACT.md) | 两端共同遵守的字段、分页、错误和写入流程 | 客户端、后端 |
| [MOBILE_FEATURE_SPEC.md](MOBILE_FEATURE_SPEC.md) | 视频、音频、上传、推送、地图等原生能力 | App 研发、QA |
| [SETUP.md](SETUP.md) | 如何配置环境并运行项目 | 新加入的研发 |
| [TEST_STRATEGY.md](TEST_STRATEGY.md) | 自动化与真机测试边界 | 研发、QA |

## 已确定的决策

1. React Native App 是近期唯一开发主线，小程序暂不继续扩展业务功能。
2. Supabase 作为第一阶段共享后端，承载 Auth、Postgres、Storage 和 Realtime。
3. App 与小程序分别实现 UI，只共享账号、数据模型、API 字段语义和测试样例。
4. 跨端基础登录采用手机验证码；微信快捷登录是后续服务端身份绑定能力。
5. App MVP 聚焦社区内容和媒体练习体验；担保支付、复杂交易和完整 Jam 生态不进入首个 MVP。

## 文档维护规则

- 产品范围变化先更新 PRD，再更新路线图。
- 表字段、枚举或权限变化必须同时更新数据模型和 API 契约。
- 引入新的原生权限或 SDK 时更新移动能力规格和开发环境文档。
- 文档描述“已完成”前，必须有代码、自动化检查或真机记录作为证据。
