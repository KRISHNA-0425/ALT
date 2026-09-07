import express from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);

// Authenticated route: Get current authenticated user
authRouter.get('/me', verifyToken, (req, res) => {
    res.status(200).json({ user: req.user });
});

// RBAC Example: Admin-only route
authRouter.get('/admin-dashboard', verifyToken, authorizeRoles('ADM'), (req, res) => {
    res.status(200).json({ message: 'Welcome Admin! You have access to this route.' });
});

export default authRouter;