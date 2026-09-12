/**
 * ==============================================================================
 * Server Entry Point - Backend REST API
 * ==============================================================================
 * Initializes Express, mounts security & CORS middlewares, establishes MongoDB
 * connection, and exposes REST endpoints for Authentication, Outreach,
 * Socio-Legal Counselling (SLC), and Case Document Attachments.
 * ==============================================================================
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDb from './config/connectDb.js';
import authRouter from './routers/auth.router.js';
import outreachRouter from './routers/outreach.route.js';
import slcRouter from './routers/slc.route.js';
import documentRouter from './routers/document.route.js';
import advocateRouter from './routers/advocate.route.js';
import notificationRouter from './routers/notification.route.js';
import path from 'path';

// Load default environment variables (.env)
dotenv.config();

// Override with production config if running in production mode
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production', override: true });
}

export const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically for local storage / fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/outreach', documentRouter);
app.use('/api/documents', documentRouter);
app.use('/api/slc', slcRouter);
app.use('/api/advocates', advocateRouter);
app.use('/api/notifications', notificationRouter);

app.get('/', (_, res) => {
    res.send(`Server is running in ${NODE_ENV} mode.`);
});

const startServer = async () => {
    try {
        await connectDb();
        const server = app.listen(port, () => {
            console.log(`server is running in ${NODE_ENV} mode at port: ${port}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use by another process.`);
            } else {
                console.error('Server error:', err);
            }
        });

        // Set server timeout to 1 hour to support large file uploads up to 2 GB
        server.timeout = 3600000;
        server.keepAliveTimeout = 3600000;
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();