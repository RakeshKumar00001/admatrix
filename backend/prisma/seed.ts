import { PrismaClient, Role, Platform } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, format } from 'date-fns';

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max));
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin user ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agency.com' },
    update: {},
    create: {
      email: 'admin@agency.com',
      passwordHash: adminPassword,
      name: 'Agency Admin',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Client 1: TechCorp ──────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { slug: 'techcorp' },
    update: {},
    create: {
      name: 'TechCorp Solutions',
      slug: 'techcorp',
      email: 'marketing@techcorp.com',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
    },
  });

  const client1Password = await bcrypt.hash('client123', 12);
  await prisma.user.upsert({
    where: { email: 'client@techcorp.com' },
    update: {},
    create: {
      email: 'client@techcorp.com',
      passwordHash: client1Password,
      name: 'TechCorp Marketing',
      role: Role.CLIENT,
      clientId: client1.id,
    },
  });

  await prisma.adAccount.upsert({
    where: { clientId_metaAccountId: { clientId: client1.id, metaAccountId: 'act_123456789' } },
    update: {},
    create: {
      clientId: client1.id,
      metaAccountId: 'act_123456789',
      name: 'TechCorp Main Account',
      currency: 'USD',
    },
  });

  await prisma.socialAccount.create({
    data: {
      clientId: client1.id,
      facebookPageId: 'fb_page_techcorp',
      instagramBusinessId: 'ig_biz_techcorp',
      facebookPageName: 'TechCorp Official',
      instagramUsername: '@techcorp_official',
    },
  }).catch(() => {});

  // ── Client 2: FashionBrand ──────────────────────────────
  const client2 = await prisma.client.upsert({
    where: { slug: 'fashionbrand' },
    update: {},
    create: {
      name: 'Fashion Brand Inc',
      slug: 'fashionbrand',
      email: 'ads@fashionbrand.com',
      primaryColor: '#ec4899',
      secondaryColor: '#f43f5e',
    },
  });

  const client2Password = await bcrypt.hash('client456', 12);
  await prisma.user.upsert({
    where: { email: 'client@fashionbrand.com' },
    update: {},
    create: {
      email: 'client@fashionbrand.com',
      passwordHash: client2Password,
      name: 'Fashion Brand Team',
      role: Role.CLIENT,
      clientId: client2.id,
    },
  });

  await prisma.adAccount.upsert({
    where: { clientId_metaAccountId: { clientId: client2.id, metaAccountId: 'act_987654321' } },
    update: {},
    create: {
      clientId: client2.id,
      metaAccountId: 'act_987654321',
      name: 'Fashion Brand Ads',
      currency: 'USD',
    },
  });

  await prisma.socialAccount.create({
    data: {
      clientId: client2.id,
      facebookPageId: 'fb_page_fashion',
      instagramBusinessId: 'ig_biz_fashion',
      facebookPageName: 'Fashion Brand Official',
      instagramUsername: '@fashionbrand_ig',
    },
  }).catch(() => {});

  // ── Mock Insights (30 days) ─────────────────────────────
  const clients = [
    {
      client: client1,
      campaigns: [
        { id: 'camp_001', name: 'Brand Awareness Q2', platform: Platform.FACEBOOK },
        { id: 'camp_002', name: 'Lead Gen - Tech', platform: Platform.FACEBOOK },
        { id: 'camp_003', name: 'Instagram Stories', platform: Platform.INSTAGRAM },
      ],
      spendBase: 500,
    },
    {
      client: client2,
      campaigns: [
        { id: 'camp_004', name: 'Summer Collection', platform: Platform.INSTAGRAM },
        { id: 'camp_005', name: 'Retargeting - Website', platform: Platform.FACEBOOK },
      ],
      spendBase: 300,
    },
  ];

  for (const { client, campaigns, spendBase } of clients) {
    for (let day = 30; day >= 0; day--) {
      const date = subDays(new Date(), day);
      date.setHours(0, 0, 0, 0);

      for (const camp of campaigns) {
        const spend = randomBetween(spendBase * 0.6, spendBase * 1.4);
        const impressions = randomInt(5000, 50000);
        const clicks = randomInt(100, 2000);
        const ctr = clicks / impressions;
        const cpc = spend / clicks;
        const conversions = randomInt(5, 100);
        const roas = randomBetween(1.5, 6.0);

        await prisma.insight.upsert({
          where: {
            clientId_date_campaignId_platform: {
              clientId: client.id,
              date,
              campaignId: camp.id,
              platform: camp.platform,
            },
          },
          update: {},
          create: {
            clientId: client.id,
            date,
            campaignId: camp.id,
            campaignName: camp.name,
            adAccountId: 'act_' + randomInt(100000, 999999),
            platform: camp.platform,
            spend: Math.round(spend * 100) / 100,
            impressions,
            clicks,
            ctr: Math.round(ctr * 10000) / 10000,
            cpc: Math.round(cpc * 100) / 100,
            cpm: Math.round((spend / impressions * 1000) * 100) / 100,
            roas: Math.round(roas * 100) / 100,
            conversions,
            leads: randomInt(2, 50),
            reach: randomInt(3000, 40000),
            frequency: randomBetween(1.0, 3.5),
          },
        });
      }

      // Social insights
      for (const plat of [Platform.FACEBOOK, Platform.INSTAGRAM]) {
        const followers = 10000 + (30 - day) * randomInt(10, 80);
        await prisma.socialInsight.upsert({
          where: { clientId_platform_date: { clientId: client.id, platform: plat, date } },
          update: {},
          create: {
            clientId: client.id,
            platform: plat,
            date,
            followers,
            followersNet: randomInt(-20, 150),
            reach: randomInt(2000, 20000),
            impressions: randomInt(3000, 30000),
            engagement: randomInt(100, 2000),
            profileViews: randomInt(50, 500),
            posts: randomInt(0, 3),
          },
        });
      }
    }
    console.log(`✅ Seeded insights for ${client.name}`);
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('  Admin:  admin@agency.com / admin123');
  console.log('  Client: client@techcorp.com / client123');
  console.log('  Client: client@fashionbrand.com / client456');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
