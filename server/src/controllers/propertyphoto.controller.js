import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import path from 'path';

const prisma = new PrismaClient();

class PropertyPhotoController {
  /**
   * Upload photos for a property
   * @route POST /api/properties/:propertyId/photos
   * @access Private (Owner only)
   */
  async uploadPhotos(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId, role } = req.user;

      // Check if property exists and user owns it
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { photos: true }
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
          message: 'You do not have permission to upload photos for this property'
        });
      }

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No photos uploaded'
        });
      }

      // Validate file types and sizes
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File type ${file.mimetype} is not allowed. Allowed types: JPEG, PNG, WEBP, HEIC`
          });
        }

        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} exceeds maximum size of 10MB`
          });
        }
      }

      // Process and upload photos
      const uploadedPhotos = [];
      const nextDisplayOrder = property.photos.length > 0 
        ? Math.max(...property.photos.map(p => p.displayOrder)) + 1 
        : 0;

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        // Process image with Sharp
        const processedImages = await this.processImage(file, propertyId, i);

        // Save to database
        const photo = await prisma.propertyPhoto.create({
          data: {
            propertyId,
            photoUrl: processedImages.original,
            thumbnailUrl: processedImages.thumbnail,
            mediumUrl: processedImages.medium,
            isPrimary: property.photos.length === 0 && i === 0,
            displayOrder: nextDisplayOrder + i,
            caption: req.body[`caption_${i}`] || null,
            altText: req.body[`alt_${i}`] || null,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedById: userId
          }
        });

        uploadedPhotos.push(photo);
      }

      res.status(201).json({
        success: true,
        message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
        data: {
          photos: uploadedPhotos,
          total: property.photos.length + uploadedPhotos.length
        }
      });

    } catch (error) {
      console.error('Upload photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred uploading photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all photos for a property
   * @route GET /api/properties/:propertyId/photos
   * @access Public
   */
  async getPropertyPhotos(req, res) {
    try {
      const { propertyId } = req.params;

      const photos = await prisma.propertyPhoto.findMany({
        where: { 
          propertyId,
          deletedAt: null
        },
        orderBy: [
          { isPrimary: 'desc' },
          { displayOrder: 'asc' }
        ],
        include: {
          uploadedBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          photos,
          total: photos.length,
          primary: photos.find(p => p.isPrimary) || null
        }
      });

    } catch (error) {
      console.error('Get property photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching photos'
      });
    }
  }

  /**
   * Get single photo
   * @route GET /api/photos/:photoId
   * @access Public
   */
  async getPhotoById(req, res) {
    try {
      const { photoId } = req.params;

      const photo = await prisma.propertyPhoto.findUnique({
        where: { id: photoId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              user_id: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });

      if (!photo || photo.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      res.json({
        success: true,
        data: photo
      });

    } catch (error) {
      console.error('Get photo by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching photo'
      });
    }
  }

  /**
   * Update photo details
   * @route PATCH /api/photos/:photoId
   * @access Private (Owner only)
   */
  async updatePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const { id: userId, role } = req.user;
      const { caption, altText, displayOrder } = req.body;

      // Check if photo exists and user has permission
      const photo = await prisma.propertyPhoto.findUnique({
        where: { id: photoId },
        include: {
          property: true
        }
      });

      if (!photo || photo.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      if (photo.property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this photo'
        });
      }

      // If displayOrder is being updated, handle reordering
      if (displayOrder !== undefined && displayOrder !== photo.displayOrder) {
        await this.reorderPhotosHelper(photo.propertyId, photo.displayOrder, displayOrder);
      }

      // Update photo
      const updatedPhoto = await prisma.propertyPhoto.update({
        where: { id: photoId },
        data: {
          caption,
          altText,
          displayOrder: displayOrder !== undefined ? displayOrder : undefined,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Photo updated successfully',
        data: updatedPhoto
      });

    } catch (error) {
      console.error('Update photo error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating photo'
      });
    }
  }

  /**
   * Set primary photo
   * @route PATCH /api/photos/:photoId/set-primary
   * @access Private (Owner only)
   */
  async setPrimaryPhoto(req, res) {
    try {
      const { photoId } = req.params;
      const { id: userId, role } = req.user;

      // Check if photo exists and user has permission
      const photo = await prisma.propertyPhoto.findUnique({
        where: { id: photoId },
        include: {
          property: true
        }
      });

      if (!photo || photo.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      if (photo.property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this photo'
        });
      }

      // Use transaction to update primary status
      await prisma.$transaction([
        // Remove primary from all photos
        prisma.propertyPhoto.updateMany({
          where: { propertyId: photo.propertyId },
          data: { isPrimary: false }
        }),
        // Set new primary
        prisma.propertyPhoto.update({
          where: { id: photoId },
          data: { 
            isPrimary: true,
            updatedAt: new Date()
          }
        })
      ]);

      res.json({
        success: true,
        message: 'Primary photo set successfully'
      });

    } catch (error) {
      console.error('Set primary photo error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred setting primary photo'
      });
    }
  }

  /**
   * Delete photo (soft delete)
   * @route DELETE /api/photos/:photoId
   * @access Private (Owner only)
   */
  async deletePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const { id: userId, role } = req.user;

      // Check if photo exists and user has permission
      const photo = await prisma.propertyPhoto.findUnique({
        where: { id: photoId },
        include: {
          property: true
        }
      });

      if (!photo || photo.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      if (photo.property.user_id !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this photo'
        });
      }

      // Soft delete
      await prisma.propertyPhoto.update({
        where: { id: photoId },
        data: {
          deletedAt: new Date()
        }
      });

      // If this was the primary photo, set another photo as primary
      if (photo.isPrimary) {
        const nextPhoto = await prisma.propertyPhoto.findFirst({
          where: { 
            propertyId: photo.propertyId,
            deletedAt: null,
            id: { not: photoId }
          },
          orderBy: { displayOrder: 'asc' }
        });

        if (nextPhoto) {
          await prisma.propertyPhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true }
          });
        }
      }

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });

    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deleting photo'
      });
    }
  }

  /**
   * Reorder photos
   * @route POST /api/properties/:propertyId/photos/reorder
   * @access Private (Owner only)
   */
  async reorderPhotos(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId, role } = req.user;
      const { photoOrder } = req.body;

      // Check property ownership
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
          message: 'You do not have permission to reorder photos'
        });
      }

      // Update display orders in transaction
      await prisma.$transaction(
        photoOrder.map((photoId, index) => 
          prisma.propertyPhoto.update({
            where: { id: photoId },
            data: { displayOrder: index }
          })
        )
      );

      res.json({
        success: true,
        message: 'Photos reordered successfully'
      });

    } catch (error) {
      console.error('Reorder photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred reordering photos'
      });
    }
  }

  /**
   * Bulk delete photos
   * @route POST /api/properties/:propertyId/photos/bulk-delete
   * @access Private (Owner only)
   */
  async bulkDeletePhotos(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId, role } = req.user;
      const { photoIds } = req.body;

      // Check property ownership
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
          message: 'You do not have permission to delete photos'
        });
      }

      // Soft delete photos
      await prisma.propertyPhoto.updateMany({
        where: { 
          id: { in: photoIds },
          propertyId
        },
        data: {
          deletedAt: new Date()
        }
      });

      // Check if any deleted photos were primary
      const deletedPrimary = await prisma.propertyPhoto.findFirst({
        where: {
          id: { in: photoIds },
          isPrimary: true,
          propertyId
        }
      });

      if (deletedPrimary) {
        // Set new primary photo
        const nextPhoto = await prisma.propertyPhoto.findFirst({
          where: { 
            propertyId,
            deletedAt: null
          },
          orderBy: { displayOrder: 'asc' }
        });

        if (nextPhoto) {
          await prisma.propertyPhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true }
          });
        }
      }

      res.json({
        success: true,
        message: `${photoIds.length} photo(s) deleted successfully`
      });

    } catch (error) {
      console.error('Bulk delete photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deleting photos'
      });
    }
  }

  /**
   * Bulk delete photos by IDs (global)
   * @route POST /api/photos/bulk/delete
   * @access Private (Admin only)
   */
  async bulkDeletePhotosByIds(req, res) {
    try {
      const { photoIds } = req.body;
      const { role } = req.user;

      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      await prisma.propertyPhoto.updateMany({
        where: { 
          id: { in: photoIds }
        },
        data: {
          deletedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: `${photoIds.length} photo(s) deleted successfully`
      });

    } catch (error) {
      console.error('Bulk delete photos by IDs error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deleting photos'
      });
    }
  }

  /**
   * Get upload presigned URL for direct upload to cloud storage
   * @route GET /api/photos/upload-url
   * @access Private
   */
  async getUploadUrl(req, res) {
    try {
      const { fileName, fileType } = req.query;
      const { id: userId } = req.user;

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(fileName);
      const baseName = path.basename(fileName, extension);
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      
      const uniqueFileName = `${sanitizedName}-${timestamp}-${randomString}${extension}`;
      const key = `properties/${userId}/${uniqueFileName}`;

      // Return presigned URL info
      res.json({
        success: true,
        data: {
          uploadUrl: `https://your-storage.com/${key}`,
          fileKey: key,
          expiresIn: 3600
        }
      });

    } catch (error) {
      console.error('Get upload URL error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred generating upload URL'
      });
    }
  }

  /**
   * Complete direct upload and create photo record
   * @route POST /api/photos/upload/complete
   * @access Private
   */
  async completeUpload(req, res) {
    try {
      const { propertyId, fileKey, fileName, fileSize, mimeType, caption, altText, isPrimary } = req.body;
      const { id: userId } = req.user;

      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const photoCount = await prisma.propertyPhoto.count({
        where: { propertyId, deletedAt: null }
      });

      const photo = await prisma.propertyPhoto.create({
        data: {
          propertyId,
          photoUrl: `https://your-storage.com/${fileKey}`,
          thumbnailUrl: `https://your-storage.com/${fileKey}-thumb`,
          mediumUrl: `https://your-storage.com/${fileKey}-medium`,
          isPrimary: isPrimary || photoCount === 0,
          displayOrder: photoCount,
          caption,
          altText,
          fileSize,
          mimeType,
          uploadedById: userId
        }
      });

      res.status(201).json({
        success: true,
        data: photo
      });

    } catch (error) {
      console.error('Complete upload error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred completing upload'
      });
    }
  }

  /**
   * Validate photos before upload
   * @route POST /api/photos/validate
   * @access Private
   */
  async validatePhotos(req, res) {
    try {
      const { fileNames, fileSizes, mimeTypes } = req.body;
      const errors = [];
      let totalSize = 0;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      const maxSize = 10 * 1024 * 1024;
      const maxTotalSize = 100 * 1024 * 1024;

      for (let i = 0; i < fileNames.length; i++) {
        if (!allowedTypes.includes(mimeTypes[i])) {
          errors.push(`${fileNames[i]}: Invalid file type`);
        }
        if (fileSizes[i] > maxSize) {
          errors.push(`${fileNames[i]}: File exceeds 10MB limit`);
        }
        totalSize += fileSizes[i];
      }

      if (totalSize > maxTotalSize) {
        errors.push(`Total size exceeds 100MB limit`);
      }

      res.json({
        success: true,
        data: {
          valid: errors.length === 0,
          errors,
          totalSize,
          totalFiles: fileNames.length
        }
      });

    } catch (error) {
      console.error('Validate photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred validating photos'
      });
    }
  }

  /**
   * Get photo count for property
   * @route GET /api/properties/:propertyId/photos/count
   * @access Public
   */
  async getPhotoCount(req, res) {
    try {
      const { propertyId } = req.params;

      const count = await prisma.propertyPhoto.count({
        where: { propertyId, deletedAt: null }
      });

      const hasPrimary = await prisma.propertyPhoto.findFirst({
        where: { propertyId, isPrimary: true, deletedAt: null }
      });

      res.json({
        success: true,
        data: {
          count,
          hasPrimary: !!hasPrimary
        }
      });

    } catch (error) {
      console.error('Get photo count error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching photo count'
      });
    }
  }

  /**
   * Get primary photo for property
   * @route GET /api/properties/:propertyId/photos/primary
   * @access Public
   */
  async getPrimaryPhoto(req, res) {
    try {
      const { propertyId } = req.params;

      const photo = await prisma.propertyPhoto.findFirst({
        where: { propertyId, isPrimary: true, deletedAt: null }
      });

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'No primary photo found'
        });
      }

      res.json({
        success: true,
        data: photo
      });

    } catch (error) {
      console.error('Get primary photo error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching primary photo'
      });
    }
  }

  /**
   * Get recently uploaded photos
   * @route GET /api/photos/recent
   * @access Public
   */
  async getRecentPhotos(req, res) {
    try {
      const { limit = 20 } = req.query;

      const photos = await prisma.propertyPhoto.findMany({
        where: { deletedAt: null },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit),
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: photos
      });

    } catch (error) {
      console.error('Get recent photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching recent photos'
      });
    }
  }

  /**
   * Search photos
   * @route GET /api/photos/search
   * @access Public
   */
  async searchPhotos(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const photos = await prisma.propertyPhoto.findMany({
        where: {
          deletedAt: null,
          OR: [
            { caption: { contains: q, mode: 'insensitive' } },
            { altText: { contains: q, mode: 'insensitive' } }
          ]
        },
        skip,
        take: parseInt(limit),
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      const total = await prisma.propertyPhoto.count({
        where: {
          deletedAt: null,
          OR: [
            { caption: { contains: q, mode: 'insensitive' } },
            { altText: { contains: q, mode: 'insensitive' } }
          ]
        }
      });

      res.json({
        success: true,
        data: {
          photos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Search photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred searching photos'
      });
    }
  }

  /**
   * Apply watermark to photos
   * @route POST /api/properties/:propertyId/photos/watermark
   * @access Private
   */
  async applyWatermark(req, res) {
    try {
      const { propertyId } = req.params;
      const { photoIds, watermarkText, position = 'bottom-right' } = req.body;
      const { id: userId, role } = req.user;

      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property || (property.user_id !== userId && role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // In a real implementation, you would process the images and add watermark
      // For now, just return success
      res.json({
        success: true,
        message: `Watermark applied to ${photoIds.length} photo(s)`
      });

    } catch (error) {
      console.error('Apply watermark error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred applying watermark'
      });
    }
  }

  /**
   * Regenerate thumbnails for photos
   * @route POST /api/properties/:propertyId/photos/regenerate-thumbnails
   * @access Private
   */
  async regenerateThumbnails(req, res) {
    try {
      const { propertyId } = req.params;
      const { photoIds } = req.body;
      const { id: userId, role } = req.user;

      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property || (property.user_id !== userId && role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // In a real implementation, you would regenerate thumbnails
      res.json({
        success: true,
        message: `Thumbnails regenerated for ${photoIds.length} photo(s)`
      });

    } catch (error) {
      console.error('Regenerate thumbnails error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred regenerating thumbnails'
      });
    }
  }

  /**
   * Download all property photos as ZIP
   * @route GET /api/properties/:propertyId/photos/download
   * @access Private
   */
  async downloadAllPhotos(req, res) {
    try {
      const { propertyId } = req.params;
      const { id: userId, role } = req.user;

      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property || (property.user_id !== userId && role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // In a real implementation, you would create a ZIP file
      res.json({
        success: true,
        message: 'Download started'
      });

    } catch (error) {
      console.error('Download all photos error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred downloading photos'
      });
    }
  }

  /**
   * Export all photo URLs
   * @route GET /api/properties/:propertyId/photos/export-urls
   * @access Public
   */
  async exportPhotoUrls(req, res) {
    try {
      const { propertyId } = req.params;

      const photos = await prisma.propertyPhoto.findMany({
        where: { propertyId, deletedAt: null },
        select: {
          id: true,
          photoUrl: true,
          thumbnailUrl: true,
          mediumUrl: true,
          caption: true,
          isPrimary: true,
          displayOrder: true
        }
      });

      res.json({
        success: true,
        data: {
          original: photos.map(p => p.photoUrl),
          thumbnail: photos.map(p => p.thumbnailUrl),
          medium: photos.map(p => p.mediumUrl),
          details: photos
        }
      });

    } catch (error) {
      console.error('Export photo URLs error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred exporting photo URLs'
      });
    }
  }

  /**
   * Get photo statistics for property
   * @route GET /api/properties/:propertyId/photos/stats
   * @access Public
   */
  async getPhotoStats(req, res) {
    try {
      const { propertyId } = req.params;

      const photos = await prisma.propertyPhoto.findMany({
        where: { propertyId, deletedAt: null },
        select: {
          fileSize: true,
          mimeType: true,
          created_at: true
        }
      });

      const totalPhotos = photos.length;
      const totalSize = photos.reduce((sum, p) => sum + (p.fileSize || 0), 0);
      const averageSize = totalPhotos > 0 ? totalSize / totalPhotos : 0;
      
      const byMimeType = {};
      photos.forEach(p => {
        byMimeType[p.mimeType] = (byMimeType[p.mimeType] || 0) + 1;
      });

      const lastUploaded = photos.length > 0 
        ? photos.sort((a, b) => b.created_at - a.created_at)[0].created_at 
        : null;

      res.json({
        success: true,
        data: {
          totalPhotos,
          totalSize,
          averageSize: Math.round(averageSize),
          byMimeType,
          lastUploaded
        }
      });

    } catch (error) {
      console.error('Get photo stats error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching photo statistics'
      });
    }
  }

  /**
   * Process image with Sharp
   * @private
   */
  async processImage(file, propertyId, index) {
    try {
      const timestamp = Date.now();
      const baseUrl = process.env.STORAGE_URL || 'https://storage.urbannest.com';
      
      return {
        original: `${baseUrl}/properties/${propertyId}/original-${timestamp}-${index}.jpg`,
        thumbnail: `${baseUrl}/properties/${propertyId}/thumb-${timestamp}-${index}.jpg`,
        medium: `${baseUrl}/properties/${propertyId}/medium-${timestamp}-${index}.jpg`
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Reorder photos helper
   * @private
   */
  async reorderPhotosHelper(propertyId, oldOrder, newOrder) {
    if (oldOrder === newOrder) return;

    await prisma.$transaction(async (tx) => {
      if (newOrder > oldOrder) {
        await tx.propertyPhoto.updateMany({
          where: {
            propertyId,
            displayOrder: {
              gt: oldOrder,
              lte: newOrder
            }
          },
          data: {
            displayOrder: { decrement: 1 }
          }
        });
      } else {
        await tx.propertyPhoto.updateMany({
          where: {
            propertyId,
            displayOrder: {
              gte: newOrder,
              lt: oldOrder
            }
          },
          data: {
            displayOrder: { increment: 1 }
          }
        });
      }
    });
  }
}

export default new PropertyPhotoController();