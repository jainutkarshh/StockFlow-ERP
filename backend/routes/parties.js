const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all parties
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const parties = await db.all('SELECT * FROM parties WHERE user_id = $1 ORDER BY name', [userId]);
        res.json(parties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single party
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
        if (!party) {
            return res.status(404).json({ error: 'Party not found' });
        }
        res.json(party);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create party
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, type, phone, address, opening_balance } = req.body;
        const result = await db.run(
            'INSERT INTO parties (user_id, name, type, phone, address, opening_balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, name, type, phone, address, opening_balance || 0]
        );
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [result.id, userId]);
        res.status(201).json(party);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update party
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, type, phone, address, opening_balance } = req.body;
        await db.run(
            'UPDATE parties SET name = $1, type = $2, phone = $3, address = $4, opening_balance = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7',
            [name, type, phone, address, opening_balance, req.params.id, userId]
        );
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
        res.json(party);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete party
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const partyId = req.params.id;
        
        // First verify party exists and belongs to user
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [partyId, userId]);
        if (!party) {
            return res.status(404).json({ error: 'Party not found' });
        }

        // Delete related records first (due to foreign key constraints)
        await db.run('DELETE FROM payments WHERE party_id = $1 AND user_id = $2', [partyId, userId]);
        await db.run('DELETE FROM stock_transactions WHERE party_id = $1 AND user_id = $2', [partyId, userId]);
        
        // Finally delete the party
        await db.run('DELETE FROM parties WHERE id = $1 AND user_id = $2', [partyId, userId]);
        
        res.json({ message: 'Party deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get party balance
router.get('/:id/balance', async (req, res) => {
    try {
        const userId = req.user.id;
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
        if (!party) {
            return res.status(404).json({ error: 'Party not found' });
        }

        // Calculate current balance
        const sales = await db.get(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM stock_transactions 
            WHERE party_id = $1 AND user_id = $2 AND type = 'OUT'
        `, [req.params.id, userId]);

        const purchases = await db.get(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM stock_transactions 
            WHERE party_id = $1 AND user_id = $2 AND type = 'IN'
        `, [req.params.id, userId]);

        const payments = await db.get(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM payments 
            WHERE party_id = $1 AND user_id = $2
        `, [req.params.id, userId]);

        // Convert all DECIMAL string values from PostgreSQL to numbers
        const salesTotal = parseFloat(sales.total) || 0;
        const purchasesTotal = parseFloat(purchases.total) || 0;
        const paymentsTotal = parseFloat(payments.total) || 0;
        const openingBalance = parseFloat(party.opening_balance) || 0;

        let balance;
        if (party.type === 'supplier') {
            // Supplier: balance = -purchases + payments + opening
            // We owe them what we purchased, payments reduce the debt
            balance = -purchasesTotal + paymentsTotal + openingBalance;
        } else {
            // Client: balance = opening + sales - purchases - payments
            // They owe us sales, payments reduce what they owe
            balance = openingBalance + salesTotal - purchasesTotal - paymentsTotal;
        }

        // Fix floating-point errors - use tolerance (0.01 rupees = 1 paisa)
        if (Math.abs(balance) < 0.01) {
            balance = 0;
        }

        res.json({
            party_id: party.id,
            party_name: party.name,
            party_type: party.type,
            opening_balance: party.opening_balance,
            total_sales: salesTotal,
            total_purchases: purchasesTotal,
            total_payments: paymentsTotal,
            current_balance: balance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get party ledger
router.get('/:id/ledger', async (req, res) => {
    try {
        const userId = req.user.id;
        const ledger = await db.all(`
            SELECT 
                'Sale' as type,
                date,
                total_amount as debit,
                0 as credit,
                CONCAT('Stock OUT - ', COALESCE(invoice_no, '')) as note,
                NULL as running_balance
            FROM stock_transactions 
            WHERE party_id = $1 AND user_id = $2 AND type = 'OUT'
            
            UNION ALL
            
            SELECT 
                'Purchase' as type,
                date,
                0 as debit,
                total_amount as credit,
                CONCAT('Stock IN - ', COALESCE(invoice_no, '')) as note,
                NULL as running_balance
            FROM stock_transactions 
            WHERE party_id = $1 AND user_id = $2 AND type = 'IN'
            
            UNION ALL
            
            SELECT 
                'Payment' as type,
                date,
                0 as debit,
                amount as credit,
                CONCAT('Payment (', mode, ') - ', COALESCE(note, '')) as note,
                NULL as running_balance
            FROM payments 
            WHERE party_id = $1 AND user_id = $2
            
            ORDER BY date
        `, [req.params.id, userId]);

        // Get party to determine type
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [req.params.id, userId]);

        // Calculate running balance
        let runningBalance = party.opening_balance || 0;
        const ledgerWithBalance = ledger.map(entry => {
            if (party.type === 'supplier') {
                // SUPPLIER: balance = -purchases + payments + opening
                // Sales: increase what they owe us
                // Purchase: increase what we owe them (negative)
                // Payment: reduce what we owe them (positive)
                if (entry.type === 'Sale') {
                    runningBalance += entry.debit;
                } else if (entry.type === 'Purchase') {
                    runningBalance -= entry.credit;
                } else if (entry.type === 'Payment') {
                    runningBalance += entry.credit;
                }
            } else {
                // CLIENT: balance = opening + sales - purchases - payments
                // Sales: increase what they owe us
                // Purchase: decrease what they owe us
                // Payment: reduce what they owe us
                if (entry.type === 'Sale') {
                    runningBalance += entry.debit;
                } else if (entry.type === 'Purchase') {
                    runningBalance -= entry.credit;
                } else if (entry.type === 'Payment') {
                    runningBalance -= entry.credit;
                }
            }
            return {
                ...entry,
                running_balance: runningBalance
            };
        });

        res.json(ledgerWithBalance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
