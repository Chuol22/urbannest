import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FavoriteController {
  /**
   * Add property to favorites
   * @route POST /api/favorites
   * @access Private
   */
  async addToFavorites(req, res) {
    try {
      const { id: userId } = req.user;
      const {
        propertyId,
        favoriteType = 'FAVORITE',
        notifyOnPriceChange = true,
        notifyOnStatusChange = true,
        notifyOnNewPhotos = true,
        tags = [],
        priority = 0
      } = req.body;

      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Check if already favorited
      const existingFavorite = await prisma.favoriteProperty.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId
          }
        }
      });

      if (existingFavorite) {
        return res.status(409).json({
          success: false,
          message: 'Property already in favorites'
        });
      }

      // Set expiration (3 months from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      // Create favorite
      const favorite = await prisma.favoriteProperty.create({
        data: {
          userId,
          propertyId,
          favoriteType,
          notifyOnPriceChange,
          notifyOnStatusChange,
          notifyOnNewPhotos,
          tags,
          priority,
          expiresAt
        },
        include: {
          property: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Property added to favorites',
        data: favorite
      });

    } catch (error) {
      console.error('Add to favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred adding to favorites',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get user's favorites
   * @route GET /api/favorites
   * @access Private
   */
  async getFavorites(req, res) {
    try {
      const { id: userId } = req.user;
      const {
        page = 1,
        limit = 12,
        favoriteType,
        tag,
        sort = 'newest',
        includeExpired = false
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = { userId };

      if (!includeExpired) {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ];
      }

      if (favoriteType) {
        where.favoriteType = favoriteType;
      }

      if (tag) {
        where.tags = { has: tag };
      }

      // Sorting
      let orderBy = {};
      switch (sort) {
        case 'newest':
          orderBy = { created_at: 'desc' };
          break;
        case 'oldest':
          orderBy = { created_at: 'asc' };
          break;
        case 'priority':
          orderBy = [{ priority: 'desc' }, { created_at: 'desc' }];
          break;
        default:
          orderBy = { created_at: 'desc' };
      }

      const [favorites, total] = await Promise.all([
        prisma.favoriteProperty.findMany({
          where,
          include: {
            property: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy
        }),
        prisma.favoriteProperty.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          favorites,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching favorites'
      });
    }
  }

  /**
   * Get favorite by ID
   * @route GET /api/favorites/:id
   * @access Private
   */
  async getFavoriteById(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id },
        include: {
          property: {
            include: {
              photos: {
                orderBy: { displayOrder: 'asc' }
              }
            }
          }
        }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      if (favorite.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this favorite'
        });
      }

      // Update view count
      await prisma.favoriteProperty.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: favorite
      });

    } catch (error) {
      console.error('Get favorite by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching favorite'
      });
    }
  }

  /**
   * Update favorite
   * @route PATCH /api/favorites/:id
   * @access Private
   */
  async updateFavorite(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const {
        favoriteType,
        notifyOnPriceChange,
        notifyOnStatusChange,
        notifyOnNewPhotos,
        tags,
        priority,
        expiresAt
      } = req.body;

      // Check if favorite exists and belongs to user
      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      if (favorite.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this favorite'
        });
      }

      // Update favorite
      const updatedFavorite = await prisma.favoriteProperty.update({
        where: { id },
        data: {
          favoriteType: favoriteType !== undefined ? favoriteType : undefined,
          notifyOnPriceChange: notifyOnPriceChange !== undefined ? notifyOnPriceChange : undefined,
          notifyOnStatusChange: notifyOnStatusChange !== undefined ? notifyOnStatusChange : undefined,
          notifyOnNewPhotos: notifyOnNewPhotos !== undefined ? notifyOnNewPhotos : undefined,
          tags: tags !== undefined ? tags : undefined,
          priority: priority !== undefined ? priority : undefined,
          expiresAt: expiresAt !== undefined ? new Date(expiresAt) : undefined,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Favorite updated successfully',
        data: updatedFavorite
      });

    } catch (error) {
      console.error('Update favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating favorite'
      });
    }
  }

  /**
   * Remove from favorites
   * @route DELETE /api/favorites/:id
   * @access Private
   */
  async removeFromFavorites(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      // Check if favorite exists and belongs to user
      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      if (favorite.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove this favorite'
        });
      }

      // Delete favorite
      await prisma.favoriteProperty.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Property removed from favorites'
      });

    } catch (error) {
      console.error('Remove from favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred removing from favorites'
      });
    }
  }

  /**
   * Bulk remove from favorites
   * @route POST /api/favorites/bulk-remove
   * @access Private
   */
  async bulkRemoveFavorites(req, res) {
    try {
      const { id: userId } = req.user;
      const { propertyIds } = req.body;

      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of property IDs'
        });
      }

      const result = await prisma.favoriteProperty.deleteMany({
        where: {
          userId,
          propertyId: { in: propertyIds }
        }
      });

      res.json({
        success: true,
        message: `${result.count} properties removed from favorites`,
        data: { count: result.count }
      });

    } catch (error) {
      console.error('Bulk remove favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred removing favorites'
      });
    }
  }

  /**
   * Check if property is favorited
   * @route GET /api/favorites/check/:propertyId
   * @access Private
   */
  async checkFavorite(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId } = req.user;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId
          }
        }
      });

      res.json({
        success: true,
        data: {
          isFavorited: !!favorite,
          favorite: favorite || null
        }
      });

    } catch (error) {
      console.error('Check favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred checking favorite status'
      });
    }
  }

  /**
   * Get favorites by type/category
   * @route GET /api/favorites/collections/:type
   * @access Private
   */
  async getFavoritesByType(req, res) {
    try {
      const { type } = req.params;
      const { id: userId } = req.user;
      const { page = 1, limit = 12 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [favorites, total] = await Promise.all([
        prisma.favoriteProperty.findMany({
          where: {
            userId,
            favoriteType: type.toUpperCase()
          },
          include: {
            property: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { priority: 'desc' }
        }),
        prisma.favoriteProperty.count({
          where: {
            userId,
            favoriteType: type.toUpperCase()
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          collection: type,
          favorites,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get favorites by type error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching favorites'
      });
    }
  }

  /**
   * Add tags to favorite
   * @route POST /api/favorites/:id/tags
   * @access Private
   */
  async addTags(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { tags } = req.body;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      if (favorite.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const mergedTags = [...new Set([...favorite.tags, ...tags])];

      const updated = await prisma.favoriteProperty.update({
        where: { id },
        data: { tags: mergedTags }
      });

      res.json({
        success: true,
        message: 'Tags added successfully',
        data: { tags: updated.tags }
      });

    } catch (error) {
      console.error('Add tags error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred adding tags'
      });
    }
  }

  /**
   * Remove tags from favorite
   * @route DELETE /api/favorites/:id/tags
   * @access Private
   */
  async removeTags(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { tags } = req.body;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      if (favorite.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const remainingTags = favorite.tags.filter(tag => !tags.includes(tag));

      const updated = await prisma.favoriteProperty.update({
        where: { id },
        data: { tags: remainingTags }
      });

      res.json({
        success: true,
        message: 'Tags removed successfully',
        data: { tags: updated.tags }
      });

    } catch (error) {
      console.error('Remove tags error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred removing tags'
      });
    }
  }

  /**
   * Update notification settings for a favorite
   * @route PATCH /api/favorites/:id/notifications
   * @access Private
   */
  async updateNotificationSettings(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { notifyOnPriceChange, notifyOnStatusChange, notifyOnNewPhotos } = req.body;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      if (favorite.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const updated = await prisma.favoriteProperty.update({
        where: { id },
        data: {
          notifyOnPriceChange: notifyOnPriceChange !== undefined ? notifyOnPriceChange : undefined,
          notifyOnStatusChange: notifyOnStatusChange !== undefined ? notifyOnStatusChange : undefined,
          notifyOnNewPhotos: notifyOnNewPhotos !== undefined ? notifyOnNewPhotos : undefined
        }
      });

      res.json({
        success: true,
        message: 'Notification settings updated',
        data: {
          notifyOnPriceChange: updated.notifyOnPriceChange,
          notifyOnStatusChange: updated.notifyOnStatusChange,
          notifyOnNewPhotos: updated.notifyOnNewPhotos
        }
      });

    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating notification settings'
      });
    }
  }

  /**
   * Get favorite statistics
   * @route GET /api/favorites/stats
   * @access Private
   */
  async getFavoriteStats(req, res) {
    try {
      const { id: userId } = req.user;

      const total = await prisma.favoriteProperty.count({ where: { userId } });

      const byType = await prisma.favoriteProperty.groupBy({
        by: ['favoriteType'],
        where: { userId },
        _count: true
      });

      const recentlyAdded = await prisma.favoriteProperty.count({
        where: {
          userId,
          created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      });

      res.json({
        success: true,
        data: {
          total,
          byType: byType.reduce((acc, curr) => {
            acc[curr.favoriteType.toLowerCase()] = curr._count;
            return acc;
          }, {}),
          recentlyAdded
        }
      });

    } catch (error) {
      console.error('Get favorite stats error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching favorite statistics'
      });
    }
  }

  /**
   * Get notification settings for favorites
   * @route GET /api/favorites/notifications/settings
   * @access Private
   */
  async getNotificationSettings(req, res) {
    try {
      const { id: userId } = req.user;

      const settings = await prisma.favoriteProperty.groupBy({
        by: ['notifyOnPriceChange', 'notifyOnStatusChange', 'notifyOnNewPhotos'],
        where: { userId },
        _count: true
      });

      res.json({
        success: true,
        data: {
          summary: settings,
          defaultSettings: {
            notifyOnPriceChange: true,
            notifyOnStatusChange: true,
            notifyOnNewPhotos: true
          }
        }
      });

    } catch (error) {
      console.error('Get notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching notification settings'
      });
    }
  }

  /**
   * Export favorites
   * @route GET /api/favorites/export
   * @access Private
   */
  async exportFavorites(req, res) {
    try {
      const { id: userId } = req.user;

      const favorites = await prisma.favoriteProperty.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        data: favorites
      });

    } catch (error) {
      console.error('Export favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred exporting favorites'
      });
    }
  }

  /**
   * Get collections
   * @route GET /api/favorites/collections
   * @access Private
   */
  async getCollections(req, res) {
    try {
      const { id: userId } = req.user;

      const collections = await prisma.favoriteProperty.groupBy({
        by: ['favoriteType'],
        where: { userId },
        _count: true
      });

      res.json({
        success: true,
        data: collections
      });

    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching collections'
      });
    }
  }

  /**
   * Get user tags
   * @route GET /api/favorites/tags
   * @access Private
   */
  async getUserTags(req, res) {
    try {
      const { id: userId } = req.user;

      const favorites = await prisma.favoriteProperty.findMany({
        where: { userId },
        select: { tags: true }
      });

      const tagCount = new Map();
      favorites.forEach(fav => {
        fav.tags.forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        });
      });

      const tags = Array.from(tagCount.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        data: tags
      });

    } catch (error) {
      console.error('Get user tags error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching tags'
      });
    }
  }

  /**
   * Search favorites
   * @route GET /api/favorites/search
   * @access Private
   */
  async searchFavorites(req, res) {
    try {
      const { id: userId } = req.user;
      const { q, page = 1, limit = 12 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const favorites = await prisma.favoriteProperty.findMany({
        where: {
          userId,
          OR: [
            { tags: { has: q } },
            { property: { title: { contains: q, mode: 'insensitive' } } }
          ]
        },
        include: {
          property: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        },
        skip,
        take: parseInt(limit)
      });

      res.json({
        success: true,
        data: favorites
      });

    } catch (error) {
      console.error('Search favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred searching favorites'
      });
    }
  }

  /**
   * Get property updates
   * @route GET /api/favorites/updates
   * @access Private
   */
  async getPropertyUpdates(req, res) {
    try {
      res.json({
        success: true,
        data: { updates: [] }
      });
    } catch (error) {
      console.error('Get property updates error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching updates'
      });
    }
  }

  /**
   * Update priority
   * @route PATCH /api/favorites/:id/priority
   * @access Private
   */
  async updatePriority(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { priority } = req.body;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite || favorite.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      const updated = await prisma.favoriteProperty.update({
        where: { id },
        data: { priority }
      });

      res.json({
        success: true,
        data: updated
      });

    } catch (error) {
      console.error('Update priority error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating priority'
      });
    }
  }

  /**
   * Extend expiration
   * @route POST /api/favorites/:id/extend
   * @access Private
   */
  async extendExpiration(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { months } = req.body;

      const favorite = await prisma.favoriteProperty.findUnique({
        where: { id }
      });

      if (!favorite || favorite.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found'
        });
      }

      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + months);

      const updated = await prisma.favoriteProperty.update({
        where: { id },
        data: { expiresAt: newExpiry }
      });

      res.json({
        success: true,
        data: updated
      });

    } catch (error) {
      console.error('Extend expiration error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred extending expiration'
      });
    }
  }

  /**
   * Bulk add favorites
   * @route POST /api/favorites/bulk/add
   * @access Private
   */
  async bulkAddFavorites(req, res) {
    try {
      const { id: userId } = req.user;
      const { propertyIds, favoriteType = 'FAVORITE' } = req.body;

      const results = [];
      for (const propertyId of propertyIds) {
        try {
          const existing = await prisma.favoriteProperty.findUnique({
            where: { userId_propertyId: { userId, propertyId } }
          });

          if (!existing) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 3);

            const favorite = await prisma.favoriteProperty.create({
              data: {
                userId,
                propertyId,
                favoriteType,
                expiresAt
              }
            });
            results.push(favorite);
          }
        } catch (err) {
          console.error(`Error adding property ${propertyId}:`, err);
        }
      }

      res.json({
        success: true,
        message: `${results.length} properties added to favorites`,
        data: results
      });

    } catch (error) {
      console.error('Bulk add favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred adding favorites'
      });
    }
  }

  /**
   * Bulk update type
   * @route PATCH /api/favorites/bulk/update-type
   * @access Private
   */
  async bulkUpdateType(req, res) {
    try {
      const { id: userId } = req.user;
      const { favoriteIds, favoriteType } = req.body;

      await prisma.favoriteProperty.updateMany({
        where: {
          id: { in: favoriteIds },
          userId
        },
        data: { favoriteType }
      });

      res.json({
        success: true,
        message: `${favoriteIds.length} favorites updated`
      });

    } catch (error) {
      console.error('Bulk update type error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating favorites'
      });
    }
  }

  /**
   * Bulk add tags
   * @route POST /api/favorites/bulk/add-tags
   * @access Private
   */
  async bulkAddTags(req, res) {
    try {
      const { id: userId } = req.user;
      const { favoriteIds, tags } = req.body;

      const favorites = await prisma.favoriteProperty.findMany({
        where: {
          id: { in: favoriteIds },
          userId
        }
      });

      for (const favorite of favorites) {
        const mergedTags = [...new Set([...favorite.tags, ...tags])];
        await prisma.favoriteProperty.update({
          where: { id: favorite.id },
          data: { tags: mergedTags }
        });
      }

      res.json({
        success: true,
        message: `Tags added to ${favorites.length} favorites`
      });

    } catch (error) {
      console.error('Bulk add tags error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred adding tags'
      });
    }
  }

  /**
   * Bulk remove tags
   * @route POST /api/favorites/bulk/remove-tags
   * @access Private
   */
  async bulkRemoveTags(req, res) {
    try {
      const { id: userId } = req.user;
      const { favoriteIds, tags } = req.body;

      const favorites = await prisma.favoriteProperty.findMany({
        where: {
          id: { in: favoriteIds },
          userId
        }
      });

      for (const favorite of favorites) {
        const remainingTags = favorite.tags.filter(tag => !tags.includes(tag));
        await prisma.favoriteProperty.update({
          where: { id: favorite.id },
          data: { tags: remainingTags }
        });
      }

      res.json({
        success: true,
        message: `Tags removed from ${favorites.length} favorites`
      });

    } catch (error) {
      console.error('Bulk remove tags error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred removing tags'
      });
    }
  }

  /**
   * Bulk update notifications
   * @route PATCH /api/favorites/bulk/update-notifications
   * @access Private
   */
  async bulkUpdateNotifications(req, res) {
    try {
      const { id: userId } = req.user;
      const { favoriteIds, notifyOnPriceChange, notifyOnStatusChange, notifyOnNewPhotos } = req.body;

      await prisma.favoriteProperty.updateMany({
        where: {
          id: { in: favoriteIds },
          userId
        },
        data: {
          notifyOnPriceChange: notifyOnPriceChange !== undefined ? notifyOnPriceChange : undefined,
          notifyOnStatusChange: notifyOnStatusChange !== undefined ? notifyOnStatusChange : undefined,
          notifyOnNewPhotos: notifyOnNewPhotos !== undefined ? notifyOnNewPhotos : undefined
        }
      });

      res.json({
        success: true,
        message: `${favoriteIds.length} favorites updated`
      });

    } catch (error) {
      console.error('Bulk update notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating notifications'
      });
    }
  }

  /**
   * Clean expired favorites
   * @route POST /api/favorites/clean-expired
   * @access Private (Admin only)
   */
  async cleanExpiredFavorites(req, res) {
    try {
      const result = await prisma.favoriteProperty.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      res.json({
        success: true,
        message: `Cleaned ${result.count} expired favorites`,
        data: { count: result.count }
      });

    } catch (error) {
      console.error('Clean expired favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred cleaning expired favorites'
      });
    }
  }

  /**
   * Get suggestions
   * @route GET /api/favorites/suggestions
   * @access Private
   */
  async getSuggestions(req, res) {
    try {
      const { id: userId } = req.user;
      const { limit = 10 } = req.query;

      const userFavorites = await prisma.favoriteProperty.findMany({
        where: { userId },
        include: { property: true },
        take: 5
      });

      const propertyTypes = [...new Set(userFavorites.map(f => f.property.property_type))];

      const suggestions = await prisma.property.findMany({
        where: {
          property_type: { in: propertyTypes },
          NOT: {
            id: { in: userFavorites.map(f => f.propertyId) }
          }
        },
        take: parseInt(limit)
      });

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching suggestions'
      });
    }
  }

  /**
   * Get most favorited
   * @route GET /api/favorites/most-favorited
   * @access Public
   */
  async getMostFavorited(req, res) {
    try {
      const { limit = 10 } = req.query;

      const mostFavorited = await prisma.property.findMany({
        where: {
          favorited_by: { some: {} }
        },
        include: {
          _count: {
            select: { favorited_by: true }
          },
          photos: {
            where: { isPrimary: true },
            take: 1
          }
        },
        orderBy: {
          favorited_by: { _count: 'desc' }
        },
        take: parseInt(limit)
      });

      res.json({
        success: true,
        data: mostFavorited
      });

    } catch (error) {
      console.error('Get most favorited error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching most favorited properties'
      });
    }
  }

  /**
   * Compare favorites
   * @route POST /api/favorites/compare
   * @access Private
   */
  async compareFavorites(req, res) {
    try {
      const { propertyIds } = req.body;

      const properties = await prisma.property.findMany({
        where: {
          id: { in: propertyIds }
        },
        include: {
          photos: {
            where: { isPrimary: true },
            take: 1
          },
          location: true,
          amenities: {
            include: { amenity: true }
          }
        }
      });

      res.json({
        success: true,
        data: properties
      });

    } catch (error) {
      console.error('Compare favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred comparing properties'
      });
    }
  }
}

export default new FavoriteController();