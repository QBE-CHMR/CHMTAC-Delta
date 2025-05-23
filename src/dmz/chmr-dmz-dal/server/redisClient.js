import { createClient } from 'redis';

const redisUrl = process.env.HOST_REDIS;

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

await redisClient.connect();

export { redisClient };
