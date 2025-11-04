<template>
  <div :class="styles.authCard">
    <!-- Main Card Content -->
    <div :class="styles.cardContent">
      <!-- Left Column - Form -->
      <div :class="styles.formColumn">
        <!-- Enhanced Avatar Section -->
        <div :class="styles.avatarSection">
            <div :class="[styles.avatar, isLogin ? styles.avatarLogin : styles.avatarRegister]">
            <div :class="styles.avatarRing"></div>
            <img 
              src="/News-Logo.png" 
              alt="News Logo"
              :class="styles.avatarIcon"
            />
            </div>
          <div :class="styles.avatarLabel">
            {{ isLogin ? 'Welcome Back' : 'Create Account' }}
          </div>
        </div>

        <form :class="styles.authForm" @submit.prevent="handleSubmit">
          <!-- Enhanced Input Groups -->
          <!-- Two-column layout for registration fields -->
          <div v-if="!isLogin" :class="styles.inputRow">
            <div :class="styles.inputGroup">
              <label :for="usernameId" :class="styles.label">
                <span :class="styles.labelIcon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                Email Address
              </label>
              <div :class="styles.inputWrapper">
                <input
                  :id="usernameId"
                  v-model="formData.username"
                  type="text"
                  :class="[styles.input, formErrors.username ? styles.inputError : '']"
                  autocomplete="email"
                  placeholder="Enter your email address"
                  @blur="validateField('username')"
                  required
                />
                <div :class="styles.inputFocus"></div>
              </div>
              <div v-if="formErrors.username" :class="styles.errorMessage">
                {{ formErrors.username }}
              </div>
            </div>

            <div :class="styles.inputGroup">
              <label :for="fullNameId" :class="styles.label">
                <span :class="styles.labelIcon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                Full Name
              </label>
              <div :class="styles.inputWrapper">
                <input
                  :id="fullNameId"
                  v-model="formData.fullName"
                  type="text"
                  :class="[styles.input, formErrors.fullName ? styles.inputError : '']"
                  autocomplete="name"
                  placeholder="Enter your full name"
                  @blur="validateField('fullName')"
                  required
                />
                <div :class="styles.inputFocus"></div>
              </div>
              <div v-if="formErrors.fullName" :class="styles.errorMessage">
                {{ formErrors.fullName }}
              </div>
            </div>
          </div>

          <!-- Single field for login -->
          <div v-if="isLogin" :class="styles.inputGroup">
            <label :for="usernameId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Username or Email
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="usernameId"
                v-model="formData.username"
                type="text"
                :class="[styles.input, formErrors.username ? styles.inputError : '']"
                autocomplete="username"
                placeholder="Enter your username or email"
                @blur="validateField('username')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.username" :class="styles.errorMessage">
              {{ formErrors.username }}
            </div>
          </div>

          <div :class="styles.inputGroup">
            <label :for="passwordId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Password
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="passwordId"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :class="[styles.input, styles.passwordInput, formErrors.password ? styles.inputError : '']"
                :autocomplete="isLogin ? 'current-password' : 'new-password'"
                placeholder="Enter your password"
                @blur="validateField('password')"
                required
              />
              <button 
                type="button" 
                :class="styles.passwordToggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.password" :class="styles.errorMessage">
              {{ formErrors.password }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label :for="confirmPasswordId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Confirm Password
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="confirmPasswordId"
                v-model="formData.confirmPassword"
                type="password"
                :class="[styles.input, formErrors.confirmPassword ? styles.inputError : '']"
                autocomplete="new-password"
                placeholder="Confirm your password"
                @blur="validateField('confirmPassword')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.confirmPassword" :class="styles.errorMessage">
              {{ formErrors.confirmPassword }}
            </div>
          </div>

          <!-- Enhanced Checkbox for Login -->
          <div v-if="isLogin" :class="styles.checkboxGroup">
            <label :class="styles.checkboxLabel">
              <input
                :id="rememberMeId"
                v-model="formData.rememberMe"
                type="checkbox"
                :class="styles.checkbox"
              />
              <span :class="styles.checkboxCustom">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Remember me for 30 days
            </label>
          </div>

          <!-- Enhanced Submit Button -->
          <button type="submit" :class="[styles.primaryButton, isSubmitting ? styles.buttonLoading : '']" :disabled="isSubmitting">
            <span v-if="!isSubmitting" :class="styles.buttonContent">
              <span :class="styles.buttonIcon">
                <svg v-if="isLogin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M23 11H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              {{ isLogin ? 'Sign In' : 'Create Account' }}
            </span>
            <span v-else :class="styles.buttonSpinner">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </span>
          </button>

          <div v-if="isLogin" :class="styles.forgotPassword">
            <a href="#" :class="styles.secondaryLink">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Forgot your password?
            </a>
          </div>
        </form>
      </div>

      <!-- Right Column - Enhanced Hero Text -->
      <div :class="styles.heroColumn">
        <div :class="styles.heroContent">
          <div :class="styles.heroDecoration">
            <div :class="styles.heroPattern"></div>
          </div>
          
          <h1 :class="styles.heroTitle">
            {{ isLogin ? 'Welcome.' : 'Join Us.' }}
            <span :class="styles.titleAccent">{{ isLogin ? 'Back.' : '' }}</span>
          </h1>
          
          <p :class="styles.heroSubtitle">
            {{
              isLogin
                ? 'Access your WPC | WeaponpowerCloud App dashboard and continue your innovation journey with cutting-edge technology and seamless experiences.'
                : 'Begin your journey with WPC | WeaponpowerCloud App and unlock access to next-generation tools, insights, and innovation platforms designed for the future.'
            }}
          </p>
          
          <div :class="styles.heroFeatures">
            <div :class="styles.feature">
              <span :class="styles.featureIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>Enterprise-grade security</span>
            </div>
            <div :class="styles.feature">
              <span :class="styles.featureIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>Lightning-fast performance</span>
            </div>
            <div :class="styles.feature">
              <span :class="styles.featureIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>Advanced analytics</span>
            </div>
          </div>
          
          <div :class="styles.authToggle">
            <span :class="styles.toggleText">
              {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
            </span>
            <button
              type="button"
              :class="styles.toggleButton"
              @click="toggleAuthMode"
            >
              <span :class="styles.toggleIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              {{ isLogin ? 'Create new account' : 'Sign in instead' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import styles from './AuthCard.module.css'

interface Props {
  isLogin?: boolean
}

interface Emits {
  (e: 'toggle-auth-mode'): void
  (e: 'submit', data: any): void
}

const { isLogin = true } = defineProps<Props>()

const emit = defineEmits<Emits>()

// Generate unique IDs for form elements
const usernameId = computed(() => `username-${Math.random().toString(36).substr(2, 9)}`)
const fullNameId = computed(() => `fullname-${Math.random().toString(36).substr(2, 9)}`)
const passwordId = computed(() => `password-${Math.random().toString(36).substr(2, 9)}`)
const confirmPasswordId = computed(() => `confirm-password-${Math.random().toString(36).substr(2, 9)}`)
const rememberMeId = computed(() => `remember-me-${Math.random().toString(36).substr(2, 9)}`)

// Form state
const showPassword = ref(false)
const isSubmitting = ref(false)

// Form data
const formData = ref({
  username: '',
  fullName: '',
  password: '',
  confirmPassword: '',
  rememberMe: false
})

// Form validation
const formErrors = reactive({
  username: '',
  fullName: '',
  password: '',
  confirmPassword: ''
})

// Validation functions
const validateField = (fieldName: string) => {
  switch (fieldName) {
    case 'username':
      if (!formData.value.username.trim()) {
        formErrors.username = isLogin ? 'Username or email is required' : 'Email address is required'
      } else if (!isLogin && !isValidEmail(formData.value.username)) {
        formErrors.username = 'Please enter a valid email address'
      } else {
        formErrors.username = ''
      }
      break
    
    case 'fullName':
      if (!isLogin) {
        if (!formData.value.fullName.trim()) {
          formErrors.fullName = 'Full name is required'
        } else if (formData.value.fullName.trim().length < 2) {
          formErrors.fullName = 'Full name must be at least 2 characters'
        } else {
          formErrors.fullName = ''
        }
      }
      break
    
    case 'password':
      if (!formData.value.password) {
        formErrors.password = 'Password is required'
      } else if (!isLogin && formData.value.password.length < 8) {
        formErrors.password = 'Password must be at least 8 characters'
      } else {
        formErrors.password = ''
      }
      break
    
    case 'confirmPassword':
      if (!isLogin) {
        if (!formData.value.confirmPassword) {
          formErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.value.password !== formData.value.confirmPassword) {
          formErrors.confirmPassword = 'Passwords do not match'
        } else {
          formErrors.confirmPassword = ''
        }
      }
      break
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = (): boolean => {
  validateField('username')
  validateField('password')
  
  if (!isLogin) {
    validateField('fullName')
    validateField('confirmPassword')
  }
  
  return !formErrors.username && !formErrors.fullName && !formErrors.password && !formErrors.confirmPassword
}

// Methods
const toggleAuthMode = () => {
  emit('toggle-auth-mode')
  // Reset form when toggling
  formData.value = {
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  }
  
  // Clear errors
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = ''
  })
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    emit('submit', { ...formData.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>
