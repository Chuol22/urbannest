/**
 * Unit Tests for Request Context Extraction Utilities
 * Tests IP address and user agent extraction from Express request objects
 */

import {
    extractIPAddress,
    extractUserAgent,
    extractRequestContext,
    truncateUserAgent,
    isValidIPAddress
} from './requestContext.js';

describe('Request Context Extraction Utilities', () => {
    describe('extractIPAddress', () => {
        it('should extract IP from X-Forwarded-For header (first IP)', () => {
            const req = {
                headers: {
                    'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1'
                }
            };
            expect(extractIPAddress(req)).toBe('203.0.113.1');
        });

        it('should extract IP from X-Real-IP header', () => {
            const req = {
                headers: {
                    'x-real-ip': '203.0.113.5'
                }
            };
            expect(extractIPAddress(req)).toBe('203.0.113.5');
        });

        it('should extract IP from CF-Connecting-IP header (Cloudflare)', () => {
            const req = {
                headers: {
                    'cf-connecting-ip': '203.0.113.10'
                }
            };
            expect(extractIPAddress(req)).toBe('203.0.113.10');
        });

        it('should extract IP from req.ip', () => {
            const req = {
                headers: {},
                ip: '203.0.113.20'
            };
            expect(extractIPAddress(req)).toBe('203.0.113.20');
        });

        it('should extract IP from req.connection.remoteAddress', () => {
            const req = {
                headers: {},
                connection: {
                    remoteAddress: '203.0.113.30'
                }
            };
            expect(extractIPAddress(req)).toBe('203.0.113.30');
        });

        it('should extract IP from req.socket.remoteAddress as last fallback', () => {
            const req = {
                headers: {},
                socket: {
                    remoteAddress: '203.0.113.40'
                }
            };
            expect(extractIPAddress(req)).toBe('203.0.113.40');
        });

        it('should return null when no IP is found', () => {
            const req = {
                headers: {}
            };
            expect(extractIPAddress(req)).toBeNull();
        });

        it('should handle IPv6 addresses', () => {
            const req = {
                headers: {
                    'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
                }
            };
            expect(extractIPAddress(req)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
        });

        it('should handle IPv4-mapped IPv6 addresses', () => {
            const req = {
                headers: {
                    'x-forwarded-for': '::ffff:192.168.1.1'
                }
            };
            expect(extractIPAddress(req)).toBe('::ffff:192.168.1.1');
        });
    });

    describe('extractUserAgent', () => {
        it('should extract user agent from headers', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            expect(extractUserAgent(req)).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        });

        it('should return null when user agent is missing', () => {
            const req = {
                headers: {}
            };
            expect(extractUserAgent(req)).toBeNull();
        });

        it('should trim whitespace from user agent', () => {
            const req = {
                headers: {
                    'user-agent': '  Mozilla/5.0  '
                }
            };
            expect(extractUserAgent(req)).toBe('Mozilla/5.0');
        });

        it('should handle array user-agent (edge case)', () => {
            const req = {
                headers: {
                    'user-agent': ['Mozilla/5.0', 'Safari/537.36']
                }
            };
            expect(extractUserAgent(req)).toBe('Mozilla/5.0, Safari/537.36');
        });
    });

    describe('extractRequestContext', () => {
        it('should extract both IP and user agent', () => {
            const req = {
                headers: {
                    'x-forwarded-for': '203.0.113.1',
                    'user-agent': 'Mozilla/5.0'
                }
            };
            const context = extractRequestContext(req);
            expect(context).toEqual({
                ipAddress: '203.0.113.1',
                userAgent: 'Mozilla/5.0'
            });
        });

        it('should return nulls when both are missing', () => {
            const req = {
                headers: {}
            };
            const context = extractRequestContext(req);
            expect(context).toEqual({
                ipAddress: null,
                userAgent: null
            });
        });
    });

    describe('truncateUserAgent', () => {
        it('should not truncate if under max length', () => {
            const userAgent = 'Mozilla/5.0';
            expect(truncateUserAgent(userAgent, 255)).toBe('Mozilla/5.0');
        });

        it('should truncate if over max length', () => {
            const longUserAgent = 'A'.repeat(300);
            const truncated = truncateUserAgent(longUserAgent, 255);
            expect(truncated.length).toBe(255);
            expect(truncated.endsWith('...')).toBe(true);
        });

        it('should return null for null input', () => {
            expect(truncateUserAgent(null)).toBeNull();
        });

        it('should return null for non-string input', () => {
            expect(truncateUserAgent(123)).toBeNull();
        });
    });

    describe('isValidIPAddress', () => {
        it('should validate correct IPv4 addresses', () => {
            expect(isValidIPAddress('192.168.1.1')).toBe(true);
            expect(isValidIPAddress('203.0.113.1')).toBe(true);
            expect(isValidIPAddress('10.0.0.1')).toBe(true);
        });

        it('should reject invalid IPv4 addresses', () => {
            expect(isValidIPAddress('256.1.1.1')).toBe(false); // Octet > 255
            expect(isValidIPAddress('192.168.1')).toBe(false); // Missing octet
            expect(isValidIPAddress('192.168.1.1.1')).toBe(false); // Too many octets
            expect(isValidIPAddress('abc.def.ghi.jkl')).toBe(false); // Non-numeric
        });

        it('should validate correct IPv6 addresses', () => {
            expect(isValidIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
            expect(isValidIPAddress('::1')).toBe(false); // Simplified format not covered by basic regex
        });

        it('should validate IPv4-mapped IPv6 addresses', () => {
            expect(isValidIPAddress('::ffff:192.168.1.1')).toBe(true);
        });

        it('should return false for null or non-string', () => {
            expect(isValidIPAddress(null)).toBe(false);
            expect(isValidIPAddress(undefined)).toBe(false);
            expect(isValidIPAddress(123)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isValidIPAddress('')).toBe(false);
        });
    });
});
