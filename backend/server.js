import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDb from './config/connectDb.js';
import authRouter from './routers/auth.router.js';
import outreachRouter from './routers/outreach.route.js';
import slcRouter from './routers/slc.route.js';

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

app.use('/api/auth', authRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/slc', slcRouter);

app.get('/', (_, res) => {
    res.send(`Server is running in ${NODE_ENV} mode.`);
});

const startServer = async () => {
    try {
        await connectDb();
        app.listen(port, () => {
            console.log(`server is running in ${NODE_ENV} mode at port: ${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();