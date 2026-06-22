const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const name = 'januar';
  const email = 'januarzidane6@gmail.com';
  const rawPassword = '07012009Zi@';
  const role = 'ADMIN';

  // Hash password
  const password = await bcrypt.hash(rawPassword, 12);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Update to admin
    await prisma.user.update({
      where: { email },
      data: { role, passwordHash: password, isVerified: true },
    });
    console.log(`✅ User "${email}" sudah ada. Diperbarui menjadi ADMIN.`);
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password,
        role,
        isVerified: true,
      },
    });
    console.log(`✅ Admin "${name}" (${email}) berhasil dibuat dengan role ADMIN!`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
