<template>
  <div v-if="visible" :class="$style.modalOverlay" @click.self="$emit('close')">
    <div :class="$style.modal" :dir="isRTL ? 'rtl' : 'ltr'">
      <div :class="$style.modalHeader">
        <h3 :class="$style.modalTitle">{{ t('userManagement.modals.user.resetPassword.title') }}</h3>
        <button :class="$style.closeBtn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div :class="$style.modalBody">
        <div :class="$style.userInfo">
          <div :class="$style.userDetails">
            <i class="fas fa-user" :class="$style.userIcon"></i>
            <div>
              <div :class="$style.userName">{{ user?.full_name }}</div>
              <div :class="$style.userEmail">{{ user?.email }}</div>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit">
          <div :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.user.password') }}</label>
            <div :class="$style.passwordInputContainer">
              <input 
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'" 
                required
                :class="[$style.input, validationErrors.password ? $style.inputError : '']"
                :placeholder="t('userManagement.forms.user.passwordPlaceholder')"
                autocomplete="new-password"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                ref="passwordInput"
              />
              <button 
                type="button"
                :class="$style.passwordToggle"
                @click="showPassword = !showPassword"
                :title="showPassword ? t('userManagement.forms.user.hidePassword') : t('userManagement.forms.user.showPassword')"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div v-if="validationErrors.password" :class="$style.errorMessage">
              {{ validationErrors.password }}
            </div>
          </div>
        </form>
      </div>
      
      <div :class="$style.modalFooter">
        <button type="button" :class="[$style.btn, $style.cancelBtn]" @click="$emit('close')">
          {{ t('userManagement.buttons.cancel') }}
        </button>
        <button 
          type="button" 
          :class="[$style.btn, $style.saveBtn, !isFormValid ? $style.saveBtn_disabled : '']" 
          :disabled="!isFormValid || loading"
          @click="handleSubmit"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          {{ loading ? t('common.saving') : t('userManagement.buttons.resetPassword') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { User } from '../../types/user-management.types'

interface Props {
  visible: boolean
  user: User | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

interface Emits {
  (e: 'save', password: string): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

const formData = ref({
  password: ''
})

const validationErrors = ref<Record<string, string>>({})
const showPassword = ref(false)
const passwordInput = ref<HTMLInputElement>()

// Password validation checks
const passwordChecks = computed(() => {
  const password = formData.value.password
  const userInfo = props.user ? [props.user.email, props.user.first_name, props.user.last_name].filter(Boolean) : []
  
  return {
    minLength: password.length >= 8,
    notOnlyNumbers: password.length === 0 || !/^\d+$/.test(password),
    notCommon: password.length === 0 || !isCommonPassword(password),
    notSimilar: password.length === 0 || !isSimilarToUserInfo(password, userInfo)
  }
})

// Form validation
const isFormValid = computed(() => {
  const { password } = formData.value
  
  if (!password) return false
  
  return Object.values(passwordChecks.value).every(check => check)
})

// Helper functions
const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', 'password123', 'admin', '12345678', 'qwerty',
    'abc123', 'password1', 'admin123', '123456789', 'welcome'
  ]
  return commonPasswords.includes(password.toLowerCase())
}

const isSimilarToUserInfo = (password: string, userInfo: string[]): boolean => {
  const passwordLower = password.toLowerCase()
  
  for (const info of userInfo) {
    if (info && info.length > 2) {
      const infoLower = info.toLowerCase()
      // Check if password contains user info or vice versa
      if (passwordLower.includes(infoLower) || infoLower.includes(passwordLower)) {
        const similarity = calculateSimilarity(passwordLower, infoLower)
        if (similarity > 0.7) {
          return true
        }
      }
    }
  }
  
  return false
}

const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Validate password on input change
const validatePasswordField = () => {
  const errors = validatePassword(formData.value.password)
  if (errors.length > 0) {
    validationErrors.value.password = errors[0]
  } else {
    delete validationErrors.value.password
  }
}

const validatePassword = (password: string): string[] => {
  const errors: string[] = []
  
  if (!password) return errors
  
  if (!passwordChecks.value.minLength) {
    errors.push(t.value('userManagement.validation.password.minLength'))
  }
  
  if (!passwordChecks.value.notOnlyNumbers) {
    errors.push(t.value('userManagement.validation.password.onlyNumbers'))
  }
  
  if (!passwordChecks.value.notCommon) {
    errors.push(t.value('userManagement.validation.password.tooCommon'))
  }
  
  if (!passwordChecks.value.notSimilar) {
    errors.push(t.value('userManagement.validation.password.tooSimilar'))
  }
  
  return errors
}

// Watch password changes for real-time validation
watch(() => formData.value.password, validatePasswordField)

const handleSubmit = () => {
  if (isFormValid.value && !props.loading) {
    emit('save', formData.value.password)
  }
}

// Reset form when modal opens/closes
watch(() => props.visible, async (visible) => {
  if (visible) {
    formData.value.password = ''
    validationErrors.value = {}
    showPassword.value = false
    
    // Focus on password input after modal opens
    await nextTick()
    passwordInput.value?.focus()
  }
})
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal {
  background: var(--bg-card);
  border-radius: 16px;
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  box-shadow: 0 8px 32px var(--shadow-color);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.modalHeader {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modalTitle {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.closeBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.closeBtn:hover {
  background: var(--bg-glass);
  color: var(--text-primary);
}

.modalBody {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.userInfo {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.userDetails {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.userIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border-radius: 50%;
  font-size: 1rem;
}

.userName {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.userEmail {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.formGroup {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(207, 163, 101, 0.1);
}

.inputError {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
}

.errorMessage {
  margin-top: 0.5rem;
  color: #e74c3c;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.errorMessage::before {
  content: "⚠";
  font-size: 0.9rem;
}

.passwordInputContainer {
  position: relative;
  width: 100%;
}

.passwordInputContainer .input {
  padding-right: 2.5rem;
}

.passwordToggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 0.9rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.passwordToggle:hover {
  color: var(--text-primary);
  background: var(--bg-glass);
}

.passwordToggle:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(207, 163, 101, 0.3);
}

.passwordHints {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.hintTitle {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.hintList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hintList li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.hintList li i {
  width: 16px;
  font-size: 0.8rem;
}

.valid {
  color: #27ae60;
}

.invalid {
  color: var(--text-muted);
}

.modalFooter {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancelBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.cancelBtn:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.saveBtn {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.saveBtn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(243, 156, 18, 0.3);
}

.saveBtn_disabled {
  background: var(--bg-glass) !important;
  color: var(--text-muted) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.saveBtn:disabled {
  transform: none !important;
  box-shadow: none !important;
}

/* RTL Support */
[dir="rtl"] .userDetails {
  flex-direction: row-reverse;
}

[dir="rtl"] .passwordToggle {
  right: auto;
  left: 0.75rem;
}

[dir="rtl"] .passwordInputContainer .input {
  padding-right: 0.75rem;
  padding-left: 2.5rem;
}

[dir="rtl"] .modalFooter {
  flex-direction: row-reverse;
}
</style>
