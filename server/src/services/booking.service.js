// server/src/services/booking.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class BookingService {
  /**
   * Create booking request
   */
  async createBooking(seekerId, data) {
    const {
      propertyId,
      hostId,
      visitType,
      requestedDate,
      requestedTime,
      durationMinutes,
      seekerPhone,
      seekerEmail,
      preferredContact
    } = data;
    
    // Check if property exists and is available
    const property = await prisma.property.findUnique({
      where: { id: propertyId, status: 'available' }
    });
    
    if (!property) {
      throw new Error('Property not available');
    }
    
    // Check for conflicting bookings
    const conflicting = await prisma.booking.findFirst({
      where: {
        propertyId,
        requestedDate: new Date(requestedDate),
        requestedTime,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });
    
    if (conflicting) {
      throw new Error('Time slot already booked');
    }
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const booking = await prisma.booking.create({
      data: {
        propertyId,
        seekerId,
        hostId,
        visitType,
        requestedDate: new Date(requestedDate),
        requestedTime,
        durationMinutes: durationMinutes || 30,
        seekerPhone,
        seekerEmail,
        preferredContact,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        property: {
          include: { location: true, photos: { where: { isPrimary: true }, take: 1 } }
        },
        seeker: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true }
        }
      }
    });
    
    return booking;
  }
  
  /**
   * Get booking by ID
   */
  async getBookingById(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: { location: true, photos: { where: { isPrimary: true }, take: 1 } }
        },
        seeker: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true, avatar_url: true }
        },
        host: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true, avatar_url: true }
        },
        messages: { orderBy: { createdAt: 'asc' } },
        feedback: true
      }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking;
  }
  
  /**
   * Update booking status
   */
  async updateStatus(bookingId, userId, role, status) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Check authorization
    const isHost = booking.hostId === userId;
    const isSeeker = booking.seekerId === userId;
    
    if (!isHost && !isSeeker && role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    // Validate status transition
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      REJECTED: []
    };
    
    if (!validTransitions[booking.status].includes(status)) {
      throw new Error(`Cannot transition from ${booking.status} to ${status}`);
    }
    
    const updateData = { status };
    
    if (status === 'CONFIRMED') {
      updateData.confirmedDate = new Date();
      updateData.confirmedTime = new Date().toTimeString();
    }
    
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        property: true,
        seeker: { select: { first_name: true, last_name: true, email: true } },
        host: { select: { first_name: true, last_name: true, email: true } }
      }
    });
    
    return updated;
  }
  
  /**
   * Check-in user
   */
  async checkIn(bookingId, userId, role) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.hostId !== userId && role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    if (booking.status !== 'CONFIRMED') {
      throw new Error('Booking must be confirmed to check in');
    }
    
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        status: 'COMPLETED'
      }
    });
    
    return updated;
  }
  
  /**
   * Get user bookings (as seeker)
   */
  async getSeekerBookings(seekerId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = { seekerId };
    if (status) where.status = status;
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            include: { location: true, photos: { where: { isPrimary: true }, take: 1 } }
          },
          host: { select: { id: true, first_name: true, last_name: true, avatar_url: true } }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);
    
    return {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Get host bookings (as property owner)
   */
  async getHostBookings(hostId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = { hostId };
    if (status) where.status = status;
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            include: { location: true, photos: { where: { isPrimary: true }, take: 1 } }
          },
          seeker: { select: { id: true, first_name: true, last_name: true, email: true, phone: true, avatar_url: true } }
        },
        skip,
        take,
        orderBy: { requestedDate: 'asc' }
      }),
      prisma.booking.count({ where })
    ]);
    
    return {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Submit feedback for booking
   */
  async submitFeedback(bookingId, userId, feedbackData) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.seekerId !== userId) {
      throw new Error('Only the seeker can submit feedback');
    }
    
    if (booking.status !== 'COMPLETED') {
      throw new Error('Cannot submit feedback for incomplete booking');
    }
    
    const feedback = await prisma.bookingFeedback.upsert({
      where: { bookingId },
      update: feedbackData,
      create: {
        bookingId,
        ...feedbackData
      }
    });
    
    return feedback;
  }
  
  /**
   * Add message to booking
   */
  async addMessage(bookingId, senderId, message) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.seekerId !== senderId && booking.hostId !== senderId) {
      throw new Error('Unauthorized');
    }
    
    const bookingMessage = await prisma.bookingMessage.create({
      data: {
        bookingId,
        senderId,
        message
      },
      include: {
        sender: {
          select: { id: true, first_name: true, last_name: true, avatar_url: true }
        }
      }
    });
    
    return bookingMessage;
  }
  
  /**
   * Get booking messages
   */
  async getMessages(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.seekerId !== userId && booking.hostId !== userId) {
      throw new Error('Unauthorized');
    }
    
    return await prisma.bookingMessage.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: { id: true, first_name: true, last_name: true, avatar_url: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

export default new BookingService();