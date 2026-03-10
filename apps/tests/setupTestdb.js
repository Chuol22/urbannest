// tests/setupTestDB.js
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const crypto = require('crypto');

const execPromise = util.promisify(exec);

// Store original environment
const originalEnv = { ...process.env };

class TestDatabaseSetup {
  constructor() {
    this.prisma = null;
    this.testDatabaseName = null;
    this.isConnected = false;
  }

  /**
   * Generate a unique test database name
   */
  generateTestDatabaseName() {
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `test_db_${randomHash}_${Date.now()}`;
  }

  /**
   * Create a new test database
   */
  async createTestDatabase() {
    try {
      // Get connection details from environment or use defaults
      const dbUser = process.env.DB_USER || 'postgres';
      const dbPassword = process.env.DB_PASSWORD || 'postgres';
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = process.env.DB_PORT || '5432';
      const defaultDb = process.env.DB_NAME || 'postgres';

      // Generate unique test database name
      this.testDatabaseName = this.generateTestDatabaseName();

      // Set the database name for connection
      process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${this.testDatabaseName}`;

      // Connect to default database to create test database
      const tempPrisma = new PrismaClient({
        datasources: {
          db: {
            url: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${defaultDb}`
          }
        }
      });

      // Create test database
      await tempPrisma.$executeRawUnsafe(
        `CREATE DATABASE "${this.testDatabaseName}"`
      );

      await tempPrisma.$disconnect();
      
      console.log(`✅ Created test database: ${this.testDatabaseName}`);
    } catch (error) {
      console.error('❌ Failed to create test database:', error);
      throw error;
    }
  }

  /**
   * Run migrations on test database
   */
  async runMigrations() {
    try {
      // Run Prisma migrations
      await execPromise('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
      });
      
      console.log('✅ Migrations applied successfully');
    } catch (error) {
      console.error('❌ Failed to run migrations:', error);
      throw error;
    }
  }

  /**
   * Initialize Prisma client for test database
   */
  async initializePrisma() {
    try {
      this.prisma = new PrismaClient({
        log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      // Test the connection
      await this.prisma.$connect();
      this.isConnected = true;
      
      console.log('✅ Prisma client connected to test database');
    } catch (error) {
      console.error('❌ Failed to initialize Prisma client:', error);
      throw error;
    }
  }

  /**
   * Set up the test database
   */
  async setup() {
    try {
      await this.createTestDatabase();
      await this.runMigrations();
      await this.initializePrisma();
      
      return this.prisma;
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up database after tests
   */
  async cleanup() {
    try {
      // Disconnect Prisma client
      if (this.prisma && this.isConnected) {
        await this.prisma.$disconnect();
        this.isConnected = false;
      }

      // Drop test database
      if (this.testDatabaseName) {
        const dbUser = process.env.DB_USER || 'postgres';
        const dbPassword = process.env.DB_PASSWORD || 'postgres';
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || '5432';
        const defaultDb = process.env.DB_NAME || 'postgres';

        const tempPrisma = new PrismaClient({
          datasources: {
            db: {
              url: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${defaultDb}`
            }
          }
        });

        // Force disconnect all connections and drop database
        await tempPrisma.$executeRawUnsafe(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = '${this.testDatabaseName}'
          AND pid <> pg_backend_pid();
        `);

        await tempPrisma.$executeRawUnsafe(
          `DROP DATABASE IF EXISTS "${this.testDatabaseName}"`
        );

        await tempPrisma.$disconnect();
        
        console.log(`✅ Dropped test database: ${this.testDatabaseName}`);
      }

      // Restore original environment
      Object.assign(process.env, originalEnv);
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clear all data from tables (useful between tests)
   */
  async clearDatabase() {
    if (!this.prisma || !this.isConnected) {
      throw new Error('Prisma client not initialized');
    }

    try {
      // Get all table names
      const tables = await this.prisma.$queryRaw`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `;

      // Truncate all tables
      for (const { tablename } of tables) {
        if (tablename !== '_prisma_migrations') {
          await this.prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "${tablename}" CASCADE;`
          );
        }
      }
      
      console.log('✅ Database cleared');
    } catch (error) {
      console.error('❌ Failed to clear database:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const testDB = new TestDatabaseSetup();

// Global setup for Jest
beforeAll(async () => {
  await testDB.setup();
});

// Optional: Clear database before each test
beforeEach(async () => {
  if (process.env.CLEAR_DB_BEFORE_EACH_TEST === 'true') {
    await testDB.clearDatabase();
  }
});

// Global teardown for Jest
afterAll(async () => {
  await testDB.cleanup();
});

module.exports = testDB;