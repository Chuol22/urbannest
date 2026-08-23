// server/src/services/auditLog.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AuditLogService {
    /**
     * Create audit log entry
     * @param {Object} params - Audit log parameters
     * @param {string} params.adminId - ID of the admin performing the action
     * @param {string} params.actionType - Type of action (e.g., 'CREATE_ADMIN', 'APPROVE_LISTING')
     * @param {string} params.targetResource - Resource being acted upon (e.g., 'USER', 'PROPERTY')
     * @param {string} [params.targetId] - Optional ID of the target resource
     * @param {string} [params.ipAddress] - Optional IP address of the admin
     * @param {string} [params.userAgent] - Optional user agent string
     * @param {Object} [params.metadata] - Optional additional context data
     * @returns {Promise<Object>} Created audit log entry
     */
    async log({ adminId, actionType, targetResource, targetId, ipAddress, userAgent, metadata }) {
        return await prisma.auditLog.create({
            data: {
                admin_id: adminId,
                action_type: actionType,
                target_resource: targetResource,
                target_id: targetId || null,
                ip_address: ipAddress || null,
                user_agent: userAgent || null,
                metadata: metadata || {}
            }
        });
    }

    /**
     * Query audit logs with filters and pagination
     * @param {Object} params - Query parameters
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.limit=50] - Records per page
     * @param {string} [params.adminId] - Filter by admin ID
     * @param {string} [params.actionType] - Filter by action type
     * @param {string} [params.resource] - Filter by target resource
     * @param {string} [params.fromDate] - Filter by start date
     * @param {string} [params.toDate] - Filter by end date
     * @param {string} [params.search] - Search term for target_id or metadata
     * @returns {Promise<Object>} Query results with logs, pagination, and total count
     */
    async query({ page = 1, limit = 50, adminId, actionType, resource, fromDate, toDate, search } = {}) {
        const where = {};

        // Apply filters
        if (adminId) {
            where.admin_id = adminId;
        }

        if (actionType) {
            where.action_type = actionType;
        }

        if (resource) {
            where.target_resource = resource;
        }

        // Date range filter
        if (fromDate || toDate) {
            where.created_at = {};
            if (fromDate) {
                where.created_at.gte = new Date(fromDate);
            }
            if (toDate) {
                where.created_at.lte = new Date(toDate);
            }
        }

        // Search filter - search in target_id and metadata
        if (search) {
            where.OR = [
                { target_id: { contains: search, mode: 'insensitive' } }
                // Note: Prisma doesn't directly support JSON search with contains
                // For metadata search, we'd need to use raw SQL or handle it in application logic
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const take = parseInt(limit);

        // Execute query with admin information joined
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    admin: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take
            }),
            prisma.auditLog.count({ where })
        ]);

        // Transform results to include admin_name
        const transformedLogs = logs.map(log => ({
            id: log.id,
            admin_id: log.admin_id,
            admin_name: `${log.admin.first_name} ${log.admin.last_name}`,
            admin_email: log.admin.email,
            action_type: log.action_type,
            target_resource: log.target_resource,
            target_id: log.target_id,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            metadata: log.metadata,
            created_at: log.created_at
        }));

        return {
            logs: transformedLogs,
            total,
            page: parseInt(page),
            limit: take,
            totalPages: Math.ceil(total / take)
        };
    }

    /**
     * Get a single audit log by ID
     * @param {string} id - Audit log ID
     * @returns {Promise<Object>} Audit log entry with admin details
     */
    async getById(id) {
        const log = await prisma.auditLog.findUnique({
            where: { id },
            include: {
                admin: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                }
            }
        });

        if (!log) {
            throw new Error('Audit log not found');
        }

        return {
            id: log.id,
            admin_id: log.admin_id,
            admin_name: `${log.admin.first_name} ${log.admin.last_name}`,
            admin_email: log.admin.email,
            action_type: log.action_type,
            target_resource: log.target_resource,
            target_id: log.target_id,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            metadata: log.metadata,
            created_at: log.created_at
        };
    }

    /**
     * Export audit logs to CSV format
     * @param {Object} filters - Same filters as query method
     * @returns {Promise<string>} CSV string
     */
    async exportToCsv(filters) {
        // Fetch all matching logs (max 10000)
        const { logs } = await this.query({ ...filters, limit: 10000 });

        // CSV header
        const csvRows = [
            ['ID', 'Admin', 'Email', 'Action', 'Resource', 'Target ID', 'IP Address', 'Timestamp', 'Metadata'].join(',')
        ];

        // CSV rows
        for (const log of logs) {
            const row = [
                log.id,
                `"${log.admin_name}"`,
                log.admin_email || '',
                log.action_type,
                log.target_resource,
                log.target_id || '',
                log.ip_address || '',
                log.created_at.toISOString(),
                `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
            ].join(',');
            csvRows.push(row);
        }

        return csvRows.join('\n');
    }
}

export default new AuditLogService();
