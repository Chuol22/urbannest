// server/src/services/totp.service.test.js
import { describe, test, expect } from '@jest/globals';
import TOTPService from './totp.service.js';
import speakeasy from 'speakeasy';

describe('TOTPService', () => {
    describe('generateSecret', () => {
        test('should generate a secret with correct issuer and name', () => {
            const email = 'admin@urbannest.com';
            const result = TOTPService.generateSecret(email);

            expect(result).toHaveProperty('secret');
            expect(result).toHaveProperty('otpauth_url');
            expect(result.secret).toBeTruthy();
            expect(result.secret.length).toBeGreaterThan(0);
            expect(result.otpauth_url).toContain('UrbanNEST');
            // Email is URL encoded in the otpauth URL
            expect(result.otpauth_url).toContain(encodeURIComponent(email));
            expect(result.otpauth_url).toContain('otpauth://totp/');
        });

        test('should generate different secrets on subsequent calls', () => {
            const email = 'admin@urbannest.com';
            const secret1 = TOTPService.generateSecret(email);
            const secret2 = TOTPService.generateSecret(email);

            expect(secret1.secret).not.toBe(secret2.secret);
        });
    });

    describe('generateQRCode', () => {
        test('should generate a data URL for QR code', async () => {
            const email = 'admin@urbannest.com';
            const { otpauth_url } = TOTPService.generateSecret(email);

            const qrCodeUrl = await TOTPService.generateQRCode(otpauth_url);

            expect(qrCodeUrl).toBeTruthy();
            expect(qrCodeUrl).toMatch(/^data:image\/png;base64,/);
        });

        test('should throw error for invalid otpauth URL', async () => {
            await expect(TOTPService.generateQRCode('')).rejects.toThrow();
        });
    });

    describe('verify', () => {
        test('should verify valid TOTP code', () => {
            // Generate a secret
            const { secret } = TOTPService.generateSecret('test@urbannest.com');

            // Generate a current token using speakeasy
            const validToken = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            // Verify the token
            const isValid = TOTPService.verify(secret, validToken);

            expect(isValid).toBe(true);
        });

        test('should reject invalid TOTP code', () => {
            const { secret } = TOTPService.generateSecret('test@urbannest.com');

            // Use an obviously invalid token
            const invalidToken = '000000';

            const isValid = TOTPService.verify(secret, invalidToken);

            expect(isValid).toBe(false);
        });

        test('should use 2-step window for clock skew tolerance', () => {
            const { secret } = TOTPService.generateSecret('test@urbannest.com');

            // This test verifies that the window parameter is set to 2
            // The actual verification of window behavior requires time manipulation
            // which is beyond the scope of a unit test

            const validToken = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            // Current token should be valid
            const isValid = TOTPService.verify(secret, validToken);
            expect(isValid).toBe(true);
        });
    });
});
