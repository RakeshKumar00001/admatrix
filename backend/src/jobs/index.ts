import cron from 'node-cron';
import { logger } from '../lib/logger';
import { syncAllClients } from '../services/sync.service';
import { generateWeeklyReports } from './weeklyReport.job';

export function startCronJobs() {
  // Daily sync — default: 2 AM
  const dailyCron = process.env.CRON_DAILY_SYNC || '0 2 * * *';
  cron.schedule(dailyCron, async () => {
    logger.info('⏰ Cron: Starting daily sync...');
    try {
      await syncAllClients();
    } catch (err) {
      logger.error('Cron daily sync failed:', err);
    }
  });
  logger.info(`✅ Daily sync cron scheduled: ${dailyCron}`);

  // Weekly reports — default: Monday 8 AM
  const weeklyCron = process.env.CRON_WEEKLY_REPORT || '0 8 * * 1';
  cron.schedule(weeklyCron, async () => {
    logger.info('⏰ Cron: Starting weekly report generation...');
    try {
      await generateWeeklyReports();
    } catch (err) {
      logger.error('Cron weekly reports failed:', err);
    }
  });
  logger.info(`✅ Weekly reports cron scheduled: ${weeklyCron}`);
}
