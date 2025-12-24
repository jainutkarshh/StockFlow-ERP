const express = require('express');
const router = express.Router();
const db = require('../db');

// Stock IN (Purchase)
router.post('/in', async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, party_id, quantity, rate, invoice_no, date, note } = req.body;
        const total_amount = quantity * rate;

        // Start transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Insert stock transaction
            const result = await client.query(
                `INSERT INTO stock_transactions 
                (user_id, product_id, party_id, type, quantity, rate, total_amount, invoice_no, date, note) 
                VALUES ($1, $2, $3, 'IN', $4, $5, $6, $7, $8, $9) RETURNING id`,
                [userId, product_id, party_id, quantity, rate, total_amount, invoice_no, date || new Date().toISOString().split('T')[0], note]
            );

            // Update product stock
            await client.query(
                'UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [quantity, product_id, userId]
            );

            await client.query('COMMIT');

            const transaction = await db.get(
                'SELECT * FROM stock_transactions WHERE id = $1 AND user_id = $2',
                [result.rows[0].id, userId]
            );

            res.status(201).json(transaction);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stock OUT (Sale)
router.post('/out', async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, party_id, quantity, rate, invoice_no, date, note } = req.body;
        const total_amount = quantity * rate;

        // Check stock availability
        const product = await db.get('SELECT current_stock FROM products WHERE id = $1 AND user_id = $2', [product_id, userId]);
        if (!product || product.current_stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Start transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Insert stock transaction
            const result = await client.query(
                `INSERT INTO stock_transactions 
                (user_id, product_id, party_id, type, quantity, rate, total_amount, invoice_no, date, note) 
                VALUES ($1, $2, $3, 'OUT', $4, $5, $6, $7, $8, $9) RETURNING id`,
                [userId, product_id, party_id, quantity, rate, total_amount, invoice_no, date || new Date().toISOString().split('T')[0], note]
            );

            // Update product stock
            await client.query(
                'UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [quantity, product_id, userId]
            );

            await client.query('COMMIT');

            const transaction = await db.get(
                'SELECT * FROM stock_transactions WHERE id = $1 AND user_id = $2',
                [result.rows[0].id, userId]
            );

            res.status(201).json(transaction);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current stock
router.get('/current', async (req, res) => {
    try {
        const userId = req.user.id;
        const stock = await db.all(`
            SELECT 
                p.*,
                (SELECT COALESCE(SUM(quantity), 0) 
                 FROM stock_transactions 
                 WHERE product_id = p.id AND user_id = $1 AND type = 'IN') as total_in,
                (SELECT COALESCE(SUM(quantity), 0) 
                 FROM stock_transactions 
                 WHERE product_id = p.id AND user_id = $1 AND type = 'OUT') as total_out,
                p.current_stock,
                CASE 
                    WHEN p.current_stock <= p.min_stock THEN 'LOW'
                    ELSE 'OK'
                END as stock_status
            FROM products p
            WHERE p.user_id = $1
            ORDER BY p.brand, p.name, p.size
        `, [userId]);
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get low stock alerts
router.get('/low-stock', async (req, res) => {
    try {
        const userId = req.user.id;
        const lowStock = await db.all(`
            SELECT 
                p.*,
                p.current_stock,
                p.min_stock,
                (p.min_stock - p.current_stock) as required_qty
            FROM products p
            WHERE p.user_id = $1 AND p.current_stock <= p.min_stock
            ORDER BY (p.min_stock - p.current_stock) DESC
        `, [userId]);
        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get stock history
router.get('/history/:product_id', async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await db.all(`
            SELECT 
                st.*,
                p.name as product_name,
                p.brand,
                p.size,
                pt.name as party_name,
                pt.type as party_type
            FROM stock_transactions st
            LEFT JOIN products p ON st.product_id = p.id AND p.user_id = $1
            LEFT JOIN parties pt ON st.party_id = pt.id AND pt.user_id = $1
            WHERE st.product_id = $1 AND st.user_id = $2
            ORDER BY st.date DESC, st.created_at DESC
        `, [userId, userId]);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
