// server/src/services/totp.service.js
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * TOTP Service for Two-Factor Authentication
 * Handles generation and verification of Time-based One-Time Passwords
 */
class TOTPService {
    /**
     * Generate a new TOTP secret for a user
     * @param {string} email - User's email address
     * @returns {Object} Secret object containing base32 secret and otpauth URL
     */
    generateSecret(email) {
        const secret = speakeasy.generateSecret({
            name: `UrbanNEST Admin (${email})`,
            issuer: 'UrbanNEST',
            length: 32
        });

        return {
            secret: secret.base32,
            otpauth_url: secret.otpauth_url
        };
    }

    /**
     * Generate QR code data URL from TOTP secret
     * @param {string} otpauthUrl - The otpauth:// URL from the secret
     * @returns {Promise<string>} Data URL for the QR code image
     */
    async generateQRCode(otpauthUrl) {
        try {
            const dataUrl = await QRCode.toDataURL(otpauthUrl);
            return dataUrl;
        } catch (error) {
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

    /**
     * Verify a TOTP code against a secret
     * @param {string} secret - The base32 encoded secret
     * @param {string} token - The 6-digit code from the user's authenticator app
     * @returns {boolean} True if the token is valid, false otherwise
     */
    verify(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2-step window for clock skew (±60 seconds)
        });
    }
}

export default new TOTPService();
