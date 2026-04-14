import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from './error';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    clientId: string | null;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
      clientId: string | null;
    };

    // ── MOCK mode: trust the JWT payload, skip DB lookup ─────────────────────
    if (process.env.USE_MOCK_DATA === 'true') {
      req.user = { id: decoded.userId, email: decoded.email, role: decoded.role, clientId: decoded.clientId };
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: { id: true, email: true, role: true, clientId: true },
    });

    if (!user) {
      throw new AppError('User not found or deactivated', 401);
    }

    req.user = { id: user.id, email: user.email, role: user.role, clientId: user.clientId };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(err);
    }
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

export const requireClientAccess = (clientIdParam: string = 'clientId') => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user) return next(new AppError('Unauthorized', 401));

    if (user.role === 'ADMIN') return next();

    const requestedClientId = req.params[clientIdParam] || req.query[clientIdParam];
    if (user.clientId !== requestedClientId) {
      return next(new AppError('Access denied to this client data', 403));
    }
    next();
  };
};
