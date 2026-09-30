import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('--- Membuat / Memperbarui Akun Admin AD BARBERSHOP ---');

  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@adbarbershop.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin AD Barbershop';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          username,
          email,
          passwordHash,
          name,
          role: 'ADMIN'
        }
      });
      console.log(`✅ Admin berhasil diperbarui:`);
      console.log(`   ID: ${updated.id}`);
      console.log(`   Username: ${updated.username}`);
      console.log(`   Email: ${updated.email}`);
      console.log(`   Password: ${password}`);
    } else {
      const created = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          name,
          role: 'ADMIN'
        }
      });
      console.log(`✅ Admin baru berhasil dibuat:`);
      console.log(`   ID: ${created.id}`);
      console.log(`   Username: ${created.username}`);
      console.log(`   Email: ${created.email}`);
      console.log(`   Password: ${password}`);
    }
  } catch (error) {
    console.error('❌ Gagal membuat akun admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
