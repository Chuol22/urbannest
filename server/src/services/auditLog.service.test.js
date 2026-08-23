// server/src/services/auditLog.service.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import auditLogService from './auditLog.service.js';

const prisma = new PrismaClient();

describe('AuditLogService', () => {
    let testAdmin;
    let testLogs = [];

    beforeAll(async () => {
        // Create a test admin user
        testAdmin = await prisma.user.create({
            data: {
                phone: '+251911111111',
                password_hash: 'test_hash_123',
                first_name: 'Test',
                last_name: 'Admin',
                email: 'testadmin@example.com',
                role: 'admin',
                is_verified: true,
                verification_status: 'approved',
                is_active: true
            }
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.auditLog.deleteMany({
            where: {
                id: { in: testLogs.map(log => log.id) }
            }
        });

        await prisma.user.delete({
            where: { id: testAdmin.id }
        });

        await prisma.$disconnect();
    });

    beforeEach(() => {
        testLogs = [];
    });

    describe('log()', () => {
        it('should create an audit log entry with all required fields', async () => {
            const logData = {
                adminId: testAdmin.id,
                actionType: 'CREATE_ADMIN',
                targetResource: 'USER',
                targetId: 'test-target-id',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                metadata: { reason: 'Testing' }
            };

            const result = await auditLogService.log(logData);
            testLogs.push(result);

            expect(result).toHaveProperty('id');
            expect(result.admin_id).toBe(testAdmin.id);
            expect(result.action_type).toBe('CREATE_ADMIN');
            expect(result.target_resource).toBe('USER');
            expect(result.target_id).toBe('test-target-id');
            expect(result.ip_address).toBe('192.168.1.1');
            expect(result.user_agent).toBe('Mozilla/5.0');
            expect(result.metadata).toEqual({ reason: 'Testing' });
            expect(result.created_at).toBeInstanceOf(Date);
        });

        it('should create an audit log entry with optional fields as null', async () => {
            const logData = {
                adminId: testAdmin.id,
                actionType: 'APPROVE_LISTING',
                targetResource: 'PROPERTY'
            };

            const result = await auditLogService.log(logData);
            testLogs.push(result);

            expect(result).toHaveProperty('id');
            expect(result.admin_id).toBe(testAdmin.id);
            expect(result.action_type).toBe('APPROVE_LISTING');
            expect(result.target_resource).toBe('PROPERTY');
            expect(result.target_id).toBeNull();
            expect(result.ip_address).toBeNull();
            expect(result.user_agent).toBeNull();
            expect(result.metadata).toEqual({});
        });
    });

    describe('query()', () => {
        beforeEach(async () => {
            // Create test logs
            const log1 = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'CREATE_ADMIN',
                targetResource: 'USER',
                targetId: 'user-1',
                ipAddress: '192.168.1.1',
                metadata: { note: 'First log' }
            });
            testLogs.push(log1);

            const log2 = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'APPROVE_LISTING',
                targetResource: 'PROPERTY',
                targetId: 'property-1',
                ipAddress: '192.168.1.2',
                metadata: { note: 'Second log' }
            });
            testLogs.push(log2);

            const log3 = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'APPROVE_LISTING',
                targetResource: 'PROPERTY',
                targetId: 'property-2',
                ipAddress: '192.168.1.3',
                metadata: { note: 'Third log' }
            });
            testLogs.push(log3);
        });

        it('should return all logs with pagination', async () => {
            const result = await auditLogService.query({
                page: 1,
                limit: 10
            });

            expect(result.logs).toBeInstanceOf(Array);
            expect(result.logs.length).toBeGreaterThanOrEqual(3);
            expect(result.total).toBeGreaterThanOrEqual(3);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBeGreaterThanOrEqual(1);
        });

        it('should filter by adminId', async () => {
            const result = await auditLogService.query({
                adminId: testAdmin.id,
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(3);
            result.logs.forEach(log => {
                expect(log.admin_id).toBe(testAdmin.id);
            });
        });

        it('should filter by actionType', async () => {
            const result = await auditLogService.query({
                actionType: 'APPROVE_LISTING',
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(2);
            result.logs.forEach(log => {
                expect(log.action_type).toBe('APPROVE_LISTING');
            });
        });

        it('should filter by resource', async () => {
            const result = await auditLogService.query({
                resource: 'PROPERTY',
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(2);
            result.logs.forEach(log => {
                expect(log.target_resource).toBe('PROPERTY');
            });
        });

        it('should filter by date range', async () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            const result = await auditLogService.query({
                fromDate: oneHourAgo.toISOString(),
                toDate: twoHoursFromNow.toISOString(),
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(3);
            result.logs.forEach(log => {
                const logDate = new Date(log.created_at);
                expect(logDate.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
                expect(logDate.getTime()).toBeLessThanOrEqual(twoHoursFromNow.getTime());
            });
        });

        it('should search by target_id', async () => {
            const result = await auditLogService.query({
                search: 'property-1',
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(1);
            const matchingLog = result.logs.find(log => log.target_id === 'property-1');
            expect(matchingLog).toBeDefined();
        });

        it('should include admin name in results', async () => {
            const result = await auditLogService.query({
                adminId: testAdmin.id,
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(3);
            result.logs.forEach(log => {
                expect(log.admin_name).toBe(`${testAdmin.first_name} ${testAdmin.last_name}`);
                expect(log.admin_email).toBe(testAdmin.email);
            });
        });

        it('should handle pagination correctly', async () => {
            const page1 = await auditLogService.query({
                adminId: testAdmin.id,
                page: 1,
                limit: 2
            });

            expect(page1.logs.length).toBeLessThanOrEqual(2);
            expect(page1.page).toBe(1);
            expect(page1.limit).toBe(2);

            const page2 = await auditLogService.query({
                adminId: testAdmin.id,
                page: 2,
                limit: 2
            });

            expect(page2.page).toBe(2);
            expect(page2.limit).toBe(2);

            // Ensure pages don't contain the same logs
            const page1Ids = page1.logs.map(log => log.id);
            const page2Ids = page2.logs.map(log => log.id);
            const overlap = page1Ids.filter(id => page2Ids.includes(id));
            expect(overlap.length).toBe(0);
        });

        it('should return logs in descending order by created_at', async () => {
            const result = await auditLogService.query({
                adminId: testAdmin.id,
                page: 1,
                limit: 10
            });

            expect(result.logs.length).toBeGreaterThanOrEqual(3);

            for (let i = 0; i < result.logs.length - 1; i++) {
                const currentDate = new Date(result.logs[i].created_at);
                const nextDate = new Date(result.logs[i + 1].created_at);
                expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
            }
        });
    });

    describe('getById()', () => {
        it('should retrieve a single audit log by ID', async () => {
            const createdLog = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'UPDATE_ADMIN',
                targetResource: 'USER',
                targetId: 'test-user-id',
                metadata: { field: 'email', oldValue: 'old@test.com', newValue: 'new@test.com' }
            });
            testLogs.push(createdLog);

            const result = await auditLogService.getById(createdLog.id);

            expect(result.id).toBe(createdLog.id);
            expect(result.admin_id).toBe(testAdmin.id);
            expect(result.admin_name).toBe(`${testAdmin.first_name} ${testAdmin.last_name}`);
            expect(result.action_type).toBe('UPDATE_ADMIN');
            expect(result.target_resource).toBe('USER');
            expect(result.target_id).toBe('test-user-id');
            expect(result.metadata).toEqual({ field: 'email', oldValue: 'old@test.com', newValue: 'new@test.com' });
        });

        it('should throw error if audit log not found', async () => {
            await expect(
                auditLogService.getById('non-existent-id')
            ).rejects.toThrow('Audit log not found');
        });
    });

    describe('exportToCsv()', () => {
        beforeEach(async () => {
            // Create test logs
            const log1 = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'CREATE_ADMIN',
                targetResource: 'USER',
                targetId: 'user-csv-1',
                ipAddress: '192.168.1.100',
                metadata: { note: 'CSV test log 1' }
            });
            testLogs.push(log1);

            const log2 = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'APPROVE_LISTING',
                targetResource: 'PROPERTY',
                targetId: 'property-csv-1',
                ipAddress: '192.168.1.101',
                metadata: { note: 'CSV test log 2' }
            });
            testLogs.push(log2);
        });

        it('should export audit logs as CSV', async () => {
            const csv = await auditLogService.exportToCsv({
                adminId: testAdmin.id
            });

            expect(typeof csv).toBe('string');
            expect(csv).toContain('ID,Admin,Email,Action,Resource,Target ID,IP Address,Timestamp,Metadata');
            expect(csv).toContain('CREATE_ADMIN');
            expect(csv).toContain('APPROVE_LISTING');
            expect(csv).toContain('USER');
            expect(csv).toContain('PROPERTY');
            expect(csv).toContain(testAdmin.email);
        });

        it('should properly escape CSV values', async () => {
            const logWithQuotes = await auditLogService.log({
                adminId: testAdmin.id,
                actionType: 'TEST_ACTION',
                targetResource: 'USER',
                targetId: 'test-id',
                metadata: { message: 'Contains "quotes" and commas, here' }
            });
            testLogs.push(logWithQuotes);

            const csv = await auditLogService.exportToCsv({
                actionType: 'TEST_ACTION'
            });

            expect(csv).toContain('TEST_ACTION');
            // Check that the metadata JSON is properly escaped
            expect(csv).toMatch(/".*"quotes".*"/);
        });
    });
});
