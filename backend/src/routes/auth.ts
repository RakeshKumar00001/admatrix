import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error';
import { authLimiter } from '../middleware/rateLimit';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ── Mock users for USE_MOCK_DATA=true (no DB needed) ──────────────────────────
const MOCK_USERS: Record<string, { id: string; name: string; email: string; passwordPlain: string; role: 'ADMIN' | 'CLIENT'; clientId: string | null; client: any | null }> = {
  'admin@agency.com': {
    id: 'mock-admin-001',
    name: 'Agency Admin',
    email: 'admin@agency.com',
    passwordPlain: 'admin123',
    role: 'ADMIN',
    clientId: null,
    client: null,
  },
  'client@techcorp.com': {
    id: 'mock-client-001',
    name: 'TechCorp Marketing',
    email: 'client@techcorp.com',
    passwordPlain: 'client123',
    role: 'CLIENT',
    clientId: 'mock-tc-001',
    client: { id: 'mock-tc-001', name: 'TechCorp Solutions', slug: 'techcorp', logoUrl: null, primaryColor: '#6366f1', secondaryColor: '#8b5cf6' },
  },
  'client@fashionbrand.com': {
    id: 'mock-client-002',
    name: 'Fashion Brand Team',
    email: 'client@fashionbrand.com',
    passwordPlain: 'client456',
    role: 'CLIENT',
    clientId: 'mock-fb-001',
    client: { id: 'mock-fb-001', name: 'Fashion Brand Inc', slug: 'fashionbrand', logoUrl: null, primaryColor: '#ec4899', secondaryColor: '#f43f5e' },
  },
};

function generateTokens(userId: string, email: string, role: string, clientId: string | null) {
  const payload = { userId, email, role, clientId };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // ── MOCK mode: authenticate without DB ──────────────────────────────────
    if (process.env.USE_MOCK_DATA === 'true') {
      const mockUser = MOCK_USERS[email.toLowerCase()];
      if (!mockUser || mockUser.passwordPlain !== password) {
        throw new AppError('Invalid email or password', 401);
      }
      const { accessToken, refreshToken } = generateTokens(mockUser.id, mockUser.email, mockUser.role, mockUser.clientId);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        data: {
          accessToken,
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role, clientId: mockUser.clientId, client: mockUser.client },
        },
      });
    }

    // ── LIVE mode: authenticate against DB ─────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email, isActive: true },
      include: { client: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } } },
    });

    if (!user) throw new AppError('Invalid email or password', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role, user.clientId);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          client: user.client,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    // Mock mode: skip DB lookup
    if (process.env.USE_MOCK_DATA === 'true') {
      const tokens = generateTokens(decoded.userId, decoded.email, decoded.role, decoded.clientId);
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      return res.json({ success: true, data: { accessToken: tokens.accessToken } });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId, isActive: true } });
    if (!user) throw new AppError('User not found', 401);

    const tokens = generateTokens(user.id, user.email, user.role, user.clientId);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken: tokens.accessToken } });
  } catch (err) {
    next(err instanceof jwt.JsonWebTokenError ? new AppError('Invalid refresh token', 401) : err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (_req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Mock mode: return from mock user map
    if (process.env.USE_MOCK_DATA === 'true') {
      const mockUser = Object.values(MOCK_USERS).find(u => u.id === req.user!.id);
      if (!mockUser) throw new AppError('User not found', 401);
      return res.json({ success: true, data: { user: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role, clientId: mockUser.clientId, client: mockUser.client } } });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, role: true, clientId: true, lastLoginAt: true,
        client: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } },
      },
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

export default router;
