<template>
  <div :class="$style.progressContainer">
    <!-- Progress Info -->
    <div :class="$style.progressInfo">
      <span :class="$style.progressText">
        {{ progressText }}
      </span>
      <span :class="$style.progressPercentage">
        {{ Math.round(percentage) }}%
      </span>
    </div>
    
    <!-- Progress Bar -->
    <div 
      :class="$style.progressBar"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="ariaLabel"
    >
      <div 
        :class="$style.progressFill"
        :style="{ width: `${Math.max(0, Math.min(100, percentage))}%` }"
      >
        <div :class="$style.progressShine"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  total: number
  progressText?: string
  ariaLabel?: string
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  progressText: 'التقدم',
  ariaLabel: 'تقدم الاستطلاع',
  showPercentage: true
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return (props.current / props.total) * 100
})

const progressText = computed(() => {
  return `${props.progressText} (${props.current} من ${props.total})`
})
</script>

<style module>
.progressContainer {
  width: 100%;
  margin-block-end: var(--space-6);
}

.progressInfo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: var(--space-2);
}

.progressText {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.progressPercentage {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.progressBar {
  width: 100%;
  height: 0.5rem;
  background: var(--color-surface-variant);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
}

.progressFill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary-hover),
    var(--color-primary),
    var(--color-primary-light)
  );
  border-radius: var(--radius-lg);
  transition: width 0.3s ease-out;
  position: relative;
  overflow: hidden;
}

.progressShine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* RTL Support */
[dir="rtl"] .progressInfo {
  direction: rtl;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .progressInfo {
    margin-block-end: var(--space-3);
  }
  
  .progressText,
  .progressPercentage {
    font-size: var(--font-size-xs);
  }
  
  .progressBar {
    height: 0.375rem;
  }
}

/* Dark theme adjustments */
[data-theme="night"] .progressBar {
  background: var(--color-surface-variant);
}

/* Animation pause on reduced motion */
@media (prefers-reduced-motion: reduce) {
  .progressShine {
    animation: none;
  }
  
  .progressFill {
    transition: none;
  }
}
</style>
