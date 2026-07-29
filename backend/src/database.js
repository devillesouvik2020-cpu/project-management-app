const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

function prepare(sql) {
  let i = 1;
  // Replace ? placeholders with $1, $2, etc. for Postgres
  let pgSql = sql.replace(/\?/g, () => `$${i++}`);
  // Replace SQLite datetime('now') with Postgres CURRENT_TIMESTAMP
  pgSql = pgSql.replace(/datetime\('now'\)/ig, 'CURRENT_TIMESTAMP');

  return {
    async all(...params) {
      const res = await pool.query(pgSql, params);
      return res.rows;
    },
    async get(...params) {
      const res = await pool.query(pgSql, params);
      return res.rows[0];
    },
    async run(...params) {
      let finalSql = pgSql;
      // In Postgres, we need RETURNING id to get the inserted row's ID
      if (finalSql.trim().toUpperCase().startsWith('INSERT') && !finalSql.toUpperCase().includes('RETURNING')) {
        finalSql += ' RETURNING id';
      }
      const res = await pool.query(finalSql, params);
      return {
        lastInsertRowid: res.rows[0]?.id || 0,
        changes: res.rowCount
      };
    }
  };
}

async function initDatabase() {
  // If no DB URL is provided, we can't initialize
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.warn("POSTGRES_URL/DATABASE_URL is not set. Skipped DB initialization.");
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      details TEXT,
      start_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS billing (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      invoice_number TEXT,
      amount NUMERIC NOT NULL DEFAULT 0,
      billing_date DATE NOT NULL,
      due_date DATE,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL DEFAULT 0,
      payment_date DATE NOT NULL,
      payment_method TEXT,
      reference_number TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('debit', 'credit')),
      amount NUMERIC NOT NULL DEFAULT 0,
      transaction_date DATE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      date_of_joining DATE NOT NULL,
      designation TEXT NOT NULL,
      place_of_posting TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS salaries (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL DEFAULT 0,
      effective_from DATE NOT NULL,
      payment_frequency TEXT DEFAULT 'monthly',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'half_day', 'leave')),
      check_in TIME,
      check_out TIME,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, attendance_date)
    )
  `);
}

module.exports = { prepare, initDatabase, pool };
