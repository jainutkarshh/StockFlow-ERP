-- PostgreSQL Schema for Water Distribution System
-- 1:1 mapping from SQLite schema
-- Run this file to initialize the database

-- Users table for authentication (MUST BE CREATED FIRST)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'local' CHECK(provider IN ('local', 'google')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    size TEXT NOT NULL,
    purchase_rate DECIMAL(10,2) NOT NULL,
    sale_rate DECIMAL(10,2) NOT NULL,
    min_stock INTEGER DEFAULT 10,
    current_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('client', 'supplier')),
    phone TEXT,
    address TEXT,
    opening_balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    party_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    invoice_no TEXT,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (party_id) REFERENCES parties(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    party_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('cash', 'online')),
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_transactions_party ON stock_transactions(party_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(date);
CREATE INDEX IF NOT EXISTS idx_payments_party ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ========================================
-- SAFE MULTI-TENANT MIGRATION (IDEMPOTENT)
-- ========================================
-- Add user_id columns safely without breaking existing data

-- Add user_id to products (allow NULL initially)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE products ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        -- Backfill existing rows with admin user (id=1)
        UPDATE products SET user_id = 1 WHERE user_id IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
        -- Create index
        CREATE INDEX idx_products_user ON products(user_id);
    END IF;
END $$;

-- Add user_id to parties (allow NULL initially)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'parties' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE parties ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        -- Backfill existing rows with admin user (id=1)
        UPDATE parties SET user_id = 1 WHERE user_id IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE parties ALTER COLUMN user_id SET NOT NULL;
        -- Drop old unique constraint and create new one with user_id
        ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_name_key;
        ALTER TABLE parties ADD CONSTRAINT parties_user_id_name_unique UNIQUE(user_id, name);
        -- Create index
        CREATE INDEX idx_parties_user ON parties(user_id);
    END IF;
END $$;

-- Add user_id to stock_transactions (allow NULL initially)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE stock_transactions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        -- Backfill existing rows with admin user (id=1)
        UPDATE stock_transactions SET user_id = 1 WHERE user_id IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE stock_transactions ALTER COLUMN user_id SET NOT NULL;
        -- Create index
        CREATE INDEX idx_stock_transactions_user ON stock_transactions(user_id);
    END IF;
END $$;

-- Add user_id to payments (allow NULL initially)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        -- Backfill existing rows with admin user (id=1)
        UPDATE payments SET user_id = 1 WHERE user_id IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
        -- Create index
        CREATE INDEX idx_payments_user ON payments(user_id);
    END IF;
END $$;
