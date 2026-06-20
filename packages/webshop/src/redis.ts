import 'dotenv/config';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = createClient({ url: redisUrl });

redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
});

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
        console.log('[Redis] Connected.');
    }
}

export async function safeRedisDel(key: string) {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`[Redis] Failed to delete key "${key}":`, error);
    }
}