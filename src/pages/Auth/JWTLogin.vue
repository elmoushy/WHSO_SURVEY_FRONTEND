<template>
  <div :class="styles.loginPage" dir="rtl">
    <!-- Background Elements -->
    <div :class="styles.backgroundLayer">
      <div :class="styles.floatingParticles">
        <div v-for="i in 12" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
      </div>
      <div :class="styles.gridOverlay"></div>
    </div>
    
    <!-- Main Content -->
    <div :class="styles.pageContent">
      <div :class="styles.contentWrapper">

        <!-- JWT Auth Card -->
        <div :class="styles.authCard">
          <!-- Card Header -->
          <div :class="styles.cardHeader">
            <div :class="styles.welcomeBadge">
              <svg :class="styles.welcomeIcon" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10.5 6H15L11.5 9.5L13 15L8 12L3 15L4.5 9.5L1 6H5.5L8 1Z" fill="currentColor"/>
              </svg>
              <span>أهلاً وسهلاً</span>
            </div>
            <h1 :class="styles.title">تسجيل الدخول</h1>
<p :class="styles.subtitle">تسجيل الدخول عبر البريد الإلكتروني</p>
          </div>

          <div :class="styles.cardBody">
            <!-- Security Status Indicator -->
            <div v-if="isAccountLocked || attemptsRemaining > 0" style="margin-bottom: 1rem;">
              <SecurityStatusIndicator 
                :attempts-remaining="attemptsRemaining"
                :retry-after="lockoutTimeRemaining"
                :status="isAccountLocked ? 'error' : (attemptsRemaining <= 3 ? 'warning' : 'secure')"
                :show-countdown="isAccountLocked"
              />
            </div>

            <!-- Error Display -->
            <div v-if="hasError" :class="styles.errorAlert">
              <div :class="styles.errorIndicator">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
                  <path d="M8 4v4M8 10h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div :class="styles.errorContent">
                <h4>فشل في تسجيل الدخول</h4>
                <p>{{ error }}</p>
                <button @click="clearError" :class="styles.errorDismiss">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  إغلاق
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" :class="styles.loadingState">
              <div :class="styles.loadingContainer">
                <div :class="styles.loadingSpinner">
                  <div :class="styles.spinnerRing"></div>
                  <div :class="styles.spinnerRing"></div>
                  <div :class="styles.spinnerRing"></div>
                </div>
                <div :class="styles.loadingText">
                  <h4>جاري تسجيل الدخول</h4>
                  <p>يتم إنشاء اتصال آمن...</p>
                </div>
              </div>
            </div>

            <!-- Login Form -->
            <div v-else :class="styles.loginSection">
              <form @submit.prevent="handleLogin" :class="styles.loginForm">
                <!-- Email Field -->
                <div :class="styles.formField">
                  <div :class="styles.inputGroup">
                    <input 
                      id="email"
                      v-model="email"
                      type="email" 
                      :class="[styles.formInput, styles.emailInput]"
                      placeholder=""
                      required
                      :disabled="isLoading"
                      dir="ltr"
                    />
                    <label for="email" :class="[styles.floatingLabel, { [styles.active]: email || isLoading }]">
                      البريد الإلكتروني
                    </label>
                  </div>
                  <div v-if="fieldErrors.email" :class="styles.fieldError">
                    {{ fieldErrors.email }}
                  </div>
                </div>

                <!-- Password Field -->
                <div :class="styles.formField">
                  <div :class="styles.inputGroup">
                    <input 
                      id="password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      :class="[styles.formInput, styles.passwordInput]"
                      placeholder=""
                      required
                      :disabled="isLoading"
                      dir="ltr"
                    />
                    <label for="password" :class="[styles.floatingLabel, { [styles.active]: password || isLoading }]">
                      كلمة المرور
                    </label>
                    <button 
                      type="button"
                      @click="togglePassword"
                      :class="styles.passwordToggle"
                      :aria-label="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
                      tabindex="-1"
                    >
  <span v-if="showPassword">
    <i class="fas fa-eye-slash"></i>
  </span>
  <span v-else>
    <i class="fas fa-eye"></i>
  </span>                    </button>
                  </div>
                  <div v-if="fieldErrors.password" :class="styles.fieldError">
                    {{ fieldErrors.password }}
                  </div>
                </div>

                <!-- Login Button -->
                <button 
                  type="submit"
                  :class="styles.loginButton"
                  :disabled="isLoading || !email || !password || isAccountLocked"
                >
                  <span :class="styles.buttonText">
                    {{ isAccountLocked ? `محظور حتى ${Math.ceil(lockoutTimeRemaining / 60)} دقائق` : 'تسجيل الدخول' }}
                  </span>
                  <div :class="styles.buttonRipple"></div>
                </button>

              </form>
            </div>

            <!-- Security Section -->
            <!-- <div :class="styles.securitySection">
              <div :class="styles.securityHeader">
                <svg :class="styles.shieldIcon" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l6 2v5c0 3.5-2.5 6.5-6 7-3.5-.5-6-3.5-6-7V3l6-2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M6 8l1.5 1.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>محمي بالتشفير المتقدم</span>
              </div>
              <div :class="styles.securityFeatures">
                <div :class="styles.feature">
                  <div :class="styles.featureDot"></div>
                  <span>مصادقة JWT آمنة</span>
                </div>
                <div :class="styles.feature">
                  <div :class="styles.featureDot"></div>
                  <span>تشفير البيانات</span>
                </div>
                <div :class="styles.feature">
                  <div :class="styles.featureDot"></div>
                  <span>جلسات آمنة</span>
                </div>
              </div>
            </div> -->
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSimpleAuth } from '../../composables/useSimpleAuth'
import SecurityStatusIndicator from '../../components/SecurityStatusIndicator'
import styles from './JWTLogin.module.css'

const router = useRouter()
const route = useRoute()

// JWT authentication
const { 
  isAuthenticated,
  isLoading,
  error,
  hasError,
  login,
  clearError,
  checkAuth,
  // Rate limiting state  
  isAccountLocked,
  attemptsRemaining,
  lockoutTimeRemaining
} = useSimpleAuth()

// Form state
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const fieldErrors = ref<{ email?: string; password?: string }>({})

// Watch for authentication state changes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    const redirectTo = (route.query.redirect as string) || '/surveys'
    router.replace(redirectTo)
  }
}, { immediate: false })

// Particle animation styles
const particleStyle = (_index: number) => {
  const size = Math.random() * 4 + 2 // 2-6px
  const delay = Math.random() * 20 // 0-20s
  const duration = Math.random() * 10 + 15 // 15-25s
  const x = Math.random() * 100 // 0-100%
  const y = Math.random() * 100 // 0-100%
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

// Toggle password visibility
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// Handle form submission
const handleLogin = async () => {
  try {
    fieldErrors.value = {}
    clearError()

    if (!email.value || !password.value) {
      return
    }

    // Check if account is currently locked
    if (isAccountLocked.value) {
      return // Let the security indicator show the lockout message
    }

    const result = await login(email.value, password.value)
    
    if (!result.success && result.errors) {
      // Handle field-specific errors
      if (result.errors.email) {
        fieldErrors.value.email = Array.isArray(result.errors.email) 
          ? result.errors.email[0] 
          : result.errors.email
      }
      if (result.errors.password) {
        fieldErrors.value.password = Array.isArray(result.errors.password) 
          ? result.errors.password[0] 
          : result.errors.password
      }
      
      // Handle general errors (including rate limiting)
      if (result.errors.general && Array.isArray(result.errors.general)) {
        // The error will be set in the composable already
      }
    }
  } catch (error: any) {
    // Logging removed for production
  }
}

// Initialize auth state on mount
onMounted(async () => {
  try {
    // Check if user is already authenticated
    await checkAuth()
    
    if (isAuthenticated.value) {
      const redirectTo = (route.query.redirect as string) || '/surveys'
      router.replace(redirectTo)
    }
  } catch (error) {
    // Logging removed for production
  }
})
</script>
