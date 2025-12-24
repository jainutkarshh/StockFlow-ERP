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
        // Verify DATABASE_URL
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Read migration file using absolute path
        const migrationPath = path.join(__dirname, 'migrations_postgresql.sql');
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found at: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        if (!migrationSQL || migrationSQL.trim().length === 0) {
            throw new Error('Migration SQL file is empty');
        }

        // Execute migrations (idempotent - safe to run multiple times)
        await pool.query(migrationSQL);
        
        console.log('✅ PostgreSQL migrations executed successfully');
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        await pool.end();
    }
}

module.exports = runMigrations;
