# 91YOYO API

Fastify + TypeScript API shared by the React Native App and the WeChat mini program.

## Commands

```bash
npm ci
npm test
npm run build
npm start
```

## Required Environment

```text
DATABASE_URL
COS_SECRET_ID
COS_SECRET_KEY
COS_REGION
COS_BUCKET
COS_PREFIX
HOST
PORT
```

Secrets belong only on the server. The App receives `EXPO_PUBLIC_API_BASE_URL` and never receives database or COS credentials.

## Current Development Deployment

- systemd unit: `91yoyo-api.service`
- working directory: `/opt/91yoyo-api`
- environment file: `/etc/91yoyo/api.env`
- internal listener: `127.0.0.1:8791`
- health: `/health/live`, `/health/ready`
- public feed: `/v1/feed`

Apply migrations in filename order using the `yoyo_app` database account. Production access must go through Nginx HTTPS; do not expose PostgreSQL or port 8791 directly.
