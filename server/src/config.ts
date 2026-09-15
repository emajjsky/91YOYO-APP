import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8791),
  DATABASE_URL: z.string().url(),
  COS_SECRET_ID: z.string().min(1),
  COS_SECRET_KEY: z.string().min(1),
  COS_REGION: z.string().min(1),
  COS_BUCKET: z.string().min(1),
  COS_PREFIX: z.string().default('91yoyo'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse(environment);
}
