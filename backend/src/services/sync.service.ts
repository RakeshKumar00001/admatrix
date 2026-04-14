import { Platform } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { fetchAdInsights, fetchPageInsights } from './meta.service';
import { cacheFlushClient } from './cache.service';
import { logger } from '../lib/logger';
import { subDays } from 'date-fns';

export async function syncClientData(clientId: string, type: string = 'all') {
  const log = await prisma.syncLog.create({
    data: { clientId, type, status: 'RUNNING' },
  });

  try {
    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      include: { adAccounts: true, socialAccounts: true },
    });

    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    let recordsUpdated = 0;

    // ── Fetch ad insights ──────────────────────────────
    if (type === 'all' || type === 'insights') {
      for (const account of client.adAccounts) {
        if (!account.isActive) continue;
        try {
          const insights = await fetchAdInsights(clientId, account.metaAccountId, startDate, endDate);

          for (const insight of insights) {
            await prisma.insight.upsert({
              where: {
                clientId_date_campaignId_platform: {
                  clientId,
                  date: new Date(insight.date_start),
                  campaignId: insight.campaign_id,
                  platform: insight.platform || Platform.FACEBOOK,
                },
              },
              update: {
                spend: insight.spend,
                impressions: insight.impressions,
                clicks: insight.clicks,
                ctr: insight.ctr,
                cpc: insight.cpc,
                cpm: insight.cpm,
                roas: insight.roas,
                conversions: insight.conversions,
                leads: insight.leads,
                reach: insight.reach,
                frequency: insight.frequency,
              },
              create: {
                clientId,
                date: new Date(insight.date_start),
                campaignId: insight.campaign_id,
                campaignName: insight.campaign_name,
                adAccountId: account.metaAccountId,
                platform: insight.platform || Platform.FACEBOOK,
                spend: insight.spend,
                impressions: insight.impressions,
                clicks: insight.clicks,
                ctr: insight.ctr,
                cpc: insight.cpc,
                cpm: insight.cpm,
                roas: insight.roas,
                conversions: insight.conversions,
                leads: insight.leads,
                reach: insight.reach,
                frequency: insight.frequency,
              },
            });
            recordsUpdated++;
          }
          logger.info(`✅ Synced ${insights.length} insights for ${client.name} / ${account.name}`);
        } catch (err: any) {
          logger.error(`❌ Error syncing account ${account.metaAccountId}: ${err.message}`);
        }
      }
    }

    // ── Fetch social insights ──────────────────────────
    if (type === 'all' || type === 'social') {
      for (const social of client.socialAccounts) {
        if (!social.isActive) continue;

        const platforms = [
          { pageId: social.facebookPageId, platform: Platform.FACEBOOK },
          { pageId: social.instagramBusinessId, platform: Platform.INSTAGRAM },
        ].filter((p) => p.pageId);

        for (const { pageId, platform } of platforms) {
          try {
            const insights = await fetchPageInsights(clientId, pageId!, platform, startDate, endDate);

            for (const insight of insights) {
              await prisma.socialInsight.upsert({
                where: {
                  clientId_platform_date: { clientId, platform, date: new Date(insight.date) },
                },
                update: {
                  followers: insight.followers,
                  followersNet: insight.followers_net,
                  reach: insight.reach,
                  impressions: insight.impressions,
                  engagement: insight.engagement,
                  profileViews: insight.profile_views,
                  posts: insight.posts,
                },
                create: {
                  clientId,
                  platform,
                  date: new Date(insight.date),
                  followers: insight.followers,
                  followersNet: insight.followers_net,
                  reach: insight.reach,
                  impressions: insight.impressions,
                  engagement: insight.engagement,
                  profileViews: insight.profile_views,
                  posts: insight.posts,
                },
              });
              recordsUpdated++;
            }
            logger.info(`✅ Synced ${insights.length} social insights for ${client.name} / ${platform}`);
          } catch (err: any) {
            logger.error(`❌ Error syncing social ${platform}: ${err.message}`);
          }
        }
      }
    }

    // Clear cached data for this client
    cacheFlushClient(clientId);

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'SUCCESS', recordsUpdated, completedAt: new Date(), message: `Synced ${recordsUpdated} records` },
    });

    logger.info(`✅ Sync complete for ${client.name}: ${recordsUpdated} records`);
  } catch (err: any) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', completedAt: new Date(), message: err.message },
    });
    logger.error(`❌ Sync failed for client ${clientId}: ${err.message}`);
    throw err;
  }
}

export async function syncAllClients() {
  logger.info('🔄 Starting daily sync for all clients...');
  const clients = await prisma.client.findMany({ where: { isActive: true }, select: { id: true, name: true } });

  for (const client of clients) {
    try {
      await syncClientData(client.id, 'all');
    } catch (err) {
      logger.error(`Failed to sync client ${client.name}`);
    }
  }
  logger.info('✅ Daily sync complete for all clients');
}
