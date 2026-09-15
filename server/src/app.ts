import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { AppServices } from './services.js';

export function buildApp(services: AppServices) {
  const app = Fastify({ logger: false });
  void app.register(cors, { origin: false });

  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    const [database, cos] = await Promise.all([
      services.health.checkDatabase().catch(() => false),
      services.health.checkCos().catch(() => false),
    ]);
    const ready = database && cos;
    return reply.code(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'not_ready',
      database,
      cos,
    });
  });

  app.get<{ Querystring: { limit?: string; cursor?: string } }>('/v1/feed', async (request, reply) => {
    const requestedLimit = Number(request.query.limit ?? 20);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return reply.code(400).send({ error: { code: 'VALIDATION_FAILED', message: 'limit 必须是正整数' } });
    }
    const limit = Math.min(requestedLimit, 50);
    const result = await services.feed.listPublic({ limit, cursor: request.query.cursor ?? null });
    return {
      data: result.items,
      page: { nextCursor: result.nextCursor, hasMore: result.hasMore },
    };
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    void reply.code(500).send({
      error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' },
    });
  });

  return app;
}
