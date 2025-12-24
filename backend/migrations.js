const db = require('./db');

async function createTables() {
    try {
        // Products table
        await db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                brand TEXT NOT NULL,
                size TEXT NOT NULL,
                purchase_rate DECIMAL(10,2) NOT NULL,
                sale_rate DECIMAL(10,2) NOT NULL,
                min_stock INTEGER DEFAULT 10,
                current_stock INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Parties table
        await db.run(`
            CREATE TABLE IF NOT EXISTS parties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                type TEXT CHECK(type IN ('client', 'supplier')) NOT NULL,
                phone TEXT,
                address TEXT,
                opening_balance DECIMAL(10,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Stock transactions table
        await db.run(`
            CREATE TABLE IF NOT EXISTS stock_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                party_id INTEGER,
                type TEXT CHECK(type IN ('IN', 'OUT')) NOT NULL,
                quantity INTEGER NOT NULL,
                rate DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                invoice_no TEXT,
                date DATE NOT NULL,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (party_id) REFERENCES parties(id)
            )
        `);

        // Payments table
        await db.run(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                party_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                mode TEXT CHECK(mode IN ('cash', 'online')) NOT NULL,
                date DATE NOT NULL,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (party_id) REFERENCES parties(id)
            )
        `);

        // Users table for authentication
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                name TEXT NOT NULL,
                provider TEXT CHECK(provider IN ('local', 'google')) DEFAULT 'local',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await db.run('CREATE INDEX IF NOT EXISTS idx_stock_transactions_party ON stock_transactions(party_id)');
        await db.run('CREATE INDEX IF NOT EXISTS idx_stock_transactions_product ON stock_transactions(product_id)');
        await db.run('CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(date)');
        await db.run('CREATE INDEX IF NOT EXISTS idx_payments_party ON payments(party_id)');
        await db.run('CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date)');
        await db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

        console.log('All tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// Run migrations
createTables().then(() => {
    console.log('Migration completed');
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
