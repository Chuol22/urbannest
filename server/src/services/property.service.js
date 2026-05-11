// server/src/services/property.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PropertyService {
  /**
   * Get all properties with filters
   */
  async getAllProperties(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      purpose,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      city,
      status = 'available',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;
    
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const where = {
      status: status === 'all' ? undefined : status,
      ...(type && { property_type: type }),
      ...(purpose && { purpose }),
      ...(city && { location: { city: { contains: city, mode: 'insensitive' } } }),
      ...(bedrooms && { bedrooms: { gte: parseInt(bedrooms) } }),
      ...(bathrooms && { bathrooms: { gte: parseFloat(bathrooms) } }),
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) })
      }
    };
    
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          photos: {
            where: { isPrimary: true },
            take: 1
          },
          location: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
              is_verified: true
            }
          },
          _count: {
            select: {
              favorited_by: true,
              bookings: { where: { status: 'COMPLETED' } }
            }
          }
        },
        skip,
        take,
        orderBy
      }),
      prisma.property.count({ where })
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
   * Get property by ID
   */
  async getPropertyById(id) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { displayOrder: 'asc' } },
        location: true,
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            avatar_url: true,
            is_verified: true,
            created_at: true
          }
        },
        amenities: { include: { amenity: true } },
        _count: {
          select: {
            favorited_by: true,
            reviews: { where: { status: 'PUBLISHED' } },
            bookings: { where: { status: 'COMPLETED' } }
          }
        }
      }
    });
    
    if (!property) {
      throw new Error('Property not found');
    }
    
    // Note: view_count tracking disabled due to database schema mismatch
    
    return property;
  }
  
  /**
   * Create property
   */
  async createProperty(userId, data) {
    const {
      title,
      description,
      property_type,
      purpose,
      price,
      bedrooms,
      bathrooms,
      sitting_area,
      kitchen,
      currency,
      address,
      city,
      country,
      latitude,
      longitude,
      amenities
    } = data;
    
    const property = await prisma.property.create({
      data: {
        title,
        description,
        property_type,
        purpose,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseFloat(bathrooms),
        sitting_area: parseInt(sitting_area),
        kitchen: kitchen === 'true' || kitchen === true,
        currency: currency || 'ETB',
        user_id: userId,
        location: {
          create: {
            address,
            city,
            country,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null
          }
        },
        amenities: amenities ? {
          create: amenities.split(',').map(amenityId => ({
            amenity: { connect: { id: amenityId } }
          }))
        } : undefined
      },
      include: {
        location: true,
        photos: true
      }
    });
    
    return property;
  }
  
  /**
   * Update property
   */
  async updateProperty(propertyId, userId, role, data) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      throw new Error('Property not found');
    }
    
    if (property.user_id !== userId && role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : undefined,
        bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : undefined,
        updated_at: new Date()
      },
      include: {
        location: true,
        photos: true
      }
    });
    
    return updated;
  }
  
  /**
   * Delete property (soft delete)
   */
  async deleteProperty(propertyId, userId, role) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      throw new Error('Property not found');
    }
    
    if (property.user_id !== userId && role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'off_market',
        deleted_at: new Date()
      }
    });
    
    return true;
  }
  
  /**
   * Get user properties
   */
  async getUserProperties(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { user_id: userId },
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          location: true,
          _count: { select: { favorited_by: true, bookings: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.property.count({ where: { user_id: userId } })
    ]);
    
    return {
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }
  
  /**
   * Get featured properties
   */
  async getFeaturedProperties(limit = 6) {
    return await prisma.property.findMany({
      where: {
        status: 'available',
        is_featured: true
      },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        location: true
      },
      take: parseInt(limit),
      orderBy: { created_at: 'desc' }
    });
  }
  
  /**
   * Get property statistics (admin)
   */
  async getStatistics() {
    const [total, byType, byPurpose, byStatus, priceStats] = await Promise.all([
      prisma.property.count(),
      prisma.property.groupBy({
        by: ['property_type'],
        _count: true
      }),
      prisma.property.groupBy({
        by: ['purpose'],
        _count: true
      }),
      prisma.property.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.property.aggregate({
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true }
      })
    ]);
    
    return { total, byType, byPurpose, byStatus, priceStats };
  }
}

export default new PropertyService();