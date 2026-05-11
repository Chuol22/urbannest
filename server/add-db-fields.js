import { PrismaClient } from '@prisma/client';

async function addFields() {
  const prisma = new PrismaClient();
  try {
    // Try to add login_attempts field
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0');
    console.log('✓ Added login_attempts field');
  } catch (error) {
    console.log('login_attempts field may already exist:', error.message);
  }
  
  try {
    // Try to add locked_until field  
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP');
    console.log('✓ Added locked_until field');
  } catch (error) {
    console.log('locked_until field may already exist:', error.message);
  }
  
  await prisma.$disconnect();
  console.log('Database schema update completed');
}

addFields().catch(console.error);
