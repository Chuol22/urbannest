// diagnose.js - Run this FIRST before starting server
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 URBANNEST SERVER DIAGNOSTIC TOOL\n' + '='.repeat(50));

// Check 1: Node version
console.log('\n📦 Node.js Version:');
const nodeVersion = process.version;
console.log(`   ${nodeVersion}`);
if (nodeVersion.startsWith('v14') || nodeVersion.startsWith('v16')) {
    console.log('   ⚠️ Consider upgrading to Node v18+ for better performance');
}

// Check 2: .env file
console.log('\n📝 Environment Configuration:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('   ✓ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDbUrl = envContent.includes('DATABASE_URL');
    const hasJwt = envContent.includes('JWT_SECRET');
    console.log(`   ${hasDbUrl ? '✓' : '✗'} DATABASE_URL ${hasDbUrl ? 'set' : 'missing'}`);
    console.log(`   ${hasJwt ? '✓' : '✗'} JWT_SECRET ${hasJwt ? 'set' : 'missing'}`);
} else {
    console.log('   ✗ .env file MISSING! Create one from .env.example');
}

// Check 3: Port availability
console.log('\n🌐 Port 5000 Status:');
import net from 'net';
const testPort = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => resolve(false))
            .once('listening', () => {
                server.close();
                resolve(true);
            })
            .listen(port);
    });
};

const isPortFree = await testPort(5000);
console.log(`   Port 5000 is ${isPortFree ? '✓ FREE' : '✗ IN USE'}`);
if (!isPortFree) {
    console.log('   💡 Run: netstat -ano | findstr :5000 to find the process');
}

// Check 4: Database connection
console.log('\n🗄️  Database Connection:');
try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('   ✓ PostgreSQL is reachable');
    
    const result = await prisma.$queryRaw`SELECT current_database() as db`;
    console.log(`   Database: ${result[0].db}`);
    await prisma.$disconnect();
} catch (error) {
    console.log(`   ✗ Database connection failed: ${error.message}`);
    console.log('   💡 Check DATABASE_URL in .env file');
}

// Check 5: Required packages
console.log('\n📚 Critical Dependencies:');
const requiredPackages = ['express', '@prisma/client', 'jsonwebtoken', 'bcryptjs'];
requiredPackages.forEach(pkg => {
    try {
        const pkgPath = path.join(__dirname, 'node_modules', pkg);
        if (fs.existsSync(pkgPath)) {
            console.log(`   ✓ ${pkg}`);
        } else {
            console.log(`   ✗ ${pkg} MISSING`);
        }
    } catch(e) {
        console.log(`   ✗ ${pkg} NOT FOUND`);
    }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('✅ If all checks passed, run: npm run dev');
console.log('❌ If any checks failed, fix them and run diagnose again');
console.log('='.repeat(50) + '\n');