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

// Fallback for missing local files in /uploads (e.g. following cloud host ephemeral container restart)
app.use('/uploads', (req, res) => {
    res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; padding: 1.5rem; }
    .card { background: white; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08); max-width: 520px; text-align: center; border: 1px solid #e2e8f0; }
    .icon { font-size: 2.5rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #b91c1c; margin-bottom: 0.75rem; }
    p { font-size: 0.925rem; line-height: 1.6; color: #475569; margin-bottom: 1.5rem; }
    .btn { display: inline-block; background: #4f46e5; color: white; padding: 0.65rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; transition: background 0.2s; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📄</div>
    <h1>Document Unavailable</h1>
    <p>This legacy document was saved on temporary server storage prior to cloud storage activation, and was cleared when the server restarted.<br><br>Please use the <strong>Remove</strong> option in your dashboard to remove this record and re-upload the document. All new uploads are permanently preserved on Cloudinary.</p>
    <a class="btn" href="javascript:window.close()">Close Window</a>
  </div>
</body>
</html>
    `);
});

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