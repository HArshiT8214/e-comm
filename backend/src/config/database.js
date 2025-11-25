const { Pool } = require('pg');
require('dotenv').config();

// Support multiple database providers:
// - POSTGRES_URL: Supabase, Vercel Postgres
// - DATABASE_URL: Render PostgreSQL, Heroku, etc.
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  // This will be the error you see in logs if variables are missing
  throw new Error("Database configuration error: POSTGRES_URL or DATABASE_URL environment variable is not set.");
}

// Determine SSL configuration based on database provider
// Supabase requires SSL with specific settings
// Render PostgreSQL also requires SSL
const isSupabase = databaseUrl.includes('supabase.co') || process.env.POSTGRES_URL;
const isProduction = process.env.NODE_ENV === 'production';

let sslConfig = false;

if (isProduction) {
  if (isSupabase) {
    // Supabase requires SSL with rejectUnauthorized: false
    sslConfig = {
      rejectUnauthorized: false,
      require: true
    };
  } else {
    // Render PostgreSQL or other managed databases
    sslConfig = {
      rejectUnauthorized: false, // Allow self-signed certificates
      require: true
    };
  }
}

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
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