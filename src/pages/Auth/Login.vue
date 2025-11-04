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

        <!-- Modern Azure AD Auth Card -->
        <div :class="styles.authCard">
          <!-- Card Header with Modern Typography -->
          <div :class="styles.cardHeader">
            <div :class="styles.welcomeBadge">
              <svg :class="styles.welcomeIcon" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10.5 6H15L11.5 9.5L13 15L8 12L3 15L4.5 9.5L1 6H5.5L8 1Z" fill="currentColor"/>
              </svg>
              <span>أهلاً وسهلاً</span>
            </div>
            <h1 :class="styles.title">تسجيل الدخول</h1>
            <p :class="styles.subtitle">ادخل إلى مساحة العمل الآمنة باستخدام مصادقة مايكروسوفت</p>
          </div>

          <div :class="styles.cardBody">
            <!-- Modern Error Display -->
            <div v-if="authError" :class="styles.errorAlert">
              <div :class="styles.errorIndicator">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
                  <path d="M8 4v4M8 10h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div :class="styles.errorContent">
                <h4>فشل في المصادقة</h4>
                <p>{{ authError }}</p>
                <button @click="clearAuthError" :class="styles.errorDismiss">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  إغلاق
                </button>
              </div>
            </div>

            <!-- Modern Loading State -->
            <div v-if="authLoading" :class="styles.loadingState">
              <div :class="styles.loadingContainer">
                <div :class="styles.loadingSpinner">
                  <div :class="styles.spinnerRing"></div>
                  <div :class="styles.spinnerRing"></div>
                  <div :class="styles.spinnerRing"></div>
                </div>
                <div :class="styles.loadingText">
                  <h4>جاري المصادقة</h4>
                  <p>يتم إنشاء اتصال آمن...</p>
                </div>
              </div>
            </div>

            <!-- Modern Login Section -->
            <div v-else :class="styles.loginSection">
              <!-- Primary Microsoft Button -->
              <button 
                @click="handleMicrosoftLogin"
                :class="styles.microsoftButton"
                :disabled="authLoading"
              >
                <div :class="styles.buttonContent">
                  <svg :class="styles.microsoftIcon" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" fill="#f25022"/>
                    <rect x="9" y="1" width="6" height="6" fill="#00a4ef"/>
                    <rect x="1" y="9" width="6" height="6" fill="#7fba00"/>
                    <rect x="9" y="9" width="6" height="6" fill="#ffb900"/>
                  </svg>
                  <div :class="styles.buttonText">
                    <span :class="styles.primaryText">المتابعة مع مايكروسوفت</span>
                    <span :class="styles.secondaryText">تسجيل دخول آمن موحد</span>
                  </div>
                </div>
                <svg :class="styles.arrowIcon" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <!-- Secondary Popup Option -->
              <div :class="styles.alternativeSection">
                <div :class="styles.divider">
                  <span>أو</span>
                </div>
                <button 
                  @click="handleMicrosoftLoginPopup"
                  :class="styles.popupButton"
                  :disabled="authLoading"
                >
                  <svg :class="styles.popupIcon" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M7 7h2M7 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <span>استخدام نافذة منبثقة</span>
                </button>
              </div>
            </div>

            <!-- Modern Security Features -->
            <div :class="styles.securitySection">
              <div :class="styles.securityHeader">
                <svg :class="styles.shieldIcon" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l6 2v5c0 3.5-2.5 6.5-6 7-3.5-.5-6-3.5-6-7V3l6-2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M6 8l1.5 1.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>محمي بواسطة Azure AD</span>
              </div>
              <div :class="styles.securityFeatures">
                <div :class="styles.feature">
                  <div :class="styles.featureDot"></div>
                  <span>تشفير شامل من البداية للنهاية</span>
                </div>
                <div :class="styles.feature">
                  <div :class="styles.featureDot"></div>
                  <span>مصادقة متعددة العوامل</span>
                </div>
                <div :class="styles.feature">
                  <div :class="styles.featureDot"></div>
                  <span>امتثال المؤسسات</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer :class="styles.footer">
          <div :class="styles.footerContent">
            <p :class="styles.footerText">
              محمي بتشفير متقدم • <span :class="styles.highlight">مصادقة Azure AD</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUnifiedAuth } from '../../composables/useUnifiedAuth'
import styles from './Login.module.css'

const router = useRouter()
const route = useRoute()

// Unified authentication (JWT-based)
const auth = useUnifiedAuth()
const { 
  initialize,
  login,
  isAuthenticated: _isAzureAuthenticated,
  isLoading: azureLoading,
  error: azureError,
  clearError: clearAzureError
} = auth

// Note: loginPopup not available in unified auth
const loginPopup = () => console.warn('loginPopup not implemented')

// Backend integration - using unified auth
const { 
  isAuthenticated: isFullyAuthenticated,
  isLoading: backendLoading, 
  error: backendError,
  clearError: clearBackendError 
} = auth

// Computed properties for combined state
const isAuthenticated = isFullyAuthenticated
const authLoading = computed(() => azureLoading.value || backendLoading.value)
const authError = computed(() => azureError.value || backendError.value)

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

// Initialize MSAL on component mount
onMounted(async () => {
  try {
    await initialize()
    
    // Add a small delay to ensure authentication state is properly set
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // If user is already authenticated, redirect to intended page
    if (isAuthenticated.value) {
      const redirectTo = (route.query.redirect as string) || '/surveys'
      
      router.replace(redirectTo)
    }
  } catch (error) {
    // Logging removed for production
  }
})

// Handle Microsoft login using redirect
const handleMicrosoftLogin = async () => {
  try {
    // Store intended redirect location
    const redirectTo = (route.query.redirect as string) || '/surveys'
    localStorage.setItem('auth-redirect-to', redirectTo)
    
    
    
    
    await login()
  } catch (error) {
    // Logging removed for production
  }
}

// Handle Microsoft login using popup (alternative method)
const handleMicrosoftLoginPopup = async () => {
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

// Clear authentication error
const clearAuthError = () => {
  clearAzureError()
  clearBackendError()
}
</script>

<style scoped>
/* RTL Support */
[dir="rtl"] {
  font-family: 'Segoe UI', 'Arial', 'Tahoma', sans-serif;
  text-align: right;
}

/* Modern Azure AD Auth Card Styles */
.authCard {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  border-radius: 20px;
  padding: 0;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 520px;
  margin: 0 auto;
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  position: relative;
  direction: rtl;
}

[data-theme="light"] .authCard {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(229, 210, 186, 0.4);
  box-shadow: 
    0 32px 64px rgba(38, 38, 38, 0.06),
    0 8px 32px rgba(38, 38, 38, 0.03);
}

.cardHeader {
  padding: 2.5rem 2.5rem 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(174, 93, 90, 0.02) 0%, rgba(207, 163, 101, 0.01) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.welcomeBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #AE5D5A 0%, #CFA365 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(174, 93, 90, 0.25);
}

.welcomeIcon {
  width: 12px;
  height: 12px;
}

.title {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
}

[data-theme="light"] .title {
  background: linear-gradient(135deg, #262626 0%, #42403B 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
}

[data-theme="light"] .subtitle {
  color: #5E4E3F;
}

.cardBody {
  padding: 1.5rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Modern Error Alert */
.errorAlert {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  direction: rtl;
}

.errorAlert::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.errorIndicator {
  color: #dc2626;
  flex-shrink: 0;
}

.errorIndicator svg {
  width: 18px;
  height: 18px;
}

.errorContent h4 {
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.errorContent p {
  color: #b91c1c;
  font-size: 0.85rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.errorDismiss {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.errorDismiss:hover {
  background: #dc2626;
  color: white;
  transform: translateY(-1px);
}

.errorDismiss svg {
  width: 12px;
  height: 12px;
}

/* Modern Loading State */
.loadingState {
  padding: 2rem 0;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loadingSpinner {
  position: relative;
  width: 48px;
  height: 48px;
}

.spinnerRing {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s ease-in-out infinite;
}

.spinnerRing:nth-child(1) {
  border-top-color: #AE5D5A;
  animation-delay: 0s;
}

.spinnerRing:nth-child(2) {
  border-top-color: #CFA365;
  animation-delay: -0.4s;
  transform: scale(0.8);
}

.spinnerRing:nth-child(3) {
  border-top-color: #997A51;
  animation-delay: -0.8s;
  transform: scale(0.6);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loadingText {
  text-align: center;
}

.loadingText h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.loadingText p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* Modern Login Section */
.loginSection {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.microsoftButton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 24px rgba(0, 120, 212, 0.25),
    0 2px 8px rgba(0, 120, 212, 0.15);
  position: relative;
  overflow: hidden;
}

.microsoftButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.microsoftButton:hover::before {
  left: 100%;
}

.microsoftButton:hover {
  background: linear-gradient(135deg, #106ebe 0%, #005a9e 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(0, 120, 212, 0.35),
    0 4px 16px rgba(0, 120, 212, 0.25);
}

.microsoftButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.buttonContent {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.microsoftIcon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.buttonText {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  text-align: right;
}

.primaryText {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

.secondaryText {
  font-size: 0.8rem;
  opacity: 0.8;
  font-weight: 500;
}

.arrowIcon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
  transform: scaleX(-1);
}

.microsoftButton:hover .arrowIcon {
  transform: scaleX(-1) translateX(4px);
}

/* Alternative Section */
.alternativeSection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #999;
  font-size: 0.85rem;
  font-weight: 500;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
}

.popupButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: transparent;
  color: #0078d4;
  border: 2px solid rgba(0, 120, 212, 0.2);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
}

.popupButton:hover {
  background: rgba(0, 120, 212, 0.05);
  border-color: rgba(0, 120, 212, 0.4);
  transform: translateY(-1px);
}

.popupButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.popupIcon {
  width: 16px;
  height: 16px;
}

/* Modern Security Section */
.securitySection {
  background: linear-gradient(135deg, rgba(174, 93, 90, 0.03) 0%, rgba(207, 163, 101, 0.02) 100%);
  border: 1px solid rgba(174, 93, 90, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 0.5rem;
}

.securityHeader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #AE5D5A;
  font-weight: 700;
  font-size: 0.9rem;
}

.shieldIcon {
  width: 16px;
  height: 16px;
}

.securityFeatures {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #666;
}

[data-theme="light"] .feature {
  color: #5E4E3F;
}

.featureDot {
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #AE5D5A 0%, #CFA365 100%);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(174, 93, 90, 0.3);
}

/* Animations */
@keyframes slideUpFade {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .authCard {
    max-width: 100%;
    margin: 0 1rem;
    border-radius: 16px;
  }
  
  .cardHeader {
    padding: 2rem 1.5rem 1rem;
  }
  
  .cardBody {
    padding: 1rem 1.5rem 2rem;
    gap: 1.5rem;
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .microsoftButton {
    padding: 1rem 1.25rem;
  }
  
  .buttonText {
    align-items: center;
    text-align: center;
  }
  
  .primaryText {
    font-size: 0.9rem;
  }
  
  .secondaryText {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .cardHeader {
    padding: 1.5rem 1rem 1rem;
  }
  
  .cardBody {
    padding: 1rem 1rem 1.5rem;
  }
  
  .welcomeBadge {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }
  
  .title {
    font-size: 1.6rem;
  }
  
  .buttonContent {
    gap: 0.75rem;
  }
  
  .microsoftIcon {
    width: 16px;
    height: 16px;
  }
}
</style>
