import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDb from './config/connectDb.js';
import authRouter from './routers/auth.router.js';
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)

app.get("/", (_, res) => {
    res.send("hello");
})

const startServer = async () => {
    connectDb().then(() => {
        app.listen(port, () => {
            console.log(`server is running at port: ${port}`)
        })
    })
}


startServer();