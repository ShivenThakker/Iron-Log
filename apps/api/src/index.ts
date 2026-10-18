import './lib/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import programRoutes from './routes/program.routes';
import sessionRoutes from './routes/session.routes';
import nutritionRoutes from './routes/nutrition.routes';
import bodyRoutes from './routes/body.routes';
import aiRoutes from './routes/ai.routes';
import gamificationRoutes from './routes/gamification.routes';
import analyticsRoutes from './routes/analytics.routes';
import equipmentRoutes from './routes/equipment.routes';
import prRoutes from './routes/pr.routes';
import cronRoutes from './routes/cron.routes';
import { errorHandler } from './middleware/error.middleware';
import { rateLimit } from './middleware/ratelimit.middleware';
import { logger } from './utils/logger';
import { env } from './lib/env';

const app = express();
const port = env.PORT;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Global API rate limit (60 requests per minute per IP)
app.use(rateLimit(60, 60000));

// Request logging
app.use((req, res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Main Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/programs', programRoutes);
app.use('/sessions', sessionRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/body', bodyRoutes);
app.use('/ai', aiRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/prs', prRoutes);
app.use('/cron', cronRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'IronLog API is alive' });
});

// Centralized error handler
app.use(errorHandler);

app.listen(Number(port), '0.0.0.0', () => {
  logger.info(`Server listening on port ${port} (0.0.0.0)`);
  logger.info(
    { geminiModel: env.GEMINI_API_KEY ? env.GEMINI_MODEL : 'disabled (demo mode)' },
    'AI configuration'
  );
});
