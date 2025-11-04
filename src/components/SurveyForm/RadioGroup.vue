<template>
  <div :class="$style.radioGroup" role="radiogroup" :aria-labelledby="labelId" :aria-required="required">
    <div 
      v-for="(option, index) in options" 
      :key="option.value"
      :class="$style.radioOption"
    >
      <input
        :id="`${fieldId}-${index}`"
        v-model="modelValue"
        :value="option.value"
        type="radio"
        :name="name"
        :disabled="disabled"
        :required="required"
        :class="$style.radioInput"
        @change="handleChange"
      />
      <label 
        :for="`${fieldId}-${index}`"
        :class="[
          $style.radioLabel,
          { [$style.radioLabelDisabled]: disabled }
        ]"
      >
        <span :class="$style.radioIndicator" aria-hidden="true">
          <span :class="$style.radioMarker"></span>
        </span>
        <span :class="$style.radioText">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number
  options: Option[]
  name: string
  disabled?: boolean
  required?: boolean
  fieldId?: string
  labelId?: string
}

interface Emits {
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false
})

const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style module>
.radioGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.radioOption {
  position: relative;
}

.radioInput {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radioLabel {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: var(--touch-target-min);
  background: var(--color-surface);
}

.radioLabel:hover {
  border-color: var(--color-primary-light);
  background: var(--color-surface-accent);
}

.radioInput:checked + .radioLabel {
  border-color: var(--color-primary);
  background: var(--color-surface-accent);
  box-shadow: var(--shadow-sm);
}

.radioInput:focus + .radioLabel {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.radioLabelDisabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.radioLabelDisabled:hover {
  border-color: var(--color-border-light);
  background: var(--color-surface);
}

.radioIndicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border-default);
  border-radius: 50%;
  background: var(--color-surface);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  margin-block-start: 0.125rem;
}

.radioInput:checked + .radioLabel .radioIndicator {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.radioMarker {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: transparent;
  transition: background var(--transition-fast);
}

.radioInput:checked + .radioLabel .radioMarker {
  background: white;
}

.radioText {
  flex: 1;
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* RTL Support */
[dir="rtl"] .radioLabel {
  text-align: start;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .radioGroup {
    gap: var(--space-2);
  }
  
  .radioLabel {
    padding: var(--space-3) var(--space-3);
  }
  
  .radioText {
    font-size: var(--font-size-sm);
  }
}
</style>
