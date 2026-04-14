import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { MOCK_USERS_LIST } from '../lib/mockData';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'CLIENT']),
  clientId: z.string().optional(),
});

// GET /api/users
router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.json({ success: true, data: { users: MOCK_USERS_LIST } });
    }
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, clientId: true, isActive: true, lastLoginAt: true, createdAt: true,
        client: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { users } });
  } catch (err) { next(err); }
});

// POST /api/users
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      const { email, name, role, clientId } = createUserSchema.parse(req.body);
      return res.status(201).json({ success: true, data: { user: { id: 'mock-user-' + Date.now(), email, name, role, clientId } } });
    }
    const { email, password, name, role, clientId } = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role, clientId },
      select: { id: true, email: true, name: true, role: true, clientId: true },
    });
    res.status(201).json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.json({ success: true, data: { user: { id: req.params.id, ...req.body } } });
    }
    const { name, isActive, clientId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, isActive, clientId },
      select: { id: true, email: true, name: true, role: true, isActive: true, clientId: true },
    });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      return res.json({ success: true, message: 'User deactivated (mock)' });
    }
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
});

export default router;

