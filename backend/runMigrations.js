const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
    });

    try {
        const migrationPath = path.join(__dirname, 'migrations_postgresql.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        await pool.query(migrationSQL);
        console.log('✅ PostgreSQL migrations executed successfully');
        return true;
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

module.exports = runMigrations;
