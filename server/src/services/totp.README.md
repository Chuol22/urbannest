# TOTP Service Implementation

## Overview
This TOTP (Time-based One-Time Password) Service provides Two-Factor Authentication functionality for the UrbanNEST Super Admin System.

## Files Created
- `totp.service.js` - Main service implementation
- `totp.service.test.js` - Comprehensive unit tests
- `totp.example.js` - Usage demonstration

## Dependencies Installed
- **speakeasy** (v2.0.0) - TOTP generation and verification
- **qrcode** (v1.5.4) - QR code generation

## Implementation Details

### Methods

#### 1. `generateSecret(email)`
Generates a new TOTP secret for a user.

**Parameters:**
- `email` (string) - User's email address

**Returns:**
```javascript
{
  secret: "base32-encoded-secret",
  otpauth_url: "otpauth://totp/UrbanNEST..."
}
```

**Features:**
- Uses UrbanNEST as the issuer
- Generates 32-character secrets
- Creates otpauth URL for authenticator apps

#### 2. `generateQRCode(otpauthUrl)`
Converts an otpauth URL into a QR code data URL.

**Parameters:**
- `otpauthUrl` (string) - The otpauth:// URL from generateSecret()

**Returns:**
- Promise<string> - Data URL (data:image/png;base64,...)

**Usage:**
- Users can scan the QR code with Google Authenticator, Authy, etc.
- Falls back to manual entry if QR scanning fails

#### 3. `verify(secret, token)`
Verifies a TOTP code against a secret.

**Parameters:**
- `secret` (string) - Base32 encoded secret
- `token` (string) - 6-digit code from authenticator app

**Returns:**
- boolean - true if valid, false otherwise

**Features:**
- 2-step window for clock skew (±60 seconds tolerance)
- Protects against timing attacks
- Base32 encoding for compatibility

## Requirements Fulfilled

### Requirement 13.2
✅ TOTP secret generation with unique secret per admin
- Implemented in `generateSecret()` method
- Uses speakeasy library with 32-character secrets
- Includes issuer (UrbanNEST) and user email

### Requirement 13.3
✅ QR code generation returning data URL
- Implemented in `generateQRCode()` method
- Returns PNG data URL for easy frontend display
- Error handling for invalid URLs

### Requirement 13.7
✅ TOTP verification with 2-step window
- Implemented in `verify()` method
- Window parameter set to 2 (±60 seconds)
- Accommodates clock skew between server and user device

## Testing

All 7 tests pass successfully:

```bash
npm test -- totp.service.test.js
```

**Test Coverage:**
- ✓ Secret generation with correct issuer
- ✓ Unique secrets on subsequent calls
- ✓ QR code data URL generation
- ✓ Error handling for invalid URLs
- ✓ Valid TOTP code verification
- ✓ Invalid code rejection
- ✓ Clock skew tolerance (2-step window)

## Usage Example

```javascript
import TOTPService from './services/totp.service.js';

// 1. Enable 2FA for user
const { secret, otpauth_url } = TOTPService.generateSecret('admin@urbannest.com');
const qrCode = await TOTPService.generateQRCode(otpauth_url);

// Store secret (encrypted) in database
// Return qrCode to frontend for user to scan

// 2. Verify during login
const userToken = '123456'; // From user's authenticator app
const isValid = TOTPService.verify(storedSecret, userToken);

if (isValid) {
  // Allow login
} else {
  // Reject login
}
```

## Security Considerations

1. **Secret Storage**: Secrets should be encrypted before storing in database
2. **Window Size**: 2-step window (±60 seconds) balances security and usability
3. **Rate Limiting**: Implement rate limiting on verification attempts
4. **Backup Codes**: Consider implementing backup codes for account recovery

## Integration Points

This service will be used by:
- Admin User Controller (task 4.x) - For enabling/disabling 2FA
- Auth Service (task 5.4) - For 2FA verification during login
- Admin Dashboard UI (task 16.x) - For displaying QR codes

## Next Steps

1. Implement 2FA enable/disable endpoints (task 5.1, 5.2, 5.3)
2. Update login flow to support 2FA (task 5.4)
3. Create frontend components for 2FA setup (task 16.1, 16.2, 16.3)
