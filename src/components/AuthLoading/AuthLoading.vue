<template>
  <div :class="$style.authLoadingContainer" :data-theme="theme">
    <div :class="$style.loadingCard">
      <!-- Loading Animation -->
      <div :class="$style.loadingAnimation">
        <div :class="$style.spinnerContainer">
          <div :class="$style.spinner">
            <div :class="[$style.spinnerRing, $style.ring1]"></div>
            <div :class="[$style.spinnerRing, $style.ring2]"></div>
            <div :class="[$style.spinnerRing, $style.ring3]"></div>
          </div>
        </div>
      </div>

      <!-- Status Information -->
      <div :class="$style.statusInfo">
        <h3 :class="$style.statusTitle">{{ title }}</h3>
        <p :class="$style.statusMessage">{{ message }}</p>
        
        <!-- Progress indicator -->
        <div v-if="progress !== undefined" :class="$style.progressContainer">
          <div :class="$style.progressBar">
            <div 
              :class="$style.progressFill" 
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <span :class="$style.progressText">{{ progress }}%</span>
        </div>

        <!-- Retry button for failed states -->
        <button 
          v-if="canRetry && onRetry" 
          @click="onRetry"
          :class="$style.retryButton"
        >
          <svg :class="$style.retryIcon" viewBox="0 0 24 24" fill="none">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Retry
        </button>
      </div>

      <!-- Debug info in development -->
      <div v-if="isDev && debugInfo" :class="$style.debugInfo">
        <details :class="$style.debugDetails">
          <summary>Debug Information</summary>
          <pre :class="$style.debugContent">{{ debugInfo }}</pre>
        </details>
      </div>
    </div>

    <!-- Background effects -->
    <div :class="$style.backgroundEffects">
      <div 
        v-for="i in 6" 
        :key="i" 
        :class="$style.floatingParticle"
        :style="getParticleStyle(i)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

interface Props {
  title?: string
  message?: string
  progress?: number
  canRetry?: boolean
  onRetry?: () => void
  debugInfo?: any
}

withDefaults(defineProps<Props>(), {
  title: 'Loading',
  message: 'Please wait...',
  canRetry: false
})

const store = useAppStore()
const theme = computed(() => store.currentTheme)
const isDev = computed(() => import.meta.env.VITE_ENVIRONMENT === 'development')

const getParticleStyle = (_index: number) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDelay = Math.random() * 3
  const animationDuration = Math.random() * 3 + 2
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${animationDuration}s`
  }
}
</script>

<style module>
.authLoadingContainer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.authLoadingContainer[data-theme="night"] {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.loadingCard {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2rem;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.04);
  text-align: center;
  max-width: 400px;
  width: 90%;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.authLoadingContainer[data-theme="night"] .loadingCard {
  background: rgba(42, 40, 59, 0.95);
  border: 1px solid rgba(94, 78, 63, 0.3);
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.2);
}

.loadingAnimation {
  margin-bottom: 2rem;
}

.spinnerContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
}

.spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinnerRing {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: spin 2s linear infinite;
}

.ring1 {
  width: 60px;
  height: 60px;
  border-top-color: #997A51;
  animation-duration: 2s;
}

.ring2 {
  width: 45px;
  height: 45px;
  top: 7.5px;
  left: 7.5px;
  border-right-color: #CFA365;
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.ring3 {
  width: 30px;
  height: 30px;
  top: 15px;
  left: 15px;
  border-bottom-color: #AE5D5A;
  animation-duration: 1s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.statusInfo {
  margin-bottom: 1rem;
}

.statusTitle {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.authLoadingContainer[data-theme="night"] .statusTitle {
  color: #F5F3EE;
}

.statusMessage {
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.authLoadingContainer[data-theme="night"] .statusMessage {
  color: #909090;
}

.progressContainer {
  margin: 1rem 0;
}

.progressBar {
  width: 100%;
  height: 4px;
  background: rgba(229, 210, 186, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #997A51, #CFA365);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progressText {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.authLoadingContainer[data-theme="night"] .progressText {
  color: #909090;
}

.retryButton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #997A51, #CFA365);
  color: #F5F3EE;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.retryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(153, 122, 81, 0.3);
}

.retryButton:active {
  transform: translateY(0);
}

.retryIcon {
  width: 18px;
  height: 18px;
}

.debugInfo {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(229, 210, 186, 0.3);
}

.authLoadingContainer[data-theme="night"] .debugInfo {
  border-top-color: rgba(94, 78, 63, 0.3);
}

.debugDetails {
  text-align: left;
}

.debugDetails summary {
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.debugDetails summary:hover {
  background: rgba(229, 210, 186, 0.1);
}

.debugContent {
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(229, 210, 186, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  overflow: auto;
  max-height: 150px;
}

.authLoadingContainer[data-theme="night"] .debugContent {
  background: rgba(94, 78, 63, 0.2);
  color: #909090;
}

.backgroundEffects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
}

.floatingParticle {
  position: absolute;
  background: linear-gradient(135deg, #997A51, #CFA365);
  border-radius: 50%;
  opacity: 0.1;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) scale(1);
    opacity: 0.1;
  }
  50% { 
    transform: translateY(-20px) scale(1.1);
    opacity: 0.2;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .loadingCard {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  
  .statusTitle {
    font-size: 1.3rem;
  }
  
  .statusMessage {
    font-size: 0.9rem;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
  }
  
  .ring1 {
    width: 50px;
    height: 50px;
  }
  
  .ring2 {
    width: 37.5px;
    height: 37.5px;
    top: 6.25px;
    left: 6.25px;
  }
  
  .ring3 {
    width: 25px;
    height: 25px;
    top: 12.5px;
    left: 12.5px;
  }
}
</style>
