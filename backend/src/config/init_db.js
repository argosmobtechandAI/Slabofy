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
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('Successfully connected to Postgres.');

    const schemaPath = path.join(__dirname, 'db_schema.sql');
    console.log(`Reading SQL schema from: ${schemaPath}`);
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema creation & seeds...');
    // We execute the raw SQL file contents
    await client.query(sqlContent);

    console.log('==================================================');
    console.log('🎉 Database Schema & Seeds initialized successfully!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Database Initialization failed:');
    console.error(err.message);
  } finally {
    await client.end();
  }
}

initDatabase();
