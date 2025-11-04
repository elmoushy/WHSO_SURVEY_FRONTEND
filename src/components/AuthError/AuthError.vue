<template>
  <div :class="$style.errorContainer" :data-theme="theme">
    <div :class="$style.errorCard">
      <!-- Error Icon -->
      <div :class="$style.errorIcon">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Error Content -->
      <div :class="$style.errorContent">
        <h2 :class="$style.errorTitle">{{ title }}</h2>
        <p :class="$style.errorMessage">{{ message }}</p>
        
        <!-- Error details -->
        <div v-if="details" :class="$style.errorDetails">
          <details :class="$style.detailsDisclosure">
            <summary>Error Details</summary>
            <div :class="$style.detailsContent">
              <pre>{{ details }}</pre>
            </div>
          </details>
        </div>

        <!-- Actions -->
        <div :class="$style.errorActions">
          <button 
            v-if="onRetry"
            @click="handleRetry"
            :class="[$style.actionButton, $style.primaryAction]"
            :disabled="isRetrying"
          >
            <svg v-if="!isRetrying" :class="$style.buttonIcon" viewBox="0 0 24 24" fill="none">
              <path d="M3 12C3 12 5.636 16 12 16C18.364 16 21 12 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M21 12C21 12 18.364 8 12 8C5.636 8 3 12 3 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <div v-else :class="$style.loadingSpinner"></div>
            {{ isRetrying ? 'Retrying...' : 'Try Again' }}
          </button>

          <button 
            v-if="onGoHome"
            @click="onGoHome"
            :class="[$style.actionButton, $style.secondaryAction]"
          >
            <svg :class="$style.buttonIcon" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Go Home
          </button>

          <button 
            v-if="onContactSupport"
            @click="onContactSupport"
            :class="[$style.actionButton, $style.tertiaryAction]"
          >
            <svg :class="$style.buttonIcon" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Contact Support
          </button>
        </div>

        <!-- Helpful tips -->
        <div v-if="tips && tips.length" :class="$style.helpfulTips">
          <h4 :class="$style.tipsTitle">What you can try:</h4>
          <ul :class="$style.tipsList">
            <li v-for="tip in tips" :key="tip" :class="$style.tipItem">{{ tip }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

interface Props {
  title?: string
  message?: string
  details?: string
  tips?: string[]
  onRetry?: () => void | Promise<void>
  onGoHome?: () => void
  onContactSupport?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  message: 'An unexpected error occurred. Please try again.',
  tips: () => [
    'Check your internet connection',
    'Refresh the page',
    'Clear your browser cache',
    'Try again in a few minutes'
  ]
})

const emit = defineEmits<{
  retry: []
  goHome: []
  contactSupport: []
}>()

const store = useAppStore()
const theme = computed(() => store.currentTheme)
const isRetrying = ref(false)

const handleRetry = async () => {
  if (props.onRetry) {
    isRetrying.value = true
    try {
      await props.onRetry()
    } finally {
      isRetrying.value = false
    }
  }
  emit('retry')
}
</script>

<style module>
.errorContainer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.errorContainer[data-theme="night"] {
  background: linear-gradient(135deg, #2d1b1b 0%, #3d2626 100%);
}

.errorCard {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2rem;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.04);
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.errorContainer[data-theme="night"] .errorCard {
  background: rgba(42, 40, 59, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.2);
}

.errorIcon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.errorIcon svg {
  width: 40px;
  height: 40px;
}

.errorContent {
  text-align: center;
}

.errorTitle {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
  letter-spacing: -0.02em;
}

.errorContainer[data-theme="night"] .errorTitle {
  color: #F5F3EE;
}

.errorMessage {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.errorContainer[data-theme="night"] .errorMessage {
  color: #909090;
}

.errorDetails {
  margin: 1.5rem 0;
  text-align: left;
}

.detailsDisclosure {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.detailsDisclosure summary {
  padding: 1rem;
  cursor: pointer;
  font-weight: 600;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.05);
  transition: background-color 0.2s;
}

.detailsDisclosure summary:hover {
  background: rgba(239, 68, 68, 0.1);
}

.detailsContent {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.02);
}

.detailsContent pre {
  font-size: 0.85rem;
  color: #64748b;
  white-space: pre-wrap;
  margin: 0;
}

.errorActions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 2rem 0;
}

.actionButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  min-height: 48px;
}

.actionButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primaryAction {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.primaryAction:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.secondaryAction {
  background: linear-gradient(135deg, #997A51, #CFA365);
  color: white;
  box-shadow: 0 4px 12px rgba(153, 122, 81, 0.3);
}

.secondaryAction:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(153, 122, 81, 0.4);
}

.tertiaryAction {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.errorContainer[data-theme="night"] .tertiaryAction {
  background: rgba(144, 144, 144, 0.1);
  color: #909090;
  border: 1px solid rgba(144, 144, 144, 0.2);
}

.tertiaryAction:hover {
  background: rgba(100, 116, 139, 0.15);
  transform: translateY(-1px);
}

.buttonIcon {
  width: 18px;
  height: 18px;
}

.loadingSpinner {
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.helpfulTips {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(229, 210, 186, 0.3);
  text-align: left;
}

.errorContainer[data-theme="night"] .helpfulTips {
  border-top-color: rgba(94, 78, 63, 0.3);
}

.tipsTitle {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.errorContainer[data-theme="night"] .tipsTitle {
  color: #d1d5db;
}

.tipsList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tipItem {
  padding: 0.5rem 0;
  color: #6b7280;
  font-size: 0.9rem;
  position: relative;
  padding-left: 1.5rem;
}

.tipItem::before {
  content: '•';
  color: #997A51;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.errorContainer[data-theme="night"] .tipItem {
  color: #9ca3af;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .errorCard {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  
  .errorTitle {
    font-size: 1.5rem;
  }
  
  .errorMessage {
    font-size: 1rem;
  }
  
  .errorIcon {
    width: 60px;
    height: 60px;
    margin-bottom: 1.5rem;
  }
  
  .errorIcon svg {
    width: 30px;
    height: 30px;
  }
  
  .errorActions {
    gap: 0.5rem;
  }
  
  .actionButton {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .errorContainer {
    padding: 0.5rem;
  }
  
  .errorCard {
    padding: 1.5rem 1rem;
  }
  
  .errorActions {
    margin: 1.5rem 0;
  }
  
  .actionButton {
    padding: 0.625rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
