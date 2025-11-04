// Form Components Export
export { default as FormField } from './FormField.vue'
export { default as TextInput } from './TextInput.vue'
export { default as TextArea } from './TextArea.vue'
export { default as RadioGroup } from './RadioGroup.vue'
export { default as CheckboxGroup } from './CheckboxGroup.vue'
export { default as RatingScale } from './RatingScale.vue'
export { default as Button } from './Button.vue'
export { default as ProgressBar } from './ProgressBar.vue'

// Type exports
export interface FormOption {
  label: string
  value: string | number
}

export interface FormFieldProps {
  label?: string
  questionNumber?: string | number
  helperText?: string
  errorMessage?: string
  required?: boolean
  disabled?: boolean
}
