// Email service utility
// Basic email service implementation using nodemailer

import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const emailService = {
  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail, userName) {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to: userEmail,
        subject: 'Welcome to UrbanNest!',
        html: `
          <h1>Welcome to UrbanNest, ${userName}!</h1>
          <p>Thank you for joining UrbanNest. We're excited to help you find your perfect property.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail, resetToken) {
    try {
      const transporter = createTransporter();
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to: userEmail,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset for your UrbanNest account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send email verification email
   */
  async sendVerificationEmail(userEmail, verificationToken) {
    try {
      const transporter = createTransporter();
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to: userEmail,
        subject: 'Verify Your Email',
        html: `
          <h1>Verify Your Email Address</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(userEmail, bookingDetails) {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to: userEmail,
        subject: 'Booking Confirmation',
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Your booking has been confirmed.</p>
          <p>Booking Reference: ${bookingDetails.reference}</p>
          <p>Check-in: ${bookingDetails.checkIn}</p>
          <p>Check-out: ${bookingDetails.checkOut}</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send custom email
   */
  async sendEmail(to, subject, html) {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to,
        subject,
        html
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if email service is configured
   */
  isConfigured() {
    return Boolean(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );
  }
};

export default emailService;
