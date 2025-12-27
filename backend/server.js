const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const runMigrations = require('./runMigrations');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5001;

// Run migrations at startup
(async () => {
    try {
        await runMigrations();
    } catch (error) {
        console.error('Failed to run migrations:', error.message);
        process.exit(1);
    }
})();

// Middleware
app.use(cors({
    origin: 'https://stock-flow-erp.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

// Import auth middleware and routes
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

// Import routes
const productsRoutes = require('./routes/products');
const partiesRoutes = require('./routes/parties');
const stockRoutes = require('./routes/stock');
const paymentsRoutes = require('./routes/payments');
const ledgerRoutes = require('./routes/ledger');
const dashboardRoutes = require('./routes/dashboard');

// Auth routes (no protection required)
app.use('/api/auth', authRoutes);

// Health check endpoints (public)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Protected API routes
app.use('/api/products', authenticateToken, productsRoutes);
app.use('/api/parties', authenticateToken, partiesRoutes);
app.use('/api/stock', authenticateToken, stockRoutes);
app.use('/api/payments', authenticateToken, paymentsRoutes);
app.use('/api/ledger', authenticateToken, ledgerRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'Water Distribution System API',
        authentication: {
            description: 'All endpoints (except /api/auth/*) require Authorization header with JWT token',
            example: 'Authorization: Bearer <token>'
        },
        endpoints: {
            auth: {
                POST_register: '/api/auth/register',
                POST_login: '/api/auth/login',
                GET_me: '/api/auth/me (requires auth)'
            },
            products: {
                GET: '/api/products',
                POST: '/api/products',
                PUT: '/api/products/:id',
                DELETE: '/api/products/:id'
            },
            parties: {
                GET: '/api/parties',
                POST: '/api/parties',
                PUT: '/api/parties/:id',
                GET_balance: '/api/parties/:id/balance',
                GET_ledger: '/api/parties/:id/ledger'
            },
            stock: {
                POST_in: '/api/stock/in',
                POST_out: '/api/stock/out',
                GET_current: '/api/stock/current',
                GET_low: '/api/stock/low-stock'
            },
            payments: {
                POST: '/api/payments',
                GET: '/api/payments/:party_id',
                POST_clear: '/api/payments/clear/:party_id'
            },
            ledger: {
                GET: '/api/ledger/:party_id',
                GET_all: '/api/ledger'
            }
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
});
