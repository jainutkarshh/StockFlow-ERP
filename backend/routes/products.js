const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await db.all('SELECT * FROM products ORDER BY brand, name, size');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await db.get('SELECT * FROM products WHERE id = $1', [req.params.id]);
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
        const { name, brand, size, purchase_rate, sale_rate, min_stock } = req.body;
        const result = await db.run(
            'INSERT INTO products (name, brand, size, purchase_rate, sale_rate, min_stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, brand, size, purchase_rate, sale_rate, min_stock || 10]
        );
        const product = await db.get('SELECT * FROM products WHERE id = $1', [result.id]);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { name, brand, size, purchase_rate, sale_rate, min_stock } = req.body;
        await db.run(
            'UPDATE products SET name = $1, brand = $2, size = $3, purchase_rate = $4, sale_rate = $5, min_stock = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [name, brand, size, purchase_rate, sale_rate, min_stock, req.params.id]
        );
        const product = await db.get('SELECT * FROM products WHERE id = $1', [req.params.id]);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
