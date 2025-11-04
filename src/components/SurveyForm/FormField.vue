<template>
  <fieldset :class="$style.fieldset" :disabled="disabled">
    <div :class="[$style.field, { [$style.fieldError]: hasError, [$style.fieldRequired]: required }]">
      <!-- Question Label and Number -->
      <legend v-if="label" :class="$style.legend">
        <span v-if="questionNumber" :class="$style.questionNumber">{{ questionNumber }}</span>
        <span :class="$style.questionText">{{ label }}</span>
        <span v-if="required" :class="$style.requiredIndicator" aria-label="مطلوب">*</span>
      </legend>
      
      <!-- Helper Text -->
      <p v-if="helperText" :class="$style.helperText" :id="helperTextId">
        {{ helperText }}
      </p>
      
      <!-- Form Control Slot -->
      <div :class="$style.controlWrapper">
        <slot 
          :fieldId="fieldId"
          :errorId="errorId"
          :helperTextId="helperTextId"
          :hasError="hasError"
          :describedBy="describedBy"
        />
      </div>
      
      <!-- Error Message -->
      <div 
        v-if="hasError" 
        :class="$style.errorMessage"
        :id="errorId"
        role="alert"
        aria-live="polite"
      >
        <i class="fas fa-exclamation-circle" :class="$style.errorIcon" aria-hidden="true"></i>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  label?: string
  questionNumber?: string | number
  helperText?: string
  errorMessage?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false
})

// Generate unique IDs for accessibility
const fieldId = useId()
const errorId = useId()
const helperTextId = useId()

const hasError = computed(() => Boolean(props.errorMessage))

const describedBy = computed(() => {
  const ids = []
  if (props.helperText) ids.push(helperTextId)
  if (hasError.value) ids.push(errorId)
  return ids.length > 0 ? ids.join(' ') : undefined
})
</script>

<style module>
.fieldset {
  border: none;
  margin: 0;
  padding: 0;
  min-inline-size: auto;
}

.fieldset:disabled {
  opacity: 0.6;
  pointer-events: none;
}

.field {
  margin-block-end: var(--space-6);
}

.legend {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-block-end: var(--space-3);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}

.questionNumber {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.questionText {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-normal);
}

.requiredIndicator {
  color: var(--color-error);
  font-weight: var(--font-weight-bold);
  margin-inline-start: var(--space-1);
}

.helperText {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
}

.controlWrapper {
  margin-block-end: var(--space-2);
}

.errorMessage {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-block-start: var(--space-2);
  padding: var(--space-3);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  line-height: var(--line-height-normal);
}

.errorIcon {
  flex-shrink: 0;
  margin-block-start: 0.125rem;
}

.fieldError .legend {
  color: var(--color-error);
}

.fieldRequired .questionNumber {
  position: relative;
}

.fieldRequired .questionNumber::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  background: var(--color-error);
  border-radius: 50%;
  border: 2px solid white;
}

/* RTL Support */
[dir="rtl"] .legend {
  text-align: start;
}

[dir="rtl"] .errorMessage {
  text-align: start;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .questionText {
    font-size: var(--font-size-base);
  }
  
  .questionNumber {
    min-width: 1.5rem;
    height: 1.5rem;
    font-size: var(--font-size-xs);
  }
}
</style>
