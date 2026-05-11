import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import crypto from 'crypto';

const execPromise = promisify(exec);

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
   * Get database connection details from environment
   */
  getDbConfig() {
    // Parse DATABASE_URL if available
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      try {
        // Parse PostgreSQL connection string
        const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
        if (match) {
          return {
            user: match[1],
            password: match[2],
            host: match[3],
            port: parseInt(match[4]),
            database: match[5]
          };
        }
      } catch (error) {
        console.warn('Failed to parse DATABASE_URL, using fallback');
      }
    }
    
    // Fallback to individual environment variables
    return {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres'
    };
  }

  /**
   * Create a new test database
   */
  async createTestDatabase() {
    try {
      const config = this.getDbConfig();
      const defaultDb = config.database;

      // Generate unique test database name
      this.testDatabaseName = this.generateTestDatabaseName();

      // Set the database name for connection
      process.env.DATABASE_URL = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${this.testDatabaseName}?sslmode=require`;

      // Connect to default database to create test database
      const tempPrisma = new PrismaClient({
        datasources: {
          db: {
            url: `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${defaultDb}`
          }
        }
      });

      try {
        // Create test database
        await tempPrisma.$executeRawUnsafe(
          `CREATE DATABASE "${this.testDatabaseName}"`
        );
        console.log(`✅ Created test database: ${this.testDatabaseName}`);
      } catch (error) {
        // If database already exists, drop and recreate
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Test database already exists, dropping and recreating...`);
          await tempPrisma.$executeRawUnsafe(
            `DROP DATABASE IF EXISTS "${this.testDatabaseName}"`
          );
          await tempPrisma.$executeRawUnsafe(
            `CREATE DATABASE "${this.testDatabaseName}"`
          );
          console.log(`✅ Recreated test database: ${this.testDatabaseName}`);
        } else {
          throw error;
        }
      } finally {
        await tempPrisma.$disconnect();
      }
    } catch (error) {
      console.error('❌ Failed to create test database:', error.message);
      throw error;
    }
  }

  /**
   * Run migrations on test database
   */
  async runMigrations() {
    try {
      // Run Prisma migrations
      const { stdout, stderr } = await execPromise('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
      });
      
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('warn')) console.error(stderr);
      
      console.log('✅ Migrations applied successfully');
    } catch (error) {
      console.error('❌ Failed to run migrations:', error.message);
      // Try to push schema instead if migrations fail
      try {
        console.log('⚠️ Trying to push schema instead...');
        await execPromise('npx prisma db push', {
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
        });
        console.log('✅ Schema pushed successfully');
      } catch (pushError) {
        console.error('❌ Failed to push schema:', pushError.message);
        throw error;
      }
    }
  }

  /**
   * Initialize Prisma client for test database
   */
  async initializePrisma() {
    try {
      this.prisma = new PrismaClient({
        log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty'
      });

      // Test the connection
      await this.prisma.$connect();
      this.isConnected = true;
      
      console.log('✅ Prisma client connected to test database');
    } catch (error) {
      console.error('❌ Failed to initialize Prisma client:', error.message);
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
      console.error('❌ Test database setup failed:', error.message);
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
        const config = this.getDbConfig();
        const defaultDb = config.database;

        const tempPrisma = new PrismaClient({
          datasources: {
            db: {
              url: `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${defaultDb}?sslmode=require`
            }
          }
        });

        try {
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
          
          console.log(`✅ Dropped test database: ${this.testDatabaseName}`);
        } catch (error) {
          console.error(`⚠️ Failed to drop test database: ${error.message}`);
        } finally {
          await tempPrisma.$disconnect();
        }
      }

      // Restore original environment
      Object.assign(process.env, originalEnv);
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error.message);
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
      console.error('❌ Failed to clear database:', error.message);
      throw error;
    }
  }

  /**
   * Get the Prisma client instance
   */
  getPrisma() {
    if (!this.prisma || !this.isConnected) {
      throw new Error('Prisma client not initialized. Call setup() first.');
    }
    return this.prisma;
  }
}

// Create a singleton instance
const testDB = new TestDatabaseSetup();

// Export for use in tests
export default testDB;