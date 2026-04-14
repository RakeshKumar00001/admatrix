import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { generateClientPDF } from '../services/pdf.service';
import { getMockReports } from '../lib/mockData';

const router = Router();
router.use(authenticate);

// GET /api/reports?clientId=xxx
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId = req.query.clientId as string;
    if (req.user?.role !== 'ADMIN' && req.user?.clientId !== clientId) {
      throw new AppError('Access denied', 403);
    }

    if (process.env.USE_MOCK_DATA === 'true') {
      const reports = getMockReports(clientId);
      return res.json({ success: true, data: { reports } });
    }

    const reports = await prisma.report.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
});


// POST /api/reports/generate
router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, startDate, endDate, reportType = 'custom' } = req.body;

    if (req.user?.role !== 'ADMIN' && req.user?.clientId !== clientId) {
      throw new AppError('Access denied', 403);
    }

    const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

    // Create report record
    const report = await prisma.report.create({
      data: {
        clientId,
        title: `${client.name} — ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        reportType,
        status: 'generating',
      },
    });

    // Generate asynchronously
    generateClientPDF(report.id, clientId, new Date(startDate), new Date(endDate))
      .then(async (fileUrl) => {
        await prisma.report.update({
          where: { id: report.id },
          data: { status: 'ready', fileUrl },
        });
      })
      .catch(async (err) => {
        await prisma.report.update({
          where: { id: report.id },
          data: { status: 'failed', fileUrl: null },
        });
      });

    res.json({ success: true, data: { report } });
  } catch (err) { next(err); }
});

// GET /api/reports/:id/download
router.get('/:id/download', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.findUniqueOrThrow({ where: { id: req.params.id } });

    if (req.user?.role !== 'ADMIN' && req.user?.clientId !== report.clientId) {
      throw new AppError('Access denied', 403);
    }

    if (report.status !== 'ready' || !report.fileUrl) {
      throw new AppError('Report not ready yet', 400);
    }

    const filePath = path.join(process.cwd(), report.fileUrl);
    if (!fs.existsSync(filePath)) throw new AppError('Report file not found', 404);

    res.download(filePath, `${report.title}.pdf`);
  } catch (err) { next(err); }
});

// GET /api/reports/:id/status
router.get('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.findUniqueOrThrow({
      where: { id: req.params.id },
      select: { id: true, status: true, fileUrl: true, title: true },
    });
    res.json({ success: true, data: { report } });
  } catch (err) { next(err); }
});

// DELETE /api/reports/:id — Admin only
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.findUniqueOrThrow({ where: { id: req.params.id } });
    if (report.fileUrl) {
      const filePath = path.join(process.cwd(), report.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) { next(err); }
});

export default router;
