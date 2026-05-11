// server/src/services/payment.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PaymentService {
  /**
   * Create payment intent
   */
  async createPaymentIntent(userId, data) {
    const {
      amount,
      currency = 'ETB',
      type,
      description,
      paymentMethod,
      paymentGateway,
      bookingId,
      propertyId,
      ownerId
    } = data;
    
    // Generate unique transaction number
    const transactionNumber = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        transactionNumber,
        type,
        amount: parseFloat(amount),
        currency,
        description,
        paymentMethod,
        paymentGateway,
        status: 'PENDING',
        bookingId,
        propertyId,
        ownerId,
        seekerId: userId
      }
    });
    
    return transaction;
  }
  
  /**
   * Update payment status
   */
  async updatePaymentStatus(transactionId, status, gatewayResponse = null) {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        gatewayResponse,
        ...(status === 'COMPLETED' && { settledDate: new Date() })
      },
      include: {
        booking: true,
        property: true
      }
    });
    
    // If payment completed, update booking if exists
    if (status === 'COMPLETED' && transaction.bookingId) {
      await prisma.booking.update({
        where: { id: transaction.bookingId },
        data: { status: 'CONFIRMED' }
      });
    }
    
    return transaction;
  }
  
  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId, userId, role) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        booking: {
          include: {
            property: { include: { photos: { where: { isPrimary: true }, take: 1 } }
          }
        },
        property: { include: { location: true } },
        receipt: true
      }
    }});
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.userId !== userId && role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    return transaction;
  }
  
  /**
   * Get user transactions
   */
  async getUserTransactions(userId, page = 1, limit = 10, type = null, status = null) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = { userId };
    if (type) where.type = type;
    if (status) where.status = status;
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          booking: {
            include: {
              property: { include: { photos: { where: { isPrimary: true }, take: 1 } }
            }
          },
          property: { include: { location: true } },
          receipt: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }}),
      prisma.transaction.count({ where })
    ]);
    
    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Process refund
   */
  async processRefund(transactionId, userId, role, reason) {
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });
    
    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }
    
    if (originalTransaction.userId !== userId && role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    if (originalTransaction.status !== 'COMPLETED') {
      throw new Error('Only completed transactions can be refunded');
    }
    
    const refundNumber = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const refundTransaction = await prisma.transaction.create({
      data: {
        userId,
        transactionNumber: refundNumber,
        type: originalTransaction.type === 'RENT_PAYMENT' ? 'DEPOSIT_REFUND' : 'DEPOSIT_REFUND',
        amount: originalTransaction.amount,
        currency: originalTransaction.currency,
        description: `Refund for ${originalTransaction.transactionNumber}: ${reason}`,
        paymentMethod: originalTransaction.paymentMethod,
        paymentGateway: originalTransaction.paymentGateway,
        status: 'PROCESSING',
        refundedTransactionId: transactionId,
        refundReason: reason,
        bookingId: originalTransaction.bookingId,
        propertyId: originalTransaction.propertyId,
        seekerId: originalTransaction.seekerId,
        ownerId: originalTransaction.ownerId
      }
    });
    
    // Update original transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'REFUNDED',
        refundReason: reason,
        refundedAt: new Date()
      }
    });
    
    return refundTransaction;
  }
  
  /**
   * Generate receipt
   */
  async generateReceipt(transactionId) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
        property: { select: { title: true } }
      }
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    const receiptNumber = `RCP_${Date.now()}_${transaction.transactionNumber}`;
    
    const receipt = await prisma.receipt.upsert({
      where: { transactionId },
      update: {
        receiptUrl: `/receipts/${receiptNumber}.pdf`,
        emailedTo: transaction.user.email
      },
      create: {
        transactionId,
        receiptNumber,
        receiptUrl: `/receipts/${receiptNumber}.pdf`,
        emailedTo: transaction.user.email
      }
    });
    
    return receipt;
  }
  
  /**
   * Get payment statistics (admin)
   */
  async getStatistics() {
    const [totalVolume, byStatus, byType, recent] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        _count: true,
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } }
        }
      })
    ]);
    
    return {
      totalVolume: totalVolume._sum.amount || 0,
      byStatus,
      byType,
      recent
    };
  }
}

export default new PaymentService(); 