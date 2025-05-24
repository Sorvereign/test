import { createClient, RedisClientType } from 'redis';

const getRedisClient = (): RedisClientType => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  
  client.on('error', (err: Error) => console.error('Redis Client Error', err));
  
  return client as RedisClientType;
};

export const getCache = async (key: string) => {
  const client = getRedisClient();
  
  try {
    await client.connect();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  } finally {
    await client.disconnect();
  }
};

export const setCache = async (key: string, data: object, ttl: number = 600): Promise<boolean> => {
  const client = getRedisClient();
  
  try {
    await client.connect();
    await client.set(key, JSON.stringify(data), { EX: ttl });
    return true;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  } finally {
    await client.disconnect();
  }
};

const memoryCache = new Map<string, { data: object, expiry: number }>();

export const getMemoryCache = (key: string) => {
  const item = memoryCache.get(key);
  
  if (!item) return null;
  if (item.expiry < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.data;
};

export const setMemoryCache = (key: string, data: object, ttl: number = 600): boolean => {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + (ttl * 1000)
  });
  
  return true;
};

export const getCacheHybrid = async (key: string) => {
  try {
    const redisData = await getCache(key);
    if (redisData) return redisData;
    
    return getMemoryCache(key);
  } catch (error) {
    console.error('Hybrid cache error:', error);
    return getMemoryCache(key);
  }
};

export const setCacheHybrid = async (key: string, data: object, ttl: number = 600): Promise<boolean> => {
  try {
    await setCache(key, data, ttl);
  } catch (error) {
    console.error('Redis cache set failed, using memory cache:', error);
  }
  
  setMemoryCache(key, data, ttl);
  
  return true;
}; 