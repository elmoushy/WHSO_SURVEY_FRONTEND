<template>
  <textarea 
    :id="fieldId"
    v-model="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :rows="rows"
    :aria-describedby="describedBy"
    :aria-invalid="hasError"
    :class="[
      $style.textarea,
      {
        [$style.textareaError]: hasError,
        [$style.textareaDisabled]: disabled,
        [$style.textareaReadonly]: readonly
      }
    ]"
    @blur="handleBlur"
    @focus="handleFocus"
    @input="handleInput"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  rows?: number
  fieldId?: string
  describedBy?: string
  hasError?: boolean
}

interface Emits {
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  input: [event: Event]
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
  rows: 3,
  hasError: false
})

const emit = defineEmits<Emits>()

const isFocused = ref(false)

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  emit('input', event)
}
</script>

<style module>
.textarea {
  width: 100%;
  min-height: calc(var(--input-height) * 2);
  padding-block: var(--space-3);
  padding-inline: var(--space-4);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 2px solid var(--color-border-default);
  border-radius: var(--radius-md);
  resize: vertical;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  appearance: none;
}

.textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.textarea:hover:not(:disabled):not(:focus) {
  border-color: var(--color-primary-light);
}

.textareaError {
  border-color: var(--color-error);
  background: var(--color-error-bg);
}

.textareaError:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.3);
}

.textareaDisabled {
  background: var(--color-surface-variant);
  color: var(--color-text-muted);
  cursor: not-allowed;
  resize: none;
}

.textareaReadonly {
  background: var(--color-surface-variant);
  cursor: default;
  resize: none;
}

/* RTL Support */
[dir="rtl"] .textarea {
  text-align: start;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .textarea {
    font-size: 16px; /* Prevent zoom on iOS */
    padding-inline: var(--space-3);
  }
}
</style>
