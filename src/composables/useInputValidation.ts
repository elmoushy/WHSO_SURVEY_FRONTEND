import { ref } from 'vue'

export type ValidationType = 'none' | 'email' | 'phone' | 'number' | 'url'

export interface ValidationResult {
  valid: boolean
  error: string
}

export interface InputConfig {
  type: string
  pattern?: string
  placeholder: string
  inputmode?: string
}

export function useInputValidation() {
  const validationErrors = ref<Record<string, string>>({})

  // Get input configuration based on validation type
  const getInputConfig = (validationType: ValidationType): InputConfig => {
    const configs: Record<ValidationType, InputConfig> = {
      none: {
        type: 'text',
        placeholder: ''
      },
      email: {
        type: 'email',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        placeholder: 'example@domain.com'
      },
      phone: {
        type: 'tel',
        pattern: '[+]?[0-9]{7,15}',
        placeholder: '+971501234567',
        inputmode: 'numeric'
      },
      number: {
        type: 'number',
        pattern: '-?[0-9]+([.,][0-9]+)?',
        placeholder: '123',
        inputmode: 'decimal'
      },
      url: {
        type: 'url',
        pattern: 'https?://.+',
        placeholder: 'https://example.com'
      }
    }

    return configs[validationType] || configs.none
  }

  // Validate answer based on validation type
  const validateAnswer = (
    validationType: ValidationType,
    value: string,
    isRequired: boolean
  ): ValidationResult => {
    // Check if required and empty
    if (!value && isRequired) {
      return {
        valid: false,
        error: 'هذا السؤال مطلوب / This question is required'
      }
    }

    // If not required and empty, it's valid
    if (!value) {
      return { valid: true, error: '' }
    }

    // Validate based on type
    switch (validationType) {
      case 'email': {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return {
          valid: emailRegex.test(value),
          error: emailRegex.test(value)
            ? ''
            : 'يرجى إدخال عنوان بريد إلكتروني صحيح / Please enter a valid email address'
        }
      }

      case 'phone': {
        const phoneRegex = /^[+]?[0-9]{7,15}$/
        const cleaned = value.replace(/[\s-]/g, '')
        return {
          valid: phoneRegex.test(cleaned),
          error: phoneRegex.test(cleaned)
            ? ''
            : 'يرجى إدخال رقم هاتف صحيح (أرقام فقط) / Please enter a valid phone number (numbers only)'
        }
      }

      case 'number': {
        const numberRegex = /^-?[0-9]+([.,][0-9]+)?$/
        return {
          valid: numberRegex.test(value),
          error: numberRegex.test(value)
            ? ''
            : 'يرجى إدخال رقم صحيح / Please enter a valid number'
        }
      }

      case 'url': {
        const urlRegex = /^https?:\/\/.+/
        return {
          valid: urlRegex.test(value),
          error: urlRegex.test(value)
            ? ''
            : 'يرجى إدخال رابط صحيح / Please enter a valid URL'
        }
      }

      case 'none':
      default:
        return { valid: true, error: '' }
    }
  }

  // Set validation error for a specific question
  const setValidationError = (questionId: string, error: string) => {
    validationErrors.value[questionId] = error
  }

  // Clear validation error for a specific question
  const clearValidationError = (questionId: string) => {
    delete validationErrors.value[questionId]
  }

  // Clear all validation errors
  const clearAllValidationErrors = () => {
    validationErrors.value = {}
  }

  // Get validation error for a specific question
  const getValidationError = (questionId: string): string => {
    return validationErrors.value[questionId] || ''
  }

  // Handle backend validation errors
  const handleBackendValidationErrors = (errors: Array<{
    question_id: string
    question_text: string
    error: string
  }>) => {
    clearAllValidationErrors()
    errors.forEach(err => {
      setValidationError(err.question_id, err.error)
    })
  }

  return {
    validationErrors,
    getInputConfig,
    validateAnswer,
    setValidationError,
    clearValidationError,
    clearAllValidationErrors,
    getValidationError,
    handleBackendValidationErrors
  }
}
