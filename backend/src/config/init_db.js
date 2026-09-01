import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not defined in your .env file.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  let client = new Client({
    connectionString: dbUrl,
    ssl: false
  });

  try {
    await client.connect();
    console.log('Successfully connected to Postgres.');

    const schemaPath = path.join(__dirname, 'db_schema.sql');
    console.log(`Reading SQL schema from: ${schemaPath}`);
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema creation & default admin seeds...');
    await client.query(sqlContent);

    const seedPath = path.join(__dirname, 'seed_products.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`Reading catalog seed products from: ${seedPath}`);
      const seedContent = fs.readFileSync(seedPath, 'utf8');
      console.log('Executing product & tier seeding...');
      await client.query(seedContent);
    }

    console.log('==================================================');
    console.log('🎉 Database Schema & Catalog initialized successfully!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Database Initialization failed:');
    console.error(err.message);
  } finally {
    await client.end();
  }
}

initDatabase();
