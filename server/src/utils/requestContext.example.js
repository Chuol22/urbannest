/**
 * Usage Example: Request Context Extraction for Audit Logging
 * 
 * This file demonstrates how to use the request context utilities
 * in conjunction with the audit log service for comprehensive logging
 * of administrative actions.
 */

import { extractRequestContext, extractIPAddress, extractUserAgent } from './requestContext.js';
import auditLogService from '../services/auditLog.service.js';

/**
 * Example 1: Basic usage in a controller
 * Extract request context and log an admin action
 */
export const exampleAdminAction = async (req, res) => {
    try {
        // Extract IP and user agent from request
        const { ipAddress, userAgent } = extractRequestContext(req);

        // Perform admin action (e.g., create admin user)
        // const newAdmin = await adminService.createAdmin(...);

        // Log the action with request context
        await auditLogService.log({
            adminId: req.user.id,
            actionType: 'CREATE_ADMIN',
            targetResource: 'USER',
            targetId: 'new-admin-id', // newAdmin.id in real scenario
            ipAddress,
            userAgent,
            metadata: {
                email: 'new.admin@example.com',
                role: 'admin'
            }
        });

        res.json({ success: true, message: 'Admin created and action logged' });
    } catch (error) {
        console.error('Error in admin action:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Example 2: Middleware for automatic request context injection
 * Attach request context to req object for use in controllers
 */
export const injectRequestContextMiddleware = (req, res, next) => {
    // Extract and attach request context to request object
    req.context = extractRequestContext(req);
    next();
};

/**
 * Example 3: Usage in middleware chain
 * Then in controllers, you can access req.context directly
 */
export const exampleWithMiddleware = async (req, res) => {
    try {
        // Request context is already available from middleware
        const { ipAddress, userAgent } = req.context;

        // Log admin action
        await auditLogService.log({
            adminId: req.user.id,
            actionType: 'APPROVE_LISTING',
            targetResource: 'PROPERTY',
            targetId: req.params.propertyId,
            ipAddress,
            userAgent,
            metadata: {
                previousStatus: 'pending',
                newStatus: 'available'
            }
        });

        res.json({ success: true, message: 'Listing approved and logged' });
    } catch (error) {
        console.error('Error approving listing:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Example 4: Individual extraction functions
 * When you only need one piece of information
 */
export const exampleIndividualExtraction = async (req, res) => {
    try {
        // Extract only IP address
        const ipAddress = extractIPAddress(req);

        // Extract only user agent
        const userAgent = extractUserAgent(req);

        // Use them separately as needed
        console.log(`Request from IP: ${ipAddress}`);
        console.log(`User Agent: ${userAgent}`);

        res.json({ ipAddress, userAgent });
    } catch (error) {
        console.error('Error extracting context:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Example 5: Complete admin controller pattern
 * Full example showing the recommended pattern for admin controllers
 */
export const completeAdminControllerExample = {
    /**
     * Create admin user with audit logging
     */
    createAdmin: async (req, res) => {
        try {
            // Extract request context
            const { ipAddress, userAgent } = extractRequestContext(req);

            // Validate input
            const { email, phone, password, first_name, last_name } = req.body;

            // Create admin (pseudo-code)
            // const newAdmin = await adminService.create({ email, phone, password, first_name, last_name });

            // Log action with full context
            await auditLogService.log({
                adminId: req.user.id, // Current admin performing the action
                actionType: 'CREATE_ADMIN',
                targetResource: 'USER',
                targetId: 'new-admin-id', // newAdmin.id in real scenario
                ipAddress,
                userAgent,
                metadata: {
                    email,
                    phone,
                    first_name,
                    last_name,
                    creator_admin_name: `${req.user.first_name} ${req.user.last_name}`
                }
            });

            res.status(201).json({
                success: true,
                message: 'Admin created successfully',
                data: {
                    id: 'new-admin-id',
                    email,
                    phone,
                    first_name,
                    last_name
                }
            });
        } catch (error) {
            console.error('Error creating admin:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Deactivate admin user with audit logging
     */
    deactivateAdmin: async (req, res) => {
        try {
            const { ipAddress, userAgent } = extractRequestContext(req);
            const targetAdminId = req.params.id;

            // Prevent self-deactivation
            if (targetAdminId === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate your own account'
                });
            }

            // Deactivate admin (pseudo-code)
            // await adminService.deactivate(targetAdminId);

            // Log action
            await auditLogService.log({
                adminId: req.user.id,
                actionType: 'DEACTIVATE_ADMIN',
                targetResource: 'USER',
                targetId: targetAdminId,
                ipAddress,
                userAgent,
                metadata: {
                    reason: req.body.reason || 'No reason provided',
                    deactivated_by: `${req.user.first_name} ${req.user.last_name}`
                }
            });

            res.json({
                success: true,
                message: 'Admin deactivated successfully'
            });
        } catch (error) {
            console.error('Error deactivating admin:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Approve listing with audit logging
     */
    approveListing: async (req, res) => {
        try {
            const { ipAddress, userAgent } = extractRequestContext(req);
            const propertyId = req.params.id;

            // Approve listing (pseudo-code)
            // const property = await propertyService.approve(propertyId);

            // Log action
            await auditLogService.log({
                adminId: req.user.id,
                actionType: 'APPROVE_LISTING',
                targetResource: 'PROPERTY',
                targetId: propertyId,
                ipAddress,
                userAgent,
                metadata: {
                    previous_status: 'pending',
                    new_status: 'available',
                    approved_by: `${req.user.first_name} ${req.user.last_name}`,
                    property_title: 'Example Property Title'
                }
            });

            res.json({
                success: true,
                message: 'Listing approved successfully'
            });
        } catch (error) {
            console.error('Error approving listing:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

/**
 * Example 6: Proxy configuration notes
 * 
 * For proper IP extraction behind proxies, ensure Express is configured correctly:
 * 
 * In server.js or app.js:
 * ```javascript
 * import express from 'express';
 * const app = express();
 * 
 * // Trust proxy - important for X-Forwarded-For header
 * app.set('trust proxy', true);
 * // Or for specific proxy:
 * // app.set('trust proxy', '127.0.0.1');
 * ```
 * 
 * This configuration tells Express to trust the X-Forwarded-For header
 * and properly populate req.ip
 */

/**
 * Example 7: Testing with mock request objects
 */
export const testRequestContextExtraction = () => {
    // Mock request from load balancer
    const mockReq = {
        headers: {
            'x-forwarded-for': '203.0.113.1, 198.51.100.1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    const context = extractRequestContext(mockReq);
    console.log('Extracted context:', context);
    // Output: { ipAddress: '203.0.113.1', userAgent: 'Mozilla/5.0...' }
};

// Export all examples
export default {
    exampleAdminAction,
    injectRequestContextMiddleware,
    exampleWithMiddleware,
    exampleIndividualExtraction,
    completeAdminControllerExample,
    testRequestContextExtraction
};
