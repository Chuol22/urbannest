// server/src/services/totp.example.js
// Example usage of the TOTP Service

import TOTPService from './totp.service.js';

async function demonstrateTOTPService() {
    console.log('=== TOTP Service Demonstration ===\n');

    // 1. Generate a secret for a user
    const email = 'admin@urbannest.com';
    console.log(`1. Generating TOTP secret for: ${email}`);
    const { secret, otpauth_url } = TOTPService.generateSecret(email);
    console.log(`   Secret (base32): ${secret}`);
    console.log(`   OTPAuth URL: ${otpauth_url}\n`);

    // 2. Generate QR code
    console.log('2. Generating QR code data URL...');
    const qrCodeDataUrl = await TOTPService.generateQRCode(otpauth_url);
    console.log(`   QR Code generated (${qrCodeDataUrl.substring(0, 50)}...)\n`);

    // 3. Verify a valid TOTP code
    console.log('3. Testing TOTP verification...');

    // Generate a valid token using the secret
    const speakeasy = await import('speakeasy');
    const currentToken = speakeasy.default.totp({
        secret: secret,
        encoding: 'base32'
    });

    console.log(`   Current valid token: ${currentToken}`);

    const isValid = TOTPService.verify(secret, currentToken);
    console.log(`   Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗'}\n`);

    // 4. Test invalid token
    console.log('4. Testing invalid token...');
    const invalidToken = '000000';
    const isInvalid = TOTPService.verify(secret, invalidToken);
    console.log(`   Token: ${invalidToken}`);
    console.log(`   Verification result: ${isInvalid ? 'VALID ✓' : 'INVALID ✗'}\n`);

    console.log('=== Demonstration Complete ===');
}

// Run the demonstration
demonstrateTOTPService().catch(console.error);
