// Input validation and sanitization utilities
// Implements comprehensive input validation to prevent XSS and injection attacks

import * as yup from 'yup'

// Environment-based validation settings
const maxLengths = {
  title: parseInt(import.meta.env.VITE_INPUT_MAX_LENGTHS_TITLE) || 255,
  description: parseInt(import.meta.env.VITE_INPUT_MAX_LENGTHS_DESCRIPTION) || 1000,
  question: parseInt(import.meta.env.VITE_INPUT_MAX_LENGTHS_QUESTION) || 500,
  option: parseInt(import.meta.env.VITE_INPUT_MAX_LENGTHS_OPTION) || 200,
  email: 254, // RFC standard
  password: 128,
  name: 100,
  url: 2048,
  phone: 15
}

// Dangerous HTML patterns that should be stripped or encoded
const htmlPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi // onclick, onload, etc.
]

// SQL injection patterns
const sqlPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(UNION\s+SELECT)/gi,
  /(--|#|\/\*|\*\/)/g,
  /('|"|;)/g
]

/**
 * Sanitizes HTML input by removing dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  let sanitized = input
  
  // Remove dangerous HTML patterns
  htmlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Encode remaining HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized.trim()
}

/**
 * Strips potential SQL injection patterns
 */
export function sanitizeSql(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  let sanitized = input
  
  // Remove SQL injection patterns
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  return sanitized.trim()
}

/**
 * General input sanitization for form inputs
 */
export function sanitizeInput(input: string, options?: {
  allowHtml?: boolean
  maxLength?: number
  stripSql?: boolean
}): string {
  if (!input || typeof input !== 'string') return ''
  
  const opts = {
    allowHtml: false,
    stripSql: true,
    ...options
  }
  
  let sanitized = input.trim()
  
  // Apply length limit
  if (opts.maxLength && sanitized.length > opts.maxLength) {
    sanitized = sanitized.substring(0, opts.maxLength)
  }
  
  // Strip SQL patterns if requested
  if (opts.stripSql) {
    sanitized = sanitizeSql(sanitized)
  }
  
  // Sanitize HTML if not explicitly allowed
  if (!opts.allowHtml) {
    sanitized = sanitizeHtml(sanitized)
  }
  
  return sanitized
}

// Common validation schemas using Yup
export const validationSchemas = {
  email: yup.string()
    .email('Please enter a valid email address')
    .max(maxLengths.email, `Email must be less than ${maxLengths.email} characters`)
    .required('Email is required'),
    
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .max(maxLengths.password, `Password must be less than ${maxLengths.password} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('Password is required'),
    
  name: yup.string()
    .max(maxLengths.name, `Name must be less than ${maxLengths.name} characters`)
    .matches(/^[a-zA-Z\s-'.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .required('Name is required'),
    
  title: yup.string()
    .max(maxLengths.title, `Title must be less than ${maxLengths.title} characters`)
    .required('Title is required'),
    
  description: yup.string()
    .max(maxLengths.description, `Description must be less than ${maxLengths.description} characters`),
    
  question: yup.string()
    .max(maxLengths.question, `Question must be less than ${maxLengths.question} characters`)
    .required('Question is required'),
    
  option: yup.string()
    .max(maxLengths.option, `Option must be less than ${maxLengths.option} characters`)
    .required('Option is required'),
    
  url: yup.string()
    .url('Please enter a valid URL')
    .max(maxLengths.url, `URL must be less than ${maxLengths.url} characters`),
    
  phone: yup.string()
    .matches(/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .max(maxLengths.phone, `Phone number must be less than ${maxLengths.phone} characters`)
}

/**
 * Validates input against common patterns
 */
export function validateInput(input: string, type: keyof typeof validationSchemas): {
  isValid: boolean
  error?: string
  sanitized: string
} {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      error: 'Input is required',
      sanitized: ''
    }
  }
  
  // Sanitize input first
  const sanitized = sanitizeInput(input, {
    maxLength: maxLengths[type as keyof typeof maxLengths],
    allowHtml: false,
    stripSql: true
  })
  
  try {
    // Validate using Yup schema
    validationSchemas[type].validateSync(sanitized)
    
    return {
      isValid: true,
      sanitized
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Validation failed',
      sanitized
    }
  }
}

/**
 * Batch validation for form objects
 */
export async function validateForm<T extends Record<string, any>>(
  formData: T,
  schema: yup.ObjectSchema<any>
): Promise<{
  isValid: boolean
  errors: Record<string, string>
  sanitizedData: Partial<T>
}> {
  const errors: Record<string, string> = {}
  const sanitizedData: Partial<T> = { ...formData }
  
  // First sanitize all string values
  Object.keys(formData).forEach(key => {
    if (typeof formData[key] === 'string') {
      (sanitizedData as any)[key] = sanitizeInput(formData[key])
    }
  })
  
  try {
    // Validate the sanitized data
    await schema.validate(sanitizedData, { abortEarly: false })
    
    return {
      isValid: true,
      errors: {},
      sanitizedData
    }
  } catch (error: any) {
    // Collect validation errors
    if (error.inner) {
      error.inner.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message
        }
      })
    }
    
    return {
      isValid: false,
      errors,
      sanitizedData
    }
  }
}

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0
  
  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isStrong: false
    }
  }
  
  // Length check
  if (password.length >= 8) score++
  else feedback.push('Use at least 8 characters')
  
  // Lowercase check
  if (/[a-z]/.test(password)) score++
  else feedback.push('Include lowercase letters')
  
  // Uppercase check
  if (/[A-Z]/.test(password)) score++
  else feedback.push('Include uppercase letters')
  
  // Number check
  if (/\d/.test(password)) score++
  else feedback.push('Include numbers')
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  else feedback.push('Include special characters')
  
  // Additional checks
  if (password.length >= 12) score++
  
  const isStrong = score >= 4
  
  if (feedback.length === 0) {
    feedback.push(isStrong ? 'Strong password!' : 'Good password')
  }
  
  return {
    score: Math.min(score, 4),
    feedback,
    isStrong
  }
}

export { maxLengths }
