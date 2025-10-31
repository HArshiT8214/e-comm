const { Pool } = require('pg');
require('dotenv').config();

// Vercel automatically injects this variable from your Supabase integration
const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  // This will be the error you see in Vercel logs if variables are missing
  throw new Error("Database configuration error: POSTGRES_URL environment variable is not set.");
}

// Create connection pool using the Vercel/Supabase URL
const pool = new Pool({
  connectionString: databaseUrl,
  // This is required for connecting to most cloud-hosted PostgreSQL instances
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection (optional)
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