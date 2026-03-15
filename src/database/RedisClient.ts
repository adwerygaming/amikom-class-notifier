import { Redis } from 'ioredis';
import tags from '../utils/Tags.js';
import { env } from '../utils/EnvManager.js';

// Use environment variables for flexibility
const redisClient = new Redis({
    host: env.REDIS_HOST || 'acr-redis',
    port: Number(env.REDIS_PORT) || 6379,
});

redisClient.on('connect', () => {
    console.log(`[${tags.Redis}] Redis Connection established successfully!`);
});

redisClient.on('close', () => {
    console.log(`[${tags.Redis}] Redis closed its connection`);
});

redisClient.on('error', (err) => {
    console.error(`[${tags.Redis}] Redis connection error:`, err);
});

export default redisClient;