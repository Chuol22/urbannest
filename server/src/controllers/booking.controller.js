import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

class BookingController {
  /**
   * Create a new booking
   * @route POST /api/bookings
   * @access Private
   */
  async createBooking(req, res) {
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
        propertyId,
        checkIn,
        checkOut,
        guests,
        totalPrice,
        message,
        paymentMethod
      } = req.body;

      // Check if property exists and is available
      const property = await prisma.property.findUnique({
        where: { id: propertyId, status: 'available' }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or not available'
        });
      }

      // Check if property is owned by the user
      if (property.user_id === userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot book your own property'
        });
      }

      // Check for overlapping bookings
      const overlappingBookings = await prisma.booking.findFirst({
        where: {
          propertyId,
          status: { notIn: ['cancelled', 'rejected'] },
          OR: [
            {
              checkIn: { lte: new Date(checkOut) },
              checkOut: { gte: new Date(checkIn) }
            }
          ]
        }
      });

      if (overlappingBookings) {
        return res.status(409).json({
          success: false,
          message: 'Property is already booked for these dates'
        });
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          propertyId,
          seekerId: userId,
          hostId: property.user_id,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests: parseInt(guests),
          totalPrice: parseFloat(totalPrice),
          message,
          paymentMethod,
          status: 'pending',
          bookingReference: this.generateBookingReference()
        },
        include: {
          property: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1
              },
              location: true
            }
          }
        }
      });

      // Create notification for host
      await this.createNotification(
        property.user_id,
        'new_booking',
        `New booking request for ${property.title}`,
        { bookingId: booking.id }
      );

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred creating booking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get user's bookings
   * @route GET /api/bookings
   * @access Private
   */
  async getUserBookings(req, res) {
    try {
      const { id: userId, role } = req.user;
      const { page = 1, limit = 10, status, type = 'all' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Determine if user is seeker or host
      let where = {};
      if (type === 'as_host') {
        where.hostId = userId;
      } else if (type === 'as_seeker') {
        where.seekerId = userId;
      } else {
        where = {
          OR: [
            { seekerId: userId },
            { hostId: userId }
          ]
        };
      }

      if (status) {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            property: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1
                },
                location: true
              }
            },
            seeker: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true,
                email: true,
                phone: true
              }
            },
            host: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true,
                email: true,
                phone: true
              }
            },
            messages: {
              orderBy: { created_at: 'desc' },
              take: 1
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.booking.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching bookings'
      });
    }
  }

  /**
   * Get booking by ID
   * @route GET /api/bookings/:id
   * @access Private
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          property: {
            include: {
              photos: true,
              location: true,
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                  avatar_url: true
                }
              }
            }
          },
          seeker: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              avatar_url: true
            }
          },
          host: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              avatar_url: true
            }
          },
          messages: {
            orderBy: { created_at: 'asc' }
          },
          payment: true
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check authorization
      if (booking.seekerId !== userId && booking.hostId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this booking'
        });
      }

      res.json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Get booking by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching booking'
      });
    }
  }

  /**
   * Update booking status
   * @route PATCH /api/bookings/:id/status
   * @access Private
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const { status, reason } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          property: true
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check authorization
      const isHost = booking.hostId === userId;
      const isSeeker = booking.seekerId === userId;

      if (!isHost && !isSeeker && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this booking'
        });
      }

      // Validate status transitions
      const validTransitions = {
        pending: { host: ['confirmed', 'rejected'], seeker: ['cancelled'] },
        confirmed: { host: ['completed'], seeker: ['cancelled'] },
        completed: { host: [], seeker: [] },
        cancelled: { host: [], seeker: [] },
        rejected: { host: [], seeker: [] }
      };

      const allowedTransitions = validTransitions[booking.status];
      const userRole = isHost ? 'host' : 'seeker';

      if (!allowedTransitions || !allowedTransitions[userRole].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change booking from ${booking.status} to ${status} as ${userRole}`
        });
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status,
          ...(reason && { cancellationReason: reason }),
          ...(status === 'confirmed' && { confirmedAt: new Date() }),
          ...(status === 'completed' && { completedAt: new Date() }),
          ...(status === 'cancelled' && { cancelledAt: new Date() })
        }
      });

      // Create notification for the other party
      const notifyUserId = isHost ? booking.seekerId : booking.hostId;
      await this.createNotification(
        notifyUserId,
        `booking_${status}`,
        `Your booking request for ${booking.property.title} has been ${status}`,
        { bookingId: booking.id }
      );

      res.json({
        success: true,
        message: `Booking ${status} successfully`,
        data: updatedBooking
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating booking'
      });
    }
  }

  /**
   * Cancel booking
   * @route POST /api/bookings/:id/cancel
   * @access Private
   */
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const { reason } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          property: true,
          payment: true
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.seekerId !== userId && booking.hostId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this booking'
        });
      }

      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel booking with status: ${booking.status}`
        });
      }

      // Calculate cancellation fee if applicable
      const daysUntilCheckIn = Math.ceil((booking.checkIn - new Date()) / (1000 * 60 * 60 * 24));
      let refundAmount = booking.totalPrice;
      let cancellationFee = 0;

      if (daysUntilCheckIn < 7) {
        cancellationFee = booking.totalPrice * 0.5;
        refundAmount = booking.totalPrice - cancellationFee;
      } else if (daysUntilCheckIn < 14) {
        cancellationFee = booking.totalPrice * 0.25;
        refundAmount = booking.totalPrice - cancellationFee;
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          refundAmount: refundAmount,
          cancellationFee: cancellationFee
        }
      });

      // Create notification
      await this.createNotification(
        booking.hostId,
        'booking_cancelled',
        `Booking for ${booking.property.title} has been cancelled`,
        { bookingId: booking.id }
      );

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
          booking: updatedBooking,
          refundAmount,
          cancellationFee
        }
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred cancelling booking'
      });
    }
  }

  /**
   * Get booking statistics
   * @route GET /api/bookings/stats
   * @access Private
   */
  async getBookingStats(req, res) {
    try {
      const { id: userId } = req.user;

      const [total, byStatus, upcoming, completed] = await Promise.all([
        prisma.booking.count({ where: { seekerId: userId } }),
        prisma.booking.groupBy({
          by: ['status'],
          where: { seekerId: userId },
          _count: true
        }),
        prisma.booking.count({
          where: {
            seekerId: userId,
            checkIn: { gt: new Date() },
            status: 'confirmed'
          }
        }),
        prisma.booking.count({
          where: {
            seekerId: userId,
            status: 'completed'
          }
        })
      ]);

      const byHost = await prisma.booking.groupBy({
        by: ['status'],
        where: { hostId: userId },
        _count: true
      });

      res.json({
        success: true,
        data: {
          total,
          byStatus: byStatus.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          }, {}),
          upcoming,
          completed,
          asHost: {
            total: byHost.reduce((sum, curr) => sum + curr._count, 0),
            byStatus: byHost.reduce((acc, curr) => {
              acc[curr.status] = curr._count;
              return acc;
            }, {})
          }
        }
      });

    } catch (error) {
      console.error('Get booking stats error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching booking statistics'
      });
    }
  }

  /**
   * Get booking by reference
   * @route GET /api/bookings/reference/:reference
   * @access Private
   */
  async getBookingByReference(req, res) {
    try {
      const { reference } = req.params;
      const { id: userId, role } = req.user;

      const booking = await prisma.booking.findUnique({
        where: { bookingReference: reference }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.seekerId !== userId && booking.hostId !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this booking'
        });
      }

      res.json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Get booking by reference error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching booking'
      });
    }
  }

  /**
   * Get property bookings (for owner)
   * @route GET /api/bookings/property/:propertyId
   * @access Private
   */
  async getPropertyBookings(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId, role } = req.user;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      if (property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view bookings for this property'
        });
      }

      const where = { propertyId };
      if (status) where.status = status;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            seeker: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true,
                email: true,
                phone: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.booking.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get property bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching property bookings'
      });
    }
  }

  /**
   * Add message to booking
   * @route POST /api/bookings/:id/messages
   * @access Private
   */
  async addBookingMessage(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { message } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.seekerId !== userId && booking.hostId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to message on this booking'
        });
      }

      const bookingMessage = await prisma.bookingMessage.create({
        data: {
          bookingId: id,
          senderId: userId,
          message
        }
      });

      // Notify the other party
      const notifyUserId = booking.seekerId === userId ? booking.hostId : booking.seekerId;
      await this.createNotification(
        notifyUserId,
        'booking_message',
        `New message about your booking`,
        { bookingId: booking.id }
      );

      res.status(201).json({
        success: true,
        data: bookingMessage
      });

    } catch (error) {
      console.error('Add booking message error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred sending message'
      });
    }
  }

  /**
   * Get booking messages
   * @route GET /api/bookings/:id/messages
   * @access Private
   */
  async getBookingMessages(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const booking = await prisma.booking.findUnique({
        where: { id }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.seekerId !== userId && booking.hostId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view messages for this booking'
        });
      }

      const [messages, total] = await Promise.all([
        prisma.bookingMessage.findMany({
          where: { bookingId: id },
          include: {
            sender: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'asc' }
        }),
        prisma.bookingMessage.count({ where: { bookingId: id } })
      ]);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get booking messages error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching messages'
      });
    }
  }

  /**
   * Generate unique booking reference
   * @private
   */
  generateBookingReference() {
    const prefix = 'BK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create notification
   * @private
   */
  async createNotification(userId, type, message, metadata = {}) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          message,
          metadata: JSON.stringify(metadata),
          isRead: false
        }
      });
    } catch (error) {
      console.error('Create notification error:', error);
    }
  }
}

export default new BookingController();