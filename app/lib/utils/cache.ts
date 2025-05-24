import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, object>({
  max: 100,
  ttl: 1000 * 60 * 10
})

export const getCache = (key: string) => cache.get(key)

export const setCache = (key: string, data: object, ttl?: number) => 
  cache.set(key, data, { ttl: ttl ? ttl * 1000 : undefined }) 