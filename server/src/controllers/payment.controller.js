import pkg from "@prisma/client";
import { validationResult } from "express-validator";
import crypto from "crypto";
import axios from "axios";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class PaymentController {
  /**
   * Initialize a new payment
   * @route POST /api/payments/initialize
   * @access Private
   */
  async initializePayment(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { id: userId } = req.user;
      const {
        type,
        amount,
        currency = 'ETB',
        paymentMethod,
        paymentGateway,
        description,
        propertyId,
        bookingId,
        isProrated = false,
        proratedDays,
        periodStart,
        periodEnd,
        metadata = {}
      } = req.body;

      // Generate unique transaction number
      const transactionNumber = await this.generateTransactionNumber();

      // Validate based on transaction type
      if (type === 'RENT_PAYMENT' && !bookingId) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID is required for rent payments'
        });
      }

      if (type === 'SECURITY_DEPOSIT' && !propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required for security deposits'
        });
      }

      // Check if booking exists and is valid
      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { property: true }
        });

        if (!booking) {
          return res.status(404).json({
            success: false,
            message: 'Booking not found'
          });
        }

        if (booking.status !== 'CONFIRMED') {
          return res.status(400).json({
            success: false,
            message: 'Booking must be confirmed to process payment'
          });
        }

        // Set property ID from booking
        metadata.bookingDetails = {
          visitType: booking.visitType,
          requestedDate: booking.requestedDate,
          propertyTitle: booking.property.title
        };
      }

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          transactionNumber,
          type,
          status: 'PENDING',
          amount,
          currency,
          description,
          paymentMethod,
          paymentGateway,
          isProrated,
          proratedDays: proratedDays ? parseInt(proratedDays) : null,
          periodStart: periodStart ? new Date(periodStart) : null,
          periodEnd: periodEnd ? new Date(periodEnd) : null,
          propertyId,
          bookingId,
          metadata
        }
      });

      // Initialize payment with gateway
      const paymentIntent = await this.initializeGatewayPayment({
        transaction,
        user: req.user,
        amount,
        currency,
        paymentMethod,
        paymentGateway
      });

      // Update transaction with gateway info
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          gatewayTransactionId: paymentIntent.gatewayTransactionId,
          gatewayResponse: paymentIntent.gatewayResponse
        }
      });

      res.status(201).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          transaction,
          paymentIntent: {
            id: paymentIntent.id,
            clientSecret: paymentIntent.clientSecret,
            nextAction: paymentIntent.nextAction,
            redirectUrl: paymentIntent.redirectUrl
          }
        }
      });

    } catch (error) {
      console.error('Initialize payment error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred initializing payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Confirm payment
   * @route POST /api/payments/:id/confirm
   * @access Private
   */
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { paymentIntentId, gatewayResponse } = req.body;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          booking: true,
          property: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (transaction.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `Transaction already ${transaction.status.toLowerCase()}`
        });
      }

      // Verify payment with gateway
      const verification = await this.verifyGatewayPayment({
        gatewayTransactionId: transaction.gatewayTransactionId || paymentIntentId,
        paymentGateway: transaction.paymentGateway,
        amount: transaction.amount,
        currency: transaction.currency
      });

      if (!verification.success) {
        // Mark as failed
        await prisma.transaction.update({
          where: { id },
          data: {
            status: 'FAILED',
            gatewayResponse: verification.response,
            updated_at: new Date()
          }
        });

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          data: verification
        });
      }

      // Update transaction as completed
      const completedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          settledDate: new Date(),
          gatewayResponse: verification.response,
          receiptConfirmed: true,
          receiptConfirmedAt: new Date(),
          updated_at: new Date()
        }
      });

      // Generate receipt
      const receipt = await this.generateReceipt(completedTransaction);

      // Handle post-payment actions
      await this.handlePostPaymentActions(completedTransaction);

      // Send confirmation
      await this.sendPaymentConfirmation(completedTransaction, receipt);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          transaction: completedTransaction,
          receipt
        }
      });

    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred confirming payment'
      });
    }
  }



  /**
 * Create a new payment (alias for initializePayment)
 * @route POST /api/payments
 * @access Private
 */
  async createPayment(req, res) {
    // This is an alias for initializePayment
    return this.initializePayment(req, res);
  }

  /**
   * Get transaction by ID
   * @route GET /api/payments/:id
   * @access Private
   */
  async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true
            }
          },
          property: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1
              }
            }
          },
          booking: {
            include: {
              property: {
                select: {
                  title: true,
                  location: true
                }
              }
            }
          },
          receipt: true,
          refundedTransaction: true,
          refundTransactions: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check permission
      if (transaction.userId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching transaction'
      });
    }
  }

  /**
   * Get user transactions
   * @route GET /api/payments
   * @access Private
   */
  async getUserTransactions(req, res) {
    try {
      const { id: userId, role } = req.user;
      const {
        page = 1,
        limit = 10,
        type,
        status,
        startDate,
        endDate,
        sort = 'newest'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};

      if (role === 'admin' && req.query.userId) {
        where.userId = req.query.userId;
      } else {
        where.userId = userId;
      }

      if (type) where.type = type;
      if (status) where.status = status;
      if (startDate || endDate) {
        where.transactionDate = {};
        if (startDate) where.transactionDate.gte = new Date(startDate);
        if (endDate) where.transactionDate.lte = new Date(endDate);
      }

      // Sorting
      let orderBy = {};
      switch (sort) {
        case 'newest':
          orderBy = { transactionDate: 'desc' };
          break;
        case 'oldest':
          orderBy = { transactionDate: 'asc' };
          break;
        case 'amount_desc':
          orderBy = { amount: 'desc' };
          break;
        case 'amount_asc':
          orderBy = { amount: 'asc' };
          break;
        default:
          orderBy = { transactionDate: 'desc' };
      }

      const [transactions, total, summary] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                title: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            receipt: true
          },
          skip,
          take: parseInt(limit),
          orderBy
        }),
        prisma.transaction.count({ where }),
        prisma.transaction.aggregate({
          where: {
            ...where,
            status: 'COMPLETED'
          },
          _sum: { amount: true },
          _count: true,
          _avg: { amount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          summary: {
            totalAmount: summary._sum.amount || 0,
            totalTransactions: summary._count,
            averageAmount: summary._avg.amount || 0
          }
        }
      });

    } catch (error) {
      console.error('Get user transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching transactions'
      });
    }
  }

  /**
   * Process refund
   * @route POST /api/payments/:id/refund
   * @access Private (Admin or Owner)
   */
  async processRefund(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const { amount, reason } = req.body;

      const originalTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          property: true,
          booking: true
        }
      });

      if (!originalTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check permission (admin or property owner)
      const isOwner = originalTransaction.property?.user_id === userId;
      if (role !== 'admin' && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Only admins or property owners can process refunds'
        });
      }

      if (originalTransaction.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Only completed transactions can be refunded'
        });
      }

      if (originalTransaction.refundedTransactionId) {
        return res.status(400).json({
          success: false,
          message: 'Transaction already refunded'
        });
      }

      const refundAmount = amount || originalTransaction.amount;
      if (refundAmount > originalTransaction.amount) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount cannot exceed original amount'
        });
      }

      // Generate refund transaction number
      const refundTransactionNumber = await this.generateTransactionNumber('REF');

      // Process refund with gateway
      const gatewayRefund = await this.processGatewayRefund({
        gatewayTransactionId: originalTransaction.gatewayTransactionId,
        paymentGateway: originalTransaction.paymentGateway,
        amount: refundAmount,
        reason
      });

      // Create refund transaction
      const refundTransaction = await prisma.transaction.create({
        data: {
          userId: originalTransaction.userId,
          transactionNumber: refundTransactionNumber,
          type: 'DEPOSIT_REFUND',
          status: gatewayRefund.success ? 'COMPLETED' : 'PENDING',
          amount: refundAmount,
          currency: originalTransaction.currency,
          description: `Refund for transaction ${originalTransaction.transactionNumber}`,
          paymentMethod: originalTransaction.paymentMethod,
          paymentGateway: originalTransaction.paymentGateway,
          gatewayTransactionId: gatewayRefund.gatewayTransactionId,
          gatewayResponse: gatewayRefund.response,
          propertyId: originalTransaction.propertyId,
          bookingId: originalTransaction.bookingId,
          refundedTransactionId: originalTransaction.id,
          refundReason: reason,
          refundedAt: new Date()
        }
      });

      // Update original transaction
      await prisma.transaction.update({
        where: { id: originalTransaction.id },
        data: {
          status: refundAmount === originalTransaction.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refund: refundTransaction,
          originalTransaction: {
            ...originalTransaction,
            status: refundAmount === originalTransaction.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
          }
        }
      });

    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred processing refund'
      });
    }
  }

  /**
   * Get payment methods for user
   * @route GET /api/payments/methods
   * @access Private
   */
  async getPaymentMethods(req, res) {
    try {
      const { id: userId } = req.user;

      const methods = await prisma.paymentMethodDetail.findMany({
        where: {
          userId,
          isActive: true,
          isExpired: false
        },
        orderBy: [
          { isDefault: 'desc' },
          { created_at: 'desc' }
        ]
      });

      res.json({
        success: true,
        data: {
          methods,
          defaultMethod: methods.find(m => m.isDefault) || null
        }
      });

    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching payment methods'
      });
    }
  }

  /**
   * Add payment method
   * @route POST /api/payments/methods
   * @access Private
   */
  async addPaymentMethod(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { id: userId } = req.user;
      const {
        paymentMethod,
        paymentGateway,
        gatewayCustomerId,
        gatewayPaymentMethodId,
        lastFour,
        cardBrand,
        expiryMonth,
        expiryYear,
        cardholderName,
        bankName,
        accountType,
        billingAddress1,
        billingAddress2,
        billingCity,
        billingState,
        billingCountry,
        isDefault = false
      } = req.body;

      // If setting as default, remove default from others
      if (isDefault) {
        await prisma.paymentMethodDetail.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      const method = await prisma.paymentMethodDetail.create({
        data: {
          userId,
          paymentMethod,
          paymentGateway,
          gatewayCustomerId,
          gatewayPaymentMethodId,
          lastFour,
          cardBrand,
          expiryMonth: expiryMonth ? parseInt(expiryMonth) : null,
          expiryYear: expiryYear ? parseInt(expiryYear) : null,
          cardholderName,
          bankName,
          accountType,
          billingAddress1,
          billingAddress2,
          billingCity,
          billingState,
          billingCountry: billingCountry || 'ET',
          isDefault,
          isVerified: false,
          isActive: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Payment method added successfully',
        data: method
      });

    } catch (error) {
      console.error('Add payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred adding payment method'
      });
    }
  }

  /**
   * Update payment method
   * @route PATCH /api/payments/methods/:id
   * @access Private
   */
  async updatePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { isDefault, billingAddress1, billingAddress2, billingCity, billingState, billingCountry } = req.body;

      const method = await prisma.paymentMethodDetail.findUnique({
        where: { id }
      });

      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      if (method.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // If setting as default, remove default from others
      if (isDefault) {
        await prisma.paymentMethodDetail.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false }
        });
      }

      const updated = await prisma.paymentMethodDetail.update({
        where: { id },
        data: {
          isDefault: isDefault !== undefined ? isDefault : undefined,
          billingAddress1,
          billingAddress2,
          billingCity,
          billingState,
          billingCountry,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Payment method updated successfully',
        data: updated
      });

    } catch (error) {
      console.error('Update payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating payment method'
      });
    }
  }

  /**
   * Delete payment method
   * @route DELETE /api/payments/methods/:id
   * @access Private
   */
  async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const method = await prisma.paymentMethodDetail.findUnique({
        where: { id }
      });

      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      if (method.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Soft delete
      await prisma.paymentMethodDetail.update({
        where: { id },
        data: {
          isActive: false,
          updated_at: new Date()
        }
      });

      // If this was default, set another as default
      if (method.isDefault) {
        const anotherMethod = await prisma.paymentMethodDetail.findFirst({
          where: { userId, isActive: true, id: { not: id } }
        });

        if (anotherMethod) {
          await prisma.paymentMethodDetail.update({
            where: { id: anotherMethod.id },
            data: { isDefault: true }
          });
        }
      }

      res.json({
        success: true,
        message: 'Payment method deleted successfully'
      });

    } catch (error) {
      console.error('Delete payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deleting payment method'
      });
    }
  }

  /**
   * Get transaction statistics
   * @route GET /api/payments/stats
   * @access Private (Admin only)
   */
  async getTransactionStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { startDate, endDate, groupBy = 'day' } = req.query;

      const dateRange = {
        gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lte: endDate ? new Date(endDate) : new Date()
      };

      const [
        totalStats,
        byStatus,
        byType,
        byGateway,
        dailyStats,
        revenue
      ] = await Promise.all([
        // Overall stats
        prisma.transaction.aggregate({
          where: {
            transactionDate: dateRange,
            status: 'COMPLETED'
          },
          _sum: { amount: true },
          _count: true,
          _avg: { amount: true }
        }),

        // By status
        prisma.transaction.groupBy({
          by: ['status'],
          where: { transactionDate: dateRange },
          _count: true,
          _sum: { amount: true }
        }),

        // By type
        prisma.transaction.groupBy({
          by: ['type'],
          where: {
            transactionDate: dateRange,
            status: 'COMPLETED'
          },
          _count: true,
          _sum: { amount: true }
        }),

        // By gateway
        prisma.transaction.groupBy({
          by: ['paymentGateway'],
          where: {
            transactionDate: dateRange,
            status: 'COMPLETED'
          },
          _count: true,
          _sum: { amount: true }
        }),

        // Daily trends
        prisma.$queryRaw`
          SELECT 
            DATE(transaction_date) as date,
            COUNT(*) as count,
            SUM(amount) as total
          FROM transactions
          WHERE transaction_date BETWEEN ${dateRange.gte} AND ${dateRange.lte}
          AND status = 'COMPLETED'
          GROUP BY DATE(transaction_date)
          ORDER BY date ASC
        `,

        // Revenue by month
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', transaction_date) as month,
            SUM(amount) as revenue
          FROM transactions
          WHERE status = 'COMPLETED'
          GROUP BY DATE_TRUNC('month', transaction_date)
          ORDER BY month DESC
          LIMIT 12
        `
      ]);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.gte,
            end: dateRange.lte
          },
          summary: {
            totalRevenue: totalStats._sum.amount || 0,
            totalTransactions: totalStats._count,
            averageTransaction: totalStats._avg.amount || 0
          },
          byStatus: byStatus.map(s => ({
            status: s.status,
            count: s._count,
            amount: s._sum.amount || 0
          })),
          byType: byType.map(t => ({
            type: t.type,
            count: t._count,
            amount: t._sum.amount || 0
          })),
          byGateway: byGateway.map(g => ({
            gateway: g.paymentGateway,
            count: g._count,
            amount: g._sum.amount || 0
          })),
          dailyTrend: dailyStats,
          revenueHistory: revenue
        }
      });

    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching statistics'
      });
    }
  }

  /**
   * Get receipt
   * @route GET /api/payments/:id/receipt
   * @access Private
   */
  async getReceipt(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          receipt: true,
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          },
          property: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.userId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!transaction.receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      res.json({
        success: true,
        data: transaction.receipt
      });

    } catch (error) {
      console.error('Get receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching receipt'
      });
    }
  }

  /**
   * Download receipt
   * @route GET /api/payments/:id/receipt/download
   * @access Private
   */
  async downloadReceipt(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          receipt: true,
          user: true,
          property: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.userId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!transaction.receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      // Update download count
      await prisma.receipt.update({
        where: { id: transaction.receipt.id },
        data: { downloadedAt: new Date() }
      });

      // Redirect to receipt URL or generate PDF
      if (transaction.receipt.pdfUrl) {
        return res.redirect(transaction.receipt.pdfUrl);
      }

      res.json({
        success: true,
        data: {
          receiptUrl: transaction.receipt.receiptUrl,
          pdfUrl: transaction.receipt.pdfUrl
        }
      });

    } catch (error) {
      console.error('Download receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred downloading receipt'
      });
    }
  }

  /**
   * Cancel payment
   * @route POST /api/payments/:id/cancel
   * @access Private
   */
  async cancelPayment(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const transaction = await prisma.transaction.findUnique({
        where: { id }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (transaction.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Only pending transactions can be cancelled'
        });
      }

      await prisma.transaction.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Payment cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel payment error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred cancelling payment'
      });
    }
  }

  /**
   * Check payment status
   * @route GET /api/payments/:id/status
   * @access Private
   */
  async checkPaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          transactionNumber: true,
          amount: true,
          currency: true,
          createdAt: true,
          gatewayTransactionId: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred checking payment status'
      });
    }
  }

  /**
   * Email receipt
   * @route POST /api/payments/:id/receipt/email
   * @access Private
   */
  async emailReceipt(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { email } = req.body;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { receipt: true }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!transaction.receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      // Update receipt with email info
      await prisma.receipt.update({
        where: { id: transaction.receipt.id },
        data: {
          emailedTo: email || transaction.user.email,
          emailedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Receipt emailed successfully'
      });

    } catch (error) {
      console.error('Email receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred emailing receipt'
      });
    }
  }

  /**
   * Get available payment gateways
   * @route GET /api/payments/gateways
   * @access Public
   */
  async getAvailableGateways(req, res) {
    try {
      const gateways = [
        { id: 'CBE_BIRR', name: 'CBE Birr', type: 'mobile_money' },
        { id: 'TELEBIRR', name: 'Telebirr', type: 'mobile_money' },
        { id: 'M_PESA', name: 'M-Pesa', type: 'mobile_money' },
        { id: 'COMMERCE_BANK', name: 'Commercial Bank of Ethiopia', type: 'bank_transfer' },
        { id: 'CHAPA', name: 'Chapa', type: 'payment_gateway' },
        { id: 'STRIPE', name: 'Stripe', type: 'payment_gateway' }
      ];

      res.json({
        success: true,
        data: gateways
      });

    } catch (error) {
      console.error('Get available gateways error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching gateways'
      });
    }
  }

  /**
   * Get supported currencies
   * @route GET /api/payments/currencies
   * @access Public
   */
  async getSupportedCurrencies(req, res) {
    try {
      const currencies = [
        { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
        { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
        { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'SSP', name: 'South Sudanese Pound', symbol: '£' },
        { code: 'SDG', name: 'Sudanese Pound', symbol: '£' }
      ];

      res.json({
        success: true,
        data: currencies
      });

    } catch (error) {
      console.error('Get supported currencies error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching currencies'
      });
    }
  }

  /**
   * Get exchange rate
   * @route GET /api/payments/exchange-rate
   * @access Public
   */
  async getExchangeRate(req, res) {
    try {
      const { from, to } = req.query;

      // Mock exchange rates
      const rates = {
        ETB: { USD: 0.018, KES: 2.4, UGX: 68 },
        USD: { ETB: 55, KES: 130, UGX: 3800 }
      };

      const rate = rates[from]?.[to] || 1;

      res.json({
        success: true,
        data: {
          from,
          to,
          rate,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Get exchange rate error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching exchange rate'
      });
    }
  }

  /**
   * Bulk update transaction status (Admin only)
   * @route PATCH /api/payments/bulk/status
   * @access Admin
   */
  async bulkUpdateStatus(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { transactionIds, status, reason } = req.body;

      const result = await prisma.transaction.updateMany({
        where: {
          id: { in: transactionIds }
        },
        data: {
          status,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: `Updated ${result.count} transactions`,
        data: result
      });

    } catch (error) {
      console.error('Bulk update status error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating transactions'
      });
    }
  }

  /**
   * Export transactions
   * @route GET /api/payments/export
   * @access Admin
   */
  async exportTransactions(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { startDate, endDate, format = 'json' } = req.query;

      const where = {};
      if (startDate || endDate) {
        where.transactionDate = {};
        if (startDate) where.transactionDate.gte = new Date(startDate);
        if (endDate) where.transactionDate.lte = new Date(endDate);
      }

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              first_name: true,
              last_name: true
            }
          },
          property: {
            select: {
              title: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' }
      });

      if (format === 'csv') {
        // Convert to CSV
        const csv = this.convertToCSV(transactions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        return res.send(csv);
      }

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Export transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred exporting transactions'
      });
    }
  }

  /**
   * Get booking transactions
   * @route GET /api/payments/booking/:bookingId
   * @access Private
   */
  async getBookingTransactions(req, res) {
    try {
      const { bookingId } = req.params;
      const { id: userId } = req.user;

      const transactions = await prisma.transaction.findMany({
        where: {
          bookingId,
          OR: [
            { userId },
            { property: { user_id: userId } }
          ]
        },
        include: {
          property: {
            select: {
              title: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' }
      });

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Get booking transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching booking transactions'
      });
    }
  }

  /**
   * Get property transactions
   * @route GET /api/payments/property/:propertyId
   * @access Private
   */
  async getPropertyTransactions(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId } = req.user;

      const transactions = await prisma.transaction.findMany({
        where: {
          propertyId,
          OR: [
            { userId },
            { property: { user_id: userId } }
          ]
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' }
      });

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Get property transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching property transactions'
      });
    }
  }

  /**
   * Get payment summary for current user
   * @route GET /api/payments/summary
   * @access Private
   */
  async getPaymentSummary(req, res) {
    try {
      const { id: userId } = req.user;

      const [totalSpent, totalTransactions, recentPayments] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            status: 'COMPLETED'
          },
          _sum: { amount: true }
        }),
        prisma.transaction.count({
          where: { userId }
        }),
        prisma.transaction.findMany({
          where: { userId },
          orderBy: { transactionDate: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            currency: true,
            type: true,
            status: true,
            transactionDate: true
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalSpent: totalSpent._sum.amount || 0,
          totalTransactions,
          recentPayments
        }
      });

    } catch (error) {
      console.error('Get payment summary error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching payment summary'
      });
    }
  }

  /**
   * Calculate payment (prorated amounts, fees, etc.)
   * @route POST /api/payments/calculate
   * @access Private
   */
  async calculatePayment(req, res) {
    try {
      const {
        type,
        baseAmount,
        startDate,
        endDate,
        propertyId
      } = req.body;

      let calculatedAmount = baseAmount;
      let fees = 0;
      let total = baseAmount;

      // Calculate prorated amount if dates provided
      if (startDate && endDate) {
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const monthlyRate = baseAmount / 30;
        calculatedAmount = monthlyRate * days;
      }

      // Apply platform fee (2.5%)
      fees = calculatedAmount * 0.025;
      total = calculatedAmount + fees;

      res.json({
        success: true,
        data: {
          baseAmount,
          calculatedAmount,
          fees,
          total,
          currency: 'ETB',
          breakdown: {
            prorated: startDate && endDate,
            platformFee: '2.5%'
          }
        }
      });

    } catch (error) {
      console.error('Calculate payment error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred calculating payment'
      });
    }
  }

  /**
   * Get platform fees
   * @route GET /api/payments/fees
   * @access Public
   */
  async getPlatformFees(req, res) {
    try {
      const fees = {
        platform_fee: {
          percentage: 2.5,
          min: 10,
          max: 1000,
          currency: 'ETB'
        },
        payment_processing: {
          percentage: 1.5,
          fixed: 5,
          currency: 'ETB'
        }
      };

      res.json({
        success: true,
        data: fees
      });

    } catch (error) {
      console.error('Get platform fees error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching platform fees'
      });
    }
  }

  /**
   * Get transaction by reference number
   * @route GET /api/payments/by-reference/:reference
   * @access Private
   */
  async getTransactionByReference(req, res) {
    try {
      const { reference } = req.params;
      const { id: userId, role } = req.user;

      const transaction = await prisma.transaction.findUnique({
        where: { transactionNumber: reference },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true
            }
          },
          property: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1
              }
            }
          },
          booking: true,
          receipt: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check permission
      if (transaction.userId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Get transaction by reference error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching transaction'
      });
    }
  }

  /**
   * Set payment method as default
   * @route PATCH /api/payments/methods/:id/default
   * @access Private
   */
  async setDefaultMethod(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      // First check if method belongs to user
      const existingMethod = await prisma.paymentMethodDetail.findUnique({
        where: { id }
      });

      if (!existingMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      if (existingMethod.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Clear existing defaults
      await prisma.paymentMethodDetail.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // Set new default
      const method = await prisma.paymentMethodDetail.update({
        where: { id },
        data: {
          isDefault: true,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Default payment method updated',
        data: method
      });

    } catch (error) {
      console.error('Set default method error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred setting default method'
      });
    }
  }

  /**
   * Verify payment method
   * @route POST /api/payments/methods/:id/verify
   * @access Private
   */
  async verifyPaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { verificationCode } = req.body;

      const method = await prisma.paymentMethodDetail.findUnique({
        where: { id }
      });

      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      if (method.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Mock verification logic
      // In production, verify with payment gateway
      const isValid = verificationCode === '123456'; // Mock OTP

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }

      const verifiedMethod = await prisma.paymentMethodDetail.update({
        where: { id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Payment method verified successfully',
        data: verifiedMethod
      });

    } catch (error) {
      console.error('Verify payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred verifying payment method'
      });
    }
  }

  /**
   * Handle webhook from payment gateways
   * @route POST /api/payments/webhook/:gateway
   * @access Public
   */
  async handleWebhook(req, res) {
    try {
      const { gateway } = req.params;
      const payload = req.body;

      // Verify webhook signature (gateway specific)
      // await this.verifyWebhookSignature(gateway, payload);

      // Process webhook
      switch (gateway.toLowerCase()) {
        case 'chapa':
          await this.handleChapaWebhook(payload);
          break;
        case 'stripe':
          await this.handleStripeWebhook(payload);
          break;
        default:
          return res.status(400).json({ error: 'Unsupported gateway' });
      }

      res.status(200).json({ received: true });

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Verify payment without processing
   * @route POST /api/payments/verify
   * @access Private
   */
  async verifyPayment(req, res) {
    try {
      const { id: userId } = req.user;
      const { gatewayTransactionId, paymentGateway, amount, currency } = req.body;

      // Mock verification
      const verification = {
        success: true,
        message: 'Payment verified',
        data: {
          gatewayTransactionId,
          paymentGateway,
          amount,
          currency,
          status: 'verified'
        }
      };

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          data: verification
        });
      }

      res.json({
        success: true,
        message: 'Payment verified',
        data: verification
      });

    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed'
      });
    }
  }

  /**
   * Run payment reconciliation (Admin only)
   * @route POST /api/payments/reconciliation
   * @access Admin
   */
  async runReconciliation(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Reconciliation logic
      // Compare gateway reports with local transactions
      const report = {
        matched: 0,
        discrepancies: [],
        totalReconciled: 0,
        date: new Date().toISOString()
      };

      res.json({
        success: true,
        data: report,
        message: 'Reconciliation completed'
      });

    } catch (error) {
      console.error('Reconciliation error:', error);
      res.status(500).json({
        success: false,
        message: 'Reconciliation failed'
      });
    }
  }

  // Helper: Generate transaction number
  async generateTransactionNumber(prefix = 'TXN') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    const transactionNumber = `${prefix}-${timestamp}-${random}`;

    // Check if exists
    const existing = await prisma.transaction.findUnique({
      where: { transactionNumber }
    });

    if (existing) {
      return this.generateTransactionNumber(prefix);
    }

    return transactionNumber;
  }

  // Helper: Initialize gateway payment
  async initializeGatewayPayment({ transaction, user, amount, currency, paymentMethod, paymentGateway }) {
    // This would integrate with actual payment gateways
    // Examples: Chapa, Telebirr, CBE, Stripe, etc.

    switch (paymentGateway) {
      case 'CHAPA':
        return this.initializeChapaPayment(transaction, user, amount, currency);
      case 'TELEBIRR':
        return this.initializeTelebirrPayment(transaction, user, amount);
      case 'CBE_BIRR':
        return this.initializeCBEPayment(transaction, user, amount);
      case 'STRIPE':
        return this.initializeStripePayment(transaction, user, amount, currency);
      default:
        // Mock response for development
        return {
          id: `mock_${crypto.randomBytes(8).toString('hex')}`,
          clientSecret: `mock_secret_${crypto.randomBytes(16).toString('hex')}`,
          gatewayTransactionId: `gateway_${crypto.randomBytes(8).toString('hex')}`,
          nextAction: null,
          redirectUrl: null,
          gatewayResponse: { mock: true }
        };
    }
  }

  // Helper: Verify gateway payment
  async verifyGatewayPayment({ gatewayTransactionId, paymentGateway, amount, currency }) {
    // Mock verification for development
    return {
      success: true,
      response: {
        verified: true,
        amount,
        currency,
        status: 'success'
      }
    };
  }

  // Helper: Process gateway refund
  async processGatewayRefund({ gatewayTransactionId, paymentGateway, amount, reason }) {
    // Mock refund for development
    return {
      success: true,
      gatewayTransactionId: `refund_${crypto.randomBytes(8).toString('hex')}`,
      response: {
        refunded: true,
        amount,
        reason
      }
    };
  }

  // Helper: Generate receipt
  async generateReceipt(transaction) {
    const receiptNumber = await this.generateTransactionNumber('RCP');

    // In production, you would generate a PDF receipt
    const receiptUrl = `https://storage.urbannest.com/receipts/${receiptNumber}.pdf`;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        transactionId: transaction.id,
        receiptUrl,
        pdfUrl: receiptUrl
      }
    });

    return receipt;
  }

  // Helper: Handle post-payment actions
  async handlePostPaymentActions(transaction) {
    switch (transaction.type) {
      case 'RENT_PAYMENT':
        // Update booking or create lease
        if (transaction.bookingId) {
          await prisma.booking.update({
            where: { id: transaction.bookingId },
            data: {
              status: 'CONFIRMED',
              transaction: { connect: { id: transaction.id } }
            }
          });
        }
        break;

      case 'SECURITY_DEPOSIT':
        // Mark deposit as paid
        break;

      case 'BUYER_PAYMENT':
        // Update property status
        if (transaction.propertyId) {
          await prisma.property.update({
            where: { id: transaction.propertyId },
            data: { status: 'sold' }
          });
        }
        break;
    }
  }

  // Helper: Send payment confirmation
  async sendPaymentConfirmation(transaction, receipt) {
    // Send email/SMS notification
    console.log(`Sending payment confirmation for transaction ${transaction.id}`);
  }

  // Helper: Initialize Chapa payment
  async initializeChapaPayment(transaction, user, amount, currency) {
    // Chapa API integration
    const payload = {
      amount: amount,
      currency: currency,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tx_ref: transaction.transactionNumber,
      callback_url: `${process.env.API_URL}/api/payments/chapa/callback`,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      customization: {
        title: 'UrbanNEST Payment',
        description: transaction.description || 'Property Payment'
      }
    };

    try {
      const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        id: response.data.data.id,
        clientSecret: null,
        gatewayTransactionId: response.data.data.tx_ref,
        nextAction: 'redirect',
        redirectUrl: response.data.data.checkout_url,
        gatewayResponse: response.data
      };
    } catch (error) {
      console.error('Chapa initialization error:', error);
      throw new Error('Failed to initialize Chapa payment');
    }
  }

  // Helper: Initialize Telebirr payment
  async initializeTelebirrPayment(transaction, user, amount) {
    // Telebirr API integration
    // This is a simplified mock
    return {
      id: `telebirr_${crypto.randomBytes(8).toString('hex')}`,
      clientSecret: null,
      gatewayTransactionId: `tb_${crypto.randomBytes(8).toString('hex')}`,
      nextAction: 'collect',
      redirectUrl: null,
      gatewayResponse: { ussdCode: '*123#' }
    };
  }

  // Helper: Initialize CBE Birr payment
  async initializeCBEPayment(transaction, user, amount) {
    // CBE Birr API integration
    return {
      id: `cbe_${crypto.randomBytes(8).toString('hex')}`,
      clientSecret: null,
      gatewayTransactionId: `cbe_${crypto.randomBytes(8).toString('hex')}`,
      nextAction: 'qrcode',
      redirectUrl: null,
      gatewayResponse: { qrCode: 'base64_encoded_qr' }
    };
  }

  // Helper: Initialize Stripe payment
  async initializeStripePayment(transaction, user, amount, currency) {
    // Stripe API integration - using dynamic import to avoid module not found error
    try {
      const stripe = (await import('stripe')).default;
      const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          transactionId: transaction.id,
          userId: user.id
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        gatewayTransactionId: paymentIntent.id,
        nextAction: 'confirm',
        redirectUrl: null,
        gatewayResponse: paymentIntent
      };
    } catch (error) {
      console.error('Stripe payment initialization failed:', error);
      throw new Error('Failed to initialize Stripe payment');
    }
  }

  // Helper: Verify gateway payment
  async verifyGatewayPayment({ gatewayTransactionId, paymentGateway, amount, currency }) {
    // Mock verification for development
    return {
      success: true,
      response: {
        verified: true,
        amount,
        currency,
        status: 'success'
      }
    };
  }

  // Helper: Export transactions to CSV
  async exportTransactions(transactions) {
    const headers = ['ID', 'Number', 'Type', 'Amount', 'Currency', 'Status', 'Date', 'User', 'Property'];
    const rows = transactions.map(t => [
      t.id,
      t.transactionNumber,
      t.type,
      t.amount,
      t.currency,
      t.status,
      t.transactionDate.toISOString().split('T')[0],
      t.user?.email || '',
      t.property?.title || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  // Private webhook helpers
  async handleChapaWebhook(payload) {
    console.log('Chapa webhook received:', JSON.stringify(payload, null, 2));

    try {
      const { tx_ref, status, reference } = payload;

      if (!tx_ref) {
        console.error('Chapa webhook missing tx_ref');
        return;
      }

      // Find the listing fee payment by transaction reference
      const payment = await prisma.listingFeePayment.findUnique({
        where: { chapaTransactionRef: tx_ref },
        include: { property: true }
      });

      if (!payment) {
        console.error(`No listing fee payment found for tx_ref: ${tx_ref}`);
        return;
      }

      // Skip if already processed
      if (payment.status === 'COMPLETED') {
        console.log(`Payment ${tx_ref} already marked as completed`);
        return;
      }

      // Only process successful payments
      if (status === 'success') {
        const tier = payment.tier || 'standard';
        const listingDays = tier === 'premium' ? 60 : 30;
        const listingExpiresAt = new Date();
        listingExpiresAt.setDate(listingExpiresAt.getDate() + listingDays);

        await prisma.$transaction([
          prisma.listingFeePayment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
              chapaCheckoutUrl: payload.checkout_url || payment.chapaCheckoutUrl
            }
          }),
          prisma.property.update({
            where: { id: payment.propertyId },
            data: {
              listing_fee_paid: true,
              listing_tier: tier,
              listing_expires_at: listingExpiresAt,
              is_featured: tier === 'premium',
              status: 'pending'
            }
          })
        ]);

        console.log(`✅ Payment ${tx_ref} verified and property ${payment.propertyId} activated with ${tier} tier`);
      } else if (status === 'failed' || status === 'cancelled') {
        await prisma.listingFeePayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });
        console.log(`❌ Payment ${tx_ref} marked as failed`);
      }
    } catch (error) {
      console.error('Error processing Chapa webhook:', error);
    }
  }

  async handleStripeWebhook(payload) {
    // Process Stripe webhook
    console.log('Stripe webhook:', payload);
  }

  async verifyWebhookSignature(gateway, payload) {
    // Implement signature verification based on gateway
    return true;
  }
}

// Create instance and export all methods
const paymentController = new PaymentController();

export const initializePayment = paymentController.initializePayment.bind(paymentController);
export const confirmPayment = paymentController.confirmPayment.bind(paymentController);
export const getTransaction = paymentController.getTransaction.bind(paymentController);
export const getUserTransactions = paymentController.getUserTransactions.bind(paymentController);
export const processRefund = paymentController.processRefund.bind(paymentController);
export const getPaymentMethods = paymentController.getPaymentMethods.bind(paymentController);
export const addPaymentMethod = paymentController.addPaymentMethod.bind(paymentController);
export const updatePaymentMethod = paymentController.updatePaymentMethod.bind(paymentController);
export const deletePaymentMethod = paymentController.deletePaymentMethod.bind(paymentController);
export const getTransactionStats = paymentController.getTransactionStats.bind(paymentController);
export const getReceipt = paymentController.getReceipt.bind(paymentController);
export const downloadReceipt = paymentController.downloadReceipt.bind(paymentController);
export const cancelPayment = paymentController.cancelPayment.bind(paymentController);
export const checkPaymentStatus = paymentController.checkPaymentStatus.bind(paymentController);
export const emailReceipt = paymentController.emailReceipt.bind(paymentController);
export const getAvailableGateways = paymentController.getAvailableGateways.bind(paymentController);
export const getSupportedCurrencies = paymentController.getSupportedCurrencies.bind(paymentController);
export const getExchangeRate = paymentController.getExchangeRate.bind(paymentController);
export const bulkUpdateStatus = paymentController.bulkUpdateStatus.bind(paymentController);
export const exportTransactions = paymentController.exportTransactions.bind(paymentController);
export const getBookingTransactions = paymentController.getBookingTransactions.bind(paymentController);
export const getPropertyTransactions = paymentController.getPropertyTransactions.bind(paymentController);
export const getPaymentSummary = paymentController.getPaymentSummary.bind(paymentController);
export const calculatePayment = paymentController.calculatePayment.bind(paymentController);
export const getPlatformFees = paymentController.getPlatformFees.bind(paymentController);
export const getTransactionByReference = paymentController.getTransactionByReference.bind(paymentController);
export const setDefaultMethod = paymentController.setDefaultMethod.bind(paymentController);
export const verifyPaymentMethod = paymentController.verifyPaymentMethod.bind(paymentController);
export const handleWebhook = paymentController.handleWebhook.bind(paymentController);
export const verifyPayment = paymentController.verifyPayment.bind(paymentController);
export const runReconciliation = paymentController.runReconciliation.bind(paymentController);
export const createPayment = paymentController.createPayment.bind(paymentController);

// Also export default for flexibility
export default paymentController;