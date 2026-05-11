import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReviewController {
  /**
   * Create a new review
   * @route POST /api/reviews
   * @access Private
   */
  async createReview(req, res) {
    try {
      const { id: authorId } = req.user;
      const {
        type,
        rating,
        title,
        content,
        pros,
        cons,
        propertyId,
        ownerId,
        bookingId,
        transactionId,
        accuracyRating,
        communicationRating,
        cleanlinessRating,
        locationRating,
        valueRating,
        amenitiesRating,
        responsivenessRating,
        fairnessRating,
        maintenanceRating,
        paymentReliability,
        careOfProperty,
        noiseLevel
      } = req.body;

      // Validate review type and required fields
      if (type === 'PROPERTY' && !propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required for property reviews'
        });
      }

      if (type === 'OWNER' && !ownerId) {
        return res.status(400).json({
          success: false,
          message: 'Owner ID is required for owner reviews'
        });
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          type,
          status: 'PUBLISHED',
          rating: parseInt(rating),
          title,
          content,
          pros,
          cons,
          authorId,
          propertyId,
          ownerId,
          bookingId,
          transactionId,
          accuracyRating: accuracyRating ? parseInt(accuracyRating) : null,
          communicationRating: communicationRating ? parseInt(communicationRating) : null,
          cleanlinessRating: cleanlinessRating ? parseInt(cleanlinessRating) : null,
          locationRating: locationRating ? parseInt(locationRating) : null,
          valueRating: valueRating ? parseInt(valueRating) : null,
          amenitiesRating: amenitiesRating ? parseInt(amenitiesRating) : null,
          responsivenessRating: responsivenessRating ? parseInt(responsivenessRating) : null,
          fairnessRating: fairnessRating ? parseInt(fairnessRating) : null,
          maintenanceRating: maintenanceRating ? parseInt(maintenanceRating) : null,
          paymentReliability: paymentReliability ? parseInt(paymentReliability) : null,
          careOfProperty: careOfProperty ? parseInt(careOfProperty) : null,
          noiseLevel: noiseLevel ? parseInt(noiseLevel) : null
        }
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });

    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred creating review',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get reviews with filters
   * @route GET /api/reviews
   * @access Public
   */
  async getReviews(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        propertyId,
        ownerId,
        rating,
        sort = 'newest'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = { status: 'PUBLISHED' };
      if (type) where.type = type;
      if (propertyId) where.propertyId = propertyId;
      if (ownerId) where.ownerId = ownerId;
      if (rating) where.rating = parseInt(rating);

      // Sorting
      let orderBy = {};
      switch (sort) {
        case 'newest':
          orderBy = { created_at: 'desc' };
          break;
        case 'oldest':
          orderBy = { created_at: 'asc' };
          break;
        case 'highest':
          orderBy = { rating: 'desc' };
          break;
        case 'lowest':
          orderBy = { rating: 'asc' };
          break;
        default:
          orderBy = { created_at: 'desc' };
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true
              }
            },
            property: {
              select: {
                id: true,
                title: true
              }
            },
            owner: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy
        }),
        prisma.review.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching reviews'
      });
    }
  }

  /**
   * Get review by ID
   * @route GET /api/reviews/:id
   * @access Public
   */
  async getReviewById(req, res) {
    try {
      const { id } = req.params;

      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true
            }
          },
          property: {
            select: {
              id: true,
              title: true
            }
          },
          owner: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          responses: {
            include: {
              author: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar_url: true
                }
              }
            },
            orderBy: { created_at: 'asc' }
          }
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.json({
        success: true,
        data: review
      });

    } catch (error) {
      console.error('Get review by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching review'
      });
    }
  }

  /**
   * Update review
   * @route PUT /api/reviews/:id
   * @access Private
   */
  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const updateData = req.body;

      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      if (review.authorId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own reviews'
        });
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          ...updateData,
          rating: updateData.rating ? parseInt(updateData.rating) : undefined,
          accuracyRating: updateData.accuracyRating ? parseInt(updateData.accuracyRating) : undefined,
          communicationRating: updateData.communicationRating ? parseInt(updateData.communicationRating) : undefined,
          cleanlinessRating: updateData.cleanlinessRating ? parseInt(updateData.cleanlinessRating) : undefined,
          locationRating: updateData.locationRating ? parseInt(updateData.locationRating) : undefined,
          valueRating: updateData.valueRating ? parseInt(updateData.valueRating) : undefined,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });

    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating review'
      });
    }
  }

  /**
   * Delete review
   * @route DELETE /api/reviews/:id
   * @access Private
   */
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      if (review.authorId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this review'
        });
      }

      await prisma.review.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });

    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deleting review'
      });
    }
  }

  /**
   * Mark review as helpful
   * @route POST /api/reviews/:id/helpful
   * @access Private
   */
  async toggleHelpful(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { isHelpful = true } = req.body;

      const existing = await prisma.reviewHelpful.findUnique({
        where: {
          reviewId_userId: {
            reviewId: id,
            userId
          }
        }
      });

      let result;
      if (existing) {
        result = await prisma.reviewHelpful.update({
          where: {
            reviewId_userId: {
              reviewId: id,
              userId
            }
          },
          data: { isHelpful }
        });
      } else {
        result = await prisma.reviewHelpful.create({
          data: {
            reviewId: id,
            userId,
            isHelpful
          }
        });
      }

      const helpfulCount = await prisma.reviewHelpful.count({
        where: {
          reviewId: id,
          isHelpful: true
        }
      });

      res.json({
        success: true,
        data: {
          isHelpful: result.isHelpful,
          helpfulCount
        }
      });

    } catch (error) {
      console.error('Toggle helpful error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred'
      });
    }
  }

  /**
   * Add response to review
   * @route POST /api/reviews/:id/responses
   * @access Private
   */
  async addResponse(req, res) {
    try {
      const { id } = req.params;
      const { id: authorId } = req.user;
      const { content, isOfficial = false } = req.body;

      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      const response = await prisma.reviewResponse.create({
        data: {
          reviewId: id,
          authorId,
          content,
          isOfficial
        },
        include: {
          author: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Add response error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred adding response'
      });
    }
  }

  /**
   * Update response
   * @route PUT /api/reviews/:id/responses/:responseId
   * @access Private
   */
  async updateResponse(req, res) {
    try {
      const { id, responseId } = req.params;
      const { id: userId } = req.user;
      const { content } = req.body;

      const response = await prisma.reviewResponse.findFirst({
        where: {
          id: responseId,
          reviewId: id,
          authorId: userId
        }
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      const updated = await prisma.reviewResponse.update({
        where: { id: responseId },
        data: { content }
      });

      res.json({
        success: true,
        data: updated
      });

    } catch (error) {
      console.error('Update response error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating response'
      });
    }
  }

  /**
   * Delete response
   * @route DELETE /api/reviews/:id/responses/:responseId
   * @access Private
   */
  async deleteResponse(req, res) {
    try {
      const { id, responseId } = req.params;
      const { id: userId, role } = req.user;

      const response = await prisma.reviewResponse.findFirst({
        where: {
          id: responseId,
          reviewId: id
        }
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      if (response.authorId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this response'
        });
      }

      await prisma.reviewResponse.delete({
        where: { id: responseId }
      });

      res.json({
        success: true,
        message: 'Response deleted successfully'
      });

    } catch (error) {
      console.error('Delete response error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deleting response'
      });
    }
  }

  /**
   * Report a review
   * @route POST /api/reviews/:id/report
   * @access Private
   */
  async reportReview(req, res) {
    try {
      const { id } = req.params;
      const { id: reporterId } = req.user;
      const { reason, description } = req.body;

      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      const report = await prisma.reviewReport.create({
        data: {
          reviewId: id,
          reporterId,
          reason,
          description
        }
      });

      res.status(201).json({
        success: true,
        message: 'Review reported successfully',
        data: report
      });

    } catch (error) {
      console.error('Report review error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred reporting review'
      });
    }
  }

  // Placeholder methods for additional functionality
  async getReviewSummary(req, res) {
    res.json({ success: true, message: 'Summary endpoint' });
  }

  async getFeaturedReviews(req, res) {
    res.json({ success: true, message: 'Featured reviews endpoint' });
  }

  async getRecentReviews(req, res) {
    res.json({ success: true, message: 'Recent reviews endpoint' });
  }

  async getTopRated(req, res) {
    res.json({ success: true, message: 'Top rated endpoint' });
  }

  async getStatistics(req, res) {
    res.json({ success: true, message: 'Statistics endpoint' });
  }

  async getPendingReviews(req, res) {
    res.json({ success: true, message: 'Pending reviews endpoint' });
  }

  async getReportedReviews(req, res) {
    res.json({ success: true, message: 'Reported reviews endpoint' });
  }

  async moderateReview(req, res) {
    res.json({ success: true, message: 'Moderate review endpoint' });
  }

  async restoreReview(req, res) {
    res.json({ success: true, message: 'Restore review endpoint' });
  }

  async bulkDeleteReviews(req, res) {
    res.json({ success: true, message: 'Bulk delete endpoint' });
  }

  async bulkModerateReviews(req, res) {
    res.json({ success: true, message: 'Bulk moderate endpoint' });
  }

  async exportReviews(req, res) {
    res.json({ success: true, message: 'Export reviews endpoint' });
  }

  async sendInvitation(req, res) {
    res.json({ success: true, message: 'Send invitation endpoint' });
  }

  async getInvitation(req, res) {
    res.json({ success: true, message: 'Get invitation endpoint' });
  }

  async acceptInvitation(req, res) {
    res.json({ success: true, message: 'Accept invitation endpoint' });
  }

  async declineInvitation(req, res) {
    res.json({ success: true, message: 'Decline invitation endpoint' });
  }

  async addPhotos(req, res) {
    res.json({ success: true, message: 'Add photos endpoint' });
  }

  async removePhoto(req, res) {
    res.json({ success: true, message: 'Remove photo endpoint' });
  }

  async addVideo(req, res) {
    res.json({ success: true, message: 'Add video endpoint' });
  }

  async removeVideo(req, res) {
    res.json({ success: true, message: 'Remove video endpoint' });
  }
}

export default new ReviewController();