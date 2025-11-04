<template>
  <div :class="styles.registerPage">
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
        <!-- Floating Header -->
        <header :class="styles.floatingHeader">
          <div :class="styles.logoContainer">
            <img src="/News-Logo.png" alt="WeaponpowerCloud" :class="styles.logo" />
            <span :class="styles.brandName">WPA | WeaponpowerCloud</span>
          </div>
          <div :class="styles.statusIndicator">
            <span :class="styles.statusDot"></span>
            <span :class="styles.statusText">New Account</span>
          </div>
        </header>

        <!-- Azure AD Auth Card -->
        <div :class="styles.authCard">
          <div :class="styles.cardHeader">
            <h1 :class="styles.title">Create Your Account</h1>
            <p :class="styles.subtitle">Sign up with your Microsoft account</p>
          </div>

          <div :class="styles.cardBody">
            <!-- Error Display -->
            <div v-if="authError" :class="styles.errorAlert">
              <div :class="styles.errorIcon">⚠️</div>
              <div :class="styles.errorContent">
                <h4>Authentication Error</h4>
                <p>{{ authError }}</p>
                <button @click="clearAuthError" :class="styles.errorDismiss">Dismiss</button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="authLoading" :class="styles.loadingState">
              <div :class="styles.loadingSpinner"></div>
              <p>Setting up your account...</p>
            </div>

            <!-- Registration Info -->
            <div v-else :class="styles.registrationSection">
              <div :class="styles.infoBox">
                <h3>Account Registration</h3>
                <p>Since we use Microsoft Azure AD for authentication, your account will be automatically created when you sign in for the first time with your Microsoft credentials.</p>
              </div>

              <!-- Login Button -->
              <button 
                @click="handleMicrosoftSignup"
                :class="styles.microsoftButton"
                :disabled="authLoading"
              >
                <svg :class="styles.microsoftIcon" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                  <path fill="#7fba00" d="M1 13h10v10H1z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                <span>Sign up with Microsoft</span>
              </button>

              <!-- Alternative Popup Login -->
              <button 
                @click="handleMicrosoftSignupPopup"
                :class="styles.popupButton"
                :disabled="authLoading"
              >
                <span>Use Popup Signup</span>
              </button>

              <!-- Already have account -->
              <div :class="styles.loginPrompt">
                <p>Already have an account? 
                  <button @click="goToLogin" :class="styles.loginLink">Sign in here</button>
                </p>
              </div>
            </div>

            <!-- Info Section -->
            <div :class="styles.infoSection">
              <div :class="styles.infoItem">
                <span :class="styles.infoIcon">🔒</span>
                <span>Secured by Microsoft Azure AD</span>
              </div>
              <div :class="styles.infoItem">
                <span :class="styles.infoIcon">👤</span>
                <span>Automatic account provisioning</span>
              </div>
              <div :class="styles.infoItem">
                <span :class="styles.infoIcon">🛡️</span>
                <span>Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer :class="styles.footer">
          <div :class="styles.footerContent">
            <p :class="styles.footerText">
              By creating an account, you agree to our <span :class="styles.highlight">Terms</span> and <span :class="styles.highlight">Privacy Policy</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSimpleAuth } from '../../composables/useSimpleAuth'
import styles from './Register.module.css'

const router = useRouter()
const route = useRoute()

const { 
  initializeAuth: initialize, 
  isAuthenticated, 
  isLoading: authLoading, 
  error: authError,
  clearError: clearAuthError 
} = useSimpleAuth()

// Note: loginPopup is not available in useSimpleAuth
const loginPopup = () => console.warn('loginPopup not implemented')

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

// Initialize MSAL on component mount
onMounted(async () => {
  await initialize()
  
  // If user is already authenticated, redirect to intended page
  if (isAuthenticated.value) {
    const redirectTo = (route.query.redirect as string) || '/surveys'
    router.replace(redirectTo)
  }
})

// Handle Microsoft signup using redirect (not implemented for JWT auth)
const handleMicrosoftSignup = async () => {
  try {
    // Store intended redirect location
    const redirectTo = (route.query.redirect as string) || '/surveys'
    localStorage.setItem('auth-redirect-to', redirectTo)
    
    // JWT auth doesn't support Microsoft signup without credentials
    console.warn('Microsoft signup not supported with JWT auth')
    router.push('/login')
  } catch (error) {
    // Logging removed for production
  }
}

// Handle Microsoft signup using popup
const handleMicrosoftSignupPopup = async () => {
  try {
    await loginPopup()
    
    if (isAuthenticated.value) {
      const redirectTo = (route.query.redirect as string) || '/surveys'
      router.replace(redirectTo)
    }
  } catch (error) {
    // Logging removed for production
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Inherit styles from Login component and add registration-specific styles */
.authCard {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 520px;
  margin: 0 auto;
  animation: slideUp 0.8s ease-out;
}

.cardHeader {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.cardBody {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.errorAlert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.errorIcon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.errorContent h4 {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.errorContent p {
  color: #b91c1c;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}

.errorDismiss {
  background: transparent;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.errorDismiss:hover {
  background: #dc2626;
  color: white;
}

.loadingState {
  text-align: center;
  padding: 2rem 0;
}

.loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.registrationSection {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.infoBox {
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.infoBox h3 {
  color: #0066cc;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.infoBox p {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.microsoftButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.microsoftButton:hover {
  background: #0052a3;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
}

.microsoftButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.microsoftIcon {
  width: 20px;
  height: 20px;
}

.popupButton {
  background: transparent;
  color: #0066cc;
  border: 2px solid #0066cc;
  border-radius: 12px;
  padding: 0.75rem 2rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.popupButton:hover {
  background: #0066cc;
  color: white;
}

.popupButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loginPrompt {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.loginPrompt p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.loginLink {
  background: transparent;
  border: none;
  color: #0066cc;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.loginLink:hover {
  color: #0052a3;
}

.infoSection {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.infoItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #666;
}

.infoIcon {
  font-size: 1rem;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
