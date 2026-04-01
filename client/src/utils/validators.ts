// src/utils/validators.ts
import DOMPurify from 'dompurify';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class Validator {
  // XSS Prevention - Sanitize user input
  static sanitize(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
    });
  }

  static required(value: any, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  static email(value: string): string | null {
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static phone(value: string): string | null {
    // International phone number validation
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{4,6}$/;
    if (value && !phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  static password(value: string): string | null {
    if (!value) return 'Password is required';
    
    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasMinLength) {
      return 'Password must be at least 8 characters';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    
    return null;
  }

  static minLength(value: string, min: number, fieldName: string): string | null {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  }

  static maxLength(value: string, max: number, fieldName: string): string | null {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  }

  static numeric(value: any, fieldName: string): string | null {
    if (value && isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  }

  static min(value: number, min: number, fieldName: string): string | null {
    if (value !== undefined && value !== null && value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  }

  static max(value: number, max: number, fieldName: string): string | null {
    if (value !== undefined && value !== null && value > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  }

  static url(value: string): string | null {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'URL must use HTTP or HTTPS protocol';
      }
      return null;
    } catch {
      return value ? 'Please enter a valid URL' : null;
    }
  }

  static validatePropertyForm(data: any): ValidationResult {
    const errors: Record<string, string> = {};
    
    // Sanitize string inputs
    const sanitizedTitle = data.title ? this.sanitize(data.title) : '';
    const sanitizedAddress = data.address ? this.sanitize(data.address) : '';
    const sanitizedDescription = data.description ? this.sanitize(data.description) : '';
    
    const titleError = this.required(sanitizedTitle, 'Title');
    if (titleError) errors.title = titleError;
    else if (sanitizedTitle.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    const priceError = this.required(data.price, 'Price');
    if (priceError) errors.price = priceError;
    else {
      const minPriceError = this.min(data.price, 0, 'Price');
      if (minPriceError) errors.price = minPriceError;
      const maxPriceError = this.max(data.price, 100000000, 'Price');
      if (maxPriceError) errors.price = maxPriceError;
    }
    
    const addressError = this.required(sanitizedAddress, 'Address');
    if (addressError) errors.address = addressError;
    
    if (sanitizedDescription) {
      const maxLengthError = this.maxLength(sanitizedDescription, 2000, 'Description');
      if (maxLengthError) errors.description = maxLengthError;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateUserRegistration(data: any): ValidationResult {
    const errors: Record<string, string> = {};
    
    const sanitizedName = data.name ? this.sanitize(data.name) : '';
    const sanitizedEmail = data.email ? this.sanitize(data.email) : '';
    
    const nameError = this.required(sanitizedName, 'Name');
    if (nameError) errors.name = nameError;
    else if (sanitizedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    const emailError = this.required(sanitizedEmail, 'Email');
    if (emailError) errors.email = emailError;
    else {
      const emailFormatError = this.email(sanitizedEmail);
      if (emailFormatError) errors.email = emailFormatError;
    }
    
    const passwordError = this.required(data.password, 'Password');
    if (passwordError) errors.password = passwordError;
    else {
      const passwordStrengthError = this.password(data.password);
      if (passwordStrengthError) errors.password = passwordStrengthError;
    }
    
    if (data.phone) {
      const phoneError = this.phone(data.phone);
      if (phoneError) errors.phone = phoneError;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateLogin(data: any): ValidationResult {
    const errors: Record<string, string> = {};
    
    const sanitizedEmail = data.email ? this.sanitize(data.email) : '';
    
    const emailError = this.required(sanitizedEmail, 'Email');
    if (emailError) errors.email = emailError;
    else {
      const emailFormatError = this.email(sanitizedEmail);
      if (emailFormatError) errors.email = emailFormatError;
    }
    
    const passwordError = this.required(data.password, 'Password');
    if (passwordError) errors.password = passwordError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}