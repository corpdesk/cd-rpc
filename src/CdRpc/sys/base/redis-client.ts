// redisClient.ts
import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import config from '../../../config';

// let redisClient: RedisClientType;
let redisClient;

export const getRedisClient = () => {
    if (!redisClient) {
        redisClient = createClient({
            host: config.push.redisHost,
            port: config.push.redisPort,
            legacyMode: true,
        } as RedisClientOptions);

        redisClient.connect().catch(console.error);
        console.log('Redis client initialized');
    }
    return redisClient;
};
