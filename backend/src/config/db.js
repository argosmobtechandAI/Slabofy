import pg from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const requiresSSL = connectionString && (
  connectionString.includes('sslmode=require') ||
  connectionString.includes('.supabase.co') ||
  connectionString.includes('.neon.tech') ||
  connectionString.includes('.rds.amazonaws.com')
);

export const pool = new Pool({
  connectionString,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('PostgreSQL Pool connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});

// Simple in-memory fallback for Redis in case of offline/unavailable Redis server
class MemoryRedisMock {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }
  async connect() { console.log('Redis connected (In-Memory Mock Active)'); }
  async get(key) {
    if (this.ttls.has(key) && this.ttls.get(key) < Date.now()) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }
  async set(key, value, options = {}) {
    this.store.set(key, value);
    if (options.EX) {
      this.ttls.set(key, Date.now() + options.EX * 1000);
    }
    return 'OK';
  }
  async expire(key, seconds) {
    if (this.store.has(key)) {
      this.ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }
  async del(key) {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.ttls.delete(key);
    return existed ? 1 : 0;
  }
  async quit() { return 'OK'; }
}

let client;
if (process.env.NODE_ENV === 'test') {
  client = new MemoryRedisMock();
} else {
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: () => false
      }
    });
    client.on('error', (err) => {
      console.warn('Redis Client Error, switching to memory mock:', err.message);
      // Replace with mock client on error
      const mock = new MemoryRedisMock();
      client.get = mock.get.bind(mock);
      client.set = mock.set.bind(mock);
      client.expire = mock.expire.bind(mock);
      client.del = mock.del.bind(mock);
    });
  } catch (e) {
    console.warn('Could not initialize Redis client, using memory mock instead.');
    client = new MemoryRedisMock();
  }
}

export const redisClient = client;

// Self-invoking async connect for Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('Redis connection failed. Running with in-memory fallback.');
    // Override methods with fallback in case connection promise rejects
    const mock = new MemoryRedisMock();
    redisClient.get = mock.get.bind(mock);
    redisClient.set = mock.set.bind(mock);
    redisClient.expire = mock.expire.bind(mock);
    redisClient.del = mock.del.bind(mock);
  }
})();
