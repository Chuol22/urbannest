// server/src/services/search.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SearchService {
  /**
   * Search properties with filters
   */
  async searchProperties(query, filters = {}) {
    const {
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
      purpose,
      city,
      status = 'available',
      limit = 20,
      offset = 0,
      sortBy = 'relevance'
    } = filters;
    
    // Build search conditions
    const where = {
      status,
      ...(propertyType && { property_type: propertyType }),
      ...(purpose && { purpose }),
      ...(bedrooms && { bedrooms: { gte: parseInt(bedrooms) } }),
      ...(bathrooms && { bathrooms: { gte: parseFloat(bathrooms) } }),
      ...(city && { location: { city: { contains: city, mode: 'insensitive' } } }),
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) })
      }
    };
    
    // Add text search if query provided
    if (query && query.length >= 2) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { city: { contains: query, mode: 'insensitive' } } },
        { location: { address: { contains: query, mode: 'insensitive' } } }
      ];
    }
    
    // Build sorting
    let orderBy = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { created_at: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      default:
        orderBy = { created_at: 'desc' };
    }
    
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
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
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy
      }),
      prisma.property.count({ where })
    ]);
    
    return {
      properties,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        hasMore: offset + limit < total
      }
    };
  }
  
  /**
   * Advanced search with geolocation
   */
  async advancedSearch(filters) {
    const {
      query,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
      purpose,
      amenities = [],
      latitude,
      longitude,
      radiusKm = 10,
      limit = 20,
      offset = 0
    } = filters;
    
    let where = `
      p.status = 'available'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (query && query.length >= 2) {
      where += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }
    
    if (minPrice) {
      where += ` AND p.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }
    
    if (maxPrice) {
      where += ` AND p.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }
    
    if (bedrooms) {
      where += ` AND p.bedrooms >= $${paramIndex}`;
      params.push(bedrooms);
      paramIndex++;
    }
    
    if (bathrooms) {
      where += ` AND p.bathrooms >= $${paramIndex}`;
      params.push(bathrooms);
      paramIndex++;
    }
    
    if (propertyType) {
      where += ` AND p.property_type = $${paramIndex}`;
      params.push(propertyType);
      paramIndex++;
    }
    
    if (purpose) {
      where += ` AND p.purpose = $${paramIndex}`;
      params.push(purpose);
      paramIndex++;
    }
    
    // Location-based search
    if (latitude && longitude) {
      where += `
        AND earth_box(ll_to_earth(l.latitude, l.longitude), ${radiusKm * 1000}) @> 
        ll_to_earth($${paramIndex}, $${paramIndex + 1})
      `;
      params.push(latitude, longitude);
      paramIndex += 2;
    }
    
    // Amenities filter
    if (amenities.length > 0) {
      const amenityPlaceholders = amenities.map((_, i) => `$${paramIndex + i}`).join(',');
      where += `
        AND EXISTS (
          SELECT 1 FROM property_amenities pa
          WHERE pa.property_id = p.id
          AND pa.amenity_id IN (${amenityPlaceholders})
          GROUP BY pa.property_id
          HAVING COUNT(DISTINCT pa.amenity_id) = ${amenities.length}
        )
      `;
      params.push(...amenities);
      paramIndex += amenities.length;
    }
    
    const sql = `
      SELECT 
        p.*,
        l.city,
        l.latitude,
        l.longitude,
        earth_distance(
          ll_to_earth(l.latitude, l.longitude),
          ll_to_earth($${paramIndex}, $${paramIndex + 1})
        ) as distance
      FROM properties p
      LEFT JOIN locations l ON p."locationId" = l.id
      WHERE ${where}
      ORDER BY distance ASC
      LIMIT $${paramIndex + 2}
      OFFSET $${paramIndex + 3}
    `;
    
    if (latitude && longitude) {
      params.push(latitude, longitude);
      paramIndex += 2;
    }
    params.push(limit, offset);
    
    const properties = await prisma.$queryRawUnsafe(sql, ...params);
    
    // Get total count
    const countSql = `
      SELECT COUNT(*)::int as total
      FROM properties p
      LEFT JOIN locations l ON p."locationId" = l.id
      WHERE ${where}
    `;
    
    const countResult = await prisma.$queryRawUnsafe(countSql, ...params.slice(0, -2));
    const total = countResult[0]?.total || 0;
    
    return {
      properties,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  }
  
  /**
   * Autocomplete suggestions
   */
  async autocomplete(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }
    
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT
        title as suggestion,
        'title' as type
      FROM properties
      WHERE 
        status = 'available'
        AND title ILIKE ${`%${query}%`}
      LIMIT ${limit}
      
      UNION
      
      SELECT DISTINCT
        city as suggestion,
        'city' as type
      FROM locations
      WHERE city ILIKE ${`%${query}%`}
      LIMIT ${limit}
      
      UNION
      
      SELECT DISTINCT
        property_type as suggestion,
        'type' as type
      FROM properties
      WHERE 
        status = 'available'
        AND property_type::text ILIKE ${`%${query}%`}
      LIMIT ${limit}
    `;
    
    return suggestions;
  }
  
  /**
   * Get search filters (available options)
   */
  async getFilterOptions() {
    const [propertyTypes, purposes, cities, priceRange, bedroomOptions] = await Promise.all([
      prisma.property.findMany({
        where: { status: 'available' },
        distinct: ['property_type'],
        select: { property_type: true }
      }),
      prisma.property.findMany({
        where: { status: 'available' },
        distinct: ['purpose'],
        select: { purpose: true }
      }),
      prisma.location.findMany({
        distinct: ['city'],
        select: { city: true },
        where: { properties: { some: { status: 'available' } } }
      }),
      prisma.property.aggregate({
        where: { status: 'available' },
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.property.findMany({
        where: { status: 'available' },
        distinct: ['bedrooms'],
        select: { bedrooms: true },
        orderBy: { bedrooms: 'asc' }
      })
    ]);
    
    return {
      propertyTypes: propertyTypes.map(p => p.property_type),
      purposes: purposes.map(p => p.purpose),
      cities: cities.map(c => c.city).filter(Boolean),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 1000000
      },
      bedrooms: bedroomOptions.map(b => b.bedrooms).filter(b => b > 0)
    };
  }
  
  /**
   * Track search for analytics
   */
  async trackSearch(userId, query, resultsCount, filters = {}) {
    // Store search analytics (you can create a SearchLog model)
    console.log(`Search tracked: user=${userId}, query="${query}", results=${resultsCount}`);
    
    // Optional: Create search log in database
    // await prisma.searchLog.create({
    //   data: { userId, query, resultsCount, filters: JSON.stringify(filters) }
    // });
    
    return true;
  }
  
  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 10) {
    // This would query aggregated search logs
    // For now, return default popular searches
    return [
      '2 bedroom apartment',
      'house for rent',
      'studio apartment',
      'furnished apartment',
      'villa for sale',
      'office space',
      'commercial property',
      'land for sale',
      'condo',
      'townhouse'
    ].slice(0, limit);
  }
}

export default new SearchService();