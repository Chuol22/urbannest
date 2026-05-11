// server/src/services/review.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReviewService {
  /**
   * Create review
   */
  async createReview(authorId, data) {
    const {
      type,
      rating,
      title,
      content,
      pros,
      cons,
      propertyId,
      ownerId,
      customerId,
      bookingId,
      accuracyRating,
      communicationRating,
      cleanlinessRating,
      locationRating,
      valueRating
    } = data;
    
    // Check if user already reviewed this entity
    let uniqueWhere = {};
    if (propertyId) {
      uniqueWhere = { authorId_propertyId: { authorId, propertyId } };
    } else if (ownerId) {
      uniqueWhere = { authorId_ownerId: { authorId, ownerId } };
    } else if (customerId) {
      uniqueWhere = { authorId_customerId: { authorId, customerId } };
    }
    
    const existing = await prisma.review.findUnique({
      where: uniqueWhere
    });
    
    if (existing) {
      throw new Error('You have already reviewed this');
    }
    
    const reviewNumber = `REV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const review = await prisma.review.create({
      data: {
        reviewNumber,
        type,
        rating: parseInt(rating),
        title,
        content,
        pros,
        cons,
        authorId,
        propertyId,
        ownerId,
        customerId,
        bookingId,
        accuracyRating: accuracyRating ? parseInt(accuracyRating) : null,
        communicationRating: communicationRating ? parseInt(communicationRating) : null,
        cleanlinessRating: cleanlinessRating ? parseInt(cleanlinessRating) : null,
        locationRating: locationRating ? parseInt(locationRating) : null,
        valueRating: valueRating ? parseInt(valueRating) : null,
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, first_name: true, last_name: true, avatar_url: true }
        }
      }
    });
    
    // Update review summary
    await this.updateReviewSummary(propertyId, ownerId, customerId);
    
    return review;
  }
  
  /**
   * Get reviews for property
   */
  async getPropertyReviews(propertyId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = {
      propertyId,
      status: 'PUBLISHED'
    };
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true, created_at: true }
          },
          helpful: {
            where: { isHelpful: true },
            select: { userId: true }
          },
          photos: true,
          responses: {
            include: {
              author: {
                select: { id: true, first_name: true, last_name: true, role: true }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where })
    ]);
    
    // Calculate rating summary
    const summary = await prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: true
    });
    
    return {
      reviews: reviews.map(review => ({
        ...review,
        helpful_count: review.helpful.length,
        is_helpful: false
      })),
      summary: {
        average: summary._avg.rating || 0,
        total: summary._count
      },
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Get reviews for owner
   */
  async getOwnerReviews(ownerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = {
      ownerId,
      status: 'PUBLISHED'
    };
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true }
          },
          helpful: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where })
    ]);
    
    const summary = await prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: true
    });
    
    return {
      reviews,
      summary: {
        average: summary._avg.rating || 0,
        total: summary._count
      },
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId, userId) {
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId
        }
      }
    });
    
    if (existing) {
      throw new Error('Already marked as helpful');
    }
    
    const helpful = await prisma.reviewHelpful.create({
      data: {
        reviewId,
        userId,
        isHelpful: true
      }
    });
    
    return helpful;
  }
  
  /**
   * Report review
   */
  async reportReview(reviewId, reporterId, reason, description = null) {
    const existing = await prisma.reviewReport.findUnique({
      where: {
        reviewId_reporterId: {
          reviewId,
          reporterId
        }
      }
    });
    
    if (existing) {
      throw new Error('Already reported this review');
    }
    
    const report = await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason,
        description,
        status: 'PENDING'
      }
    });
    
    return report;
  }
  
  /**
   * Update review summary (aggregate stats)
   */
  async updateReviewSummary(propertyId = null, ownerId = null, customerId = null) {
    if (propertyId) {
      const stats = await prisma.review.aggregate({
        where: {
          propertyId,
          status: 'PUBLISHED'
        },
        _avg: {
          rating: true,
          accuracyRating: true,
          communicationRating: true,
          cleanlinessRating: true,
          locationRating: true,
          valueRating: true
        },
        _count: true
      });
      
      const distribution = await prisma.review.groupBy({
        by: ['rating'],
        where: {
          propertyId,
          status: 'PUBLISHED'
        },
        _count: true
      });
      
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(d => { counts[d.rating] = d._count; });
      
      await prisma.reviewSummary.upsert({
        where: { propertyId },
        update: {
          totalReviews: stats._count,
          averageRating: stats._avg.rating || 0,
          fiveStarCount: counts[5],
          fourStarCount: counts[4],
          threeStarCount: counts[3],
          twoStarCount: counts[2],
          oneStarCount: counts[1],
          avgAccuracy: stats._avg.accuracyRating,
          avgCommunication: stats._avg.communicationRating,
          avgCleanliness: stats._avg.cleanlinessRating,
          avgLocation: stats._avg.locationRating,
          avgValue: stats._avg.valueRating,
          lastReviewAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          propertyId,
          totalReviews: stats._count,
          averageRating: stats._avg.rating || 0,
          fiveStarCount: counts[5],
          fourStarCount: counts[4],
          threeStarCount: counts[3],
          twoStarCount: counts[2],
          oneStarCount: counts[1],
          avgAccuracy: stats._avg.accuracyRating,
          avgCommunication: stats._avg.communicationRating,
          avgCleanliness: stats._avg.cleanlinessRating,
          avgLocation: stats._avg.locationRating,
          avgValue: stats._avg.valueRating,
          lastReviewAt: new Date()
        }
      });
    }
    
    if (ownerId) {
      const stats = await prisma.review.aggregate({
        where: { ownerId, status: 'PUBLISHED' },
        _avg: { rating: true },
        _count: true
      });
      
      await prisma.reviewSummary.upsert({
        where: { ownerId },
        update: {
          totalReviews: stats._count,
          averageRating: stats._avg.rating || 0,
          updatedAt: new Date()
        },
        create: {
          ownerId,
          totalReviews: stats._count,
          averageRating: stats._avg.rating || 0
        }
      });
    }
  }
  
  /**
   * Delete review (admin only)
   */
  async deleteReview(reviewId, adminId) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'REMOVED',
        archivedAt: new Date()
      }
    });
    
    // Update summary
    await this.updateReviewSummary(review.propertyId, review.ownerId, review.customerId);
    
    return true;
  }
  
  /**
   * Add response to review (owner/host response)
   */
  async addResponse(reviewId, authorId, content, isOfficial = false) {
    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        authorId,
        content,
        isOfficial,
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: { id: true, first_name: true, last_name: true, role: true }
        }
      }
    });
    
    return response;
  }
}

export default new ReviewService();