/**
 * Request Context Extraction Utilities
 * Helper functions to extract IP address and user agent from Express requests
 * Handles proxy headers (X-Forwarded-For) correctly for accurate client information
 * Used for audit logging in the Super Admin Management System
 */

/**
 * Extract IP address from request object
 * Handles proxy headers (X-Forwarded-For) for accurate client IP extraction
 * Priority order:
 * 1. X-Forwarded-For header (first IP in chain for proxied requests)
 * 2. X-Real-IP header (common in nginx reverse proxy setups)
 * 3. req.ip (Express built-in, already handles some proxy scenarios)
 * 4. req.connection.remoteAddress (direct connection fallback)
 * 5. req.socket.remoteAddress (socket-level fallback)
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} - Client IP address or null if not found
 */
export const extractIPAddress = (req) => {
    try {
        // Check X-Forwarded-For header (common with load balancers and proxies)
        // Format: "client, proxy1, proxy2" - we want the first (original client) IP
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            // Split by comma and get the first IP (original client)
            const ips = forwardedFor.split(',').map(ip => ip.trim());
            if (ips.length > 0 && ips[0]) {
                return ips[0];
            }
        }

        // Check X-Real-IP header (nginx reverse proxy standard)
        const realIP = req.headers['x-real-ip'];
        if (realIP && typeof realIP === 'string') {
            return realIP.trim();
        }

        // Check Cloudflare's CF-Connecting-IP header
        const cfIP = req.headers['cf-connecting-ip'];
        if (cfIP && typeof cfIP === 'string') {
            return cfIP.trim();
        }

        // Check req.ip (Express provides this, respects trust proxy setting)
        if (req.ip) {
            return req.ip;
        }

        // Fallback to connection remote address
        if (req.connection && req.connection.remoteAddress) {
            return req.connection.remoteAddress;
        }

        // Final fallback to socket remote address
        if (req.socket && req.socket.remoteAddress) {
            return req.socket.remoteAddress;
        }

        // Return null if no IP can be extracted
        return null;
    } catch (error) {
        console.error('Error extracting IP address:', error);
        return null;
    }
};

/**
 * Extract user agent string from request headers
 * Returns the User-Agent header which contains browser/client information
 * Used for audit logging to track which client made the request
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} - User agent string or null if not found
 */
export const extractUserAgent = (req) => {
    try {
        // Get User-Agent header
        const userAgent = req.headers['user-agent'];

        if (!userAgent) {
            return null;
        }

        // Ensure it's a string and not an array (shouldn't happen with user-agent, but be safe)
        if (typeof userAgent === 'string') {
            return userAgent.trim();
        }

        // If it's an array, join it (edge case)
        if (Array.isArray(userAgent)) {
            return userAgent.join(', ').trim();
        }

        return null;
    } catch (error) {
        console.error('Error extracting user agent:', error);
        return null;
    }
};

/**
 * Extract complete request context for audit logging
 * Combines IP address and user agent extraction in a single call
 * Returns an object with both values for convenience
 * 
 * @param {Object} req - Express request object
 * @returns {Object} - { ipAddress: string|null, userAgent: string|null }
 */
export const extractRequestContext = (req) => {
    return {
        ipAddress: extractIPAddress(req),
        userAgent: extractUserAgent(req)
    };
};

/**
 * Truncate user agent string to fit database constraints
 * User agent can be very long, so we truncate to specified length
 * Default max length is 255 chars (common VARCHAR limit)
 * 
 * @param {string|null} userAgent - User agent string
 * @param {number} maxLength - Maximum length (default: 255)
 * @returns {string|null} - Truncated user agent or null
 */
export const truncateUserAgent = (userAgent, maxLength = 255) => {
    if (!userAgent || typeof userAgent !== 'string') {
        return null;
    }

    if (userAgent.length <= maxLength) {
        return userAgent;
    }

    // Truncate and add ellipsis
    return userAgent.substring(0, maxLength - 3) + '...';
};

/**
 * Validate IP address format (IPv4 or IPv6)
 * Useful for sanity checking extracted IP addresses
 * 
 * @param {string|null} ip - IP address to validate
 * @returns {boolean} - True if valid IPv4 or IPv6 format
 */
export const isValidIPAddress = (ip) => {
    if (!ip || typeof ip !== 'string') {
        return false;
    }

    // IPv4 regex pattern
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    // IPv6 regex pattern (simplified, covers most cases)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

    // Check if it matches IPv4
    if (ipv4Regex.test(ip)) {
        // Validate each octet is 0-255
        const octets = ip.split('.');
        return octets.every(octet => {
            const num = parseInt(octet, 10);
            return num >= 0 && num <= 255;
        });
    }

    // Check if it matches IPv6 (basic check)
    if (ipv6Regex.test(ip)) {
        return true;
    }

    // Check for IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
    const ipv4MappedRegex = /^::ffff:(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4MappedRegex.test(ip)) {
        return true;
    }

    return false;
};

// Export all functions as default object for convenience
export default {
    extractIPAddress,
    extractUserAgent,
    extractRequestContext,
    truncateUserAgent,
    isValidIPAddress
};
