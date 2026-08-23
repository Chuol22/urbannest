// server/src/routes/admin.routes.js
import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkRole(['admin']));

// ==================== System Dashboard Metrics ====================
router.get('/dashboard', (req, res) => adminController.getDashboardStats(req, res));
router.get('/dashboard/users', (req, res) => adminController.getUserStats(req, res));
router.get('/dashboard/properties', (req, res) => adminController.getPropertyStats(req, res));
router.get('/dashboard/revenue', (req, res) => adminController.getRevenueStats(req, res));

// ==================== Platform User Management (must come BEFORE /:id routes) ====================
router.get('/users/all', (req, res) => adminController.getAllUsers(req, res));
router.get('/users/all/export', (req, res) => adminController.exportUsers(req, res));
router.post('/users/all/bulk-action', (req, res) => adminController.bulkUserAction(req, res));
router.put('/users/all/:id/verify', (req, res) => adminController.verifyUser(req, res));
router.post('/users/all/:id/deactivate', (req, res) => adminController.deactivateUser(req, res));
router.post('/users/all/:id/activate', (req, res) => adminController.activateUser(req, res));

// ==================== Admin User Lifecycle ====================
router.post('/users', (req, res) => adminController.createAdmin(req, res));
router.get('/users', (req, res) => adminController.listAdmins(req, res));
router.get('/users/:id', (req, res) => adminController.getAdminDetails(req, res));
router.put('/users/:id', (req, res) => adminController.updateAdmin(req, res));
router.put('/users/:id/password', (req, res) => adminController.updateAdminPassword(req, res));
router.post('/users/:id/deactivate', (req, res) => adminController.deactivateAdmin(req, res));
router.post('/users/:id/activate', (req, res) => adminController.activateAdmin(req, res));

// ==================== Two-Factor Authentication ====================
router.post('/users/:id/enable-2fa', (req, res) => adminController.enable2FA(req, res));
router.post('/users/:id/verify-2fa', (req, res) => adminController.verify2FA(req, res));
router.post('/users/:id/disable-2fa', (req, res) => adminController.disable2FA(req, res));

// ==================== Audit Logs ====================
router.get('/audit-logs', (req, res) => adminController.getAuditLogs(req, res));
router.get('/audit-logs/export', (req, res) => adminController.exportAuditLogs(req, res));
router.get('/audit-logs/:id', (req, res) => adminController.getAuditLogDetails(req, res));

// ==================== Listing Moderation ====================
router.get('/listings', (req, res) => adminController.getAllListings(req, res));
router.get('/listings/pending', (req, res) => adminController.getPendingListings(req, res));
router.get('/listings/awaiting-fee', (req, res) => adminController.getListingsAwaitingFee(req, res));
router.post('/listings/bulk-approve', (req, res) => adminController.bulkApproveListings(req, res));
router.post('/listings/bulk-reject', (req, res) => adminController.bulkRejectListings(req, res));
router.post('/listings/:id/approve', (req, res) => adminController.approveListing(req, res));
router.post('/listings/:id/reject', (req, res) => adminController.rejectListing(req, res));

// ==================== Payment Management ====================
router.get('/payments', (req, res) => adminController.getPayments(req, res));
router.get('/payments/export', (req, res) => adminController.exportPayments(req, res));
router.get('/payments/:id', (req, res) => adminController.getPaymentDetails(req, res));
router.post('/payments/:id/complete', (req, res) => adminController.markPaymentCompleted(req, res));

// ==================== Legacy Broker Routes ====================
router.get('/brokers', (req, res) => adminController.getAllBrokers(req, res));
router.get('/brokers/pending', (req, res) => adminController.getPendingBrokers(req, res));
router.post('/brokers/:id/approve', (req, res) => adminController.approveBroker(req, res));
router.post('/brokers/:id/reject', (req, res) => adminController.rejectBroker(req, res));

export default router;
