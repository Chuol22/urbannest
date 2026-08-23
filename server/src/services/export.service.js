// server/src/services/export.service.js

/**
 * Export Service
 * Handles CSV export functionality with formula injection prevention and UTF-8 encoding
 * Requirements: 17.1, 17.2, 17.4, 17.8, 17.9
 */
class ExportService {
    /**
     * Sanitize cell value to prevent formula injection attacks
     * Prefixes values starting with =, +, -, @ with a single quote
     * @param {any} value - Cell value to sanitize
     * @returns {any} - Sanitized value
     * 
     * Requirements:
     * - Prevent formula injection (17.9)
     * - Prefix =, +, -, @ with single quote (17.9)
     */
    sanitizeCell(value) {
        // Check if value is a string and starts with formula characters
        if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
            return `'${value}`;
        }
        return value;
    }

    /**
     * Convert array of objects to CSV format with proper escaping
     * @param {Array<Object>} data - Array of data objects to convert
     * @param {Array<Object>} columns - Column definitions with label and accessor
     *        Each column: { label: string, accessor: function(row) => value }
     * @returns {string} - CSV formatted string with UTF-8 encoding
     * 
     * Requirements:
     * - Include column headers with human-readable names (17.2)
     * - Proper CSV escaping (17.9)
     * - UTF-8 encoding support (17.8)
     */
    toCsv(data, columns) {
        // Create header row with column labels
        const header = columns.map(col => `"${col.label}"`).join(',');

        // Create data rows
        const rows = data.map(row => {
            return columns.map(col => {
                // Extract value using column accessor function
                const value = col.accessor(row);

                // Sanitize value to prevent formula injection
                const sanitized = this.sanitizeCell(value);

                // Convert to string, escape double quotes by doubling them, and wrap in quotes
                // Handle null/undefined values
                const stringValue = sanitized === null || sanitized === undefined ? '' : String(sanitized);
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(',');
        });

        // Combine header and rows with newline separator
        // UTF-8 encoding is handled automatically by Node.js string encoding
        return [header, ...rows].join('\n');
    }

    /**
     * Generate filename with timestamp for CSV export
     * @param {string} prefix - Prefix for the filename (e.g., 'users', 'payments', 'audit-logs')
     * @returns {string} - Filename with timestamp in format: prefix-YYYY-MM-DDTHH-MM-SS-mmmZ.csv
     * 
     * Requirements:
     * - Include timestamp in filename (17.10)
     */
    generateFilename(prefix) {
        // Get current timestamp in ISO format and replace colons and dots with dashes
        // Format: YYYY-MM-DDTHH-MM-SS-mmmZ
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `${prefix}-${timestamp}.csv`;
    }
}

// Export as singleton instance (default export)
export default new ExportService();

// Also export as named export for flexibility
export const exportService = new ExportService();
