import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import cloudinary from '../config/cloudinary.js';
import { uploadMultipleToCloudinary } from '../middleware/upload.cloudinary.js';
import axios from 'axios';

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
        where: { status: 'available', is_featured: true },
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
      console.log('[GET USER PROPERTIES] Request from user:', req.user?.id);

      const { id: userId } = req.user;

      if (!userId) {
        console.error('[GET USER PROPERTIES] No user ID found in request');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      console.log('[GET USER PROPERTIES] Pagination - page:', page, 'limit:', limit, 'skip:', skip);
      console.log('[GET USER PROPERTIES] Fetching properties for user:', userId);

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { user_id: userId },
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                photoUrl: true,
                isPrimary: true
              }
            },
            location: true,
            _count: { select: { favorited_by: true, bookings: true } }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),
        prisma.property.count({ where: { user_id: userId } })
      ]);

      console.log('[GET USER PROPERTIES] Found', total, 'total properties,', properties.length, 'on this page');

      const paginationMeta = PaginationHelper.getPaginationMeta(page, limit, total);

      res.json({
        success: true,
        data: properties,
        pagination: paginationMeta
      });
    } catch (error) {
      console.error('[GET USER PROPERTIES] Error:', error);
      console.error('[GET USER PROPERTIES] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching your properties',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      console.log('[CREATE PROPERTY] Request from user:', req.user?.id);
      console.log('[CREATE PROPERTY] Request body:', JSON.stringify(req.body, null, 2));

      const { id: userId, role } = req.user;
      const {
        title, description, property_type, purpose, price,
        bedrooms, bathrooms, sitting_area, kitchen, currency,
        locationId, location, address
      } = req.body;

      // Validation
      if (!title || !title.trim()) {
        console.error('[CREATE PROPERTY] Missing title');
        return res.status(400).json({
          success: false,
          message: 'Property title is required'
        });
      }

      if (!price || parseFloat(price) <= 0) {
        console.error('[CREATE PROPERTY] Invalid price:', price);
        return res.status(400).json({
          success: false,
          message: 'Valid property price is required'
        });
      }

      // Only verified brokers/landlords can create listings
      if (role !== 'admin') {
        console.log('[CREATE PROPERTY] Checking verification status for user:', userId);

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { is_verified: true, verification_status: true, role: true }
        });

        if (!user) {
          console.error('[CREATE PROPERTY] User not found:', userId);
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('[CREATE PROPERTY] User verification status:', user.verification_status);

        if (!user.is_verified && user.verification_status !== 'approved') {
          console.error('[CREATE PROPERTY] User not verified:', userId, user.verification_status, 'is_verified:', user.is_verified);
          return res.status(403).json({
            success: false,
            message: 'Your account must be verified by admin before you can create listings.',
            verification_status: user.verification_status
          });
        }
      }

      // Handle location creation or linking
      let finalLocationId = locationId || null;
      const locData = location || (typeof address === 'object' ? address : null);

      console.log('[CREATE PROPERTY] Location data:', { locationId, locData, address });

      if (!finalLocationId && locData) {
        console.log('[CREATE PROPERTY] Creating new location from locData');

        try {
          const createdLoc = await prisma.location.create({
            data: {
              country: locData.country || 'Ethiopia',
              region: locData.region || locData.state || null,
              city: locData.city || 'Addis Ababa',
              subCity: locData.subCity || locData.sub_city || null,
              address: locData.address || locData.street || (typeof address === 'string' ? address : 'Addis Ababa'),
              latitude: parseFloat(locData.latitude || locData.lat || 9.0054),
              longitude: parseFloat(locData.longitude || locData.lng || 38.7636)
            }
          });
          finalLocationId = createdLoc.id;
          console.log('[CREATE PROPERTY] Created location:', finalLocationId);
        } catch (locError) {
          console.error('[CREATE PROPERTY] Error creating location:', locError);
          throw new Error('Failed to create property location: ' + locError.message);
        }
      } else if (!finalLocationId && typeof address === 'string' && address.trim()) {
        console.log('[CREATE PROPERTY] Creating new location from address string');

        try {
          const createdLoc = await prisma.location.create({
            data: {
              country: 'Ethiopia',
              city: 'Addis Ababa',
              address: address.trim(),
              latitude: 9.0054,
              longitude: 38.7636
            }
          });
          finalLocationId = createdLoc.id;
          console.log('[CREATE PROPERTY] Created location:', finalLocationId);
        } catch (locError) {
          console.error('[CREATE PROPERTY] Error creating location:', locError);
          throw new Error('Failed to create property location: ' + locError.message);
        }
      }

      console.log('[CREATE PROPERTY] Creating property with locationId:', finalLocationId);

      const propertyData = {
        title: title.trim(),
        description: description?.trim() || '',
        property_type: property_type || 'apartment',
        purpose: purpose || 'rent',
        price: parseFloat(price) || 0,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: Math.round(parseFloat(bathrooms)) || 0,
        sitting_area: sitting_area ? parseInt(sitting_area) : 0,
        kitchen: kitchen === 'true' || kitchen === true,
        currency: currency || 'ETB',
        status: 'pending',        // Always pending until listing fee paid + admin approved
        listing_fee_paid: false,
        listing_tier: req.body.listing_tier || req.body.tier || 'standard',
        user_id: userId,
        locationId: finalLocationId
      };

      console.log('[CREATE PROPERTY] Property data:', propertyData);

      const property = await prisma.property.create({
        data: propertyData,
        include: { location: true, photos: true }
      });

      console.log('[CREATE PROPERTY] Property created successfully:', property.id);

      res.status(201).json({
        success: true,
        message: 'Property created. Please pay the listing fee to submit for review.',
        data: property
      });

    } catch (error) {
      console.error('[CREATE PROPERTY] Error:', error);
      console.error('[CREATE PROPERTY] Error stack:', error.stack);

      // Provide more specific error messages
      let errorMessage = 'An error occurred creating property';

      if (error.message) {
        errorMessage = error.message;
      }

      if (error.code === 'P2002') {
        errorMessage = 'A property with this information already exists';
      } else if (error.code === 'P2003') {
        errorMessage = 'Invalid location reference';
      } else if (error.code === 'P2025') {
        errorMessage = 'Related record not found';
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Initialize Chapa listing fee payment
   * @route POST /api/properties/:id/listing-fee
   * @body { tier: 'standard' | 'premium' }
   * Fees: Standard - ETB 50 (rent), ETB 100 (sale/lease)
   *       Premium - ETB 100 (rent), ETB 200 (sale/lease)
   */
  async initializeListingFeePayment(req, res) {
    try {
      const { id: propertyId } = req.params;
      const { tier = 'standard' } = req.body;
      const { id: userId, email, first_name, last_name, phone } = req.user;

      // Validate tier
      if (!['standard', 'premium'].includes(tier)) {
        return res.status(400).json({ success: false, message: 'Invalid tier. Must be "standard" or "premium".' });
      }

      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      if (property.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You do not own this property' });
      }
      if (property.listing_fee_paid) {
        return res.status(400).json({ success: false, message: 'Listing fee already paid for this property' });
      }

      // Determine fee based on purpose and tier
      const isRent = ['rent', 'short_term_rental', 'long_term_rental'].includes(property.purpose);
      const fees = {
        standard: isRent ? 50 : 100,
        premium: isRent ? 100 : 200
      };
      const amount = fees[tier] || (isRent ? 50 : 100);

      // Unique transaction reference - Chapa limit: max 50 characters
      const txRef = `un_${Date.now()}`;   // e.g. "un_1756590214123" = 17 chars ✓
      const chapaSecretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-f1spSv89Gl5KyQHfhVsr62XadDMMhouO';

      const rawPhone = phone || '0911234567';
      const cleanPhone = rawPhone.replace(/[^\d+]/g, '') || '0911234567';

      console.log('[INITIALIZE LISTING FEE] Calling Chapa for property:', propertyId, 'amount:', amount, 'tier:', tier, 'txRef:', txRef);

      // Call Chapa API using axios (more reliable than native fetch for SSL/network)
      let chapaData;
      let chapaStatus;
      try {
        const chapaRes = await axios.post(
          'https://api.chapa.co/v1/transaction/initialize',
          {
            amount: amount.toString(),
            currency: 'ETB',
            email: email && email.includes('@') ? email : `user_${cleanPhone}@urbannest.com`,
            first_name: (first_name || 'Owner').slice(0, 30),
            last_name: (last_name || 'User').slice(0, 30),
            phone_number: cleanPhone,
            tx_ref: txRef,
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success&property=${propertyId}&tx_ref=${txRef}`,
            customization: {
              title: 'UrbanNEST',           // 9 chars ✓ (Chapa limit: 16)
              description: tier === 'premium' ? 'Premium listing' : 'Standard listing'
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${chapaSecretKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000  // 15s timeout
          }
        );
        chapaData = chapaRes.data;
        chapaStatus = chapaRes.status;
      } catch (chapaErr) {
        // axios throws for non-2xx; extract the body if available
        chapaData = chapaErr.response?.data || {};
        chapaStatus = chapaErr.response?.status || 0;
        if (!chapaErr.response) {
          // Pure network error (ECONNREFUSED, fetch failed, timeout, etc.)
          throw new Error(`Cannot reach payment gateway: ${chapaErr.message}`);
        }
      }

      console.log('[INITIALIZE LISTING FEE] Chapa response status:', chapaStatus, 'data:', chapaData);

      if (chapaData?.status !== 'success') {
        console.error('[INITIALIZE LISTING FEE] Chapa initialization failed:', chapaData);

        let errorMsg = 'Payment gateway initialization failed.';
        if (typeof chapaData?.message === 'string') {
          errorMsg = chapaData.message;
        } else if (typeof chapaData?.message === 'object' && chapaData.message !== null) {
          errorMsg = Object.entries(chapaData.message)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else if (typeof chapaData?.data === 'object' && chapaData.data !== null) {
          errorMsg = Object.entries(chapaData.data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        }

        return res.status(400).json({
          success: false,
          message: errorMsg,
          error: chapaData
        });
      }

      // Record the pending payment in DB with tier
      try {
        await prisma.listingFeePayment.upsert({
          where: { chapaTransactionRef: txRef },
          create: {
            propertyId,
            userId,
            amount,
            tier,
            currency: 'ETB',
            chapaTransactionRef: txRef,
            chapaCheckoutUrl: chapaData.data?.checkout_url,
            status: 'PENDING'
          },
          update: {
            tier,
            chapaCheckoutUrl: chapaData.data?.checkout_url,
            status: 'PENDING'
          }
        });
      } catch (dbErr) {
        console.warn('[INITIALIZE LISTING FEE] Warning recording payment in DB:', dbErr.message);
      }

      res.json({
        success: true,
        message: 'Payment initialized',
        data: {
          checkout_url: chapaData.data?.checkout_url,
          tx_ref: txRef,
          amount,
          tier,
          currency: 'ETB',
          property_id: propertyId
        }
      });

    } catch (error) {
      console.error('[INITIALIZE LISTING FEE] Fatal Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initialize payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verify Chapa listing fee payment (webhook + manual verify)
   * @route POST /api/properties/:id/listing-fee/verify
   */
  async verifyListingFeePayment(req, res) {
    try {
      const { id: propertyId } = req.params;
      let { tx_ref } = req.body || {};

      if (!tx_ref && req.query?.tx_ref) {
        tx_ref = req.query.tx_ref;
      }

      // Find the payment record
      let paymentRecord = null;
      if (tx_ref) {
        paymentRecord = await prisma.listingFeePayment.findUnique({
          where: { chapaTransactionRef: tx_ref }
        });
      }

      // Fallback: look up pending payment for this property if tx_ref wasn't directly found
      if (!paymentRecord && propertyId) {
        paymentRecord = await prisma.listingFeePayment.findFirst({
          where: { propertyId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' }
        });
        if (paymentRecord) {
          tx_ref = paymentRecord.chapaTransactionRef;
        }
      }

      // If already verified previously (idempotency check)
      if (paymentRecord && paymentRecord.status === 'COMPLETED') {
        const prop = await prisma.property.findUnique({ where: { id: propertyId } });
        return res.json({
          success: true,
          message: 'Payment already verified successfully.',
          data: {
            property_id: propertyId,
            tx_ref: paymentRecord.chapaTransactionRef,
            tier: paymentRecord.tier,
            amount_paid: paymentRecord.amount,
            currency: 'ETB',
            paid_at: paymentRecord.paidAt,
            property_title: prop?.title,
            property_status: prop?.status,
            listing_expires_at: prop?.listing_expires_at,
            is_featured: prop?.is_featured
          }
        });
      }

      if (!paymentRecord) {
        // Check if property is already marked paid
        const existingProp = await prisma.property.findUnique({ where: { id: propertyId } });
        if (existingProp && existingProp.listing_fee_paid) {
          return res.json({
            success: true,
            message: 'Listing fee is already paid for this property.',
            data: {
              property_id: propertyId,
              property_title: existingProp.title,
              property_status: existingProp.status
            }
          });
        }
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      const chapaSecretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-f1spSv89Gl5KyQHfhVsr62XadDMMhouO';

      // Verify with Chapa using Axios
      let verifyData;
      let isSuccess = false;
      try {
        const verifyRes = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
          headers: {
            'Authorization': `Bearer ${chapaSecretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        verifyData = verifyRes.data;
        isSuccess = verifyRes.status === 200 && verifyData?.status === 'success' && verifyData?.data?.status === 'success';
      } catch (chapaErr) {
        console.error('[VERIFY LISTING FEE] Chapa verification API error:', chapaErr.response?.data || chapaErr.message);
        verifyData = chapaErr.response?.data || {};
        isSuccess = false;
      }

      if (!isSuccess) {
        // Update payment status to FAILED if verification failed
        await prisma.listingFeePayment.update({
          where: { id: paymentRecord.id },
          data: { status: 'FAILED' }
        }).catch(() => {});

        return res.status(400).json({
          success: false,
          message: verifyData?.message || 'Payment not confirmed by Chapa',
          chapa_status: verifyData?.data?.status || 'failed'
        });
      }

      // Calculate listing expiry based on tier
      const tier = paymentRecord.tier || 'standard';
      const listingDays = tier === 'premium' ? 60 : 30;
      const listingExpiresAt = new Date();
      listingExpiresAt.setDate(listingExpiresAt.getDate() + listingDays);

      // Update payment record and mark property fee as paid with tier benefits
      const [updatedPayment, updatedProperty] = await prisma.$transaction([
        prisma.listingFeePayment.update({
          where: { id: paymentRecord.id },
          data: { status: 'COMPLETED', paidAt: new Date() }
        }),
        prisma.property.update({
          where: { id: propertyId },
          data: {
            listing_fee_paid: true,
            listing_tier: tier,
            listing_expires_at: listingExpiresAt,
            is_featured: tier === 'premium', // Premium listings get featured badge
            status: 'pending', // Moves into admin review queue
          }
        })
      ]);

      res.json({
        success: true,
        message: `Payment verified! Your ${tier} listing has been submitted for admin review.`,
        data: {
          property_id: propertyId,
          tx_ref,
          tier,
          amount_paid: updatedPayment.amount,
          currency: 'ETB',
          paid_at: updatedPayment.paidAt,
          property_title: updatedProperty.title,
          property_status: updatedProperty.status,
          listing_expires_at: listingExpiresAt,
          is_featured: updatedProperty.is_featured
        }
      });

    } catch (error) {
      console.error('Verify listing fee error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify payment' });
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