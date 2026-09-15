import COS from 'cos-nodejs-sdk-v5';
import type { AppConfig } from './config.js';

export function createCosService(config: AppConfig) {
  const client = new COS({ SecretId: config.COS_SECRET_ID, SecretKey: config.COS_SECRET_KEY });

  return {
    async check(): Promise<boolean> {
      await new Promise<void>((resolve, reject) => {
        client.headBucket({ Bucket: config.COS_BUCKET, Region: config.COS_REGION }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      return true;
    },
  };
}
