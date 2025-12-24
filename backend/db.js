const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        const isProduction = process.env.NODE_ENV === 'production';

        this.pool = new Pool({
            connectionString: databaseUrl,
            ssl: isProduction
                ? { rejectUnauthorized: false }
                : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('connect', () => {
            console.log('PostgreSQL connected');
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected PostgreSQL error', err);
        });

        console.log('PostgreSQL connection pool created');
    }

    _convertParams(sql, params = []) {
        let paramIndex = 1;
        const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        return { sql: convertedSql, params };
    }

    async run(sql, params = []) {
        const { sql: convertedSql, params: convertedParams } =
            this._convertParams(sql, params);

        const result = await this.pool.query(convertedSql, convertedParams);

        if (
            convertedSql.toUpperCase().includes('INSERT') &&
            result.rows?.length
        ) {
            return { id: result.rows[0].id, changes: result.rowCount };
        }

        return { id: null, changes: result.rowCount };
    }

    async get(sql, params = []) {
        const { sql: convertedSql, params: convertedParams } =
            this._convertParams(sql, params);

        const result = await this.pool.query(convertedSql, convertedParams);
        return result.rows[0] || null;
    }

    async all(sql, params = []) {
        const { sql: convertedSql, params: convertedParams } =
            this._convertParams(sql, params);

        const result = await this.pool.query(convertedSql, convertedParams);
        return result.rows;
    }

    async close() {
        await this.pool.end();
        console.log('Database connection pool closed');
    }
}

module.exports = new Database();
