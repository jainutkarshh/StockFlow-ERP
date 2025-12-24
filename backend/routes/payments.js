const express = require('express');
const router = express.Router();
const db = require('../db');

/*
---------------------------------------------------------
PAYMENT INSERT (FIXED)
---------------------------------------------------------
All payments are stored as POSITIVE numbers.
The balance formula handles the effect on each party type.
---------------------------------------------------------
*/

// Create payment
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { party_id, amount, mode, date, note } = req.body;

        console.log('[PAYMENT] Received payment request:', {
            party_id,
            amount,
            amount_type: typeof amount,
            mode,
            date,
            note
        });

        const party = await db.get(`SELECT type FROM parties WHERE id = $1 AND user_id = $2`, [party_id, userId]);
        if (!party) return res.status(404).json({ error: "Party not found" });

        // ALWAYS store payments as positive
        const finalAmount = Math.abs(amount);
        console.log('[PAYMENT] Final amount to store:', finalAmount, 'Type:', typeof finalAmount);

        const result = await db.run(
            `INSERT INTO payments (user_id, party_id, amount, mode, date, note)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [userId, party_id, finalAmount, mode, date || new Date().toISOString().split("T")[0], note]
        );

        const payment = await db.get(`SELECT * FROM payments WHERE id = $1 AND user_id = $2`, [result.id, userId]);
        res.status(201).json(payment);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/*
---------------------------------------------------------
CLEAR BALANCE (UNIVERSAL FIX)
---------------------------------------------------------
This route handles all corner cases and ensures the correct sign
for supplier/client settlement entries.
---------------------------------------------------------
*/

// Clear balance (UNIVERSAL FIX)
router.post('/clear/:party_id', async (req, res) => {
    try {
        const userId = req.user.id;
        const partyId = req.params.party_id;

        // Get party
        const party = await db.get(`SELECT * FROM parties WHERE id = $1 AND user_id = $2`, [partyId, userId]);
        if (!party) return res.status(404).json({ error: "Party not found" });

        // Fetch totals
        const sales = await db.get(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM stock_transactions
            WHERE party_id = $1 AND user_id = $2 AND type = 'OUT'
        `, [partyId, userId]);

        const purchases = await db.get(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM stock_transactions
            WHERE party_id = $1 AND user_id = $2 AND type = 'IN'
        `, [partyId, userId]);

        const payments = await db.get(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE party_id = $1 AND user_id = $2
        `, [partyId, userId]);

        // Convert all DECIMAL string values from PostgreSQL to numbers
        const salesTotal = parseFloat(sales.total) || 0;
        const purchasesTotal = parseFloat(purchases.total) || 0;
        const paymentsTotal = parseFloat(payments.total) || 0;
        const openingBalance = parseFloat(party.opening_balance) || 0;

        let balance = 0;

        // CORRECT BALANCE ENGINE
        if (party.type === 'supplier') {
            // Supplier: balance = -purchases + payments + opening
            // (we owe supplier purchases amount, payments reduce what we owe)
            balance = -purchasesTotal + paymentsTotal + openingBalance;
        } else {
            // Client: balance = opening + sales - purchases - payments
            balance = openingBalance + salesTotal - purchasesTotal - paymentsTotal;
        }

        // Fix floating-point errors - use tolerance instead of exact equality
        if (Math.abs(balance) < 0.01) {
            balance = 0;
        }

        if (balance === 0) {
            return res.status(400).json({ error: "No balance to clear" });
        }

        // Settlement amount is always positive
        const settlementAmount = Math.abs(balance);

        // GUARD: Check if a settlement payment already exists for this balance
        // Settlement payments have note = "Full Balance Settlement"
        const existingSettlement = await db.get(`
            SELECT COUNT(*) as count FROM payments 
            WHERE party_id = $1 AND user_id = $2 AND note = 'Full Balance Settlement'
        `, [partyId, userId]);

        if (existingSettlement && existingSettlement.count > 0) {
            return res.status(400).json({ 
                error: "Balance already settled. Cannot create duplicate settlement." 
            });
        }

        // Insert settlement entry
        const result = await db.run(
            `INSERT INTO payments (user_id, party_id, amount, mode, date, note)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
                userId,
                partyId,
                settlementAmount,
                "cash",
                new Date().toISOString().split("T")[0],
                "Full Balance Settlement"
            ]
        );

        res.json({
            message: "Balance cleared successfully",
            previous_balance: balance,
            settlement_amount: settlementAmount,
            new_balance: 0
        });

    } catch (err) {
        console.error("CLEAR BALANCE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


// Get payments by party
router.get('/:party_id', async (req, res) => {
    try {
        const userId = req.user.id;
        const payments = await db.all(`
            SELECT p.*, pt.name as party_name 
            FROM payments p
            JOIN parties pt ON p.party_id = pt.id
            WHERE p.party_id = $1 AND p.user_id = $2
            ORDER BY p.date DESC, p.created_at DESC
        `, [req.params.party_id, userId]);

        res.json(payments);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all payments
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const payments = await db.all(`
            SELECT 
                p.*,
                pt.name as party_name,
                pt.type as party_type
            FROM payments p
            JOIN parties pt ON p.party_id = pt.id
            WHERE p.user_id = $1
            ORDER BY p.date DESC, p.created_at DESC
        `, [userId]);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
