import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Subscription Plans
  console.log('Seeding SubscriptionPlans...');
  const plans = [
    {
      tier: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      maxTrips: 2,
      maxMembersPerTrip: 5,
      canScanReceipts: false,
      canExport: false,
      canCustomSplit: false,
      canCurrencyConvert: false,
      canAISettle: false,
    },
    {
      tier: 'PRO' as const,
      priceMonthly: 299,
      priceYearly: 2499,
      maxTrips: 10,
      maxMembersPerTrip: 15,
      canScanReceipts: true,
      canExport: true,
      canCustomSplit: true,
      canCurrencyConvert: true,
      canAISettle: false,
    },
    {
      tier: 'PREMIUM' as const,
      priceMonthly: 599,
      priceYearly: 4999,
      maxTrips: -1,
      maxMembersPerTrip: -1,
      canScanReceipts: true,
      canExport: true,
      canCustomSplit: true,
      canCurrencyConvert: true,
      canAISettle: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }

  // 2. Seed Users
  console.log('Seeding Users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@settl.com' },
    update: {},
    create: {
      email: 'alice@settl.com',
      name: 'Alice Cooper',
      username: 'alice_cooper',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@settl.com' },
    update: {},
    create: {
      email: 'bob@settl.com',
      name: 'Bob Marley',
      username: 'bob_marley',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@settl.com' },
    update: {},
    create: {
      email: 'charlie@settl.com',
      name: 'Charlie Chaplin',
      username: 'charlie_chaplin',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  // Assign FREE plan subscription
  const freePlan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { tier: 'FREE' },
  });

  for (const u of [user1, user2, user3]) {
    await prisma.userSubscription.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        planId: freePlan.id,
        status: 'ACTIVE',
      },
    });
  }

  // 3. Seed 1 Sample Trip with Alice as Owner, Bob and Charlie as members
  console.log('Seeding Sample Trip...');
  
  // Clean up any existing sample trip to ensure clean upsert / seeding
  const existingTrip = await prisma.trip.findFirst({
    where: { name: 'Goa Road Trip', ownerId: user1.id }
  });
  if (existingTrip) {
    await prisma.trip.delete({ where: { id: existingTrip.id } });
  }

  await prisma.trip.create({
    data: {
      name: 'Goa Road Trip',
      description: 'Fun weekend trip to Goa',
      budget: 15000,
      currency: 'INR',
      status: 'ACTIVE',
      ownerId: user1.id,
      members: {
        create: [
          {
            userId: user1.id,
            role: 'OWNER',
            displayName: 'Alice (Owner)',
          },
          {
            userId: user2.id,
            role: 'MEMBER',
            displayName: 'Bob',
          },
          {
            userId: user3.id,
            role: 'MEMBER',
            displayName: 'Charlie',
          },
        ],
      },
    },
  });

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
