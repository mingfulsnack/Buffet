const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'buffet_restaurant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

// Function to test database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    console.log(`📡 Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    console.log('✅ Database connection successful!');
    console.log(`⏰ Current time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].pg_version.split(',')[0]}`);
    
    // Test if main tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('nhanvien', 'khachhang', 'ban', 'phieudatban', 'monan')
      ORDER BY table_name
    `);
    
    console.log(`📋 Found ${tablesResult.rows.length}/5 main tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    if (tablesResult.rows.length < 5) {
      console.log('⚠️  Warning: Some tables are missing. Please run the database schema script.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Hint: Make sure PostgreSQL is running and accessible');
    } else if (error.code === '3D000') {
      console.error('   💡 Hint: Database does not exist. Please create it first.');
    } else if (error.code === '28P01') {
      console.error('   💡 Hint: Authentication failed. Check username/password in .env file');
    }
    
    return false;
  }
};

module.exports = pool;
module.exports.testConnection = testConnection;
