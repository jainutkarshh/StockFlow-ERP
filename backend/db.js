const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
        // Use DATABASE_URL environment variable for connection
        const databaseUrl = process.env.DATABASE_URL;
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        this.pool = new Pool({
            connectionString: databaseUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });

        console.log('PostgreSQL connection pool created');
    }

    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    _convertParams(sql, params = []) {
        let paramIndex = 1;
        const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        return { sql: convertedSql, params };
    }

    async run(sql, params = []) {
        const { sql: convertedSql, params: convertedParams } = this._convertParams(sql, params);
        
        try {
            const result = await this.pool.query(convertedSql, convertedParams);
            
            // For INSERT statements, return the inserted row's id
            if (convertedSql.toUpperCase().includes('INSERT') && result.rows && result.rows.length > 0) {
                return { id: result.rows[0].id, changes: result.rowCount };
            }
            
            return { id: null, changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    async get(sql, params = []) {
        const { sql: convertedSql, params: convertedParams } = this._convertParams(sql, params);
        
        try {
            const result = await this.pool.query(convertedSql, convertedParams);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async all(sql, params = []) {
        const { sql: convertedSql, params: convertedParams } = this._convertParams(sql, params);
        
        try {
            const result = await this.pool.query(convertedSql, convertedParams);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    async close() {
        try {
            await this.pool.end();
            console.log('Database connection pool closed');
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new Database();
