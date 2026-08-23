#!/usr/bin/env node

/**
 * One-Time Admin Setup Script
 * 
 * This script creates the first admin user for the UrbanNEST platform.
 * It reads credentials from environment variables and ensures idempotent execution.
 * 
 * Usage:
 *   node server/scripts/setupAdmin.js
 * 
 * Required Environment Variables:
 *   - ADMIN_EMAIL
 *   - ADMIN_PASSWORD
 *   - ADMIN_FIRST_NAME
 *   - ADMIN_LAST_NAME
 *   - ADMIN_PHONE
 * 
 * Requirements Validation: 1.1, 20.3
 */

// Import required dependencies
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import passwordService from '../src/services/password.service.js';
import { validateAndSanitizeEmail, validateAndSanitizePhone, sanitizeInput } from '../src/utils/validators.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Prisma Client
let dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (dbUrl && !dbUrl.includes('connect_timeout')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
}
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

/**
 * Validates required environment variables
 * @returns {Object} Environment variables object or null if validation fails
 */
function validateEnvironmentVariables() {
    const required = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_FIRST_NAME', 'ADMIN_LAST_NAME', 'ADMIN_PHONE'];
    const missing = [];

    for (const varName of required) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.error(`[Setup Error] Missing required environment variable(s): ${missing.join(', ')}`);
        return null;
    }

    return {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        phone: process.env.ADMIN_PHONE
    };
}

/**
 * Check if an admin user already exists in the database with connection retry
 * @returns {Promise<boolean>} True if admin exists, false otherwise
 */
async function checkExistingAdmin() {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            attempts++;
            await prisma.$connect();
            const existingAdmin = await prisma.user.findFirst({
                where: {
                    role: 'admin'
                }
            });
            return existingAdmin !== null;
        } catch (err) {
            console.warn(`[Setup Warning] Connection attempt ${attempts}/${maxAttempts} failed: ${err.message}`);
            if (attempts >= maxAttempts) throw err;
            console.log('[Setup] Retrying database connection in 2 seconds...');
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    return false;
}

/**
 * Main setup function
 * Creates the first admin user if none exists
 */
async function main() {
    try {
        console.log('[Setup] Starting admin user setup...');
        console.log(`[Setup] Timestamp: ${new Date().toISOString()}`);

        // Step 1: Validate environment variables
        console.log('[Setup] Step 1: Validating environment variables...');
        const credentials = validateEnvironmentVariables();
        if (!credentials) {
            console.error('[Setup] Environment validation failed');
            process.exit(1);
        }
        console.log('[Setup] Environment variables validated successfully');

        // Step 2: Validate credentials
        console.log('[Setup] Step 2: Validating credentials...');
        const emailValidation = validateAndSanitizeEmail(credentials.email);
        if (!emailValidation.valid) {
            console.error(`[Setup Error] ${emailValidation.error}`);
            process.exit(1);
        }

        const phoneValidation = validateAndSanitizePhone(credentials.phone);
        if (!phoneValidation.valid) {
            console.error(`[Setup Error] ${phoneValidation.error}`);
            process.exit(1);
        }

        if (!credentials.password || credentials.password.length < 8) {
            console.error('[Setup Error] Password must be at least 8 characters long');
            process.exit(1);
        }
        console.log('[Setup] Credential validation passed');

        // Step 3: Hash password using bcrypt (12 salt rounds)
        console.log('[Setup] Step 3: Hashing password...');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(credentials.password, salt);
        console.log('[Setup] Password hashed successfully');

        // Step 4: Check if user with this email or role=admin already exists and update or create with Neon retry
        console.log('[Setup] Step 4: Syncing superadmin user in database...');
        const sanitizedEmail = emailValidation.sanitized;
        const sanitizedPhone = phoneValidation.sanitized;

        let targetAdmin = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                await prisma.$connect();

                const existingAdmin = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: sanitizedEmail },
                            { role: 'admin' }
                        ]
                    }
                });

                if (existingAdmin) {
                    console.log(`[Setup] Updating existing admin account (ID: ${existingAdmin.id})...`);
                    targetAdmin = await prisma.user.update({
                        where: { id: existingAdmin.id },
                        data: {
                            email: sanitizedEmail,
                            phone: sanitizedPhone,
                            password_hash: hashedPassword,
                            first_name: sanitizeInput(credentials.firstName),
                            last_name: sanitizeInput(credentials.lastName),
                            role: 'admin',
                            is_verified: true,
                            verification_status: 'approved',
                            is_active: true
                        },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            updated_at: true
                        }
                    });
                    console.log('[Setup Success] Superadmin credentials updated successfully!');
                    console.log(`[Setup Success] Admin Email: ${targetAdmin.email}`);
                } else {
                    console.log('[Setup] Creating new superadmin account...');
                    targetAdmin = await prisma.user.create({
                        data: {
                            email: sanitizedEmail,
                            phone: sanitizedPhone,
                            password_hash: hashedPassword,
                            first_name: sanitizeInput(credentials.firstName),
                            last_name: sanitizeInput(credentials.lastName),
                            role: 'admin',
                            is_verified: true,
                            verification_status: 'approved',
                            is_active: true
                        },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            created_at: true
                        }
                    });
                    console.log('[Setup Success] Superadmin User Created Successfully!');
                    console.log(`[Setup Success] Admin ID: ${targetAdmin.id}`);
                    console.log(`[Setup Success] Admin Email: ${targetAdmin.email}`);
                }

                break; // Succeeded, exit retry loop
            } catch (dbErr) {
                console.warn(`[Setup Warning] Database connection attempt ${attempts}/${maxAttempts} failed: ${dbErr.message}`);
                if (attempts >= maxAttempts) throw dbErr;
                console.log('[Setup] Database server is waking up. Retrying in 3 seconds...');
                await new Promise(res => setTimeout(res, 3000));
            }
        }

    } catch (error) {
        console.error('[Setup Error] Setup failed:', error.message);
        if (error.stack) {
            console.error('[Setup Error] Stack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        // Always disconnect Prisma client to avoid hanging connections
        await prisma.$disconnect();
    }
}

/**
 * Execute main function with error handling
 * Ensures proper cleanup and exit codes
 */
main()
    .then(() => {
        console.log('[Setup] Script execution completed');
    })
    .catch((error) => {
        console.error('[Setup Fatal Error] Unexpected error during execution:', error);
        process.exit(1);
    });
