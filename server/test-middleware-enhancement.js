/**
 * Test script to verify auth middleware enhancements for task 3.1
 * Tests that verifyToken properly extracts userId and userRole
 */

import jwt from 'jsonwebtoken';
import authMiddleware from './src/middleware/auth.middleware.js';

// Mock request, response, and next
const createMockReq = (token) => ({
    headers: {
        authorization: token ? `Bearer ${token}` : undefined
    },
    cookies: {}
});

const createMockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    return res;
};

const createMockNext = () => {
    let called = false;
    const next = () => {
        called = true;
    };
    next.wasCalled = () => called;
    return next;
};

console.log('Testing auth middleware enhancements...\n');

// Test 1: Token extraction and userId/userRole setting
console.log('Test 1: Verify req.userId and req.userRole are set from JWT');
try {
    // Create a valid token
    const testPayload = {
        id: 'test-user-123',
        role: 'admin',
        email: 'admin@test.com'
    };

    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '1h'
    });

    const req = createMockReq(token);
    const res = createMockRes();
    const next = createMockNext();

    // Mock prisma user lookup
    const { prisma } = await import('./src/config/prisma.js');
    const originalFindUnique = prisma.user.findUnique;
    prisma.user.findUnique = async () => ({
        id: 'test-user-123',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
        is_verified: true
    });

    await authMiddleware.verifyToken(req, res, next);

    // Restore original method
    prisma.user.findUnique = originalFindUnique;

    // Verify results
    if (req.userId === 'test-user-123' && req.userRole === 'admin') {
        console.log('✓ PASS: req.userId and req.userRole are correctly set');
        console.log(`  req.userId: ${req.userId}`);
        console.log(`  req.userRole: ${req.userRole}`);
    } else {
        console.log('✗ FAIL: req.userId or req.userRole not set correctly');
        console.log(`  Expected userId: 'test-user-123', got: ${req.userId}`);
        console.log(`  Expected userRole: 'admin', got: ${req.userRole}`);
    }

    // Verify req.user is still set (backward compatibility)
    if (req.user && req.user.id === 'test-user-123' && req.user.role === 'admin') {
        console.log('✓ PASS: req.user is still set (backward compatibility)');
    } else {
        console.log('✗ FAIL: req.user not set correctly');
    }

} catch (error) {
    console.log('✗ FAIL: Error during test');
    console.error(error);
}

console.log('\nTest 2: Missing token returns 401');
try {
    const req = createMockReq(null);
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware.verifyToken(req, res, next);

    if (res.statusCode === 401 && res.jsonData?.message === 'Access denied. No token provided.') {
        console.log('✓ PASS: Returns 401 for missing token');
    } else {
        console.log('✗ FAIL: Did not return correct 401 response');
        console.log(`  Status: ${res.statusCode}, Message: ${res.jsonData?.message}`);
    }
} catch (error) {
    console.log('✗ FAIL: Error during test');
    console.error(error);
}

console.log('\nTest 3: Expired token returns 401');
try {
    // Create an expired token
    const testPayload = {
        id: 'test-user-123',
        role: 'admin',
        email: 'admin@test.com'
    };

    const expiredToken = jwt.sign(testPayload, process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '-1h' // Already expired
    });

    const req = createMockReq(expiredToken);
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware.verifyToken(req, res, next);

    if (res.statusCode === 401 && res.jsonData?.message === 'Token has expired. Please login again.') {
        console.log('✓ PASS: Returns 401 for expired token');
    } else {
        console.log('✗ FAIL: Did not return correct 401 response for expired token');
        console.log(`  Status: ${res.statusCode}, Message: ${res.jsonData?.message}`);
    }
} catch (error) {
    console.log('✗ FAIL: Error during test');
    console.error(error);
}

console.log('\n✅ All manual tests completed!');
process.exit(0);
