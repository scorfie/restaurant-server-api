import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed an admin');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.staff.findUnique({ where: { email } });
  if (existing) {
    console.log(`Staff account already exists for ${email}, skipping.`);
    return;
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  await prisma.staff.create({
    data: { name, email, password: passwordHash, role: 'admin' },
  });

  console.log(`Admin staff account created for ${email}`);
}

seedAdmin()
  .catch((err) => {
    console.error('Failed to seed admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
