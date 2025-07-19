const express = require('express');
const { register, login, logout, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authRateLimit, apiRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes (with stricter rate limiting)
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);

// Protected routes
router.post('/logout', apiRateLimit, verifyToken, logout);
router.get('/profile', apiRateLimit, verifyToken, getProfile);

module.exports = router;
