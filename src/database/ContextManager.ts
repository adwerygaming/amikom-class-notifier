import { randomUUID } from "node:crypto";
import redisClient from "./RedisClient.js";

const redis = redisClient.duplicate();

export interface BaseContext {
    executorUserId: string;
}

export class ContextManager {
    static async create<T extends BaseContext>(data: T, ttlSeconds = 900): Promise<string> {
        const uuid = randomUUID();
        await redis.set(`interaction_context:${uuid}`, JSON.stringify(data), 'EX', ttlSeconds);
        return uuid;
    }

    static async get<T = unknown>(uuid: string): Promise<T | null> {
        const data = await redis.getdel(`interaction_context:${uuid}`);
        if (!data) return null;

        try {
            return JSON.parse(data) as T;
        } catch {
            return null;
        }
    }

    static async delete(uuid: string): Promise<void> {
        await redis.del(`interaction_context:${uuid}`);
    }
}
