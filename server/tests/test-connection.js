// tests/test-connection.js - Enhanced version
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:8080'; // ← Now uses env variable

async function testDatabaseConnection() {
  console.log('\n📊 TESTING DATABASE CONNECTION\n' + '='.repeat(50));
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
  
  try {
    console.log('⏳ Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    console.log('⏳ Testing query...');
    const result = await prisma.$queryRaw`SELECT 1 as connected, NOW() as current_time, current_database() as db_name`;
    console.log('✅ Test query successful!');
    console.log(`   Database: ${result[0].db_name}`);
    console.log(`   Time: ${result[0].current_time}`);
    
    // Optional: Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`   Tables in database: ${tables[0].count}`);
    
    console.log('\n✅ All database tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your Neon database is active:');
      console.log('   → Go to https://console.neon.tech');
      console.log('   → Check if your database shows as "Active"');
      console.log('2. If it\'s paused, it will automatically wake up on first connection');
      console.log('   → Wait 5-10 seconds and try again');
      console.log('3. Verify your DATABASE_URL in .env file');
      console.log('4. Check your internet connection');
    } else if (error.code === 'P1003') {
      console.log('\n💡 Database does not exist. Run migrations first:');
      console.log('   npx prisma migrate dev');
    } else if (error.code === 'P1010') {
      console.log('\n💡 User does not have permission. Check your Neon credentials.');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testAPIEndpoint() {
  console.log('\n🌐 TESTING API ENDPOINT\n' + '='.repeat(50));
  console.log(`API URL: ${API_URL}`);
  
  try {
    console.log('⏳ Checking server health...');
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ API server is running!');
      console.log(`   Environment: ${data.environment || 'N/A'}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      return true;
    } else {
      console.log('⚠️  Server returned unexpected response');
      return false;
    }
  } catch (error) {
    console.log('⚠️  API server not reachable (this is OK if server is not running)');
    console.log(`   Error: ${error.message}`);
    console.log('   To test API, run: npm run dev first');
    return false;
  }
}

async function runAllTests() {
  console.log('\n🔍 URBANNEST CONNECTION TESTS');
  console.log('='.repeat(60));
  
  const dbOk = await testDatabaseConnection();
  const apiOk = await testAPIEndpoint();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Database: ${dbOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`API: ${apiOk ? '✅ PASSED' : '⚠️  SKIPPED (server not running)'}`);
  
  if (dbOk && apiOk) {
    console.log('\n🎉 All systems ready! You can connect your frontend now.');
  } else if (dbOk && !apiOk) {
    console.log('\n⚠️  Database is fine, but API server is not running.');
    console.log('   Run: npm run dev');
  } else {
    console.log('\n❌ Database connection failed. Fix database first.');
  }
  console.log('='.repeat(60) + '\n');
}

// Run all tests
runAllTests();