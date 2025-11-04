<template>
  <div :class="styles.formField">
    <div :class="styles.inputGroup">
      <input 
        :id="id"
        v-model="inputValue"
        :type="type"
        :class="[styles.formInput, { [styles.inputWarning]: hasInvalidChars && showCharacterWarning }]"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :dir="dir"
        :maxlength="maxLength"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <label 
        :for="id" 
        :class="[styles.floatingLabel, { [styles.active]: inputValue || isFocused || disabled }]"
      >
        {{ label }}
      </label>
      
      <!-- Character count for limited fields -->
      <div v-if="maxLength && showCharacterCount" :class="styles.characterCount">
        {{ inputValue.length }}/{{ maxLength }}
      </div>
      
      <!-- Password toggle for password fields -->
      <button 
        v-if="type === 'password' && showPasswordToggle"
        type="button"
        @click="togglePasswordVisibility"
        :class="styles.passwordToggle"
        :aria-label="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
        tabindex="-1"
      >
        <span v-if="showPassword">
          <i class="fas fa-eye-slash"></i>
        </span>
        <span v-else>
          <i class="fas fa-eye"></i>
        </span>
      </button>
    </div>
    
    <!-- Security warnings -->
    <div v-if="hasInvalidChars && showCharacterWarning" :class="styles.securityWarning">
      ⚠️ Input contains characters that will be removed for security
    </div>
    
    <!-- Field errors -->
    <div v-if="error" :class="styles.fieldError">
      {{ error }}
    </div>
    
    <!-- Validation messages -->
    <div v-if="validationMessage" :class="styles.validationMessage">
      {{ validationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import styles from './SecureInput.module.css'

export interface SecureInputProps {
  id: string
  label: string
  modelValue: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  dir?: string
  maxLength?: number
  sanitize?: boolean
  showCharacterWarning?: boolean
  showCharacterCount?: boolean
  showPasswordToggle?: boolean
  error?: string
  validationMessage?: string
}

const props = withDefaults(defineProps<SecureInputProps>(), {
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
  dir: 'ltr',
  sanitize: true,
  showCharacterWarning: false,
  showCharacterCount: false,
  showPasswordToggle: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
  'securityWarning': [hasWarning: boolean]
}>()

const isFocused = ref(false)
const showPassword = ref(false)

// Check for potentially dangerous characters
const dangerousChars = /<|>|script|javascript:|data:|onerror=|onload=/i
const htmlTags = /<[^>]*>/g

const hasInvalidChars = computed(() => {
  return dangerousChars.test(props.modelValue)
})

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    let processedValue = value
    
    if (props.sanitize) {
      // Basic client-side cleaning (server will do final sanitization)
      processedValue = value.replace(htmlTags, '').trim()
      
      // Limit length if specified
      if (props.maxLength && processedValue.length > props.maxLength) {
        processedValue = processedValue.substring(0, props.maxLength)
      }
    }
    
    emit('update:modelValue', processedValue)
  }
})

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Watch for security warnings
watch(hasInvalidChars, (hasWarning) => {
  emit('securityWarning', hasWarning)
})
</script>
