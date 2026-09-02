import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Starting database column synchronization...');
  
  const migrationStatements = [
    `ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;`,
    `ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_fee_paid BOOLEAN DEFAULT false;`,
    `ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_tier VARCHAR(50) DEFAULT 'standard';`,
    `ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_expires_at TIMESTAMP;`,
    `ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_rejection_reason TEXT;`,
    `ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`,

    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending_review';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_document_url TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);`,

    `CREATE TABLE IF NOT EXISTS listing_fee_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL,
      currency VARCHAR(10) DEFAULT 'ETB',
      tier VARCHAR(50) DEFAULT 'standard',
      chapa_transaction_ref VARCHAR(255) UNIQUE,
      chapa_checkout_url TEXT,
      status VARCHAR(50) DEFAULT 'PENDING',
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const sql of migrationStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ Executed: ${sql.trim()}`);
    } catch (err) {
      console.warn(`⚠️ Warning for [${sql.slice(0, 45)}...]:`, err.message);
    }
  }

  console.log('🎉 Database synchronization complete!');
  await prisma.$disconnect();
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
