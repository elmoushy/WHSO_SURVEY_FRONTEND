<template>
  <div :class="$style.ratingContainer">
    <!-- Rating Labels -->
    <div v-if="showLabels" :class="$style.ratingLabels">
      <span :class="$style.ratingLabelMin">{{ minLabel }}</span>
      <span :class="$style.ratingLabelMax">{{ maxLabel }}</span>
    </div>
    
    <!-- Rating Scale -->
    <div 
      :class="$style.ratingScale"
      role="radiogroup"
      :aria-labelledby="labelId"
      :aria-required="required"
    >
      <button
        v-for="value in ratingValues"
        :key="value"
        type="button"
        :class="[
          $style.ratingButton,
          { 
            [$style.ratingButtonSelected]: modelValue === value,
            [$style.ratingButtonDisabled]: disabled
          }
        ]"
        :disabled="disabled"
        :aria-pressed="modelValue === value"
        @click="handleRatingSelect(value)"
      >
        {{ value }}
      </button>
    </div>
    
    <!-- Current Selection Display -->
    <div v-if="modelValue !== undefined" :class="$style.currentSelection">
      <span>{{ selectionText }}: <strong>{{ modelValue }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  minLabel?: string
  maxLabel?: string
  selectionText?: string
  showLabels?: boolean
  disabled?: boolean
  required?: boolean
  labelId?: string
}

interface Emits {
  'update:modelValue': [value: number]
  change: [value: number]
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 5,
  step: 1,
  minLabel: 'ضعيف',
  maxLabel: 'ممتاز',
  selectionText: 'تقييمك',
  showLabels: true,
  disabled: false,
  required: false
})

const emit = defineEmits<Emits>()

const ratingValues = computed(() => {
  const values = []
  for (let i = props.min; i <= props.max; i += props.step) {
    values.push(i)
  }
  return values
})

const handleRatingSelect = (value: number) => {
  if (props.disabled) return
  
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style module>
.ratingContainer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ratingLabels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: var(--space-2);
}

.ratingLabelMin,
.ratingLabelMax {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.ratingScale {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.ratingButton {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  padding: var(--space-2);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 2px solid var(--color-border-default);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.ratingButton:hover:not(:disabled) {
  border-color: var(--color-primary-light);
  background: var(--color-surface-accent);
  color: var(--color-primary);
  transform: scale(1.05);
}

.ratingButton:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.ratingButtonSelected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
  transform: scale(1.1);
}

.ratingButtonSelected:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: white;
}

.ratingButtonDisabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ratingButtonDisabled:hover {
  border-color: var(--color-border-default);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transform: none;
}

.currentSelection {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2);
  background: var(--color-surface-accent);
  border-radius: var(--radius-md);
}

/* RTL Support */
[dir="rtl"] .ratingLabels {
  direction: rtl;
}

[dir="rtl"] .currentSelection {
  text-align: center;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .ratingScale {
    gap: var(--space-1);
  }
  
  .ratingButton {
    min-width: 2.5rem;
    min-height: 2.5rem;
    font-size: var(--font-size-base);
  }
  
  .ratingLabels {
    font-size: var(--font-size-xs);
  }
}

/* Animation for selection */
@keyframes ratingSelect {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1.1); }
}

.ratingButtonSelected {
  animation: ratingSelect 0.2s ease-out;
}
</style>
