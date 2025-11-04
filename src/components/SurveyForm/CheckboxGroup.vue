<template>
  <div :class="$style.checkboxGroup" role="group" :aria-labelledby="labelId" :aria-required="required">
    <div 
      v-for="(option, index) in options" 
      :key="option.value"
      :class="$style.checkboxOption"
    >
      <input
        :id="`${fieldId}-${index}`"
        :checked="isChecked(option.value)"
        :value="option.value"
        type="checkbox"
        :disabled="disabled"
        :class="$style.checkboxInput"
        @change="handleChange(option.value, $event)"
      />
      <label 
        :for="`${fieldId}-${index}`"
        :class="[
          $style.checkboxLabel,
          { [$style.checkboxLabelDisabled]: disabled }
        ]"
      >
        <span :class="$style.checkboxIndicator" aria-hidden="true">
          <i v-if="isChecked(option.value)" class="fas fa-check" :class="$style.checkboxIcon"></i>
        </span>
        <span :class="$style.checkboxText">{{ option.label }}</span>
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
  modelValue?: (string | number)[]
  options: Option[]
  disabled?: boolean
  required?: boolean
  fieldId?: string
  labelId?: string
}

interface Emits {
  'update:modelValue': [value: (string | number)[]]
  change: [value: (string | number)[]]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false,
  required: false
})

const emit = defineEmits<Emits>()

const isChecked = (value: string | number): boolean => {
  return (props.modelValue || []).includes(value)
}

const handleChange = (value: string | number, event: Event) => {
  const target = event.target as HTMLInputElement
  const currentValues = [...(props.modelValue || [])]
  
  if (target.checked) {
    currentValues.push(value)
  } else {
    const index = currentValues.indexOf(value)
    if (index > -1) {
      currentValues.splice(index, 1)
    }
  }
  
  emit('update:modelValue', currentValues)
  emit('change', currentValues)
}
</script>

<style module>
.checkboxGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.checkboxOption {
  position: relative;
}

.checkboxInput {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkboxLabel {
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

.checkboxLabel:hover {
  border-color: var(--color-primary-light);
  background: var(--color-surface-accent);
}

.checkboxInput:checked + .checkboxLabel {
  border-color: var(--color-primary);
  background: var(--color-surface-accent);
  box-shadow: var(--shadow-sm);
}

.checkboxInput:focus + .checkboxLabel {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.checkboxLabelDisabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkboxLabelDisabled:hover {
  border-color: var(--color-border-light);
  background: var(--color-surface);
}

.checkboxIndicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  margin-block-start: 0.125rem;
}

.checkboxInput:checked + .checkboxLabel .checkboxIndicator {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.checkboxIcon {
  font-size: 0.75rem;
  color: white;
}

.checkboxText {
  flex: 1;
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* RTL Support */
[dir="rtl"] .checkboxLabel {
  text-align: start;
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .checkboxGroup {
    gap: var(--space-2);
  }
  
  .checkboxLabel {
    padding: var(--space-3) var(--space-3);
  }
  
  .checkboxText {
    font-size: var(--font-size-sm);
  }
}
</style>
