import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { syncClientData } from '../services/sync.service';
import { AppError } from '../middleware/error';

const router = Router();
router.use(authenticate);

// POST /api/meta/sync — Trigger manual sync for a client
router.post('/sync', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, type = 'all' } = req.body;
    if (req.user?.role !== 'ADMIN' && req.user?.clientId !== clientId) {
      throw new AppError('Access denied', 403);
    }

    // Start sync async
    syncClientData(clientId, type).catch(console.error);

    res.json({ success: true, message: `Sync started for client ${clientId}` });
  } catch (err) { next(err); }
});

// GET /api/meta/sync/logs?clientId=xxx
router.get('/sync/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId = req.query.clientId as string;
    if (req.user?.role !== 'ADMIN' && req.user?.clientId !== clientId) {
      throw new AppError('Access denied', 403);
    }

    const logs = await prisma.syncLog.findMany({
      where: { clientId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: { logs } });
  } catch (err) { next(err); }
});

// POST /api/meta/token — Save/update Meta token for client (admin only)
router.post('/token', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, tokenType, token } = req.body;
    const { encryptToken } = await import('../services/encrypt.service');
    const encryptedToken = encryptToken(token);

    const saved = await prisma.token.upsert({
      where: { clientId_tokenType: { clientId, tokenType } },
      update: { encryptedToken, isActive: true },
      create: { clientId, tokenType, encryptedToken },
    });

    res.json({ success: true, data: { token: { id: saved.id, tokenType: saved.tokenType } } });
  } catch (err) { next(err); }
});

export default router;
