const { Pool } = require('pg');

// Serverless-friendly PostgreSQL configuration
const createConnection = async () => {
  const config = {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: process.env.POSTGRES_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Serverless-friendly settings
    max: 1, // Limit connections for serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  try {
    const pool = new Pool(config);
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const pool = await createConnection();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { createConnection, testConnection };
