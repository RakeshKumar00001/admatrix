/**
 * Mock data store — used when USE_MOCK_DATA=true and no PostgreSQL is available.
 * Mirrors the exact shape returned by Prisma queries so route handlers can
 * be used without a database for demo / testing purposes.
 */

import { subDays, format } from 'date-fns';

// ── Clients ──────────────────────────────────────────────────────────────────
export const MOCK_CLIENTS = [
  {
    id: 'mock-tc-001',
    name: 'TechCorp Solutions',
    slug: 'techcorp',
    email: 'marketing@techcorp.com',
    phone: null,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: null,
    domain: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { users: 1, adAccounts: 1 },
    adAccounts: [{ id: 'aa-001', name: 'TechCorp Main Account', metaAccountId: 'act_123456789' }],
    socialAccounts: [{ id: 'sa-001', facebookPageName: 'TechCorp Official', instagramUsername: '@techcorp_official' }],
  },
  {
    id: 'mock-fb-001',
    name: 'Fashion Brand Inc',
    slug: 'fashionbrand',
    email: 'ads@fashionbrand.com',
    phone: null,
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    logoUrl: null,
    domain: null,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    _count: { users: 1, adAccounts: 1 },
    adAccounts: [{ id: 'aa-002', name: 'Fashion Brand Ads', metaAccountId: 'act_987654321' }],
    socialAccounts: [{ id: 'sa-002', facebookPageName: 'Fashion Brand Official', instagramUsername: '@fashionbrand_ig' }],
  },
];

// ── Users ──────────────────────────────────────────────────────────────────
export const MOCK_USERS_LIST = [
  {
    id: 'mock-admin-001',
    email: 'admin@agency.com',
    name: 'Agency Admin',
    role: 'ADMIN',
    clientId: null,
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-01-01'),
    client: null,
  },
  {
    id: 'mock-client-001',
    email: 'client@techcorp.com',
    name: 'TechCorp Marketing',
    role: 'CLIENT',
    clientId: 'mock-tc-001',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-01-15'),
    client: { name: 'TechCorp Solutions', slug: 'techcorp' },
  },
  {
    id: 'mock-client-002',
    email: 'client@fashionbrand.com',
    name: 'Fashion Brand Team',
    role: 'CLIENT',
    clientId: 'mock-fb-001',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-02-10'),
    client: { name: 'Fashion Brand Inc', slug: 'fashionbrand' },
  },
];

// ── Insight generation helpers ───────────────────────────────────────────────
function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max)); }

const CAMPAIGNS: Record<string, { id: string; name: string; platform: string }[]> = {
  'mock-tc-001': [
    { id: 'camp_001', name: 'Brand Awareness Q2', platform: 'FACEBOOK' },
    { id: 'camp_002', name: 'Lead Gen - Tech', platform: 'FACEBOOK' },
    { id: 'camp_003', name: 'Instagram Stories', platform: 'INSTAGRAM' },
  ],
  'mock-fb-001': [
    { id: 'camp_004', name: 'Summer Collection', platform: 'INSTAGRAM' },
    { id: 'camp_005', name: 'Retargeting - Website', platform: 'FACEBOOK' },
  ],
};

const SPEND_BASE: Record<string, number> = { 'mock-tc-001': 500, 'mock-fb-001': 300 };

function generateInsights(clientId: string, days = 30) {
  const campaigns = CAMPAIGNS[clientId] || [];
  const spendBase = SPEND_BASE[clientId] || 300;
  const insights: any[] = [];

  for (let day = days; day >= 0; day--) {
    const date = subDays(new Date(), day);
    date.setHours(0, 0, 0, 0);

    for (const camp of campaigns) {
      const spend = rnd(spendBase * 0.6, spendBase * 1.4);
      const impressions = rndInt(5000, 50000);
      const clicks = rndInt(100, 2000);
      const conversions = rndInt(5, 100);
      const roas = rnd(1.5, 6.0);

      insights.push({
        id: `ins_${clientId}_${day}_${camp.id}`,
        clientId,
        date: date.toISOString(),
        campaignId: camp.id,
        campaignName: camp.name,
        adAccountId: 'act_' + rndInt(100000, 999999),
        platform: camp.platform,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        ctr: Math.round((clicks / impressions) * 10000) / 10000,
        cpc: Math.round((spend / clicks) * 100) / 100,
        cpm: Math.round((spend / impressions * 1000) * 100) / 100,
        roas: Math.round(roas * 100) / 100,
        conversions,
        leads: rndInt(2, 50),
        reach: rndInt(3000, 40000),
        frequency: rnd(1.0, 3.5),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }
  }
  return insights;
}

function generateSocialInsights(clientId: string, days = 30) {
  const socialInsights: any[] = [];
  const platforms = ['FACEBOOK', 'INSTAGRAM'];

  for (let day = days; day >= 0; day--) {
    const date = subDays(new Date(), day);
    date.setHours(0, 0, 0, 0);

    for (const platform of platforms) {
      const followers = 10000 + (days - day) * rndInt(10, 80);
      socialInsights.push({
        id: `si_${clientId}_${day}_${platform}`,
        clientId,
        platform,
        date: date.toISOString(),
        followers,
        followersNet: rndInt(-20, 150),
        reach: rndInt(2000, 20000),
        impressions: rndInt(3000, 30000),
        engagement: rndInt(100, 2000),
        profileViews: rndInt(50, 500),
        posts: rndInt(0, 3),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }
  }
  return socialInsights;
}

// Cache insights per clientId so values are stable per server session
const insightCache: Record<string, any[]> = {};
const socialInsightCache: Record<string, any[]> = {};

export function getMockInsights(clientId: string, filters?: {
  startDate?: string; endDate?: string; platform?: string; campaignId?: string;
}) {
  if (!insightCache[clientId]) insightCache[clientId] = generateInsights(clientId, 30);
  let data = insightCache[clientId];

  if (filters?.startDate) data = data.filter(i => new Date(i.date) >= new Date(filters.startDate!));
  if (filters?.endDate) data = data.filter(i => new Date(i.date) <= new Date(filters.endDate!));
  if (filters?.platform && filters.platform !== 'ALL') data = data.filter(i => i.platform === filters.platform);
  if (filters?.campaignId) data = data.filter(i => i.campaignId === filters.campaignId);
  return data;
}

export function getMockSocialInsights(clientId: string, filters?: {
  startDate?: string; endDate?: string; platform?: string;
}) {
  if (!socialInsightCache[clientId]) socialInsightCache[clientId] = generateSocialInsights(clientId, 30);
  let data = socialInsightCache[clientId];

  if (filters?.startDate) data = data.filter(i => new Date(i.date) >= new Date(filters.startDate!));
  if (filters?.endDate) data = data.filter(i => new Date(i.date) <= new Date(filters.endDate!));
  if (filters?.platform && filters.platform !== 'ALL') data = data.filter(i => i.platform === filters.platform);
  return data;
}

export function getMockCampaigns(clientId: string) {
  const campaigns = CAMPAIGNS[clientId] || [];
  return campaigns.map(c => {
    const insights = getMockInsights(clientId, { campaignId: c.id });
    const totalSpend = insights.reduce((a, i) => a + i.spend, 0);
    const totalImpressions = insights.reduce((a, i) => a + i.impressions, 0);
    const totalClicks = insights.reduce((a, i) => a + i.clicks, 0);
    const totalLeads = insights.reduce((a, i) => a + i.leads, 0);
    const avgROAS = insights.length > 0 ? insights.reduce((a, i) => a + i.roas, 0) / insights.length : 0;
    const avgCTR = insights.length > 0 ? insights.reduce((a, i) => a + i.ctr, 0) / insights.length : 0;
    return {
      campaignId: c.id,
      campaignName: c.name,
      platform: c.platform,
      _sum: { spend: Math.round(totalSpend * 100) / 100, impressions: totalImpressions, clicks: totalClicks, leads: totalLeads },
      _avg: { roas: Math.round(avgROAS * 100) / 100, ctr: Math.round(avgCTR * 10000) / 10000 },
    };
  });
}

// ── Mock Reports ─────────────────────────────────────────────────────────────
const MOCK_REPORTS: Record<string, any[]> = {
  'mock-tc-001': [
    {
      id: 'rep-001', clientId: 'mock-tc-001',
      title: 'TechCorp Solutions — Monthly Report', status: 'ready',
      reportType: 'monthly', fileUrl: null,
      periodStart: subDays(new Date(), 30).toISOString(),
      periodEnd: new Date().toISOString(),
      createdAt: subDays(new Date(), 2).toISOString(),
      updatedAt: subDays(new Date(), 2).toISOString(),
    },
    {
      id: 'rep-002', clientId: 'mock-tc-001',
      title: 'TechCorp Solutions — Weekly Report', status: 'ready',
      reportType: 'weekly', fileUrl: null,
      periodStart: subDays(new Date(), 7).toISOString(),
      periodEnd: new Date().toISOString(),
      createdAt: subDays(new Date(), 1).toISOString(),
      updatedAt: subDays(new Date(), 1).toISOString(),
    },
  ],
  'mock-fb-001': [
    {
      id: 'rep-003', clientId: 'mock-fb-001',
      title: 'Fashion Brand Inc — Monthly Report', status: 'ready',
      reportType: 'monthly', fileUrl: null,
      periodStart: subDays(new Date(), 30).toISOString(),
      periodEnd: new Date().toISOString(),
      createdAt: subDays(new Date(), 3).toISOString(),
      updatedAt: subDays(new Date(), 3).toISOString(),
    },
  ],
};

export function getMockReports(clientId?: string) {
  if (clientId) return MOCK_REPORTS[clientId] || [];
  // Admin: all reports
  return Object.values(MOCK_REPORTS).flat();
}
