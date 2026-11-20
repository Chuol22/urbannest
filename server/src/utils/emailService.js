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
   * Send notification when an admin approves and publishes a listing
   */
  async sendListingApprovedEmail(userEmail, userName, propertyTitle, propertyId) {
    try {
      if (!this.isConfigured()) {
        console.log(`[Email Mock] Listing approved email would be sent to ${userEmail} for "${propertyTitle}"`);
        return { success: true, simulated: true };
      }
      const transporter = createTransporter();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const propertyUrl = `${frontendUrl}/properties/${propertyId}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to: userEmail,
        subject: `🎉 Congratulations! Your listing "${propertyTitle}" is now Published on UrbanNEST`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #181B22 0%, #262C37 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Urban<span style="color: #C9A865;">NEST</span></h1>
              <p style="margin: 8px 0 0; color: #94A3B8; font-size: 14px;">Ethiopia's Premier Real Estate Platform</p>
            </div>
            <div style="padding: 32px 28px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #E8F5E9; color: #2E7D4F; padding: 6px 16px; border-radius: 50px; font-size: 13px; font-weight: 700; border: 1px solid #C8E6C9;">
                  ✓ Payment Verified & Published
                </span>
              </div>
              <h2 style="color: #181B22; font-size: 20px; font-weight: 700; margin-top: 0;">Great news, ${userName}!</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Our administrative team has verified your manual payment transfer receipt. Your property listing is now approved and live for thousands of prospective buyers and tenants!
              </p>
              
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #64748B; font-weight: 600;">Published Property</p>
                <h3 style="margin: 0; color: #181B22; font-size: 17px; font-weight: 700;">${propertyTitle}</h3>
                <p style="margin: 8px 0 0; font-size: 13px; color: #2E7D4F; font-weight: 600;">Status: Live & Publicly Searchable</p>
              </div>

              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${propertyUrl}" style="background-color: #C9A865; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 8px rgba(201, 168, 101, 0.3);">
                  View Your Live Listing
                </a>
              </div>
              <p style="text-align: center; margin: 0; font-size: 13px; color: #64748B;">
                You can also manage or update your property anytime from your <a href="${frontendUrl}/dashboard" style="color: #181B22; font-weight: 600;">Dashboard</a>.
              </p>
            </div>
            <div style="background-color: #F1F5F9; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8;">
              <p style="margin: 0;">© ${new Date().getFullYear()} UrbanNEST Technologies. Addis Ababa, Ethiopia.</p>
              <p style="margin: 4px 0 0;">Need help? Reach out at support@urbannest.com or +251 911 234 567.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending listing approved email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send notification when manual payment receipt is rejected
   */
  async sendListingPaymentRejectedEmail(userEmail, userName, propertyTitle, reason, propertyId) {
    try {
      if (!this.isConfigured()) {
        console.log(`[Email Mock] Listing payment rejected email would be sent to ${userEmail} for "${propertyTitle}"`);
        return { success: true, simulated: true };
      }
      const transporter = createTransporter();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const dashboardUrl = `${frontendUrl}/dashboard`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@urbannest.com',
        to: userEmail,
        subject: `Action Required: Payment Verification for "${propertyTitle}"`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #181B22 0%, #262C37 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Urban<span style="color: #C9A865;">NEST</span></h1>
            </div>
            <div style="padding: 32px 28px;">
              <h2 style="color: #181B22; font-size: 20px; margin-top: 0;">Hello ${userName},</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                We could not verify the transfer receipt uploaded for your listing <strong>"${propertyTitle}"</strong>.
              </p>
              <div style="background-color: #FFF1F2; border: 1px solid #FECDD3; border-radius: 12px; padding: 18px; margin: 20px 0;">
                <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #BE123C; font-weight: 700;">Admin Feedback / Reason:</p>
                <p style="margin: 0; color: #881337; font-size: 14px;">${reason || 'The transaction could not be confirmed in the account statement or the image was unreadable.'}</p>
              </div>
              <p style="color: #475569; font-size: 14px;">
                Please log into your dashboard, double-check your transfer confirmation in Commercial Bank of Ethiopia (CBE) or Telebirr, and re-upload a clear receipt screenshot.
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}" style="background-color: #181B22; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block;">
                  Go to Dashboard & Re-upload
                </a>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending payment rejected email:', error);
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
