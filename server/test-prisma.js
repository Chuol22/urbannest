import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function test() {
  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Test123!@#', salt);

    const user = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@example.com`,
        phone: `+123456789${Math.floor(Math.random() * 10)}`,
        password_hash: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'seeker',
        email_verification_token: crypto.randomBytes(32).toString('hex'),
        email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    console.log('Success:', user);
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
