import axios from 'axios';
import { Platform } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { decryptToken } from './encrypt.service';
import { cacheGet, cacheSet } from './cache.service';
import { logger } from '../lib/logger';

const META_API_BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v19.0'}`;

// ── Mock data generator ─────────────────────────────────
function generateMockInsights(accountId: string, startDate: Date, endDate: Date) {
  const campaigns = [
    { id: `${accountId}_camp_1`, name: 'Brand Awareness Campaign' },
    { id: `${accountId}_camp_2`, name: 'Lead Generation' },
    { id: `${accountId}_camp_3`, name: 'Retargeting - Website Visitors' },
  ];

  const results = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    for (const camp of campaigns) {
      const spend = (Math.random() * 400 + 100).toFixed(2);
      const impressions = Math.floor(Math.random() * 40000 + 5000);
      const clicks = Math.floor(Math.random() * 1800 + 200);
      const conversions = Math.floor(Math.random() * 80 + 5);
      results.push({
        campaign_id: camp.id,
        campaign_name: camp.name,
        date_start: current.toISOString().split('T')[0],
        spend: parseFloat(spend),
        impressions,
        clicks,
        ctr: parseFloat((clicks / impressions).toFixed(4)),
        cpc: parseFloat((parseFloat(spend) / clicks).toFixed(2)),
        cpm: parseFloat((parseFloat(spend) / impressions * 1000).toFixed(2)),
        conversions,
        leads: Math.floor(conversions * 0.6),
        reach: Math.floor(impressions * 0.7),
        frequency: parseFloat((Math.random() * 2 + 1).toFixed(2)),
        roas: parseFloat((Math.random() * 4 + 1.5).toFixed(2)),
        platform: accountId.includes('ig') ? Platform.INSTAGRAM : Platform.FACEBOOK,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return results;
}

function generateMockSocialInsights(pageId: string, platform: Platform, startDate: Date, endDate: Date) {
  const results = [];
  const current = new Date(startDate);
  let followers = 10000;

  while (current <= endDate) {
    const net = Math.floor(Math.random() * 100 - 10);
    followers += Math.max(0, net);
    results.push({
      date: current.toISOString().split('T')[0],
      followers,
      followers_net: net,
      reach: Math.floor(Math.random() * 15000 + 2000),
      impressions: Math.floor(Math.random() * 25000 + 3000),
      engagement: Math.floor(Math.random() * 1500 + 100),
      profile_views: Math.floor(Math.random() * 400 + 50),
      posts: Math.floor(Math.random() * 3),
      platform,
    });
    current.setDate(current.getDate() + 1);
  }
  return results;
}

// ── Live Meta API calls ─────────────────────────────────
async function getAccessToken(clientId: string): Promise<string> {
  // Check for client-specific token first
  const tokenRecord = await prisma.token.findUnique({
    where: { clientId_tokenType: { clientId, tokenType: 'system_user' } },
  });
  if (tokenRecord) return decryptToken(tokenRecord.encryptedToken);

  // Fall back to system user token
  const systemToken = process.env.META_SYSTEM_USER_TOKEN;
  if (!systemToken) throw new Error('No Meta token available');
  return systemToken;
}

export async function fetchAdInsights(
  clientId: string,
  adAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const useMock = process.env.USE_MOCK_DATA === 'true';
  const cacheKey = `insights_${clientId}_${adAccountId}_${startDate.toISOString()}_${endDate.toISOString()}`;

  const cached = cacheGet<any[]>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit: ${cacheKey}`);
    return cached;
  }

  if (useMock) {
    logger.info(`[MOCK] Fetching ad insights for account ${adAccountId}`);
    const data = generateMockInsights(adAccountId, startDate, endDate);
    cacheSet(cacheKey, data, 3600);
    return data;
  }

  try {
    const token = await getAccessToken(clientId);
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const response = await axios.get(`${META_API_BASE}/${adAccountId}/insights`, {
      params: {
        access_token: token,
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions',
        time_range: JSON.stringify({ since: start, until: end }),
        time_increment: 1,
        level: 'campaign',
        limit: 500,
      },
    });

    const data = response.data.data || [];
    const processed = data.map((d: any) => ({
      ...d,
      spend: parseFloat(d.spend || 0),
      impressions: parseInt(d.impressions || 0),
      clicks: parseInt(d.clicks || 0),
      ctr: parseFloat(d.ctr || 0),
      cpc: parseFloat(d.cpc || 0),
      cpm: parseFloat(d.cpm || 0),
      reach: parseInt(d.reach || 0),
      frequency: parseFloat(d.frequency || 0),
      conversions: d.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0,
      leads: d.actions?.find((a: any) => a.action_type === 'lead')?.value || 0,
      roas: d.actions?.find((a: any) => a.action_type === 'purchase')?.value
        ? (d.actions.find((a: any) => a.action_type === 'purchase').value * 50) / parseFloat(d.spend || 1)
        : 0,
    }));

    cacheSet(cacheKey, processed, 3600);
    return processed;
  } catch (err: any) {
    logger.error(`Meta API error: ${err.message}`);
    throw err;
  }
}

export async function fetchPageInsights(
  clientId: string,
  pageId: string,
  platform: Platform,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const useMock = process.env.USE_MOCK_DATA === 'true';
  const cacheKey = `social_${clientId}_${pageId}_${platform}`;

  const cached = cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  if (useMock) {
    logger.info(`[MOCK] Fetching ${platform} page insights for ${pageId}`);
    const data = generateMockSocialInsights(pageId, platform, startDate, endDate);
    cacheSet(cacheKey, data, 3600);
    return data;
  }

  try {
    const token = await getAccessToken(clientId);
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const response = await axios.get(`${META_API_BASE}/${pageId}/insights`, {
      params: {
        access_token: token,
        metric: 'page_fans,page_impressions,page_reach,page_post_engagements,page_views_total',
        period: 'day',
        since: start,
        until: end,
      },
    });

    const data = response.data.data || [];
    cacheSet(cacheKey, data, 3600);
    return data;
  } catch (err: any) {
    logger.error(`Page insights error: ${err.message}`);
    throw err;
  }
}
