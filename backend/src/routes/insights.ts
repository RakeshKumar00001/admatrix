import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { getMockInsights, getMockSocialInsights, getMockCampaigns } from '../lib/mockData';

const router = Router();
router.use(authenticate);

const insightQuerySchema = z.object({
  clientId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'ALL']).optional(),
  campaignId: z.string().optional(),
  groupBy: z.enum(['day', 'campaign', 'platform']).optional(),
});

function getClientFilter(req: AuthRequest, requestedClientId: string) {
  if (req.user?.role === 'ADMIN') return requestedClientId;
  if (req.user?.clientId !== requestedClientId) throw new AppError('Access denied', 403);
  return requestedClientId;
}

// GET /api/insights — Ad campaign insights
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, startDate, endDate, platform, campaignId } = insightQuerySchema.parse(req.query);
    const resolvedClientId = getClientFilter(req, clientId);

    if (process.env.USE_MOCK_DATA === 'true') {
      const insights = getMockInsights(resolvedClientId, { startDate, endDate, platform, campaignId });
      const kpis = insights.reduce(
        (acc, i) => ({
          totalSpend: acc.totalSpend + i.spend,
          totalImpressions: acc.totalImpressions + i.impressions,
          totalClicks: acc.totalClicks + i.clicks,
          totalConversions: acc.totalConversions + i.conversions,
          totalLeads: acc.totalLeads + i.leads,
          totalReach: acc.totalReach + i.reach,
        }),
        { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalLeads: 0, totalReach: 0 }
      );
      kpis.totalSpend = Math.round(kpis.totalSpend * 100) / 100;
      const avgCTR = kpis.totalImpressions > 0 ? kpis.totalClicks / kpis.totalImpressions : 0;
      const avgCPC = kpis.totalClicks > 0 ? kpis.totalSpend / kpis.totalClicks : 0;
      const avgROAS = insights.length > 0 ? insights.reduce((a, i) => a + i.roas, 0) / insights.length : 0;
      return res.json({
        success: true,
        data: {
          insights,
          kpis: { ...kpis, avgCTR: Math.round(avgCTR * 10000) / 10000, avgCPC: Math.round(avgCPC * 100) / 100, avgROAS: Math.round(avgROAS * 100) / 100 },
        },
      });
    }

    const where: any = { clientId: resolvedClientId };
    if (startDate) where.date = { ...(where.date || {}), gte: new Date(startDate) };
    if (endDate) where.date = { ...(where.date || {}), lte: new Date(endDate) };
    if (platform && platform !== 'ALL') where.platform = platform;
    if (campaignId) where.campaignId = campaignId;

    const insights = await prisma.insight.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Aggregate KPIs
    const kpis = insights.reduce(
      (acc, i) => ({
        totalSpend: acc.totalSpend + i.spend,
        totalImpressions: acc.totalImpressions + i.impressions,
        totalClicks: acc.totalClicks + i.clicks,
        totalConversions: acc.totalConversions + i.conversions,
        totalLeads: acc.totalLeads + i.leads,
        totalReach: acc.totalReach + i.reach,
      }),
      { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalLeads: 0, totalReach: 0 }
    );
    kpis.totalSpend = Math.round(kpis.totalSpend * 100) / 100;
    const avgCTR = kpis.totalImpressions > 0 ? kpis.totalClicks / kpis.totalImpressions : 0;
    const avgCPC = kpis.totalClicks > 0 ? kpis.totalSpend / kpis.totalClicks : 0;
    const avgROAS = insights.length > 0 ? insights.reduce((a, i) => a + i.roas, 0) / insights.length : 0;

    res.json({
      success: true,
      data: {
        insights,
        kpis: { ...kpis, avgCTR: Math.round(avgCTR * 10000) / 10000, avgCPC: Math.round(avgCPC * 100) / 100, avgROAS: Math.round(avgROAS * 100) / 100 },
      },
    });
  } catch (err) { next(err); }
});

// GET /api/insights/social — Social media insights
router.get('/social', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, startDate, endDate, platform } = insightQuerySchema.parse(req.query);
    const resolvedClientId = getClientFilter(req, clientId);

    if (process.env.USE_MOCK_DATA === 'true') {
      const socialInsights = getMockSocialInsights(resolvedClientId, { startDate, endDate, platform });
      return res.json({ success: true, data: { socialInsights } });
    }

    const where: any = { clientId: resolvedClientId };
    if (startDate) where.date = { ...(where.date || {}), gte: new Date(startDate) };
    if (endDate) where.date = { ...(where.date || {}), lte: new Date(endDate) };
    if (platform && platform !== 'ALL') where.platform = platform;

    const socialInsights = await prisma.socialInsight.findMany({ where, orderBy: { date: 'asc' } });
    res.json({ success: true, data: { socialInsights } });
  } catch (err) { next(err); }
});

// GET /api/insights/campaigns — Unique campaign list
router.get('/campaigns', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId = req.query.clientId as string;
    const resolvedClientId = getClientFilter(req, clientId);

    if (process.env.USE_MOCK_DATA === 'true') {
      const campaigns = getMockCampaigns(resolvedClientId);
      return res.json({ success: true, data: { campaigns } });
    }

    const campaigns = await prisma.insight.groupBy({
      by: ['campaignId', 'campaignName', 'platform'],
      where: { clientId: resolvedClientId },
      _sum: { spend: true, impressions: true, clicks: true, leads: true },
      _avg: { roas: true, ctr: true },
    });

    res.json({ success: true, data: { campaigns } });
  } catch (err) { next(err); }
});

export default router;

