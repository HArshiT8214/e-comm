// database.js
const { Pool } = require('pg');
require('dotenv').config();

const rawUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!rawUrl) {
  throw new Error("Database configuration error: POSTGRES_URL or DATABASE_URL is not set.");
}

// Ensure sslmode=require for Supabase (and most managed PG)
// Appends the flag only if it's missing.
const hasQuery = rawUrl.includes('?');
const hasSSLMode = /[?&]sslmode=/i.test(rawUrl);
const databaseUrl = hasSSLMode ? rawUrl : `${rawUrl}${hasQuery ? '&' : '?'}sslmode=require`;

// In production, enable TLS. For Supabase, relaxing cert verification is common on Node hosts.
const isProduction = process.env.NODE_ENV === 'production';

// Keep it simple: let the URL carry sslmode=require; tell pg to use TLS without hard-failing on CA chains.
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Optional: startup probe
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ PostgreSQL Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL Database connection failed:', error.message);
    if (client) client.release();
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = { pool, testConnection };
