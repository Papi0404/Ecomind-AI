const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with EcoMind AI challenges and badges...');

  // 1. Seed Challenges
  const challenges = [
    {
      title: 'Berjalan Kaki 30 Menit',
      description: 'Berjalan kaki alih-alih berkendara untuk perjalanan jarak dekat harian Anda.',
      category: 'Transport',
      pointsReward: 80,
      co2Reduction: 0.3,
      durationDays: 1,
      isWeekly: false,
    },
    {
      title: 'Makan Siang Nabati',
      description: 'Pilih menu makanan berbasis tumbuhan (plant-based) hari ini untuk mengurangi emisi pangan.',
      category: 'Food',
      pointsReward: 60,
      co2Reduction: 0.5,
      durationDays: 1,
      isWeekly: false,
    },
    {
      title: 'Gunakan Tas Kain',
      description: 'Tolak kantong plastik sekali pakai saat berbelanja di minimarket atau pasar.',
      category: 'Waste',
      pointsReward: 40,
      co2Reduction: 0.1,
      durationDays: 1,
      isWeekly: false,
    },
    {
      title: 'Matikan Lampu 1 Jam',
      description: 'Kurangi konsumsi energi listrik dengan mematikan lampu yang tidak terpakai selama 1 jam di malam hari.',
      category: 'Energy',
      pointsReward: 50,
      co2Reduction: 0.2,
      durationDays: 1,
      isWeekly: false,
    },
    {
      title: 'Pilah Sampah Hari Ini',
      description: 'Pisahkan sampah rumah tangga Anda menjadi organik, anorganik, dan B3 sebelum dibuang.',
      category: 'Waste',
      pointsReward: 70,
      co2Reduction: 0.15,
      durationDays: 1,
      isWeekly: false,
    },
    {
      title: '30-Day Bike Challenge',
      description: 'Gunakan sepeda sebagai transportasi utama minimal 5 kali seminggu untuk mengurangi emisi kendaraan.',
      category: 'Transport',
      pointsReward: 500,
      co2Reduction: 2.4,
      durationDays: 7,
      isWeekly: true,
    },
    {
      title: 'Zero Waste Kitchen',
      description: 'Kurangi sampah sisa makanan dan hindari kemasan plastik sekali pakai di dapur Anda selama seminggu penuh.',
      category: 'Waste',
      pointsReward: 400,
      co2Reduction: 1.8,
      durationDays: 7,
      isWeekly: true,
    },
    {
      title: 'Energy Saver Week',
      description: 'Matikan AC jika tidak digunakan, gunakan peralatan hemat energi, dan kurangi konsumsi listrik rumah 20% minggu ini.',
      category: 'Energy',
      pointsReward: 350,
      co2Reduction: 1.1,
      durationDays: 7,
      isWeekly: true,
    },
  ];

  for (const c of challenges) {
    const existing = await prisma.challenge.findFirst({
      where: { title: c.title },
    });
    if (!existing) {
      await prisma.challenge.create({
        data: c,
      });
    }
  }

  // 2. Seed Badges
  const badges = [
    {
      name: 'Green Starter',
      description: 'Selesaikan misi pertama Anda',
      icon: '🌱',
      reqType: 'POINTS',
      reqValue: 50,
    },
    {
      name: 'Week Warrior',
      description: 'Pertahankan streak aktivitas hijau selama 7 hari berturut-turut',
      icon: '⚡',
      reqType: 'STREAK',
      reqValue: 7,
    },
    {
      name: 'Eco Champion',
      description: 'Selesaikan total 10 tantangan ramah lingkungan',
      icon: '🏆',
      reqType: 'CHALLENGES',
      reqValue: 10,
    },
    {
      name: 'Recycler Pro',
      description: 'Lakukan pemilahan dan daur ulang secara konsisten',
      icon: '♻️',
      reqType: 'POINTS',
      reqValue: 300,
    },
    {
      name: 'Water Guardian',
      description: 'Hemat air secara konsisten dalam aktivitas sehari-hari',
      icon: '🌊',
      reqType: 'POINTS',
      reqValue: 500,
    },
    {
      name: 'Plant Powered',
      description: 'Pertahankan diet nabati yang ramah lingkungan',
      icon: '🌿',
      reqType: 'POINTS',
      reqValue: 200,
    },
    {
      name: 'Earth Guardian',
      description: 'Selesaikan total 50 tantangan ramah lingkungan',
      icon: '🌍',
      reqType: 'CHALLENGES',
      reqValue: 50,
    },
    {
      name: 'Streak Master',
      description: 'Pertahankan streak aktivitas hijau selama 30 hari berturut-turut',
      icon: '🔥',
      reqType: 'STREAK',
      reqValue: 30,
    },
    {
      name: 'Diamond Eco',
      description: 'Capai level 15 sebagai pahlawan lingkungan utama',
      icon: '💎',
      reqType: 'POINTS',
      reqValue: 10000,
    },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        reqType: b.reqType,
        reqValue: b.reqValue,
      },
    });
  }

  console.log('Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
