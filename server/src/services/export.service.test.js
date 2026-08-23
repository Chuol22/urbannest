// server/src/services/export.service.test.js
import { describe, test, expect } from '@jest/globals';
import exportService from './export.service.js';

describe('ExportService', () => {
    describe('sanitizeCell()', () => {
        test('should prefix formula injection characters with single quote', () => {
            expect(exportService.sanitizeCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
            expect(exportService.sanitizeCell('+1234567890')).toBe("'+1234567890");
            expect(exportService.sanitizeCell('-5000')).toBe("'-5000");
            expect(exportService.sanitizeCell('@user')).toBe("'@user");
        });

        test('should not modify non-formula strings', () => {
            expect(exportService.sanitizeCell('normal text')).toBe('normal text');
            expect(exportService.sanitizeCell('email@example.com')).toBe('email@example.com');
            expect(exportService.sanitizeCell('price: $100')).toBe('price: $100');
        });

        test('should not modify non-string values', () => {
            expect(exportService.sanitizeCell(123)).toBe(123);
            expect(exportService.sanitizeCell(true)).toBe(true);
            expect(exportService.sanitizeCell(null)).toBe(null);
            expect(exportService.sanitizeCell(undefined)).toBe(undefined);
        });

        test('should handle edge cases', () => {
            expect(exportService.sanitizeCell('')).toBe('');
            expect(exportService.sanitizeCell('=')).toBe("'=");
            expect(exportService.sanitizeCell('  =test')).toBe('  =test'); // Space before =
        });
    });

    describe('toCsv()', () => {
        test('should convert simple data to CSV with headers', () => {
            const data = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ];
            const columns = [
                { label: 'Name', accessor: (row) => row.name },
                { label: 'Age', accessor: (row) => row.age }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[0]).toBe('"Name","Age"');
            expect(lines[1]).toBe('"John","30"');
            expect(lines[2]).toBe('"Jane","25"');
        });

        test('should escape double quotes in cell values', () => {
            const data = [
                { title: 'The "Best" Property', price: 1000 }
            ];
            const columns = [
                { label: 'Title', accessor: (row) => row.title },
                { label: 'Price', accessor: (row) => row.price }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[1]).toBe('"The ""Best"" Property","1000"');
        });

        test('should sanitize formula injection in CSV data', () => {
            const data = [
                { formula: '=SUM(A1:A10)', command: '+COMMAND' },
                { formula: '-5000', command: '@user' }
            ];
            const columns = [
                { label: 'Formula', accessor: (row) => row.formula },
                { label: 'Command', accessor: (row) => row.command }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[1]).toBe("\"'=SUM(A1:A10)\",\"'+COMMAND\"");
            expect(lines[2]).toBe("\"'-5000\",\"'@user\"");
        });

        test('should handle null and undefined values', () => {
            const data = [
                { name: 'John', email: null, phone: undefined }
            ];
            const columns = [
                { label: 'Name', accessor: (row) => row.name },
                { label: 'Email', accessor: (row) => row.email },
                { label: 'Phone', accessor: (row) => row.phone }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[1]).toBe('"John","",""');
        });

        test('should handle special characters and UTF-8', () => {
            const data = [
                { name: 'François', city: 'São Paulo' },
                { name: '张伟', city: '北京' },
                { name: 'محمد', city: 'القاهرة' }
            ];
            const columns = [
                { label: 'Name', accessor: (row) => row.name },
                { label: 'City', accessor: (row) => row.city }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[0]).toBe('"Name","City"');
            expect(lines[1]).toBe('"François","São Paulo"');
            expect(lines[2]).toBe('"张伟","北京"');
            expect(lines[3]).toBe('"محمد","القاهرة"');
        });

        test('should handle empty data array', () => {
            const data = [];
            const columns = [
                { label: 'Name', accessor: (row) => row.name },
                { label: 'Age', accessor: (row) => row.age }
            ];

            const result = exportService.toCsv(data, columns);
            expect(result).toBe('"Name","Age"');
        });

        test('should handle commas in cell values', () => {
            const data = [
                { address: '123 Main St, Apt 4B', city: 'New York, NY' }
            ];
            const columns = [
                { label: 'Address', accessor: (row) => row.address },
                { label: 'City', accessor: (row) => row.city }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[1]).toBe('"123 Main St, Apt 4B","New York, NY"');
        });

        test('should handle newlines in cell values', () => {
            const data = [
                { description: 'Line 1\nLine 2\nLine 3' }
            ];
            const columns = [
                { label: 'Description', accessor: (row) => row.description }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            // Newlines within quoted fields are preserved
            expect(result).toContain('"Line 1\nLine 2\nLine 3"');
        });

        test('should use accessor function to transform data', () => {
            const data = [
                { user: { firstName: 'John', lastName: 'Doe' }, createdAt: new Date('2024-01-15') }
            ];
            const columns = [
                { label: 'Full Name', accessor: (row) => `${row.user.firstName} ${row.user.lastName}` },
                { label: 'Created', accessor: (row) => row.createdAt.toISOString().split('T')[0] }
            ];

            const result = exportService.toCsv(data, columns);
            const lines = result.split('\n');

            expect(lines[1]).toBe('"John Doe","2024-01-15"');
        });
    });

    describe('generateFilename()', () => {
        test('should generate filename with prefix and timestamp', () => {
            const prefix = 'users';
            const filename = exportService.generateFilename(prefix);

            expect(filename).toMatch(/^users-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/);
        });

        test('should generate different filenames for different prefixes', () => {
            const filename1 = exportService.generateFilename('users');
            const filename2 = exportService.generateFilename('payments');

            expect(filename1).toMatch(/^users-/);
            expect(filename2).toMatch(/^payments-/);
            expect(filename1).not.toBe(filename2);
        });

        test('should generate unique filenames when called multiple times', () => {
            const filename1 = exportService.generateFilename('audit-logs');
            // Small delay to ensure different timestamp
            const start = Date.now();
            while (Date.now() - start < 2) { } // 2ms delay
            const filename2 = exportService.generateFilename('audit-logs');

            expect(filename1).not.toBe(filename2);
        });

        test('should include .csv extension', () => {
            const filename = exportService.generateFilename('test');
            expect(filename).toMatch(/\.csv$/);
        });

        test('should handle various prefix formats', () => {
            expect(exportService.generateFilename('audit-logs')).toMatch(/^audit-logs-.*\.csv$/);
            expect(exportService.generateFilename('listing_export')).toMatch(/^listing_export-.*\.csv$/);
            expect(exportService.generateFilename('PaymentReport')).toMatch(/^PaymentReport-.*\.csv$/);
        });
    });

    describe('Integration', () => {
        test('should handle complete export workflow', () => {
            // Sample data with various edge cases
            const data = [
                {
                    id: '123',
                    name: 'John "The Boss" Doe',
                    email: 'john@example.com',
                    role: 'admin',
                    formula: '=SUM(A1:A10)',
                    createdAt: new Date('2024-01-15T10:30:00Z')
                },
                {
                    id: '456',
                    name: 'François',
                    email: null,
                    role: 'user',
                    formula: '+COMMAND',
                    createdAt: new Date('2024-01-16T14:45:00Z')
                }
            ];

            const columns = [
                { label: 'ID', accessor: (row) => row.id },
                { label: 'Full Name', accessor: (row) => row.name },
                { label: 'Email Address', accessor: (row) => row.email },
                { label: 'Role', accessor: (row) => row.role },
                { label: 'Formula', accessor: (row) => row.formula },
                { label: 'Created At', accessor: (row) => row.createdAt.toISOString() }
            ];

            // Generate CSV
            const csv = exportService.toCsv(data, columns);

            // Generate filename
            const filename = exportService.generateFilename('users');

            // Verify CSV structure
            const lines = csv.split('\n');
            expect(lines).toHaveLength(3); // Header + 2 data rows

            // Verify header
            expect(lines[0]).toBe('"ID","Full Name","Email Address","Role","Formula","Created At"');

            // Verify data sanitization and escaping
            expect(lines[1]).toContain('"John ""The Boss"" Doe"');
            expect(lines[1]).toContain("\"'=SUM(A1:A10)\"");
            expect(lines[2]).toContain('"François"');
            expect(lines[2]).toContain('""'); // null email becomes empty string
            expect(lines[2]).toContain("\"'+COMMAND\"");

            // Verify filename format
            expect(filename).toMatch(/^users-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/);
        });

        test('should handle large dataset export', () => {
            // Generate 1000 records
            const data = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
                email: `user${i}@example.com`
            }));

            const columns = [
                { label: 'ID', accessor: (row) => row.id },
                { label: 'Name', accessor: (row) => row.name },
                { label: 'Email', accessor: (row) => row.email }
            ];

            const csv = exportService.toCsv(data, columns);
            const lines = csv.split('\n');

            expect(lines).toHaveLength(1001); // Header + 1000 data rows
            expect(lines[0]).toBe('"ID","Name","Email"');
            expect(lines[1]).toBe('"0","User 0","user0@example.com"');
            expect(lines[1000]).toBe('"999","User 999","user999@example.com"');
        });
    });
});
