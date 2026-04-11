// Run schema.sql
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema.sql...');
    await pool.query(schema);
    console.log('Schema executed successfully');

    pool.end();
  } catch (err) {
    console.error('Error running schema:', err.message);
    pool.end();
    process.exit(1);
  }
}

runSchema();