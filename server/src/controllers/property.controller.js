import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import cloudinary from '../config/cloudinary.js';
import { uploadMultipleToCloudinary } from '../middleware/upload.cloudinary.js';

const prisma = new PrismaClient();

// ==================== Pagination Helper Class ====================

class PaginationHelper {
  static getPaginationMeta(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
      startIndex: (page - 1) * limit + 1,
      endIndex: Math.min(page * limit, total)
    };
  }

  static getPaginationLinks(baseUrl, page, limit, totalPages, queryParams = {}) {
    const links = {
      self: `${baseUrl}?page=${page}&limit=${limit}${this.buildQueryString(queryParams)}`,
      first: `${baseUrl}?page=1&limit=${limit}${this.buildQueryString(queryParams)}`,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}${this.buildQueryString(queryParams)}`
    };
    
    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}${this.buildQueryString(queryParams)}`;
    }
    
    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}&limit=${limit}${this.buildQueryString(queryParams)}`;
    }
    
    return links;
  }

  static buildQueryString(params) {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    return query ? `&${query}` : '';
  }
}

// ==================== Property Controller ====================

class PropertyController {
  /**
   * Get all properties with advanced pagination & filters
   */
  async getProperties(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const skip = (page - 1) * limit;
      
      const cursor = req.query.cursor;
      const useCursorPagination = req.query.useCursor === 'true';
      
      const {
        q, type, purpose, status = 'available',
        minPrice, maxPrice, bedrooms, bathrooms,
        city, region, latitude, longitude, radius = 10,
        sortBy = 'created_at', sortOrder = 'desc',
        includeInactive = false, userId
      } = req.query;
      
      const where = {};
      
      if (!includeInactive) {
        where.status = status === 'all' ? { not: 'off_market' } : status;
      } else if (status !== 'all') {
        where.status = status;
      }
      
      if (userId) where.user_id = userId;
      
      if (q && q.length >= 2) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { city: { contains: q, mode: 'insensitive' } } }
        ];
      }
      
      if (type) where.property_type = type;
      if (purpose) where.purpose = purpose;
      
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }
      
      if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
      if (bathrooms) where.bathrooms = { gte: parseFloat(bathrooms) };
      if (city) where.location = { city: { contains: city, mode: 'insensitive' } };
      
      let orderBy = {};
      switch (sortBy) {
        case 'price':
          orderBy = { price: sortOrder === 'asc' ? 'asc' : 'desc' };
          break;
        case 'bedrooms':
          orderBy = { bedrooms: sortOrder === 'asc' ? 'asc' : 'desc' };
          break;
        case 'popularity':
          orderBy = { favorited_by: { _count: sortOrder === 'asc' ? 'asc' : 'desc' } };
          break;
        default:
          orderBy = { created_at: sortOrder === 'asc' ? 'asc' : 'desc' };
      }
      
      let properties = [];
      let total = 0;
      
      if (latitude && longitude) {
        const results = await prisma.$queryRaw`
          SELECT 
            p.id, p.title, p.description, p.property_type, p.purpose, 
            p.price, p.bedrooms, p.bathrooms, p.sitting_area, p.kitchen,
            p.currency, p.status, p.user_id, p.is_featured, p.deleted_at,
            p.created_at, p.updated_at,
            l.city, l.region, l.latitude, l.longitude,
            earth_distance(
              ll_to_earth(l.latitude, l.longitude),
              ll_to_earth(${parseFloat(latitude)}, ${parseFloat(longitude)})
            ) as distance
          FROM properties p
          JOIN locations l ON p."locationId" = l.id
          WHERE p.status = ${status}
            AND earth_distance(
              ll_to_earth(l.latitude, l.longitude),
              ll_to_earth(${parseFloat(latitude)}, ${parseFloat(longitude)})
            ) <= ${parseFloat(radius) * 1000}
          ORDER BY distance ASC
          LIMIT ${limit}
          OFFSET ${skip}
        `;
        properties = results;
        
        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*)::int as total
          FROM properties p
          JOIN locations l ON p."locationId" = l.id
          WHERE p.status = ${status}
            AND earth_distance(
              ll_to_earth(l.latitude, l.longitude),
              ll_to_earth(${parseFloat(latitude)}, ${parseFloat(longitude)})
            ) <= ${parseFloat(radius) * 1000}
        `;
        total = countResult[0]?.total || 0;
      } else {
        const queryOptions = {
          where,
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
              orderBy: { displayOrder: 'asc' }
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
          orderBy
        };
        
        if (useCursorPagination && cursor) {
          queryOptions.cursor = { id: cursor };
          queryOptions.skip = 1;
        } else {
          queryOptions.skip = skip;
          queryOptions.take = limit;
        }
        
        if (!useCursorPagination) queryOptions.take = limit;
        
        [properties, total] = await Promise.all([
          prisma.property.findMany(queryOptions),
          prisma.property.count({ where })
        ]);
      }
      
      const enrichedProperties = properties.map(property => ({
        ...property,
        isNew: (new Date() - new Date(property.created_at)) < 7 * 24 * 60 * 60 * 1000,
        displayPrice: this.formatPrice(property.price, property.currency),
        mainPhoto: property.photos?.[0]?.photo_url || property.photos?.[0]?.thumbnailUrl || '/images/default-property.jpg',
        distance: property.distance ? `${(property.distance / 1000).toFixed(1)}km` : null
      }));
      
      const paginationMeta = PaginationHelper.getPaginationMeta(page, limit, total);
      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const links = PaginationHelper.getPaginationLinks(baseUrl, page, limit, paginationMeta.totalPages, req.query);
      
      res.json({
        success: true,
        data: enrichedProperties,
        pagination: paginationMeta,
        links,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching properties',
        error: env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get featured properties
   */
  async getFeaturedProperties(req, res) {
    try {
      const properties = await prisma.property.findMany({
        where: { status: 'available', isFeatured: true },
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          location: true
        },
        take: 6,
        orderBy: { created_at: 'desc' }
      });
      
      res.json({
        success: true,
        data: properties
      });
    } catch (error) {
      console.error('Get featured properties error:', error);
      res.status(500).json({ success: false, message: 'An error occurred fetching featured properties' });
    }
  }

  /**
   * Search properties
   */
  async searchProperties(req, res) {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
      }
      
      const properties = await prisma.property.findMany({
        where: {
          status: 'available',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { location: { city: { contains: q, mode: 'insensitive' } } },
            { location: { address: { contains: q, mode: 'insensitive' } } }
          ]
        },
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          location: true
        },
        take: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: properties,
        count: properties.length
      });
    } catch (error) {
      console.error('Search properties error:', error);
      res.status(500).json({ success: false, message: 'An error occurred searching properties' });
    }
  }

  /**
   * Get property by ID with paginated reviews
   */
  async getPropertyById(req, res) {
    try {
      const { id } = req.params;
      const reviewPage = Math.max(1, parseInt(req.query.reviewPage) || 1);
      const reviewLimit = Math.min(20, parseInt(req.query.reviewLimit) || 5);
      const reviewSkip = (reviewPage - 1) * reviewLimit;
      
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          photos: { orderBy: { displayOrder: 'asc' } },
          location: true,
          user: {
            select: {
              id: true, first_name: true, last_name: true, email: true,
              phone: true, avatar_url: true, is_verified: true, created_at: true,
              properties: { where: { status: 'available' }, select: { id: true, title: true } }
            }
          },
          amenities: { include: { amenity: true } },
          _count: { select: { favorited_by: true, bookings: { where: { status: 'COMPLETED' } } } }
        }
      });
      
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      // Add responsive Cloudinary URLs if photos have publicId
      const photosWithResponsive = property.photos.map(photo => ({
        ...photo,
        responsive: photo.publicId ? {
          srcset: cloudinary.getResponsiveSrcSet(photo.publicId),
          thumbnail: cloudinary.getOptimizedUrl(photo.publicId, { width: 100, height: 100, crop: 'thumb' }),
          small: cloudinary.getOptimizedUrl(photo.publicId, { width: 300, height: 200, crop: 'fill' }),
          medium: cloudinary.getOptimizedUrl(photo.publicId, { width: 600, height: 400, crop: 'limit' }),
          large: cloudinary.getOptimizedUrl(photo.publicId, { width: 1200, height: 800, crop: 'limit' }),
          webp: cloudinary.getOptimizedUrl(photo.publicId, { format: 'webp' })
        } : null
      }));
      
      const [reviews, totalReviews, ratingStats, ratingDistribution] = await Promise.all([
        prisma.review.findMany({
          where: { propertyId: id, status: 'PUBLISHED' },
          include: {
            author: { select: { id: true, first_name: true, last_name: true, avatar_url: true, created_at: true } },
            helpful: { where: { isHelpful: true }, select: { userId: true } }
          },
          orderBy: { created_at: 'desc' },
          skip: reviewSkip,
          take: reviewLimit
        }),
        prisma.review.count({ where: { propertyId: id, status: 'PUBLISHED' } }),
        prisma.review.aggregate({
          where: { propertyId: id, status: 'PUBLISHED' },
          _avg: { rating: true, accuracyRating: true, communicationRating: true, cleanlinessRating: true, locationRating: true, valueRating: true },
          _count: true,
          _min: { rating: true },
          _max: { rating: true }
        }),
        prisma.review.groupBy({
          by: ['rating'],
          where: { propertyId: id, status: 'PUBLISHED' },
          _count: true
        })
      ]);
      
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingDistribution.forEach(item => { distribution[item.rating] = item._count; });
      
      const similarProperties = await prisma.property.findMany({
        where: {
          id: { not: id },
          status: 'available',
          property_type: property.property_type,
          location: { city: property.location?.city },
          price: { gte: property.price * 0.7, lte: property.price * 1.3 }
        },
        include: { photos: { where: { isPrimary: true }, take: 1 }, location: true },
        take: 6,
        orderBy: { created_at: 'desc' }
      });
      
      res.json({
        success: true,
        data: {
          ...property,
          photos: photosWithResponsive,
          stats: {
            favorite_count: property._count.favorited_by,
            booking_count: property._count.bookings,
            review_count: ratingStats._count
          },
          rating: {
            average: ratingStats._avg.rating || 0,
            count: ratingStats._count,
            distribution,
            breakdown: {
              accuracy: ratingStats._avg.accuracyRating,
              communication: ratingStats._avg.communicationRating,
              cleanliness: ratingStats._avg.cleanlinessRating,
              location: ratingStats._avg.locationRating,
              value: ratingStats._avg.valueRating
            }
          },
          reviews: {
            data: reviews.map(review => ({ ...review, helpful_count: review.helpful.length })),
            pagination: PaginationHelper.getPaginationMeta(reviewPage, reviewLimit, totalReviews)
          },
          similar_properties: similarProperties,
          ...(property.purpose === 'rent' && { availability: await this.getPropertyAvailability(id) })
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get property by ID error:', error);
      res.status(500).json({ success: false, message: 'An error occurred fetching property' });
    }
  }

  /**
   * Get user's properties
   */
  async getUserProperties(req, res) {
    try {
      const { id: userId } = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { user_id: userId },
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            location: true,
            _count: { select: { favorited_by: true, bookings: true } }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),
        prisma.property.count({ where: { user_id: userId } })
      ]);
      
      const paginationMeta = PaginationHelper.getPaginationMeta(page, limit, total);
      
      res.json({
        success: true,
        data: properties,
        pagination: paginationMeta
      });
    } catch (error) {
      console.error('Get user properties error:', error);
      res.status(500).json({ success: false, message: 'An error occurred fetching your properties' });
    }
  }

  /**
   * Upload property photos with Cloudinary CDN
   */
  async uploadPropertyPhotos(req, res) {
    try {
      const { id: propertyId } = req.params;
      const { id: userId, role } = req.user;
      
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { photos: true }
      });
      
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      if (property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You don\'t own this property' });
      }
      
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }
      
      // Upload to Cloudinary directly from memory buffer
      const uploadResults = await uploadMultipleToCloudinary(files, 'properties');
      
      const savedPhotos = [];
      for (let i = 0; i < uploadResults.length; i++) {
        const result = uploadResults[i];
        const isPrimary = property.photos.length === 0 && i === 0;
        
        const photo = await prisma.propertyPhoto.create({
          data: {
            propertyId: propertyId,
            photoUrl: result.secure_url,
            publicId: result.public_id,
            isPrimary: isPrimary,
            displayOrder: property.photos.length + i,
            caption: req.body.captions?.[i] || '',
            fileSize: result.bytes,
            mimeType: `image/${result.format}`,
            uploadedById: userId
          }
        });
        
        savedPhotos.push(photo);
      }
      
      res.status(201).json({
        success: true,
        message: `${savedPhotos.length} photos uploaded successfully`,
        data: savedPhotos
      });
      
    } catch (error) {
      console.error('Upload photos error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload photos',
        error: env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get property photos with Cloudinary responsive URLs
   */
  async getPropertyPhotos(req, res) {
    try {
      const { id: propertyId } = req.params;
      
      const photos = await prisma.propertyPhoto.findMany({
        where: { propertyId },
        orderBy: { displayOrder: 'asc' }
      });
      
      const photosWithResponsive = photos.map(photo => {
        if (!photo.publicId) {
          return photo;
        }
        
        return {
          ...photo,
          responsive: {
            srcset: cloudinary.getResponsiveSrcSet(photo.publicId),
            sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
            thumbnail: cloudinary.getOptimizedUrl(photo.publicId, { width: 100, height: 100, crop: 'thumb' }),
            small: cloudinary.getOptimizedUrl(photo.publicId, { width: 300, height: 200, crop: 'fill' }),
            medium: cloudinary.getOptimizedUrl(photo.publicId, { width: 600, height: 400, crop: 'limit' }),
            large: cloudinary.getOptimizedUrl(photo.publicId, { width: 1200, height: 800, crop: 'limit' }),
            webp: cloudinary.getOptimizedUrl(photo.publicId, { format: 'webp' })
          }
        };
      });
      
      res.json({
        success: true,
        data: photosWithResponsive
      });
      
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch photos' });
    }
  }

  /**
   * Delete property photo from Cloudinary and database
   */
  async deletePropertyPhoto(req, res) {
    try {
      const { propertyId, photoId } = req.params;
      const { id: userId, role } = req.user;
      
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      if (property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      const photo = await prisma.propertyPhoto.findUnique({ where: { id: photoId } });
      if (!photo) {
        return res.status(404).json({ success: false, message: 'Photo not found' });
      }
      
      // Delete from Cloudinary
      if (photo.publicId) {
        await cloudinary.deleteImage(photo.publicId);
      }
      
      // Delete from database
      await prisma.propertyPhoto.delete({ where: { id: photoId } });
      
      // Reorder remaining photos
      const remainingPhotos = await prisma.propertyPhoto.findMany({
        where: { propertyId },
        orderBy: { displayOrder: 'asc' }
      });
      
      for (let i = 0; i < remainingPhotos.length; i++) {
        await prisma.propertyPhoto.update({
          where: { id: remainingPhotos[i].id },
          data: { displayOrder: i }
        });
      }
      
      // If deleted photo was primary, set new primary
      if (photo.isPrimary && remainingPhotos.length > 0) {
        await prisma.propertyPhoto.update({
          where: { id: remainingPhotos[0].id },
          data: { isPrimary: true }
        });
      }
      
      res.json({ success: true, message: 'Photo deleted successfully' });
      
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete photo' });
    }
  }

  /**
   * Set primary photo
   */
  async setPrimaryPhoto(req, res) {
    try {
      const { propertyId, photoId } = req.params;
      const { id: userId, role } = req.user;
      
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      if (property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      await prisma.propertyPhoto.updateMany({
        where: { propertyId },
        data: { isPrimary: false }
      });
      
      await prisma.propertyPhoto.update({
        where: { id: photoId },
        data: { isPrimary: true }
      });
      
      res.json({ success: true, message: 'Primary photo updated' });
      
    } catch (error) {
      console.error('Set primary photo error:', error);
      res.status(500).json({ success: false, message: 'Failed to update primary photo' });
    }
  }

  /**
   * Get property availability (for rentals)
   */
  async getPropertyAvailability(propertyId) {
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        requestedDate: { gte: new Date() }
      },
      select: { requestedDate: true, status: true },
      orderBy: { requestedDate: 'asc' },
      take: 90
    });
    
    return bookings.map(booking => ({
      date: booking.requestedDate,
      status: booking.status === 'CONFIRMED' ? 'booked' : 'pending'
    }));
  }

  /**
   * Format price with currency
   */
  formatPrice(price, currency = 'ETB') {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(price);
  }

  /**
   * Create property listing
   */
  async createProperty(req, res) {
    try {
      const { id: userId } = req.user;
      const {
        title, description, property_type, purpose, price,
        bedrooms, bathrooms, sitting_area, kitchen, currency,
        locationId
      } = req.body;
      
      const property = await prisma.property.create({
        data: {
          title,
          description,
          property_type,
          purpose,
          price: parseFloat(price),
          bedrooms: parseInt(bedrooms),
          bathrooms: parseFloat(bathrooms),
          sitting_area: sitting_area ? parseInt(sitting_area) : 0,
          kitchen: kitchen === 'true' || kitchen === true,
          currency: currency || 'ETB',
          status: 'available',
          user_id: userId,
          locationId
        },
        include: { location: true, photos: true }
      });
      
      res.status(201).json({ success: true, message: 'Property created successfully', data: property });
      
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({ success: false, message: 'An error occurred creating property' });
    }
  }

  /**
   * Update property
   */
  async updateProperty(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const updateData = req.body;
      
      const property = await prisma.property.findUnique({ where: { id } });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      if (property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      const updatedProperty = await prisma.property.update({
        where: { id },
        data: {
          ...updateData,
          price: updateData.price ? parseFloat(updateData.price) : undefined,
          bedrooms: updateData.bedrooms ? parseInt(updateData.bedrooms) : undefined,
          bathrooms: updateData.bathrooms ? parseFloat(updateData.bathrooms) : undefined,
          updated_at: new Date()
        },
        include: { location: true, photos: true }
      });
      
      res.json({ success: true, message: 'Property updated successfully', data: updatedProperty });
      
    } catch (error) {
      console.error('Update property error:', error);
      res.status(500).json({ success: false, message: 'An error occurred updating property' });
    }
  }

  /**
   * Delete property (soft delete)
   */
  async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      
      const property = await prisma.property.findUnique({ where: { id } });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      if (property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      await prisma.property.update({
        where: { id },
        data: { status: 'off_market', deleted_at: new Date() }
      });
      
      res.json({ success: true, message: 'Property deleted successfully' });
      
    } catch (error) {
      console.error('Delete property error:', error);
      res.status(500).json({ success: false, message: 'An error occurred deleting property' });
    }
  }
}

export default new PropertyController();