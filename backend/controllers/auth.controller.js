import bcryptjs from 'bcryptjs';
import User, { ALLOWED_ROLES } from '../models/User.model.js';
import { genToken } from '../config/token.js';

export const register = async (req, res) => {
    // 1. Extract userName, userID, password, and roles
    const { userName, userID, password, roles } = req.body;

    try {
        // 2. Validate payload presence
        if (!userName || !userID || !password) {
            return res.status(400).json({ message: 'Username, userID, and password are required' });
        }

        // 3. Enforce schema and logic constraints
        if (typeof userName !== 'string' || userName.trim().length === 0) {
            return res.status(400).json({ message: 'Valid userName is required' });
        }

        if (typeof userID !== 'string' || !userID.startsWith('OR')) {
            return res.status(400).json({ message: 'userID must start with "OR"' });
        }

        if (userID.length > 25) {
            return res.status(400).json({ message: 'userID must not exceed 25 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Validate roles if provided
        const assignedRole = roles ? roles.toUpperCase().trim() : 'OR';
        if (!ALLOWED_ROLES.includes(assignedRole)) {
            return res.status(400).json({
                message: `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
            });
        }

        // 4. Check for existing user (checking userID to enforce uniqueness)
        const existingUser = await User.findOne({ userID });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this userID already exists' });
        }

        // 5. Hash password explicitly
        const saltRounds = 10;
        const hashedPassword = await bcryptjs.hash(password, saltRounds);

        // 6. Persist new user with roles included
        const newUser = await User.create({
            userName,
            userID,
            password: hashedPassword,
            roles: assignedRole,
        });

        // 7. Generate token with role embedded
        const token = genToken(newUser.userID, newUser.roles);

        // 8. Send sanitized response (exclude password, include roles)
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                userName: newUser.userName,
                userID: newUser.userID,
                roles: newUser.roles,
                createdAt: newUser.createdAt,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    const { userID, password } = req.body;

    try {
        // 1. Validate payload presence
        if (!userID || !password) {
            return res.status(400).json({ message: 'UserID and password are required' });
        }

        // 2. Validate prefix format
        if (typeof userID !== 'string' || !userID.startsWith('OR')) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Find unique user
        const existingUser = await User.findOne({ userID });
        if (!existingUser) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Compare hash
        const isPasswordValid = await bcryptjs.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 5. Generate token with user role (fallback to 'OR' for legacy records)
        const userRole = existingUser.roles || 'OR';
        const token = genToken(existingUser.userID, userRole);

        // 6. Return token and safe user fields including roles
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: existingUser._id,
                userName: existingUser.userName,
                userID: existingUser.userID,
                roles: userRole,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
