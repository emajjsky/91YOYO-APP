# 91YOYO App 开发环境

版本：v0.1  
更新日期：2026-09-15

## 1. 已知环境要求

- macOS（iOS 开发必需）
- Node.js `>= 20.19.4` 的受支持 LTS 版本
- npm 10+
- Xcode、Command Line Tools 和 CocoaPods
- Android Studio、Android SDK 和 JDK（Android 开发）

盘点时本机为 Node `20.10.0`、npm `10.2.3`、Expo CLI `57.0.24`、Xcode `26.6`。Expo 已明确提示 Node `20.10.0` 过旧，因此先升级 Node 再排查其他启动问题。

## 2. 安装

```bash
cd /Users/tanyihua/Downloads/91yoyo/91yoyo-rn
npm ci
cp .env.example .env.local
```

在 `.env.local` 填入 development API 地址。数据库密码、COS Secret、短信密钥、微信 AppSecret 或推送私钥不得写入任何 `EXPO_PUBLIC_*` 变量。

## 3. 启动

```bash
npm run start
```

常用入口：

```bash
npm run ios
npm run android
npm run web
npx tsc --noEmit
```

当前已有 `ios/` 原生工程，没有 `android/`。第一次执行 Android 原生运行可能触发 prebuild；应先确定正式 package name 和需要的 config plugins，避免反复生成原生配置。

## 4. 环境变量

| 变量 | 是否必需 | 说明 |
| --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | 是 | `development`, `staging`, `production` |
| `EXPO_PUBLIC_API_BASE_URL` | 是 | 当前环境 91YOYO API 地址 |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | 否 | 请求超时，默认 15000 |

`.env.local` 不提交。应用启动时应校验必需变量，并在开发环境显示可定位的配置错误。

## 5. API 与数据库开发

服务端位于 `server/`，标准检查为：

```bash
cd server
npm ci
npm test
npm run build
```

数据库 migration 位于 `server/migrations/`。开发模拟器通过 SSH 隧道访问服务器内部 API：`ssh -N -L 8791:127.0.0.1:8791 <server>`。生产变更通过受控部署应用 migration，不在服务器手工改完即结束。

## 6. iOS

```bash
cd ios
pod install
cd ..
npm run ios
```

若 package 变更涉及原生模块，先确认对应 Expo config plugin，再更新 Pods。不要手工修改生成文件来替代可重复的 Expo 配置。

## 7. Android

安装 Android Studio 后配置 SDK、模拟器和 JDK。正式生成原生工程前，在 `app.json` 中确定：

- `expo.android.package`
- adaptive icon 背景和前景
- 通知图标/颜色
- 权限与 config plugins

之后运行 `npm run android`。Android 真机需要额外验证媒体选择、后台音频、通知渠道、返回手势和厂商后台限制。

## 8. 当前配置缺口

`app.json` 仍包含开发默认值：

- `name` / `slug`: `91yoyo-rn`
- iOS Bundle Identifier: `com.anonymous.91yoyo-rn`
- `userInterfaceStyle`: `light`
- 未声明 Android package

这些值可以用于原型，但不能用于正式签名和商店发布。修改 Bundle ID/package 前先由项目所有者确认永久标识，因为后续迁移成本高。

## 9. 常见检查

- Expo 报 Node 不支持：升级到满足 `>= 20.19.4` 的 LTS。
- iOS Pod 依赖异常：确认 Node/npm 依赖一致后再运行 `pod install`。
- 图片可见但视频不能播：当前代码的视频是静态封面，不是环境故障。
- 点击发布提示成功但首页无数据：当前发帖未连接 store 或后端，是尚未实现的业务链路。
