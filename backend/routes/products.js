const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const products = await db.all('SELECT * FROM products WHERE user_id = $1 ORDER BY brand, name, size', [userId]);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const product = await db.get('SELECT * FROM products WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, brand, size, purchase_rate, sale_rate, min_stock } = req.body;
        const result = await db.run(
            'INSERT INTO products (user_id, name, brand, size, purchase_rate, sale_rate, min_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, name, brand, size, purchase_rate, sale_rate, min_stock || 10]
        );
        const product = await db.get('SELECT * FROM products WHERE id = $1 AND user_id = $2', [result.id, userId]);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, brand, size, purchase_rate, sale_rate, min_stock } = req.body;
        await db.run(
            'UPDATE products SET name = $1, brand = $2, size = $3, purchase_rate = $4, sale_rate = $5, min_stock = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8',
            [name, brand, size, purchase_rate, sale_rate, min_stock, req.params.id, userId]
        );
        const product = await db.get('SELECT * FROM products WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        await db.run('DELETE FROM products WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
