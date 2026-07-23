// server/db/pool.js  — PostgreSQL connection pool
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
  max:      10,
  connectionTimeoutMillis: 5000,   // Fail fast if DB unreachable (5s)
  idleTimeoutMillis:       30000,
  statement_timeout:       10000,  // Kill queries taking > 10s
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err.message);
});

export default pool;
