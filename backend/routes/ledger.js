const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all balances summary (MUST come before /:party_id to prevent route matching issues)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('[LEDGER] GET / - Starting balances query');
        const startTime = Date.now();
        
        const balances = await db.all(`
            SELECT 
                pt.id,
                pt.name,
                pt.type,
                pt.phone,
                pt.opening_balance,
                pt.type as party_type,
                COALESCE(st_out.total_sales, 0) as total_sales,
                COALESCE(st_in.total_purchases, 0) as total_purchases,
                COALESCE(py.total_payments, 0) as total_payments
            FROM parties pt
            LEFT JOIN (
                SELECT party_id, SUM(total_amount) as total_sales
                FROM stock_transactions
                WHERE type = 'OUT' AND user_id = $1
                GROUP BY party_id
            ) st_out ON pt.id = st_out.party_id
            LEFT JOIN (
                SELECT party_id, SUM(total_amount) as total_purchases
                FROM stock_transactions
                WHERE type = 'IN' AND user_id = $1
                GROUP BY party_id
            ) st_in ON pt.id = st_in.party_id
            LEFT JOIN (
                SELECT party_id, SUM(amount) as total_payments
                FROM payments
                WHERE user_id = $1
                GROUP BY party_id
            ) py ON pt.id = py.party_id
            WHERE pt.user_id = $1
            ORDER BY pt.name
        `, [userId]);

        console.log(`[LEDGER] Query completed in ${Date.now() - startTime}ms, rows: ${balances.length}`);

        const balancesWithCalculations = balances.map(balance => {
            // Convert all DECIMAL string values from PostgreSQL to numbers
            const totalSales = parseFloat(balance.total_sales) || 0;
            const totalPurchases = parseFloat(balance.total_purchases) || 0;
            const totalPayments = parseFloat(balance.total_payments) || 0;
            const openingBalance = parseFloat(balance.opening_balance) || 0;

            let currentBalance;
            if (balance.party_type === 'supplier') {
                // Supplier: balance = -purchases + payments + opening
                // (we owe supplier purchases amount, payments reduce what we owe)
                currentBalance = -totalPurchases + totalPayments + openingBalance;
            } else {
                // Client: balance = opening + sales - purchases - payments
                // (they owe us sales, purchases are irrelevant for client, payments reduce what they owe)
                currentBalance = openingBalance + totalSales - totalPurchases - totalPayments;
            }
            
            // Fix floating-point errors - use tolerance (0.01 rupees = 1 paisa)
            if (Math.abs(currentBalance) < 0.01) {
                currentBalance = 0;
            }
            
            return {
                ...balance,
                current_balance: currentBalance
            };
        });

        // Sort by absolute balance (descending) then by name (ascending)
        balancesWithCalculations.sort((a, b) => {
            const absA = Math.abs(a.current_balance);
            const absB = Math.abs(b.current_balance);
            if (absB !== absA) {
                return absB - absA;
            }
            return a.name.localeCompare(b.name);
        });

        // Calculate totals
        const totals = balancesWithCalculations.reduce((acc, curr) => {
            acc.total_receivable = curr.party_type === 'client' ? 
                acc.total_receivable + (curr.current_balance > 0 ? curr.current_balance : 0) : 
                acc.total_receivable;
            acc.total_payable = curr.party_type === 'supplier' ? 
                acc.total_payable + (curr.current_balance < 0 ? Math.abs(curr.current_balance) : 0) : 
                acc.total_payable;
            return acc;
        }, { total_receivable: 0, total_payable: 0 });

        res.json({
            balances: balancesWithCalculations,
            summary: totals
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ledger for specific party
router.get('/:party_id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { from_date, to_date } = req.query;
        const params = [req.params.party_id, userId];
        
        let dateFilter = '';
        if (from_date && to_date) {
            params.push(from_date, to_date);
            dateFilter = ` AND date BETWEEN $3 AND $4`;
        }

        const query = `
            SELECT 
                'Sale' as transaction_type,
                st.date,
                st.total_amount as debit,
                0 as credit,
                CONCAT('Sale - ', COALESCE(st.invoice_no, ''), ' - ', p.name, ' ', p.size) as description,
                st.note,
                NULL as running_balance
            FROM stock_transactions st
            JOIN products p ON st.product_id = p.id
            WHERE st.party_id = $1 AND st.user_id = $2 AND st.type = 'OUT'${dateFilter}
            
            UNION ALL
            
            SELECT 
                'Purchase' as transaction_type,
                st.date,
                0 as debit,
                st.total_amount as credit,
                CONCAT('Purchase - ', COALESCE(st.invoice_no, ''), ' - ', p.name, ' ', p.size) as description,
                st.note,
                NULL as running_balance
            FROM stock_transactions st
            JOIN products p ON st.product_id = p.id
            WHERE st.party_id = $1 AND st.user_id = $2 AND st.type = 'IN'${dateFilter}
            
            UNION ALL
            
            SELECT 
                'Payment' as transaction_type,
                py.date,
                0 as debit,
                py.amount as credit,
                CONCAT('Payment (', py.mode, ')') as description,
                py.note,
                NULL as running_balance
            FROM payments py
            WHERE py.party_id = $1 AND py.user_id = $2${dateFilter}
            
            ORDER BY date, transaction_type
        `;

        const transactions = await db.all(query, params);
        console.log('[LEDGER] Raw transactions:', JSON.stringify(transactions, null, 2));

        // Get opening balance and party type
        const party = await db.get('SELECT * FROM parties WHERE id = $1 AND user_id = $2', [req.params.party_id, userId]);
        console.log('[LEDGER] Party:', JSON.stringify(party, null, 2));
        
        // Calculate running balance based on party type
        let runningBalance = parseFloat(party.opening_balance) || 0;
        console.log('[LEDGER] Starting balance:', runningBalance);
        
        const ledgerWithBalance = transactions.map(transaction => {
            const debit = parseFloat(transaction.debit) || 0;
            const credit = parseFloat(transaction.credit) || 0;
            
            if (party.type === 'supplier') {
                // SUPPLIER: balance = -purchases + payments + opening
                // Sales increase what they owe us (positive)
                // Purchases increase what we owe them (negative)
                // Payments reduce what we owe them (increase balance)
                if (transaction.transaction_type === 'Sale') {
                    runningBalance += debit;
                } else if (transaction.transaction_type === 'Purchase') {
                    runningBalance -= credit;
                } else if (transaction.transaction_type === 'Payment') {
                    runningBalance += credit;
                }
            } else {
                // CLIENT: balance = opening + sales - purchases - payments
                // Sales increase what they owe us (positive)
                // Purchases decrease what they owe us (negative)
                // Payments reduce what they owe us (negative)
                if (transaction.transaction_type === 'Sale') {
                    runningBalance += debit;
                } else if (transaction.transaction_type === 'Purchase') {
                    runningBalance -= credit;
                } else if (transaction.transaction_type === 'Payment') {
                    runningBalance -= credit;
                }
            }
            console.log(`[LEDGER] ${transaction.transaction_type} | debit=${debit} credit=${credit} | runningBalance=${runningBalance}`);
            return {
                ...transaction,
                running_balance: runningBalance
            };
        });

        res.json({
            party_id: party.id,
            party_name: party.name,
            party_type: party.type,
            opening_balance: party.opening_balance,
            transactions: ledgerWithBalance,
            closing_balance: runningBalance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
