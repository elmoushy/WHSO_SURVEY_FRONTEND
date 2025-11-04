<template>
  <div :class="styles.loginPage" :dir="isRTL ? 'rtl' : 'ltr'">
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

        <!-- Unauthorized Access Card -->
        <div :class="styles.authCard">

          <!-- Card Header -->
          <div :class="styles.cardHeader">
            <div :class="[styles.welcomeBadge, styles.unauthorizedBadge]">
              <svg :class="styles.welcomeIcon" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.5c-3.03 0-5.5-2.47-5.5-5.5S4.97 2.5 8 2.5s5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5z" fill="currentColor"/>
                <path d="M10.5 5.5L5.5 10.5M5.5 5.5l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ content.badge }}</span>
            </div>
            <h1 :class="styles.title">{{ content.title }}</h1>
            <p :class="styles.subtitle">{{ content.subtitle }}</p>
          </div>

          <div :class="styles.cardBody">
            <!-- Unauthorized Message -->
            <div :class="styles.unauthorizedAlert">
              <div :class="styles.unauthorizedIndicator">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div :class="styles.unauthorizedContent">
                <h4>{{ content.alertTitle }}</h4>
                <p>{{ content.alertMessage }}</p>
              </div>
            </div>

            <!-- Login Button -->
            <div :class="styles.loginButtonContainer">
              <button 
                @click="navigateToLogin" 
                :class="styles.loginButton"
                type="button"
              >
                <span :class="styles.buttonText">{{ content.buttonText }}</span>
                <svg :class="styles.buttonIcon" viewBox="0 0 16 16" fill="none">
                  <path :d="isRTL ? 'M10 12L6 8L10 4' : 'M6 12L10 8L6 4'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <!-- Additional Info -->
            <div :class="styles.infoSection">
              <div :class="styles.infoCard">
                <svg :class="styles.infoIcon" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 7v4M8 5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p :class="styles.infoText">
                  {{ content.infoText }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import styles from './UnauthorizedAccess.module.css'

// Language state
const isRTL = ref(true)

// Content based on language
const content = computed(() => {
  if (isRTL.value) {
    return {
      badge: 'غير مصرح',
      title: 'الوصول غير مصرح به',
      subtitle: 'أنت غير مصرح لك بالوصول إلى هذه الصفحة',
      alertTitle: 'يرجى تسجيل الدخول للمتابعة',
      alertMessage: 'للوصول إلى هذا التطبيق، يجب عليك تسجيل الدخول باستخدام بيانات اعتماد صالحة.',
      buttonText: 'انتقل إلى صفحة تسجيل الدخول',
      infoText: 'إذا كنت تواجه مشاكل في الوصول، يرجى الاتصال بمسؤول النظام.'
    }
  } else {
    return {
      badge: 'Unauthorized',
      title: 'Access Denied',
      subtitle: 'You are not authorized to access this page',
      alertTitle: 'Please Login to Continue',
      alertMessage: 'To access this application, you must login with valid credentials.',
      buttonText: 'Go to Login Page',
      infoText: 'If you are having trouble accessing, please contact the system administrator.'
    }
  }
})


// Generate random particle positions
const particleStyle = (index: number) => ({
  left: `${(index * 8.33) % 100}%`,
  top: `${(index * 13.7) % 100}%`,
  animationDelay: `${index * 0.5}s`,
  animationDuration: `${15 + (index % 5) * 2}s`
})

// Navigate to login using full URL redirect (not Vue router)
const navigateToLogin = () => {
  // Use window.location.href for full page reload and URL navigation
  // This ensures the server/proxy IP restrictions apply
  window.location.href = '/login'
}
</script>

<style module src="./UnauthorizedAccess.module.css"></style>
