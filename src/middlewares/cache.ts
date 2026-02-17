import { getRedisClient } from '../lib/redis';

const CACHE_PREFIX = 'cms:cache:';
const TTL = 900; // 15 minutes

export default (/* config, { strapi } */) => {
  return async (ctx, next) => {
    const redis = getRedisClient();

    // Bypass: no Redis, non-GET, non-API, authenticated, or draft requests
    if (
      !redis ||
      ctx.method !== 'GET' ||
      !ctx.path.startsWith('/api/') ||
      ctx.headers['authorization'] ||
      ctx.query['status'] === 'draft'
    ) {
      ctx.set('X-Cache', 'BYPASS');
      return next();
    }

    const key = `${CACHE_PREFIX}${ctx.url}`;

    try {
      const cached = await redis.get(key);

      if (cached !== null) {
        const { status, body, headers } = JSON.parse(cached);
        ctx.status = status;
        ctx.body = body;
        for (const [name, value] of Object.entries(headers)) {
          ctx.set(name, value as string);
        }
        ctx.set('X-Cache', 'HIT');
        return;
      }
    } catch (err) {
      console.warn('[cache] Redis GET error:', (err as Error).message);
      ctx.set('X-Cache', 'BYPASS');
      return next();
    }

    ctx.set('X-Cache', 'MISS');
    await next();

    // Only cache successful JSON responses
    if (ctx.status !== 200 || !ctx.body) return;

    try {
      const contentType = ctx.response.get('Content-Type') || '';
      const headersToCache: Record<string, string> = {};
      if (contentType) headersToCache['Content-Type'] = contentType;

      const payload = JSON.stringify({
        status: ctx.status,
        body: ctx.body,
        headers: headersToCache,
      });

      await redis.set(key, payload, 'EX', TTL);
    } catch (err) {
      console.warn('[cache] Redis SET error:', (err as Error).message);
    }
  };
};
