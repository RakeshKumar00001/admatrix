import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { MOCK_CLIENTS } from '../lib/mockData';

const router = Router();
router.use(authenticate);

const clientSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  domain: z.string().optional(),
});

// GET /api/clients — Admin: all; Client: own
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      const clients = req.user?.role === 'ADMIN'
        ? MOCK_CLIENTS
        : MOCK_CLIENTS.filter(c => c.id === req.user?.clientId);
      return res.json({ success: true, data: { clients } });
    }

    const where = req.user?.role === 'ADMIN' ? {} : { id: req.user?.clientId! };
    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: { select: { users: true, adAccounts: true } },
        adAccounts: { select: { id: true, name: true, metaAccountId: true } },
        socialAccounts: { select: { id: true, facebookPageName: true, instagramUsername: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { clients } });
  } catch (err) { next(err); }
});

// GET /api/clients/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.clientId !== req.params.id) {
      throw new AppError('Access denied', 403);
    }

    if (process.env.USE_MOCK_DATA === 'true') {
      const client = MOCK_CLIENTS.find(c => c.id === req.params.id);
      if (!client) throw new AppError('Client not found', 404);
      return res.json({ success: true, data: { client } });
    }

    const client = await prisma.client.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        adAccounts: true, socialAccounts: true,
        _count: { select: { users: true, insights: true } },
      },
    });
    res.json({ success: true, data: { client } });
  } catch (err) { next(err); }
});

// POST /api/clients — Admin only
router.post('/', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.status(201).json({ success: true, data: { client: { id: 'mock-new-' + Date.now(), ...req.body } } });
    }
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({ data });
    res.status(201).json({ success: true, data: { client } });
  } catch (err) { next(err); }
});

// PUT /api/clients/:id — Admin only
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      const client = MOCK_CLIENTS.find(c => c.id === req.params.id) || {};
      return res.json({ success: true, data: { client: { ...client, ...req.body } } });
    }
    const data = clientSchema.partial().parse(req.body);
    const client = await prisma.client.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: { client } });
  } catch (err) { next(err); }
});

// DELETE /api/clients/:id — Admin only
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.json({ success: true, message: 'Client deleted (mock)' });
    }
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) { next(err); }
});

// POST /api/clients/:id/ad-accounts
router.post('/:id/ad-accounts', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.status(201).json({ success: true, data: { account: { id: 'mock-aa-' + Date.now(), ...req.body } } });
    }
    const { metaAccountId, name, currency, timezone } = req.body;
    const account = await prisma.adAccount.create({
      data: { clientId: req.params.id, metaAccountId, name, currency, timezone },
    });
    res.status(201).json({ success: true, data: { account } });
  } catch (err) { next(err); }
});

// POST /api/clients/:id/social-accounts
router.post('/:id/social-accounts', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.status(201).json({ success: true, data: { account: { id: 'mock-sa-' + Date.now(), ...req.body } } });
    }
    const { facebookPageId, instagramBusinessId, facebookPageName, instagramUsername } = req.body;
    const account = await prisma.socialAccount.create({
      data: { clientId: req.params.id, facebookPageId, instagramBusinessId, facebookPageName, instagramUsername },
    });
    res.status(201).json({ success: true, data: { account } });
  } catch (err) { next(err); }
});

export default router;

