import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'kepler432b',
  user: process.env.DB_USER || 'kepler432b_app',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  application_name: 'kepler432b_backend',
  ssl: useSSL ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('❌ DB pool error:', err.message);
});

pool.on('connect', (client) => {
  client.query("SET statement_timeout = '30000'");
  client.query("SET search_path TO public");
});

export default pool;
