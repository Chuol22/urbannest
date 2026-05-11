// server/src/services/user.service.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

class UserService {
  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_verified: true,
        is_active: true,
        role: true,
        created_at: true,
        last_login: true,
        _count: {
          select: {
            properties: true,
            seeker_bookings: true,
            host_bookings: true,
            favorite_properties: true,
            written_reviews: true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const { first_name, last_name, phone, avatar_url } = data;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        phone,
        avatar_url,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        role: true,
        is_verified: true
      }
    });
    
    return user;
  }
  
  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    const [properties, bookingsAsSeeker, bookingsAsHost, favorites, reviews] = await Promise.all([
      prisma.property.count({ where: { user_id: userId } }),
      prisma.booking.count({ where: { seekerId: userId } }),
      prisma.booking.count({ where: { hostId: userId } }),
      prisma.favoriteProperty.count({ where: { userId } }),
      prisma.review.count({ where: { authorId: userId } })
    ]);
    
    // Note: view_count tracking disabled due to database schema mismatch
    const propertyViews = { _sum: { view_count: 0 } };
    
    // Get booking completion rate
    const completedBookings = await prisma.booking.count({
      where: { hostId: userId, status: 'COMPLETED' }
    });
    
    const totalBookings = await prisma.booking.count({
      where: { hostId: userId }
    });
    
    const completionRate = totalBookings > 0 
      ? (completedBookings / totalBookings) * 100 
      : 0;
    
    return {
      properties: {
        total: properties,
        total_views: propertyViews._sum.view_count || 0
      },
      bookings: {
        as_seeker: bookingsAsSeeker,
        as_host: bookingsAsHost,
        completion_rate: Math.round(completionRate)
      },
      favorites: favorites,
      reviews: reviews
    };
  }
  
  /**
   * Get all users (admin only)
   */
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = {};
    if (filters.role) where.role = filters.role;
    if (filters.is_active !== undefined) where.is_active = filters.is_active === 'true';
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          is_verified: true,
          is_active: true,
          role: true,
          created_at: true,
          last_login: true,
          _count: {
            select: {
              properties: true,
              seeker_bookings: true,
              host_bookings: true
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, role, adminId) {
    // Prevent changing own role
    if (userId === adminId) {
      throw new Error('Cannot change your own role');
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    return user;
  }
  
  /**
   * Activate/deactivate user (admin only)
   */
  async toggleUserStatus(userId, isActive, adminId) {
    // Prevent deactivating yourself
    if (userId === adminId) {
      throw new Error('Cannot deactivate your own account');
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: isActive
      },
      select: {
        id: true,
        email: true,
        is_active: true
      }
    });
    
    return user;
  }
  
  /**
   * Delete user (admin only - soft delete)
   */
  async deleteUser(userId, adminId) {
    if (userId === adminId) {
      throw new Error('Cannot delete your own account');
    }
    
    // Soft delete - deactivate and remove sensitive info
    await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: false,
        email: `deleted_${Date.now()}_${userId}`,
        phone: `deleted_${Date.now()}`
      }
    });
    
    return true;
  }
  
  /**
   * Upload/update avatar
   */
  async updateAvatar(userId, avatarUrl) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
      select: { id: true, avatar_url: true }
    });
    
    return user;
  }
  
  /**
   * Get user's properties with pagination
   */
  async getUserProperties(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { user_id: userId },
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          location: true,
          _count: {
            select: {
              favorited_by: true,
              bookings: { where: { status: 'COMPLETED' } }
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.property.count({ where: { user_id: userId } })
    ]);
    
    return {
      properties,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
  
  /**
   * Get user's bookings (as seeker)
   */
  async getUserBookings(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { seekerId: userId },
        include: {
          property: {
            include: {
              photos: { where: { isPrimary: true }, take: 1 },
              location: true
            }
          },
          host: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.booking.count({ where: { seekerId: userId } })
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
   * Get user's favorites
   */
  async getUserFavorites(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const [favorites, total] = await Promise.all([
      prisma.favoriteProperty.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              photos: { where: { isPrimary: true }, take: 1 },
              location: true,
              user: {
                select: { id: true, first_name: true, last_name: true, avatar_url: true }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.favoriteProperty.count({ where: { userId } })
    ]);
    
    return {
      favorites,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }
}

export default new UserService();