const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d';

// Register with email and password
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user exists
        const existingUser = await db.get('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Create user
        const result = await db.run(
            'INSERT INTO users (email, password_hash, name, provider) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, password_hash, name, 'local']
        );

        const user = {
            id: result.id,
            email,
            name,
            provider: 'local'
        };

        // Generate JWT
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        res.status(201).json({ token, user });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login with email and password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await db.get('SELECT id, email, password_hash, name, provider FROM users WHERE email = $1', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const userProfile = {
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider
        };

        const token = jwt.sign(userProfile, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        res.json({ token, user: userProfile });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user (protected)
router.get('/me', (req, res) => {
    // This route requires the auth middleware to be applied
    try {
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

module.exports = router;
