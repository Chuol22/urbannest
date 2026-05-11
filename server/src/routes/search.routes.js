import express from 'express';
const router = express.Router();
import searchService from '../services/search.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { prisma } from '../config/prisma.js';

// Public search endpoint
router.get('/properties', async (req, res) => {
  try {
    const { q, ...filters } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const results = await searchService.searchProperties(q, {
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : undefined,
      propertyType: filters.propertyType,
      limit: parseInt(filters.limit) || 20,
      offset: parseInt(filters.offset) || 0,
      sortBy: filters.sortBy
    });

    res.json({
      success: true,
      data: results.data,
      pagination: results.pagination,
      query: q
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = await searchService.autocomplete(q, parseInt(limit));
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Autocomplete failed'
    });
  }
});

// Advanced search
router.post('/advanced', async (req, res) => {
  try {
    const filters = req.body;
    const results = await searchService.advancedSearch(filters);
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Advanced search failed'
    });
  }
});

// Track search (for analytics - authenticated)
router.post('/track', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { query, resultsCount, filters } = req.body;
    
    // Log search for analytics
    await prisma.searchLog.create({
      data: {
        userId: req.user.id,
        query,
        resultsCount,
        filters: JSON.stringify(filters),
        ip: req.ip
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    // Don't fail if tracking fails
    res.json({ success: true });
  }
});

export default router;  