import pg from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isSupabaseOrCloud = connectionString && (
  connectionString.includes('supabase') || 
  connectionString.includes('neon') || 
  connectionString.includes('aws') || 
  connectionString.includes('elephantsql') ||
  process.env.NODE_ENV === 'production'
);

export const pool = new Pool({
  connectionString,
  ssl: isSupabaseOrCloud ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('PostgreSQL Pool connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});

// Self-healing schema check to ensure missing columns on existing tables are automatically added
export const autoMigrateSchema = async () => {
  try {
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
              CREATE TYPE shipment_status AS ENUM ('pending', 'created', 'courier_pending', 'pickup_scheduled', 'in_transit', 'delivered', 'cancelled', 'rto');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
              CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_category') THEN
              CREATE TYPE ticket_category AS ENUM ('payments_payouts', 'order_issue', 'product_listing', 'account_kyc', 'technical_bug', 'shiprocket_delivery', 'other');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_status') THEN
              CREATE TYPE return_status AS ENUM ('requested', 'seller_approved', 'seller_rejected', 'admin_approved', 'admin_rejected', 'pickup_done', 'refunded', 'closed');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_reason') THEN
              CREATE TYPE return_reason AS ENUM ('defective_item', 'wrong_item_delivered', 'item_not_as_described', 'size_fit_issue', 'changed_mind', 'damaged_in_transit', 'missing_parts', 'other');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_requested' AND enumtypid = 'order_status'::regtype) THEN
              ALTER TYPE order_status ADD VALUE 'return_requested';
          END IF;
      END $$;

      ALTER TABLE seller_profiles
      ADD COLUMN IF NOT EXISTS pickup_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pickup_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pickup_address TEXT,
      ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS pickup_state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS pickup_pincode VARCHAR(10),
      ADD COLUMN IF NOT EXISTS pickup_country VARCHAR(50) DEFAULT 'India',
      ADD COLUMN IF NOT EXISTS shiprocket_pickup_id VARCHAR(100);

      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) DEFAULT 0.50,
      ADD COLUMN IF NOT EXISTS length_cm DECIMAL(6,2) DEFAULT 10.00,
      ADD COLUMN IF NOT EXISTS breadth_cm DECIMAL(6,2) DEFAULT 10.00,
      ADD COLUMN IF NOT EXISTS height_cm DECIMAL(6,2) DEFAULT 5.00,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS reject_reason TEXT;

      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS color VARCHAR(100),
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS shipping_address TEXT,
      ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(10),
      ADD COLUMN IF NOT EXISTS courier_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS shiprocket_order_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS shiprocket_shipment_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS awb_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS courier_id INT,
      ADD COLUMN IF NOT EXISTS courier_name_sr VARCHAR(255),
      ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
      ADD COLUMN IF NOT EXISTS shipping_charges DECIMAL(8,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS shipment_status shipment_status DEFAULT 'pending';

      ALTER TABLE coupons
      ADD COLUMN IF NOT EXISTS uses INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS uses_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
  } catch (err) {
    console.error('Schema auto-migration notice:', err.message);
  }
};
autoMigrateSchema();

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
