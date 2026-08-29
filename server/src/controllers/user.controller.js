import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../middleware/upload.cloudinary.js';

const prisma = new PrismaClient();

class UserController {
  /**
   * Get current user profile
   * @route GET /api/users/profile
   * @access Private
   */
  async getProfile(req, res) {
    try {
      const { id } = req.user;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          role: true,
          is_verified: true,
          avatar_url: true,
          created_at: true,
          last_login: true,
          is_active: true,
          _count: {
            select: {
              properties: true,
              seeker_bookings: true,
              host_bookings: true,
              favorite_properties: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching profile'
      });
    }
  }

  /**
   * Update user profile
   * @route PUT /api/users/profile
   * @access Private
   */
  async updateProfile(req, res) {
    try {
      const { id } = req.user;
      const { first_name, last_name, phone, avatar_url } = req.body;

      // Check if phone is already taken by another user
      if (phone) {
        const existingUser = await prisma.user.findFirst({
          where: {
            phone,
            NOT: { id }
          }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Phone number is already in use'
          });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          phone: phone || undefined,
          avatar_url: avatar_url || undefined,
          updated_at: new Date()
        },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          role: true,
          avatar_url: true,
          updated_at: true
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating profile'
      });
    }
  }

  /**
   * Upload avatar
   * @route POST /api/users/avatar
   * @access Private
   */
  /**
   * Upload avatar
   * @route POST /api/users/avatar
   * @access Private
   */
  async uploadAvatar(req, res) {
    try {
      const { id } = req.user;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      let avatarUrl = req.file.path || req.file.location;
      if (!avatarUrl && req.file.buffer) {
        try {
          if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
            const uploaded = await uploadToCloudinary(req.file.buffer, 'avatars');
            avatarUrl = uploaded.secure_url;
          } else {
            avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
          }
        } catch (uploadErr) {
          console.warn('Cloudinary upload fallback to data URI:', uploadErr.message);
          avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          avatar_url: avatarUrl,
          updated_at: new Date()
        },
        select: {
          avatar_url: true
        }
      });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: user
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred uploading avatar'
      });
    }
  }

  /**
   * Upload verification document
   * @route POST /api/users/verification-documents
   * @access Private (owner/agent only)
   */
  async uploadVerificationDocument(req, res) {
    try {
      const { id } = req.user;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document file uploaded'
        });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      let documentUrl = req.file.path || req.file.location;
      if (!documentUrl && req.file.buffer) {
        try {
          if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
            const uploaded = await uploadToCloudinary(req.file.buffer, 'documents', 'auto');
            documentUrl = uploaded.secure_url;
          } else {
            documentUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
          }
        } catch (uploadErr) {
          console.warn('Cloudinary upload fallback to data URI:', uploadErr.message);
          documentUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
      }

      const targetRole = user.role === 'seeker' ? 'agent' : user.role;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          role: targetRole,
          verification_document_url: documentUrl,
          verification_status: 'pending_review',
          is_verified: false, // Reset to false while pending re-review
          verification_rejection_reason: null
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          verification_status: true,
          verification_document_url: true
        }
      });

      res.json({
        success: true,
        message: 'Verification document uploaded successfully. Your account is pending admin review.',
        data: updatedUser
      });

    } catch (error) {
      console.error('Upload verification document error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred uploading verification document'
      });
    }
  }

  /**
   * Get broker verification status
   * @route GET /api/users/verification-status
   * @access Private
   */
  async getVerificationStatus(req, res) {
    try {
      const { id } = req.user;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          is_verified: true,
          verification_status: true,
          verification_document_url: true,
          verification_rejection_reason: true,
          role: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Get verification status error:', error);
      res.status(500).json({ success: false, message: 'Failed to get verification status' });
    }
  }

  /**
   * Get user by ID (public profile)
   * @route GET /api/users/:id
   * @access Public
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id, is_active: true },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          role: true,
          created_at: true,
          is_verified: true,
          properties: {
            where: { status: { not: 'off_market' } },
            select: {
              id: true,
              title: true,
              price: true,
              property_type: true,
              purpose: true,
              status: true,
              photos: {
                where: { isPrimary: true },
                take: 1,
                select: { photoUrl: true }
              },
              location: {
                select: {
                  address: true,
                  city: true,
                  country: true
                }
              }
            },
            take: 10
          },
          _count: {
            select: {
              properties: {
                where: { status: { not: 'off_market' } }
              },
              host_bookings: true,
              reviews: {
                where: { status: 'PUBLISHED' }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user rating if they are an owner/host
      let rating = null;
      if (user.role === 'owner' || user.role === 'agent') {
        const reviews = await prisma.review.aggregate({
          where: {
            ownerId: id,
            status: 'PUBLISHED'
          },
          _avg: {
            rating: true,
            responsivenessRating: true,
            fairnessRating: true,
            maintenanceRating: true
          },
          _count: true
        });

        rating = {
          average: reviews._avg.rating || 0,
          count: reviews._count,
          responsiveness: reviews._avg.responsivenessRating,
          fairness: reviews._avg.fairnessRating,
          maintenance: reviews._avg.maintenanceRating
        };
      }

      res.json({
        success: true,
        data: {
          ...user,
          rating
        }
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching user'
      });
    }
  }

  /**
   * Get user listings (properties)
   * @route GET /api/users/:id/listings
   * @access Public
   */
  async getUserListings(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        user_id: id,
        ...(status && { status })
      };

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1
            },
            location: true,
            _count: {
              select: {
                favorited_by: true,
                bookings: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.property.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          properties,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get user listings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching user listings'
      });
    }
  }

  /**
   * Get user's saved/favorite properties
   * @route GET /api/users/favorites
   * @access Private
   */
  async getFavorites(req, res) {
    try {
      const { id } = req.user;
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [favorites, total] = await Promise.all([
        prisma.favoriteProperty.findMany({
          where: { userId: id },
          include: {
            property: {
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
                    avatar_url: true
                  }
                }
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.favoriteProperty.count({
          where: { userId: id }
        })
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
   * Get user's bookings
   * @route GET /api/users/bookings
   * @access Private
   */
  async getUserBookings(req, res) {
    try {
      const { id, role } = req.user;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = role === 'seeker' 
        ? { seekerId: id }
        : { hostId: id };

      if (status) {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            property: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1
                },
                location: true
              }
            },
            seeker: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true
              }
            },
            host: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_url: true
              }
            },
            messages: {
              take: 1,
              orderBy: { created_at: 'desc' }
            },
            feedback: true
          },
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.booking.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred fetching bookings'
      });
    }
  }

  /**
   * Update user settings/preferences
   * @route PUT /api/users/settings
   * @access Private
   */
  async updateSettings(req, res) {
    try {
      const { id } = req.user;
      const { notifications, privacy } = req.body;

      // Get current user settings
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { settings: true }
      });

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          settings: {
            notifications: {
              email: notifications?.email ?? currentUser?.settings?.notifications?.email ?? true,
              push: notifications?.push ?? currentUser?.settings?.notifications?.push ?? true,
              sms: notifications?.sms ?? currentUser?.settings?.notifications?.sms ?? false
            },
            privacy: {
              showProfile: privacy?.showProfile ?? currentUser?.settings?.privacy?.showProfile ?? true,
              showListings: privacy?.showListings ?? currentUser?.settings?.privacy?.showListings ?? true
            }
          },
          updated_at: new Date()
        },
        select: {
          settings: true
        }
      });

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedUser.settings
      });

    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred updating settings'
      });
    }
  }

  /**
   * Deactivate account
   * @route DELETE /api/users/deactivate
   * @access Private
   */
  async deactivateAccount(req, res) {
    try {
      const { id } = req.user;
      const { password, reason } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to deactivate account'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Soft delete or deactivate
      await prisma.user.update({
        where: { id },
        data: {
          is_active: false,
          deactivated_at: new Date(),
          deactivation_reason: reason,
          email: `${user.email}_deactivated_${Date.now()}`,
          phone: user.phone ? `${user.phone}_deactivated_${Date.now()}` : null
        }
      });

      res.json({
        success: true,
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred deactivating account'
      });
    }
  }

  /**
   * Reactivate account
   * @route POST /api/users/reactivate
   * @access Private
   */
  async reactivateAccount(req, res) {
    try {
      const { email, phone, password } = req.body;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      // Find deactivated user
      const where = {};
      if (email) where.email = email;
      if (phone) where.phone = phone;

      const user = await prisma.user.findFirst({
        where: {
          ...where,
          is_active: false
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Deactivated account not found'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Reactivate account
      const reactivatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null,
          email: user.email.replace(/_deactivated_\d+$/, ''),
          phone: user.phone ? user.phone.replace(/_deactivated_\d+$/, '') : null,
          updated_at: new Date()
        },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          is_active: true
        }
      });

      res.json({
        success: true,
        message: 'Account reactivated successfully',
        data: reactivatedUser
      });

    } catch (error) {
      console.error('Reactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred reactivating account'
      });
    }
  }

  /**
   * Change password
   * @route PUT /api/users/change-password
   * @access Private
   */
  async changePassword(req, res) {
    try {
      const { id } = req.user;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id },
        data: {
          password_hash: hashedPassword,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred changing password'
      });
    }
  }
}

export default new UserController();