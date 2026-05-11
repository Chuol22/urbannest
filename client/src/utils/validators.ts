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
      return 'Please enter a valid phone number (e.g., +251912345678)';
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

  // ============ REGISTRATION VALIDATION (UPDATED FOR BACKEND) ============
  static validateUserRegistration(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    role?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};
    
    const sanitizedFirstName = data.first_name ? this.sanitize(data.first_name) : '';
    const sanitizedLastName = data.last_name ? this.sanitize(data.last_name) : '';
    const sanitizedEmail = data.email ? this.sanitize(data.email) : '';
    const sanitizedPhone = data.phone ? this.sanitize(data.phone) : '';
    
    // Validate First Name
    const firstNameError = this.required(sanitizedFirstName, 'First name');
    if (firstNameError) errors.first_name = firstNameError;
    else if (sanitizedFirstName.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }
    
    // Validate Last Name
    const lastNameError = this.required(sanitizedLastName, 'Last name');
    if (lastNameError) errors.last_name = lastNameError;
    else if (sanitizedLastName.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }
    
    // Validate Email
    const emailError = this.required(sanitizedEmail, 'Email');
    if (emailError) errors.email = emailError;
    else {
      const emailFormatError = this.email(sanitizedEmail);
      if (emailFormatError) errors.email = emailFormatError;
    }
    
    // Validate Phone (now required)
    const phoneError = this.required(sanitizedPhone, 'Phone number');
    if (phoneError) errors.phone = phoneError;
    else {
      const phoneFormatError = this.phone(sanitizedPhone);
      if (phoneFormatError) errors.phone = phoneFormatError;
    }
    
    // Validate Password
    const passwordError = this.required(data.password, 'Password');
    if (passwordError) errors.password = passwordError;
    else {
      const passwordStrengthError = this.password(data.password);
      if (passwordStrengthError) errors.password = passwordStrengthError;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ============ LOGIN VALIDATION ============
  static validateLogin(data: { email: string; password: string }): ValidationResult {
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

  // ============ PROPERTY FORM VALIDATION ============
  static validatePropertyForm(data: any): ValidationResult {
    const errors: Record<string, string> = {};
    
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
}

// Export a simple object for backward compatibility
export const validator = {
  validateLogin: (data: any) => Validator.validateLogin(data),
  validateUserRegistration: (data: any) => Validator.validateUserRegistration(data),
  validatePropertyForm: (data: any) => Validator.validatePropertyForm(data),
  required: Validator.required.bind(Validator),
  email: Validator.email.bind(Validator),
  phone: Validator.phone.bind(Validator),
  password: Validator.password.bind(Validator),
  sanitize: Validator.sanitize.bind(Validator),
};