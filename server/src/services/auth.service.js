// server/src/services/auth.service.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { email, phone, password, first_name, last_name } = userData;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });
    
    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password_hash: hashedPassword,
        first_name,
        last_name
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
        is_verified: true,
        created_at: true
      }
    });
    
    return { user };
  }
  
  /**
   * Login user
   */
  async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url
      },
      ...tokens
    };
  }
  
  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      
      if (!user || !user.is_active) {
        throw new Error('Invalid refresh token');
      }
      
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  /**
   * Verify email
   */
  async verifyEmail(token) {
    throw new Error('Email verification not available in current database schema');
  }
  
  /**
   * Forgot password - generate reset token
   */
  async forgotPassword(email) {
    throw new Error('Password reset not available in current database schema');
  }
  
  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    throw new Error('Password reset not available in current database schema');
  }
  
  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword
      }
    });
    
    return true;
  }
  
  /**
   * Logout - revoke all tokens
   */
  async logoutAllDevices(userId) {
    return true;
  }
}

export default new AuthService();