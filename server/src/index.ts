import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createCosService } from './cos.js';
import { createDatabase } from './database.js';
import { createFeedRepository } from './feedRepository.js';

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);
const cos = createCosService(config);
const app = buildApp({
  health: { checkDatabase: database.check, checkCos: cos.check },
  feed: createFeedRepository(database.pool),
});

const shutdown = async () => {
  await app.close();
  await database.pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

await app.listen({ host: config.HOST, port: config.PORT });
