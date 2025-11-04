<template>
  <div :class="[styles.securityIndicator, styles[statusColor]]" v-if="showIndicator">
    <div :class="styles.indicatorIcon">
      <svg v-if="status === 'secure'" viewBox="0 0 16 16" fill="none">
        <path d="M8 1l6 2v5c0 3.5-2.5 6.5-6 7-3.5-.5-6-3.5-6-7V3l6-2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M6 8l1.5 1.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else-if="status === 'warning'" viewBox="0 0 16 16" fill="none">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 5zm.002 6a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z" fill="currentColor"/>
      </svg>
      <svg v-else viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
        <path d="M8 4v4M8 10h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    
    <div :class="styles.indicatorContent">
      <span :class="styles.indicatorText">{{ message }}</span>
      <div v-if="showCountdown && retryAfter > 0" :class="styles.countdown">
        {{ formatCountdown(retryAfter) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import styles from './SecurityStatusIndicator.module.css'

export interface SecurityStatusProps {
  attemptsRemaining?: number
  maxAttempts?: number
  retryAfter?: number
  status?: 'secure' | 'warning' | 'error'
  message?: string
  showCountdown?: boolean
}

const props = withDefaults(defineProps<SecurityStatusProps>(), {
  attemptsRemaining: 0,
  maxAttempts: 5,
  retryAfter: 0,
  status: 'secure',
  showCountdown: false
})

const countdownInterval = ref<number | null>(null)
const remainingTime = ref(props.retryAfter)

const statusColor = computed(() => {
  if (props.status === 'error' || props.attemptsRemaining === 0) return 'error'
  if (props.status === 'warning' || (props.attemptsRemaining > 0 && props.attemptsRemaining <= 3)) return 'warning'
  return 'secure'
})

const showIndicator = computed(() => {
  return props.attemptsRemaining > 0 || props.retryAfter > 0 || props.message
})

const message = computed(() => {
  if (props.message) return props.message
  
  if (props.retryAfter > 0) {
    return 'Account locked. Try again in:'
  }
  
  if (props.attemptsRemaining > 0) {
    if (props.attemptsRemaining === 1) {
      return '⚠️ Last attempt remaining before account lockout'
    }
    return `⚠️ You have ${props.attemptsRemaining} login attempts remaining`
  }
  
  if (props.attemptsRemaining === 0) {
    return 'Account locked due to multiple failed attempts'
  }
  
  return 'Login secure'
})

const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const startCountdown = () => {
  if (props.retryAfter <= 0) return
  
  remainingTime.value = props.retryAfter
  
  countdownInterval.value = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearCountdown()
    }
  }, 1000)
}

const clearCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
}

onMounted(() => {
  if (props.showCountdown && props.retryAfter > 0) {
    startCountdown()
  }
})

onUnmounted(() => {
  clearCountdown()
})
</script>
