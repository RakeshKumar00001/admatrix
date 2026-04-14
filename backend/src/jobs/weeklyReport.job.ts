import { prisma } from '../lib/prisma';
import { generateClientPDF } from '../services/pdf.service';
import { logger } from '../lib/logger';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export async function generateWeeklyReports() {
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  });

  for (const client of clients) {
    try {
      logger.info(`📋 Generating weekly report for ${client.name}...`);

      const report = await prisma.report.create({
        data: {
          clientId: client.id,
          title: `${client.name} — Weekly Report (${format(lastWeekStart, 'MMM dd')} - ${format(lastWeekEnd, 'MMM dd, yyyy')})`,
          periodStart: lastWeekStart,
          periodEnd: lastWeekEnd,
          reportType: 'weekly',
          status: 'generating',
        },
      });

      const fileUrl = await generateClientPDF(report.id, client.id, lastWeekStart, lastWeekEnd);

      await prisma.report.update({
        where: { id: report.id },
        data: { status: 'ready', fileUrl },
      });

      logger.info(`✅ Weekly report ready for ${client.name}`);
    } catch (err: any) {
      logger.error(`❌ Failed to generate weekly report for ${client.name}: ${err.message}`);
    }
  }
}
