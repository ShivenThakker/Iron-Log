import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import programRoutes from './routes/program.routes';
import sessionRoutes from './routes/session.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/programs', programRoutes);
app.use('/sessions', sessionRoutes);

// Main health route for keep-alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'IronLog API is alive' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
