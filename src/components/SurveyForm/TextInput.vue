<template>
  <input 
    :id="fieldId"
    v-model="modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :aria-describedby="describedBy"
    :aria-invalid="hasError"
    :class="[
      $style.input,
      {
        [$style.inputError]: hasError,
        [$style.inputDisabled]: disabled,
        [$style.inputReadonly]: readonly
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
  type?: 'text' | 'email' | 'tel' | 'password' | 'search' | 'url'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
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
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
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
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}
</script>

<style module>
.input {
  width: 100%;
  min-height: var(--input-height);
  padding-block: var(--space-3);
  padding-inline: var(--space-4);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 2px solid var(--color-border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  appearance: none;
}

.input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.input:hover:not(:disabled):not(:focus) {
  border-color: var(--color-primary-light);
}

.inputError {
  border-color: var(--color-error);
  background: var(--color-error-bg);
}

.inputError:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.3);
}

.inputDisabled {
  background: var(--color-surface-variant);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.inputReadonly {
  background: var(--color-surface-variant);
  cursor: default;
}

/* RTL Support */
[dir="rtl"] .input {
  text-align: start;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .input {
    font-size: 16px; /* Prevent zoom on iOS */
    padding-inline: var(--space-3);
  }
}
</style>
