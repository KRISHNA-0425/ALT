import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Authentication Middleware:
 * Verifies JWT from Authorization header ('Bearer <token>')
 */
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Authentication required. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user or attach decoded payload
        const user = await User.findOne({ userID: decoded.userID }).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User belonging to token no longer exists.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('JWT verification error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

/**
 * RBAC (Role-Based Access Control) Middleware:
 * Validates whether the authenticated user has one of the required roles.
 * Usage: authorizeRoles("ADM", "DEV")
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. Please login first.' });
        }

        const userRole = req.user.roles;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `Access denied. Role '${userRole}' is not authorized to access this resource.`,
            });
        }

        next();
    };
};
