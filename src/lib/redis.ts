import Redis from 'ioredis';

let client: Redis | null = null;

function getRedisClient(): Redis | null {
  if (client) return client;

  const socketPath = process.env.REDIS_SOCKET_PATH;

  if (!socketPath) {
    return null;
  }

  client = new Redis({ path: socketPath, lazyConnect: true });

  client.on('error', (err) => {
    console.warn('[cache] Redis error:', err.message);
  });

  return client;
}

export { getRedisClient };

const CACHE_PREFIX = 'cms:cache:';

export async function invalidateApiCache(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const pattern = `${CACHE_PREFIX}/api/*`;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');

    console.log('[cache] API cache invalidated');
  } catch (err) {
    console.warn('[cache] Failed to invalidate cache:', (err as Error).message);
  }
}
