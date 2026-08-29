// server/src/controllers/admin.controller.js
import { prisma } from '../config/prisma.js';
import passwordService from '../services/password.service.js';
import auditLogService from '../services/auditLog.service.js';
import totpService from '../services/totp.service.js';
import exportService from '../services/export.service.js';
import { validateAndSanitizeEmail, validateAndSanitizePhone, sanitizeInput } from '../utils/validators.js';
import { extractIPAddress, extractUserAgent } from '../utils/requestContext.js';

class AdminController {

  // ==================== System Metrics & Dashboard ====================

  /**
   * GET /api/admin/dashboard
   */
  async getDashboardStats(req, res) {
    try {
      const [
        totalUsers,
        usersByRole,
        pendingVerifications,
        propertiesByStatus,
        revenueAggregate,
        pendingBookings,
        activeAdmins,
        recentBrokers,
        recentListings
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: { id: true }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where: { verification_status: 'pending_review' },
          _count: { id: true }
        }),
        prisma.property.groupBy({
          by: ['status'],
          where: { deleted_at: null },
          _count: { id: true }
        }),
        prisma.listingFeePayment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED' }
        }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'admin', is_active: true } }),
        prisma.user.findMany({
          where: { role: { in: ['owner', 'agent'] } },
          orderBy: { created_at: 'desc' },
          take: 5,
          select: { id: true, first_name: true, last_name: true, email: true, phone: true, verification_status: true, created_at: true }
        }),
        prisma.property.findMany({
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 5,
          include: { user: { select: { first_name: true, last_name: true } }, location: true }
        })
      ]);

      // Format role breakdowns
      const roleBreakdown = { seeker: 0, owner: 0, agent: 0, admin: 0 };
      usersByRole.forEach(item => { roleBreakdown[item.role] = item._count.id; });

      const pendingVerificationBreakdown = { seeker: 0, owner: 0, agent: 0 };
      pendingVerifications.forEach(item => { pendingVerificationBreakdown[item.role] = item._count.id; });

      const propertyStatusBreakdown = { available: 0, pending: 0, rented: 0, sold: 0, withdrawn: 0 };
      propertiesByStatus.forEach(item => { propertyStatusBreakdown[item.status] = item._count.id; });

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            usersByRole: roleBreakdown,
            pendingVerifications: pendingVerificationBreakdown,
            propertiesByStatus: propertyStatusBreakdown,
            totalRevenue: revenueAggregate._sum.amount || 0,
            pendingBookings,
            activeAdmins
          },
          recentBrokers,
          recentListings
        }
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
    }
  }

  /**
   * GET /api/admin/dashboard/users
   */
  async getUserStats(req, res) {
    try {
      const { role, status } = req.query;
      const where = {};
      if (role) where.role = role;
      if (status === 'active') where.is_active = true;
      if (status === 'inactive') where.is_active = false;

      const [totalCount, roleDistribution, verifiedCount] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.groupBy({ by: ['role'], where, _count: { id: true } }),
        prisma.user.count({ where: { ...where, is_verified: true } })
      ]);

      res.json({
        success: true,
        data: {
          totalCount,
          roleDistribution,
          verifiedCount
        }
      });
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to get user statistics' });
    }
  }

  /**
   * GET /api/admin/dashboard/properties
   */
  async getPropertyStats(req, res) {
    try {
      const [totalProperties, statusBreakdown, typeBreakdown, pendingReviewCount] = await Promise.all([
        prisma.property.count({ where: { deleted_at: null } }),
        prisma.property.groupBy({ by: ['status'], where: { deleted_at: null }, _count: { id: true } }),
        prisma.property.groupBy({ by: ['property_type'], where: { deleted_at: null }, _count: { id: true } }),
        prisma.property.count({ where: { status: 'pending', listing_fee_paid: true, deleted_at: null } })
      ]);

      res.json({
        success: true,
        data: {
          totalProperties,
          statusBreakdown,
          typeBreakdown,
          pendingReviewCount
        }
      });
    } catch (error) {
      console.error('Property stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to get property statistics' });
    }
  }

  /**
   * GET /api/admin/dashboard/revenue
   */
  async getRevenueStats(req, res) {
    try {
      const { from_date, to_date } = req.query;
      const where = {};
      if (from_date || to_date) {
        where.createdAt = {};
        if (from_date) where.createdAt.gte = new Date(from_date);
        if (to_date) where.createdAt.lte = new Date(to_date);
      }

      const [completedSum, totalPayments, completedPayments, failedPayments] = await Promise.all([
        prisma.listingFeePayment.aggregate({ _sum: { amount: true }, where: { ...where, status: 'COMPLETED' } }),
        prisma.listingFeePayment.count({ where }),
        prisma.listingFeePayment.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.listingFeePayment.count({ where: { ...where, status: 'FAILED' } })
      ]);

      const successRate = totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : '0.00';

      res.json({
        success: true,
        data: {
          totalRevenue: completedSum._sum.amount || 0,
          totalPayments,
          completedPayments,
          failedPayments,
          successRate: parseFloat(successRate)
        }
      });
    } catch (error) {
      console.error('Revenue stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to get revenue statistics' });
    }
  }

  // ==================== Admin User Lifecycle ====================

  /**
   * POST /api/admin/users
   */
  async createAdmin(req, res) {
    try {
      const { email, phone, password, first_name, last_name } = req.body;

      if (!email || !phone || !password || !first_name || !last_name) {
        return res.status(400).json({ success: false, message: 'All fields (email, phone, password, first_name, last_name) are required.' });
      }

      const emailVal = validateAndSanitizeEmail(email);
      if (!emailVal.valid) {
        return res.status(400).json({ success: false, message: emailVal.error });
      }

      const phoneVal = validateAndSanitizePhone(phone);
      if (!phoneVal.valid) {
        return res.status(400).json({ success: false, message: phoneVal.error });
      }

      const passVal = passwordService.validate(password);
      if (!passVal.valid) {
        return res.status(400).json({ success: false, message: passVal.errors[0], errors: passVal.errors });
      }

      // Uniqueness checks
      const existingEmail = await prisma.user.findUnique({ where: { email: emailVal.sanitized } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email address is already in use.' });
      }

      const existingPhone = await prisma.user.findFirst({ where: { phone: phoneVal.sanitized } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is already in use.' });
      }

      const hashedPassword = await passwordService.hash(password);

      const newAdmin = await prisma.user.create({
        data: {
          email: emailVal.sanitized,
          phone: phoneVal.sanitized,
          password_hash: hashedPassword,
          first_name: sanitizeInput(first_name),
          last_name: sanitizeInput(last_name),
          role: 'admin',
          is_verified: true,
          verification_status: 'approved',
          is_active: true
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          role: true,
          is_verified: true,
          is_active: true,
          two_factor_enabled: true,
          created_at: true
        }
      });

      // Audit Log
      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'CREATE_ADMIN',
        targetResource: 'USER',
        targetId: newAdmin.id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { created_email: newAdmin.email }
      });

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: newAdmin
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ success: false, message: 'Failed to create admin user' });
    }
  }

  /**
   * GET /api/admin/users
   */
  async listAdmins(req, res) {
    try {
      const { page = 1, limit = 20, active, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { role: 'admin' };
      if (active !== undefined) {
        where.is_active = active === 'true';
      }

      if (search) {
        const cleanSearch = sanitizeInput(search);
        where.OR = [
          { email: { contains: cleanSearch, mode: 'insensitive' } },
          { first_name: { contains: cleanSearch, mode: 'insensitive' } },
          { last_name: { contains: cleanSearch, mode: 'insensitive' } },
          { phone: { contains: cleanSearch, mode: 'insensitive' } }
        ];
      }

      const [admins, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            role: true,
            is_active: true,
            is_verified: true,
            two_factor_enabled: true,
            created_at: true,
            updated_at: true
          }
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          admins,
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error('List admins error:', error);
      res.status(500).json({ success: false, message: 'Failed to list admin users' });
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getAdminDetails(req, res) {
    try {
      const { id } = req.params;
      const admin = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_verified: true,
          two_factor_enabled: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!admin || admin.role !== 'admin') {
        return res.status(404).json({ success: false, message: 'Admin user not found' });
      }

      res.json({ success: true, data: admin });
    } catch (error) {
      console.error('Get admin details error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch admin details' });
    }
  }

  /**
   * PUT /api/admin/users/:id
   */
  async updateAdmin(req, res) {
    try {
      const { id } = req.params;
      const { email, phone, first_name, last_name } = req.body;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== 'admin') {
        return res.status(404).json({ success: false, message: 'Admin user not found' });
      }

      const updateData = {};
      if (email && email !== target.email) {
        const emailVal = validateAndSanitizeEmail(email);
        if (!emailVal.valid) return res.status(400).json({ success: false, message: emailVal.error });
        const existingEmail = await prisma.user.findUnique({ where: { email: emailVal.sanitized } });
        if (existingEmail) return res.status(400).json({ success: false, message: 'Email address already in use' });
        updateData.email = emailVal.sanitized;
      }

      if (phone && phone !== target.phone) {
        const phoneVal = validateAndSanitizePhone(phone);
        if (!phoneVal.valid) return res.status(400).json({ success: false, message: phoneVal.error });
        const existingPhone = await prisma.user.findFirst({ where: { phone: phoneVal.sanitized } });
        if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already in use' });
        updateData.phone = phoneVal.sanitized;
      }

      if (first_name) updateData.first_name = sanitizeInput(first_name);
      if (last_name) updateData.last_name = sanitizeInput(last_name);

      const updatedAdmin = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          two_factor_enabled: true
        }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'UPDATE_ADMIN',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { updated_fields: Object.keys(updateData) }
      });

      res.json({ success: true, message: 'Admin user updated successfully', data: updatedAdmin });
    } catch (error) {
      console.error('Update admin error:', error);
      res.status(500).json({ success: false, message: 'Failed to update admin user' });
    }
  }

  /**
   * PUT /api/admin/users/:id/password
   */
  async updateAdminPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword, currentPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password is required' });
      }

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // If resetting own password, verify current password
      if (req.user.id === id) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to change your own password' });
        }
        const matches = await passwordService.compare(currentPassword, target.password_hash);
        if (!matches) {
          return res.status(400).json({ success: false, message: 'Current password verification failed' });
        }
      }

      // Validate new password strength
      const passVal = passwordService.validate(newPassword);
      if (!passVal.valid) {
        return res.status(400).json({ success: false, message: passVal.errors[0], errors: passVal.errors });
      }

      const hashedPassword = await passwordService.hash(newPassword);
      await prisma.user.update({
        where: { id },
        data: { password_hash: hashedPassword }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'RESET_PASSWORD',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { self_update: req.user.id === id }
      });

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update admin password error:', error);
      res.status(500).json({ success: false, message: 'Failed to update password' });
    }
  }

  /**
   * POST /api/admin/users/:id/deactivate
   */
  async deactivateAdmin(req, res) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
      }

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== 'admin') {
        return res.status(404).json({ success: false, message: 'Admin user not found' });
      }

      await prisma.user.update({
        where: { id },
        data: { is_active: false }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'DEACTIVATE_ADMIN',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'Admin account deactivated successfully' });
    } catch (error) {
      console.error('Deactivate admin error:', error);
      res.status(500).json({ success: false, message: 'Failed to deactivate admin account' });
    }
  }

  /**
   * POST /api/admin/users/:id/activate
   */
  async activateAdmin(req, res) {
    try {
      const { id } = req.params;
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== 'admin') {
        return res.status(404).json({ success: false, message: 'Admin user not found' });
      }

      await prisma.user.update({
        where: { id },
        data: { is_active: true }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'ACTIVATE_ADMIN',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'Admin account activated successfully' });
    } catch (error) {
      console.error('Activate admin error:', error);
      res.status(500).json({ success: false, message: 'Failed to activate admin account' });
    }
  }

  // ==================== Two-Factor Authentication (2FA) ====================

  /**
   * POST /api/admin/users/:id/enable-2fa
   */
  async enable2FA(req, res) {
    try {
      const { id } = req.params;
      if (id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized 2FA setup request' });
      }

      const secretData = totpService.generateSecret(req.user.email);
      const qrCodeUrl = await totpService.generateQRCode(secretData.otpauth_url);

      res.json({
        success: true,
        data: {
          secret: secretData.secret,
          qrCodeUrl
        }
      });
    } catch (error) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({ success: false, message: 'Failed to initiate 2FA setup' });
    }
  }

  /**
   * POST /api/admin/users/:id/verify-2fa
   */
  async verify2FA(req, res) {
    try {
      const { id } = req.params;
      const { code, secret } = req.body;

      if (!code || !secret) {
        return res.status(400).json({ success: false, message: 'Verification code and secret are required' });
      }

      const isValid = totpService.verify(secret, code);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid 2FA verification code' });
      }

      await prisma.user.update({
        where: { id },
        data: {
          two_factor_enabled: true,
          two_factor_secret: secret
        }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'ENABLE_2FA',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'Two-Factor Authentication enabled successfully' });
    } catch (error) {
      console.error('Verify 2FA error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify 2FA setup' });
    }
  }

  /**
   * POST /api/admin/users/:id/disable-2fa
   */
  async disable2FA(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ success: false, message: 'Password confirmation required to disable 2FA' });
      }

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const passwordMatches = await passwordService.compare(password, target.password_hash);
      if (!passwordMatches) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
      }

      await prisma.user.update({
        where: { id },
        data: {
          two_factor_enabled: false,
          two_factor_secret: null
        }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'DISABLE_2FA',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'Two-Factor Authentication disabled' });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
    }
  }

  // ==================== Audit Logs ====================

  /**
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req, res) {
    try {
      const { page, limit, admin_id, action_type, resource, from_date, to_date, search } = req.query;

      const result = await auditLogService.query({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        adminId: admin_id,
        actionType: action_type,
        resource,
        fromDate: from_date,
        toDate: to_date,
        search
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
  }

  /**
   * GET /api/admin/audit-logs/:id
   */
  async getAuditLogDetails(req, res) {
    try {
      const { id } = req.params;
      const log = await auditLogService.getById(id);
      res.json({ success: true, data: log });
    } catch (error) {
      console.error('Get audit log detail error:', error);
      res.status(404).json({ success: false, message: error.message || 'Audit log not found' });
    }
  }

  /**
   * GET /api/admin/audit-logs/export
   */
  async exportAuditLogs(req, res) {
    try {
      const { admin_id, action_type, resource, from_date, to_date, search } = req.query;

      const csvData = await auditLogService.exportToCsv({
        adminId: admin_id,
        actionType: action_type,
        resource,
        fromDate: from_date,
        toDate: to_date,
        search
      });

      const filename = exportService.generateFilename('audit-logs');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (error) {
      console.error('Export audit logs error:', error);
      res.status(500).json({ success: false, message: 'Failed to export audit logs' });
    }
  }

  // ==================== Listing Approvals & Moderation ====================

  /**
   * GET /api/admin/listings/pending
   */
  async getPendingListings(req, res) {
    try {
      const listings = await prisma.property.findMany({
        where: {
          status: 'pending',
          listing_fee_paid: true,
          deleted_at: null
        },
        orderBy: { created_at: 'asc' },
        include: {
          user: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
          location: true,
          photos: { where: { isPrimary: true }, take: 1 },
          listing_fee_payments: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      res.json({ success: true, data: listings });
    } catch (error) {
      console.error('Get pending listings error:', error);
      res.status(500).json({ success: false, message: 'Failed to get pending listings' });
    }
  }

  /**
   * GET /api/admin/listings
   */
  async getAllListings(req, res) {
    try {
      console.log('[GET LISTINGS] Request params:', req.query);

      const { status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { deleted_at: null };
      if (status) {
        where.status = status;
      }

      console.log('[GET LISTINGS] Where clause:', where);
      console.log('[GET LISTINGS] Pagination - skip:', skip, 'take:', take);

      const [listings, total] = await Promise.all([
        prisma.property.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                role: true
              }
            },
            location: true,
            photos: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                photoUrl: true,
                isPrimary: true
              }
            }
          }
        }),
        prisma.property.count({ where })
      ]);

      // Map photos to include url field for frontend compatibility
      const mappedListings = listings.map(listing => ({
        ...listing,
        photos: listing.photos?.map(photo => ({
          ...photo,
          url: photo.photoUrl
        })) || []
      }));

      const totalPages = Math.ceil(total / take);

      console.log('[GET LISTINGS] Found', total, 'listings,', mappedListings.length, 'on this page');

      res.json({
        success: true,
        data: {
          listings: mappedListings,
          total,
          page: parseInt(page),
          limit: take,
          totalPages
        }
      });
    } catch (error) {
      console.error('[GET LISTINGS] Error:', error);
      console.error('[GET LISTINGS] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to get listings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/admin/listings/:id/approve
   */
  async approveListing(req, res) {
    try {
      const { id } = req.params;

      const property = await prisma.property.findUnique({ where: { id } });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Listing not found' });
      }
      if (!property.listing_fee_paid) {
        return res.status(400).json({ success: false, message: 'Listing fee has not been paid' });
      }

      const updated = await prisma.property.update({
        where: { id },
        data: {
          status: 'available',
          listing_rejection_reason: null
        }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'APPROVE_LISTING',
        targetResource: 'PROPERTY',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'Listing approved and published', data: updated });
    } catch (error) {
      console.error('Approve listing error:', error);
      res.status(500).json({ success: false, message: 'Failed to approve listing' });
    }
  }

  /**
   * POST /api/admin/listings/:id/reject
   */
  async rejectListing(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Rejection reason must be at least 10 characters' });
      }

      const property = await prisma.property.findUnique({ where: { id } });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Listing not found' });
      }

      const updated = await prisma.property.update({
        where: { id },
        data: {
          status: 'withdrawn',
          listing_rejection_reason: reason.trim()
        }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'REJECT_LISTING',
        targetResource: 'PROPERTY',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { reason: reason.trim() }
      });

      res.json({ success: true, message: 'Listing rejected', data: updated });
    } catch (error) {
      console.error('Reject listing error:', error);
      res.status(500).json({ success: false, message: 'Failed to reject listing' });
    }
  }

  /**
   * POST /api/admin/listings/bulk-approve
   */
  async bulkApproveListings(req, res) {
    try {
      const { listing_ids } = req.body;
      if (!Array.isArray(listing_ids) || listing_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'listing_ids array is required' });
      }

      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const id of listing_ids) {
        try {
          const prop = await prisma.property.findUnique({ where: { id } });
          if (!prop) {
            failureCount++;
            errors.push({ id, error: 'Listing not found' });
            continue;
          }

          if (!prop.listing_fee_paid) {
            failureCount++;
            errors.push({ id, error: 'Listing fee not paid' });
            continue;
          }

          await prisma.property.update({
            where: { id },
            data: { status: 'available', listing_rejection_reason: null }
          });

          await auditLogService.log({
            adminId: req.user.id,
            actionType: 'BULK_APPROVE_LISTING',
            targetResource: 'PROPERTY',
            targetId: id,
            ipAddress: extractIPAddress(req),
            userAgent: extractUserAgent(req)
          });

          successCount++;
        } catch (err) {
          failureCount++;
          errors.push({ id, error: err.message });
        }
      }

      res.json({
        success: true,
        message: `Bulk approve completed: ${successCount} succeeded, ${failureCount} failed`,
        data: { successCount, failureCount, errors }
      });
    } catch (error) {
      console.error('Bulk approve listings error:', error);
      res.status(500).json({ success: false, message: 'Failed to process bulk approve' });
    }
  }

  /**
   * POST /api/admin/listings/bulk-reject
   */
  async bulkRejectListings(req, res) {
    try {
      const { listing_ids, reason } = req.body;

      if (!Array.isArray(listing_ids) || listing_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'listing_ids array is required' });
      }

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Rejection reason must be at least 10 characters' });
      }

      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const id of listing_ids) {
        try {
          const prop = await prisma.property.findUnique({ where: { id } });
          if (!prop) {
            failureCount++;
            errors.push({ id, error: 'Listing not found' });
            continue;
          }

          await prisma.property.update({
            where: { id },
            data: { status: 'withdrawn', listing_rejection_reason: reason.trim() }
          });

          await auditLogService.log({
            adminId: req.user.id,
            actionType: 'BULK_REJECT_LISTING',
            targetResource: 'PROPERTY',
            targetId: id,
            ipAddress: extractIPAddress(req),
            userAgent: extractUserAgent(req),
            metadata: { reason: reason.trim() }
          });

          successCount++;
        } catch (err) {
          failureCount++;
          errors.push({ id, error: err.message });
        }
      }

      res.json({
        success: true,
        message: `Bulk reject completed: ${successCount} succeeded, ${failureCount} failed`,
        data: { successCount, failureCount, errors }
      });
    } catch (error) {
      console.error('Bulk reject listings error:', error);
      res.status(500).json({ success: false, message: 'Failed to process bulk reject' });
    }
  }

  /**
   * GET /api/admin/listings/awaiting-fee
   */
  async getListingsAwaitingFee(req, res) {
    try {
      const listings = await prisma.property.findMany({
        where: { status: 'pending', listing_fee_paid: false, deleted_at: null },
        orderBy: { created_at: 'asc' },
        include: {
          user: { select: { first_name: true, last_name: true, email: true, phone: true } },
          location: true
        }
      });
      res.json({ success: true, data: listings });
    } catch (error) {
      console.error('Get listings awaiting fee error:', error);
      res.status(500).json({ success: false, message: 'Failed to get listings' });
    }
  }

  // ==================== Payment Management ====================

  /**
   * GET /api/admin/payments
   */
  async getPayments(req, res) {
    try {
      const { status, from_date, to_date, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (from_date || to_date) {
        where.createdAt = {};
        if (from_date) where.createdAt.gte = new Date(from_date);
        if (to_date) where.createdAt.lte = new Date(to_date);
      }

      const [payments, total] = await Promise.all([
        prisma.listingFeePayment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            user: { select: { first_name: true, last_name: true, email: true, phone: true } },
            property: { select: { title: true, purpose: true, status: true } }
          }
        }),
        prisma.listingFeePayment.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          payments,
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to get payments' });
    }
  }

  /**
   * GET /api/admin/payments/config
   */
  async getPaymentConfig(req, res) {
    try {
      if (!this.paymentConfig) {
        this.paymentConfig = { sell_fee: 500, rent_fee: 300 };
      }
      res.json({
        success: true,
        data: this.paymentConfig
      });
    } catch (error) {
      console.error('Get payment config error:', error);
      res.status(500).json({ success: false, message: 'Failed to get payment configuration' });
    }
  }

  /**
   * PUT /api/admin/payments/config
   */
  async updatePaymentConfig(req, res) {
    try {
      const { sell_fee, rent_fee } = req.body;
      if (!this.paymentConfig) {
        this.paymentConfig = { sell_fee: 500, rent_fee: 300 };
      }
      if (sell_fee !== undefined) this.paymentConfig.sell_fee = Number(sell_fee);
      if (rent_fee !== undefined) this.paymentConfig.rent_fee = Number(rent_fee);

      res.json({
        success: true,
        message: 'Payment configuration updated successfully',
        data: this.paymentConfig
      });
    } catch (error) {
      console.error('Update payment config error:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment configuration' });
    }
  }

  /**
   * GET /api/admin/payments/:id
   */
  async getPaymentDetails(req, res) {
    try {
      const { id } = req.params;
      const payment = await prisma.listingFeePayment.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
          property: { select: { id: true, title: true, purpose: true, status: true, property_type: true } }
        }
      });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      res.json({ success: true, data: payment });
    } catch (error) {
      console.error('Get payment details error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
    }
  }

  /**
   * POST /api/admin/payments/:id/complete
   */
  async markPaymentCompleted(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'Reason for manual payment completion is required' });
      }

      const payment = await prisma.listingFeePayment.findUnique({ where: { id } });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      const updatedPayment = await prisma.listingFeePayment.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      // Update associated property listing fee status
      if (payment.propertyId) {
        await prisma.property.update({
          where: { id: payment.propertyId },
          data: { listing_fee_paid: true }
        });
      }

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'MANUAL_PAYMENT_COMPLETED',
        targetResource: 'PAYMENT',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { reason: reason.trim(), original_status: payment.status }
      });

      res.json({ success: true, message: 'Payment manually marked as COMPLETED', data: updatedPayment });
    } catch (error) {
      console.error('Manual payment completion error:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
  }

  /**
   * GET /api/admin/payments/export
   */
  async exportPayments(req, res) {
    try {
      const { status, from_date, to_date } = req.query;

      const where = {};
      if (status) where.status = status;
      if (from_date || to_date) {
        where.createdAt = {};
        if (from_date) where.createdAt.gte = new Date(from_date);
        if (to_date) where.createdAt.lte = new Date(to_date);
      }

      const payments = await prisma.listingFeePayment.findMany({
        where,
        take: 10000,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          property: { select: { title: true } }
        }
      });

      const columns = [
        { label: 'Payment ID', accessor: p => p.id },
        { label: 'Tx Reference', accessor: p => p.txRef || '' },
        { label: 'User', accessor: p => p.user ? `${p.user.first_name} ${p.user.last_name}` : '' },
        { label: 'Email', accessor: p => p.user ? p.user.email : '' },
        { label: 'Property Title', accessor: p => p.property ? p.property.title : '' },
        { label: 'Amount', accessor: p => p.amount },
        { label: 'Currency', accessor: p => p.currency },
        { label: 'Status', accessor: p => p.status },
        { label: 'Payment Method', accessor: p => p.paymentMethod || '' },
        { label: 'Timestamp', accessor: p => p.createdAt ? p.createdAt.toISOString() : '' }
      ];

      const csvData = exportService.toCsv(payments, columns);
      const filename = exportService.generateFilename('payments');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (error) {
      console.error('Export payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to export payments' });
    }
  }

  // ==================== Legacy Broker Verification Methods ====================

  async getPendingBrokers(req, res) {
    try {
      const brokers = await prisma.user.findMany({
        where: {
          verification_status: 'pending_review',
          role: { in: ['owner', 'agent'] },
          verification_document_url: { not: null }
        },
        orderBy: { created_at: 'asc' },
        select: {
          id: true, first_name: true, last_name: true, email: true, phone: true,
          role: true, verification_status: true, verification_document_url: true,
          created_at: true, is_active: true
        }
      });
      res.json({ success: true, data: brokers });
    } catch (error) {
      console.error('Get pending brokers error:', error);
      res.status(500).json({ success: false, message: 'Failed to get pending brokers' });
    }
  }

  async getAllBrokers(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { role: { in: ['owner', 'agent'] } };
      if (status) where.verification_status = status;

      const [brokers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: parseInt(limit),
          select: {
            id: true, first_name: true, last_name: true, email: true, phone: true,
            role: true, verification_status: true, is_verified: true,
            verification_document_url: true, verification_rejection_reason: true,
            created_at: true, is_active: true,
            _count: { select: { properties: true } }
          }
        }),
        prisma.user.count({ where })
      ]);

      res.json({ success: true, data: { brokers, total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (error) {
      console.error('Get all brokers error:', error);
      res.status(500).json({ success: false, message: 'Failed to get brokers' });
    }
  }

  async approveBroker(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || !['owner', 'agent'].includes(user.role)) {
        return res.status(400).json({ success: false, message: 'User is not a valid broker or owner' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { is_verified: true, verification_status: 'approved', verification_rejection_reason: null },
        select: { id: true, first_name: true, last_name: true, email: true, verification_status: true, is_verified: true }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'APPROVE_BROKER',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'Broker approved successfully', data: updated });
    } catch (error) {
      console.error('Approve broker error:', error);
      res.status(500).json({ success: false, message: 'Failed to approve broker' });
    }
  }

  async rejectBroker(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Broker not found' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { is_verified: false, verification_status: 'rejected', verification_rejection_reason: reason.trim() },
        select: { id: true, first_name: true, last_name: true, email: true, verification_status: true }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'REJECT_BROKER',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { reason: reason.trim() }
      });

      res.json({ success: true, message: 'Broker rejected', data: updated });
    } catch (error) {
      console.error('Reject broker error:', error);
      res.status(500).json({ success: false, message: 'Failed to reject broker' });
    }
  }

  // ==================== Platform User Management ====================

  /**
   * GET /api/v1/admin/users/all
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, status, verification_status, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (role && role !== 'ALL') {
        where.role = role;
      }

      if (status === 'active') {
        where.is_active = true;
      } else if (status === 'inactive') {
        where.is_active = false;
      }

      if (verification_status && verification_status !== 'ALL') {
        if (verification_status === 'unverified') {
          where.is_verified = false;
        } else if (['pending_review', 'approved', 'rejected'].includes(verification_status)) {
          where.verification_status = verification_status;
        }
      }

      if (search && search.trim()) {
        const query = sanitizeInput(search.trim());
        where.OR = [
          { first_name: { contains: query, mode: 'insensitive' } },
          { last_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            role: true,
            is_active: true,
            is_verified: true,
            verification_status: true,
            verification_document_url: true,
            verification_rejection_reason: true,
            avatar_url: true,
            created_at: true,
            updated_at: true,
            _count: {
              select: {
                properties: true,
                seeker_bookings: true,
                host_bookings: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      const formattedUsers = users.map(u => ({
        ...u,
        _count: {
          properties: u._count?.properties || 0,
          bookings: (u._count?.seeker_bookings || 0) + (u._count?.host_bookings || 0)
        }
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch platform users' });
    }
  }

  /**
   * PUT /api/v1/admin/users/all/:id/verify
   */
  async verifyUser(req, res) {
    try {
      const { id } = req.params;
      const decision = req.body.decision || req.body.verification_status;
      const reason = req.body.reason || req.body.rejection_reason;

      if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ success: false, message: "Decision must be 'approved' or 'rejected'" });
      }

      if (decision === 'rejected' && (!reason || !reason.trim())) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isApproved = decision === 'approved';
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          is_verified: isApproved,
          verification_status: decision,
          verification_rejection_reason: isApproved ? null : reason.trim()
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          is_verified: true,
          verification_status: true,
          verification_rejection_reason: true
        }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: isApproved ? 'APPROVE_USER' : 'REJECT_USER',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req),
        metadata: { decision, role: user.role, reason: reason ? reason.trim() : null }
      });

      res.json({
        success: true,
        message: `Account for ${user.first_name} ${user.last_name} (${user.role}) has been ${decision}`,
        data: updatedUser
      });
    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user verification status' });
    }
  }

  /**
   * POST /api/v1/admin/users/all/:id/activate
   */
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { is_active: true },
        select: { id: true, first_name: true, last_name: true, is_active: true }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'ACTIVATE_USER',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'User account activated successfully', data: updated });
    } catch (error) {
      console.error('Activate user error:', error);
      res.status(500).json({ success: false, message: 'Failed to activate user account' });
    }
  }

  /**
   * POST /api/v1/admin/users/all/:id/deactivate
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { is_active: false },
        select: { id: true, first_name: true, last_name: true, is_active: true }
      });

      await auditLogService.log({
        adminId: req.user.id,
        actionType: 'DEACTIVATE_USER',
        targetResource: 'USER',
        targetId: id,
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
      });

      res.json({ success: true, message: 'User account deactivated successfully', data: updated });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ success: false, message: 'Failed to deactivate user account' });
    }
  }

  /**
   * DELETE /api/v1/admin/users/all/:id
   * Permanently delete a user account from the platform
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found' });
      }

      await prisma.user.delete({
        where: { id }
      });

      try {
        await auditLogService.log({
          adminId: req.user.id,
          actionType: 'DELETE_USER',
          targetResource: 'USER',
          targetId: id,
          ipAddress: extractIPAddress(req),
          userAgent: extractUserAgent(req),
          metadata: { email: user.email, name: `${user.first_name} ${user.last_name}`, role: user.role }
        });
      } catch (auditErr) {
        console.error('Audit log error (non-fatal):', auditErr);
      }

      res.json({
        success: true,
        message: `Account for ${user.first_name} ${user.last_name} (${user.email || user.phone}) has been permanently deleted from the platform.`
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user account: ' + error.message });
    }
  }

  /**
   * POST /api/v1/admin/users/all/bulk-action
   */
  async bulkUserAction(req, res) {
    try {
      console.log('[BULK ACTION] Request body:', JSON.stringify(req.body, null, 2));

      // Accept both snake_case (user_ids) and camelCase (userIds)
      const userIds = req.body.user_ids || req.body.userIds;
      const { action, reason } = req.body;

      console.log('[BULK ACTION] Extracted userIds:', userIds);
      console.log('[BULK ACTION] Action:', action);

      // Validation: Check if userIds is provided and is an array
      if (!userIds) {
        console.error('[BULK ACTION] Missing user_ids/userIds field');
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required (provide as user_ids or userIds)'
        });
      }

      if (!Array.isArray(userIds)) {
        console.error('[BULK ACTION] user_ids is not an array:', typeof userIds);
        return res.status(400).json({
          success: false,
          message: 'User IDs must be an array'
        });
      }

      if (userIds.length === 0) {
        console.error('[BULK ACTION] Empty user_ids array');
        return res.status(400).json({
          success: false,
          message: 'User IDs array cannot be empty'
        });
      }

      // Validation: Check action type
      if (!action) {
        console.error('[BULK ACTION] Missing action field');
        return res.status(400).json({
          success: false,
          message: 'Action field is required'
        });
      }

      const validActions = ['approve', 'reject', 'activate', 'deactivate'];
      if (!validActions.includes(action)) {
        console.error('[BULK ACTION] Invalid action:', action);
        return res.status(400).json({
          success: false,
          message: `Invalid bulk action specified. Must be one of: ${validActions.join(', ')}`
        });
      }

      // Validation: Reject action requires reason
      if (action === 'reject' && (!reason || reason.trim().length < 10)) {
        console.error('[BULK ACTION] Reject action missing or invalid reason');
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required and must be at least 10 characters'
        });
      }

      // Build update data based on action
      let updateData = {};
      if (action === 'approve') {
        updateData = {
          is_verified: true,
          verification_status: 'approved',
          verification_rejection_reason: null
        };
      } else if (action === 'reject') {
        updateData = {
          is_verified: false,
          verification_status: 'rejected',
          verification_rejection_reason: reason.trim()
        };
      } else if (action === 'activate') {
        updateData = { is_active: true };
      } else if (action === 'deactivate') {
        updateData = { is_active: false };
      }

      console.log('[BULK ACTION] Update data:', updateData);
      console.log('[BULK ACTION] Attempting to update users:', userIds);

      // Execute bulk update
      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: updateData
      });

      console.log('[BULK ACTION] Update result:', result);

      // Log the action in audit trail
      try {
        await auditLogService.log({
          adminId: req.user.id,
          actionType: `BULK_${action.toUpperCase()}_USERS`,
          targetResource: 'USER',
          targetId: 'MULTIPLE',
          ipAddress: extractIPAddress(req),
          userAgent: extractUserAgent(req),
          metadata: { count: result.count, userIds, action, reason }
        });
      } catch (auditError) {
        console.error('[BULK ACTION] Audit log error (non-fatal):', auditError);
        // Continue even if audit logging fails
      }

      console.log('[BULK ACTION] Success - processed', result.count, 'users');

      res.json({
        success: true,
        message: `Successfully processed ${result.count} user account(s) - ${action}`,
        data: {
          affectedCount: result.count,
          requestedCount: userIds.length,
          action,
          userIds
        }
      });
    } catch (error) {
      console.error('[BULK ACTION] Error details:', error);
      console.error('[BULK ACTION] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to execute bulk user action',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/v1/admin/users/all/export
   */
  async exportUsers(req, res) {
    try {
      const { role, status, verification_status } = req.query;
      const where = {};
      if (role) where.role = role;
      if (status === 'active') where.is_active = true;
      if (status === 'inactive') where.is_active = false;
      if (verification_status) where.verification_status = verification_status;

      const users = await prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_verified: true,
          verification_status: true,
          created_at: true
        }
      });

      const csvHeader = 'ID,First Name,Last Name,Email,Phone,Role,Active,Verified,Verification Status,Created At\n';
      const csvRows = users.map(u =>
        `"${u.id}","${u.first_name || ''}","${u.last_name || ''}","${u.email || ''}","${u.phone || ''}","${u.role}","${u.is_active}","${u.is_verified}","${u.verification_status || ''}","${u.created_at}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="platform-users.csv"');
      res.status(200).send(csvHeader + csvRows);
    } catch (error) {
      console.error('Export users error:', error);
      res.status(500).json({ success: false, message: 'Failed to export users' });
    }
  }
}

export default new AdminController();
