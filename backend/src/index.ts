import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error';
import { apiLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import insightRoutes from './routes/insights';
import reportRoutes from './routes/reports';
import metaRoutes from './routes/meta';
import userRoutes from './routes/users';
import { startCronJobs } from './jobs';
import { logger } from './lib/logger';

const app = express();
const PORT = process.env.PORT || 4000;

// 🔥 IMPORTANT: Trust proxy (Render fix)
app.set('trust proxy', 1);

// ── Security middleware ──────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 🔥 FIXED CORS (supports Vercel + local)
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://admatrix-eta.vercel.app', // 🔥 your frontend
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// ── Static files (PDFs) ─────────────────────────────────
app.use('/reports', express.static('reports'));

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/users', userRoutes);

// ── Health check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Error handler (must be last) ─────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(
    `📊 Mode: ${
      process.env.USE_MOCK_DATA === 'true' ? 'MOCK' : 'LIVE'
    } data`
  );
  startCronJobs();
});

export default app;
