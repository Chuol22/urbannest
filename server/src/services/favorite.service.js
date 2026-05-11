// server/src/services/favorite.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FavoriteService {
  /**
   * Add property to favorites
   */
  async addFavorite(userId, propertyId, favoriteType = 'FAVORITE') {
    // Check if already favorited
    const existing = await prisma.favoriteProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });
    
    if (existing) {
      throw new Error('Property already in favorites');
    }
    
    const favorite = await prisma.favoriteProperty.create({
      data: {
        userId,
        propertyId,
        favoriteType
      },
      include: {
        property: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            location: true
          }
        }
      }
    });
    
    return favorite;
  }
  
  /**
   * Remove property from favorites
   */
  async removeFavorite(userId, propertyId) {
    const favorite = await prisma.favoriteProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });
    
    if (!favorite) {
      throw new Error('Property not in favorites');
    }
    
    await prisma.favoriteProperty.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });
    
    return true;
  }
  
  /**
   * Get user favorites
   */
  async getUserFavorites(userId, page = 1, limit = 10, favoriteType = null) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = { userId };
    if (favoriteType) where.favoriteType = favoriteType;
    
    const [favorites, total] = await Promise.all([
      prisma.favoriteProperty.findMany({
        where,
        include: {
          property: {
            include: {
              photos: { where: { isPrimary: true }, take: 1 },
              location: true,
              user: {
                select: { id: true, first_name: true, last_name: true, avatar_url: true }
              },
              _count: {
                select: {
                  favorited_by: true,
                  bookings: { where: { status: 'COMPLETED' } }
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.favoriteProperty.count({ where })
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
  
  /**
   * Check if property is favorited
   */
  async isFavorited(userId, propertyId) {
    const favorite = await prisma.favoriteProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });
    
    return !!favorite;
  }
  
  /**
   * Update favorite type
   */
  async updateFavoriteType(userId, propertyId, favoriteType) {
    const favorite = await prisma.favoriteProperty.update({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      },
      data: { favoriteType }
    });
    
    return favorite;
  }
  
  /**
   * Bulk add favorites
   */
  async bulkAddFavorites(userId, propertyIds, favoriteType = 'FAVORITE') {
    const results = [];
    const errors = [];
    
    for (const propertyId of propertyIds) {
      try {
        const existing = await prisma.favoriteProperty.findUnique({
          where: { userId_propertyId: { userId, propertyId } }
        });
        
        if (!existing) {
          const favorite = await prisma.favoriteProperty.create({
            data: { userId, propertyId, favoriteType }
          });
          results.push(favorite);
        }
      } catch (error) {
        errors.push({ propertyId, error: error.message });
      }
    }
    
    return { results, errors };
  }
  
  /**
   * Get favorite statistics
   */
  async getStats(userId) {
    const stats = await prisma.favoriteProperty.groupBy({
      by: ['favoriteType'],
      where: { userId },
      _count: true
    });
    
    const result = {};
    stats.forEach(stat => {
      result[stat.favoriteType] = stat._count;
    });
    
    return result;
  }
}

export default new FavoriteService();