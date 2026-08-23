import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import authMiddleware from './auth.middleware.js';

// Create mock function outside to ensure it's the same reference
const mockFindUnique = jest.fn();

// Mock Prisma before importing authMiddleware
jest.mock('../config/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: mockFindUnique
        }
    }
}));

describe('authMiddleware.checkRole', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: 'test-user-id' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should allow access when user has the required role', async () => {
        // Arrange
        const mockUser = {
            id: 'test-user-id',
            role: 'admin',
            is_active: true,
            first_name: 'John',
            last_name: 'Admin',
            email: 'john@admin.com',
            phone: '+251911234567',
            is_verified: true,
            two_factor_enabled: false
        };

        mockFindUnique.mockResolvedValue(mockUser);

        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { id: 'test-user-id' },
            select: {
                id: true,
                role: true,
                is_active: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                is_verified: true,
                two_factor_enabled: true
            }
        });
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no user in request', async () => {
        // Arrange
        req.user = null;
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Access denied. No token provided.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found in database', async () => {
        // Arrange
        mockFindUnique.mockResolvedValue(null);
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'User not found.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when account is deactivated', async () => {
        // Arrange
        const mockUser = {
            id: 'test-user-id',
            role: 'admin',
            is_active: false, // Deactivated
            first_name: 'John',
            last_name: 'Admin',
            email: 'john@admin.com',
            phone: '+251911234567',
            is_verified: true,
            two_factor_enabled: false
        };

        mockFindUnique.mockResolvedValue(mockUser);
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Account is deactivated.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user role does not match allowed roles', async () => {
        // Arrange
        const mockUser = {
            id: 'test-user-id',
            role: 'seeker', // Not admin
            is_active: true,
            first_name: 'John',
            last_name: 'Seeker',
            email: 'john@seeker.com',
            phone: '+251911234567',
            is_verified: true,
            two_factor_enabled: false
        };

        mockFindUnique.mockResolvedValue(mockUser);
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Access denied. Admin role required.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for multiple allowed roles', async () => {
        // Arrange
        const mockUser = {
            id: 'test-user-id',
            role: 'agent',
            is_active: true,
            first_name: 'John',
            last_name: 'Agent',
            email: 'john@agent.com',
            phone: '+251911234567',
            is_verified: true,
            two_factor_enabled: false
        };

        mockFindUnique.mockResolvedValue(mockUser);
        const middleware = authMiddleware.checkRole(['owner', 'agent', 'admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 500 when database error occurs', async () => {
        // Arrange
        mockFindUnique.mockRejectedValue(new Error('Database error'));
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Authorization check failed.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should attach full user object to req.user', async () => {
        // Arrange
        const mockUser = {
            id: 'test-user-id',
            role: 'admin',
            is_active: true,
            first_name: 'John',
            last_name: 'Admin',
            email: 'john@admin.com',
            phone: '+251911234567',
            is_verified: true,
            two_factor_enabled: true
        };

        mockFindUnique.mockResolvedValue(mockUser);
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        expect(req.user).toEqual(mockUser);
        expect(req.user).toHaveProperty('first_name', 'John');
        expect(req.user).toHaveProperty('last_name', 'Admin');
        expect(req.user).toHaveProperty('email', 'john@admin.com');
        expect(req.user).toHaveProperty('phone', '+251911234567');
        expect(req.user).toHaveProperty('two_factor_enabled', true);
    });

    it('should load fresh user data from database on each request', async () => {
        // Arrange
        req.user = { id: 'test-user-id', role: 'admin', is_active: true }; // Stale data

        const freshUser = {
            id: 'test-user-id',
            role: 'admin',
            is_active: false, // Changed in database
            first_name: 'John',
            last_name: 'Admin',
            email: 'john@admin.com',
            phone: '+251911234567',
            is_verified: true,
            two_factor_enabled: false
        };

        mockFindUnique.mockResolvedValue(freshUser);
        const middleware = authMiddleware.checkRole(['admin']);

        // Act
        await middleware(req, res, next);

        // Assert
        // Should reject because fresh data shows is_active=false
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Account is deactivated.'
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('authMiddleware.verifyToken', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            cookies: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 when no token provided', async () => {
        // Arrange
        const middleware = authMiddleware.verifyToken;

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Access denied. No token provided.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
        // Arrange
        req.headers.authorization = 'Bearer invalid-token';

        const middleware = authMiddleware.verifyToken;

        // Act
        await middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('authMiddleware.extractToken', () => {
    it('should extract token from Authorization header', () => {
        // Arrange
        const req = {
            headers: { authorization: 'Bearer test-token-123' },
            cookies: {}
        };

        // Act
        const token = authMiddleware.extractToken(req);

        // Assert
        expect(token).toBe('test-token-123');
    });

    it('should extract token from cookies', () => {
        // Arrange
        const req = {
            headers: {},
            cookies: { accessToken: 'cookie-token-123' }
        };

        // Act
        const token = authMiddleware.extractToken(req);

        // Assert
        expect(token).toBe('cookie-token-123');
    });

    it('should return null when no token available', () => {
        // Arrange
        const req = {
            headers: {},
            cookies: {}
        };

        // Act
        const token = authMiddleware.extractToken(req);

        // Assert
        expect(token).toBeNull();
    });
});

describe('authMiddleware.isAdmin', () => {
    let req, res, next;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should return 401 when no user in request', () => {
        // Arrange
        req = {};
        const middleware = authMiddleware.isAdmin;

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
        // Arrange
        req = { user: { id: 'user-1', role: 'seeker' } };
        const middleware = authMiddleware.isAdmin;

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next when user is admin', () => {
        // Arrange
        req = { user: { id: 'user-1', role: 'admin' } };
        const middleware = authMiddleware.isAdmin;

        // Act
        middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('authMiddleware.isActive', () => {
    let req, res, next;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should return 401 when no user in request', () => {
        // Arrange
        req = {};
        const middleware = authMiddleware.isActive;

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not active', () => {
        // Arrange
        req = { user: { id: 'user-1', is_active: false } };
        const middleware = authMiddleware.isActive;

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next when user is active', () => {
        // Arrange
        req = { user: { id: 'user-1', is_active: true } };
        const middleware = authMiddleware.isActive;

        // Act
        middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});