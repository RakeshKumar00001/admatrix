import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { format, subDays } from 'date-fns';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

interface ReportData {
  client: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    email: string | null;
  };
  period: { start: string; end: string };
  kpis: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalLeads: number;
    avgROAS: number;
    avgCTR: number;
    avgCPC: number;
  };
  campaigns: {
    name: string;
    platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    roas: number;
    leads: number;
  }[];
  dailySpend: { date: string; spend: number }[];
  generatedAt: string;
  agencyName: string;
}

async function buildReportData(clientId: string, startDate: Date, endDate: Date): Promise<ReportData> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { name: true, logoUrl: true, primaryColor: true, secondaryColor: true, email: true },
  });

  const insights = await prisma.insight.findMany({
    where: { clientId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  });

  // Aggregate KPIs
  const totalSpend = insights.reduce((a, i) => a + i.spend, 0);
  const totalImpressions = insights.reduce((a, i) => a + i.impressions, 0);
  const totalClicks = insights.reduce((a, i) => a + i.clicks, 0);
  const totalLeads = insights.reduce((a, i) => a + i.leads, 0);
  const avgROAS = insights.length > 0 ? insights.reduce((a, i) => a + i.roas, 0) / insights.length : 0;
  const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  // Aggregate campaigns
  const campaignMap = new Map<string, any>();
  for (const i of insights) {
    const existing = campaignMap.get(i.campaignId) || {
      name: i.campaignName, platform: i.platform, spend: 0, impressions: 0, clicks: 0, leads: 0, roasTotal: 0, count: 0
    };
    existing.spend += i.spend;
    existing.impressions += i.impressions;
    existing.clicks += i.clicks;
    existing.leads += i.leads;
    existing.roasTotal += i.roas;
    existing.count += 1;
    campaignMap.set(i.campaignId, existing);
  }

  const campaigns = Array.from(campaignMap.values())
    .map((c) => ({
      name: c.name,
      platform: c.platform,
      spend: Math.round(c.spend * 100) / 100,
      impressions: c.impressions,
      clicks: c.clicks,
      ctr: c.impressions > 0 ? Math.round(c.clicks / c.impressions * 10000) / 100 : 0,
      roas: Math.round((c.roasTotal / c.count) * 100) / 100,
      leads: c.leads,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  // Daily spend for chart
  const dailyMap = new Map<string, number>();
  for (const i of insights) {
    const dateKey = format(new Date(i.date), 'MMM dd');
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + i.spend);
  }
  const dailySpend = Array.from(dailyMap.entries()).map(([date, spend]) => ({
    date, spend: Math.round(spend * 100) / 100,
  }));

  return {
    client,
    period: {
      start: format(startDate, 'MMM dd, yyyy'),
      end: format(endDate, 'MMM dd, yyyy'),
    },
    kpis: {
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalImpressions,
      totalClicks,
      totalLeads,
      avgROAS: Math.round(avgROAS * 100) / 100,
      avgCTR: Math.round(avgCTR * 10000) / 100,
      avgCPC: Math.round(avgCPC * 100) / 100,
    },
    campaigns,
    dailySpend,
    generatedAt: format(new Date(), 'MMM dd, yyyy HH:mm'),
    agencyName: process.env.EMAIL_FROM_NAME || 'Marketing Agency',
  };
}

function getReportTemplate(): string {
  // Try to load from the templates directory
  const possiblePaths = [
    path.join(__dirname, '../templates/report.html'),
    path.join(process.cwd(), 'src/templates/report.html'),
    path.join(process.cwd(), 'dist/templates/report.html'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }

  // Minimal fallback that avoids ${{}} TS parsing issues
  const dollarSign = '$';
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">',
    '<style>body{font-family:Segoe UI,sans-serif;color:#1e293b;margin:0}',
    '.header{background:{{client.primaryColor}};color:#fff;padding:40px 50px}',
    '.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:32px 50px}',
    '.kpi-card{background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0}',
    '.kpi-label{font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:8px}',
    '.kpi-value{font-size:24px;font-weight:700}',
    'table{width:100%;border-collapse:collapse;margin:0 50px 32px;font-size:13px}',
    'th{background:{{client.primaryColor}};color:#fff;padding:10px 14px;text-align:left}',
    'td{padding:10px 14px;border-bottom:1px solid #e2e8f0}</style></head><body>',
    '<div class="header"><h1>{{client.name}}</h1>',
    '<p>Performance Report &mdash; {{agencyName}}</p>',
    '<p>{{period.start}} &mdash; {{period.end}}</p></div>',
    '<div class="kpi-grid">',
    `<div class="kpi-card"><div class="kpi-label">Total Spend</div><div class="kpi-value">${dollarSign}{{kpis.totalSpend}}</div></div>`,
    '<div class="kpi-card"><div class="kpi-label">Total Leads</div><div class="kpi-value">{{kpis.totalLeads}}</div></div>',
    '<div class="kpi-card"><div class="kpi-label">Avg ROAS</div><div class="kpi-value">{{kpis.avgROAS}}x</div></div>',
    '<div class="kpi-card"><div class="kpi-label">Avg CTR</div><div class="kpi-value">{{kpis.avgCTR}}%</div></div>',
    '</div>',
    '<table><thead><tr><th>Campaign</th><th>Platform</th><th>Spend</th><th>Impressions</th><th>Clicks</th><th>ROAS</th><th>Leads</th></tr></thead>',
    '<tbody>{{#each campaigns}}<tr>',
    `<td>{{name}}</td><td>{{platform}}</td><td>${dollarSign}{{spend}}</td>`,
    '<td>{{impressions}}</td><td>{{clicks}}</td><td>{{roas}}x</td><td>{{leads}}</td>',
    '</tr>{{/each}}</tbody></table>',
    '<div style="padding:24px 50px;font-size:12px;color:#64748b;background:#f1f5f9;display:flex;justify-content:space-between">',
    '<span>Generated by {{agencyName}}</span><span>{{generatedAt}}</span><span>For {{client.name}}</span></div>',
    '</body></html>',
  ].join('\n');
}

export async function generateClientPDF(
  reportId: string,
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  logger.info(`📄 Generating PDF for report ${reportId}...`);

  const data = await buildReportData(clientId, startDate, endDate);
  const templateHtml = getReportTemplate();

  // Normalize bar heights for chart (max 140px)
  const maxSpend = Math.max(...data.dailySpend.map((d) => d.spend), 1);
  data.dailySpend = data.dailySpend.map((d) => ({
    ...d,
    spend: Math.round((d.spend / maxSpend) * 140),
  }));

  // Compile Handlebars template
  const template = Handlebars.compile(templateHtml);
  const html = template(data);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const fileName = `report_${reportId}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    logger.info(`✅ PDF generated: ${fileName}`);
    return `reports/${fileName}`;
  } finally {
    await browser.close();
  }
}
