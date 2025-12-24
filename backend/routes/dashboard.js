const express = require('express');
const db = require('../db');
const router = express.Router();

// Get top 5 selling products based on stock OUT transactions
router.get('/top-products', async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                p.id,
                p.name AS product,
                SUM(st.quantity) AS quantity
            FROM stock_transactions st
            JOIN products p ON st.product_id = p.id
            WHERE st.type = 'OUT' AND st.user_id = $1
            GROUP BY p.id, p.name
            ORDER BY quantity DESC
            LIMIT 5
        `;

        const results = await db.all(query, [userId]);
        
        res.json(results || []);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ 
            error: 'Failed to fetch top products',
            message: error.message 
        });
    }
});

module.exports = router;
