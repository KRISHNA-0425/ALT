import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDb from './config/connectDb.js';
import authRouter from './routers/auth.router.js';
import outreachRouter from './routers/outreach.route.js';
import slcRouter from './routers/slc.route.js';
import documentRouter from './routers/document.route.js';

import path from 'path';

// Load default .env first
dotenv.config();

// If NODE_ENV is production, load .env.production
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production', override: true });
}

export const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
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

app.get('/', (_, res) => {
    res.send(`Server is running in ${NODE_ENV} mode.`);
});

const startServer = async () => {
    try {
        await connectDb();
        const server = app.listen(port, () => {
            console.log(`server is running in ${NODE_ENV} mode at port: ${port}`);
        });

        // Set server timeout to 1 hour to support large file uploads up to 2 GB
        server.timeout = 3600000;
        server.keepAliveTimeout = 3600000;
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();