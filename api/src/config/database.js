const { Pool } = require('pg');
require('dotenv').config();

// Vercel injects POSTGRES_URL from Supabase integration
const databaseUrl = process.env.POSTGRES_URL || 
                    // CRITICAL FIX: Changed DB_NAME to DB_DATABASE
                    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE}`;

// Create connection pool using the URL
const pool = new Pool({
  connectionString: databaseUrl,
  // Add SSL settings for external PostgreSQL providers like Supabase
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection (optional, ensure it doesn't run on file load)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL Database connection failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = { pool, testConnection };
