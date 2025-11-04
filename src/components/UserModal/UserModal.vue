<template>
  <div v-if="visible" :class="$style.modalOverlay" @click.self="$emit('close')">
    <div :class="$style.modal" :dir="isRTL ? 'rtl' : 'ltr'">
      <div :class="$style.modalHeader">
        <h3 :class="$style.modalTitle">{{ getModalTitle() }}</h3>
        <button :class="$style.closeBtn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div :class="$style.modalBody">
        <form @submit.prevent="handleSubmit">
          <div :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.user.email') }}</label>
            <input 
              v-model="formData.email"
              type="email" 
              required
              :class="$style.input"
              :disabled="mode.type === 'view' || mode.type === 'edit'"
            />
          </div>
          
          <div :class="$style.formRow">
            <div :class="$style.formGroup">
              <label :class="$style.label">{{ t('userManagement.forms.user.firstName') }}</label>
              <input 
                v-model="formData.first_name"
                type="text" 
                required
                :class="$style.input"
                :disabled="mode.type === 'view' || mode.type === 'edit'"
              />
            </div>
            
            <div :class="$style.formGroup">
              <label :class="$style.label">{{ t('userManagement.forms.user.lastName') }}</label>
              <input 
                v-model="formData.last_name"
                type="text" 
                required
                :class="$style.input"
                :disabled="mode.type === 'view' || mode.type === 'edit'"
                autocomplete="off"
              />
            </div>
          </div>
          
          <div :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.user.role') }}</label>
            <select 
              v-model="formData.role"
              :class="$style.select"
              :disabled="mode.type === 'view'"
              required
            >
              <option v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.display }}
              </option>
            </select>
          </div>
          
          <!-- Auth Type and Password for Create Mode -->
          <!-- <div v-if="mode.type === 'create'" :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.user.authType') }}</label>
            <select 
              v-model="formData.auth_type"
              :class="$style.select"
              required
            >
              <option value="regular">{{ t('userManagement.forms.user.authTypeRegular') }}</option>
              <option value="azure">{{ t('userManagement.forms.user.authTypeAzure') }}</option>
            </select>
          </div> -->
          
          <div v-if="mode.type === 'create' && formData.auth_type === 'regular'" :class="$style.formGroup">
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
          
          <div v-if="mode.type === 'invite'" :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.user.groups') }}</label>
            <div :class="$style.checkboxGroup">
              <div v-for="group in groups" :key="group.id" :class="$style.checkboxItem">
                <input 
                  type="checkbox" 
                  :value="group.id"
                  v-model="formData.groups"
                  :class="$style.checkbox"
                />
                <label>{{ group.name }}</label>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div :class="$style.modalFooter" v-if="mode.type !== 'view'">
        <button type="button" :class="[$style.btn, $style.cancelBtn]" @click="$emit('close')">
          {{ t('userManagement.buttons.cancel') }}
        </button>
        <button 
          type="button" 
          :class="[$style.btn, $style.saveBtn, !isFormValid ? $style.saveBtn_disabled : '']" 
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          {{ t('userManagement.buttons.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { User, UserModalMode } from '../../types/user-management.types'

interface Props {
  mode: UserModalMode
  user?: User | null
  roles: Array<{ value: string; display: string }>
  groups: Array<{ id: number; name: string }>
}

const props = defineProps<Props>()

interface Emits {
  (e: 'save', data: any): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

const visible = computed(() => true)

const formData = ref({
  email: '',
  first_name: '',
  last_name: '',
  role: 'user',
  auth_type: 'regular',
  password: '',
  groups: [] as number[]
})

const validationErrors = ref<Record<string, string>>({})
const showPassword = ref(false)

// Form validation computed properties
const isFormValid = computed(() => {
  const { email, first_name, last_name, role, password, auth_type } = formData.value
  
  // Basic required fields
  if (!email || !first_name || !last_name || !role) {
    return false
  }
  
  // Password validation for create mode with regular auth
  if (props.mode.type === 'create' && auth_type === 'regular') {
    if (!password) {
      return false
    }
    // Check if password passes all validation rules
    const passwordValidation = validatePassword(password)
    if (passwordValidation.length > 0) {
      return false
    }
  }
  
  // Check if there are any validation errors
  if (Object.keys(validationErrors.value).length > 0) {
    return false
  }
  
  return true
})

// Password validation function
const validatePassword = (password: string): string[] => {
  const errors: string[] = []
  const { email, first_name, last_name } = formData.value
  
  // Minimum length validator
  if (password.length < 8) {
    errors.push(t.value('userManagement.validation.password.minLength'))
  }
  
  // Numeric password validator
  if (/^\d+$/.test(password)) {
    errors.push(t.value('userManagement.validation.password.onlyNumbers'))
  }
  
  // Common password validator (basic check)
  const commonPasswords = [
    'password', 'password123', 'admin', '12345678', 'qwerty',
    'abc123', 'password1', 'admin123', '123456789', 'welcome'
  ]
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push(t.value('userManagement.validation.password.tooCommon'))
  }
  
  // User attribute similarity validator
  const userInfo = [email, first_name, last_name].filter(Boolean)
  const passwordLower = password.toLowerCase()
  
  for (const info of userInfo) {
    if (info && info.length > 2) {
      const infoLower = info.toLowerCase()
      // Simple similarity check - if password contains user info or vice versa
      if (passwordLower.includes(infoLower) || infoLower.includes(passwordLower)) {
        // More sophisticated similarity check could be added here
        const similarity = calculateSimilarity(passwordLower, infoLower)
        if (similarity > 0.7) {
          errors.push(t.value('userManagement.validation.password.tooSimilar'))
          break
        }
      }
    }
  }
  
  return errors
}

// Simple similarity calculation (Levenshtein distance based)
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

// Levenshtein distance calculation
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
  if (props.mode.type === 'create' && formData.value.auth_type === 'regular' && formData.value.password) {
    const errors = validatePassword(formData.value.password)
    if (errors.length > 0) {
      validationErrors.value.password = errors[0] // Show first error
    } else {
      delete validationErrors.value.password
    }
  } else {
    delete validationErrors.value.password
  }
}

// Watch password changes for real-time validation
watch(() => formData.value.password, validatePasswordField)
watch(() => formData.value.email, validatePasswordField)
watch(() => formData.value.first_name, validatePasswordField)
watch(() => formData.value.last_name, validatePasswordField)

const getModalTitle = () => {
  switch (props.mode.type) {
    case 'create': return t.value('userManagement.modals.user.create.title')
    case 'edit': return t.value('userManagement.modals.user.edit.title')
    case 'view': return t.value('userManagement.modals.user.view.title')
    case 'invite': return t.value('userManagement.modals.user.invite.title')
    default: return ''
  }
}

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('save', formData.value)
  }
}

// Initialize form data when user prop changes
watch(() => props.user, (user) => {
  if (user) {
    formData.value = {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      auth_type: 'regular',
      password: '',
      groups: []
    }
  } else {
    formData.value = {
      email: '',
      first_name: '',
      last_name: '',
      role: 'user',
      auth_type: 'regular',
      password: '',
      groups: []
    }
  }
  // Clear validation errors when user changes
  validationErrors.value = {}
}, { immediate: true })
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
  max-width: 500px;
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

.formGroup {
  margin-bottom: 1.5rem;
}

.formRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.input,
.select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.input:focus,
.select:focus {
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

.checkboxGroup {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.checkboxItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox {
  width: auto;
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
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
}

.saveBtn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(207, 163, 101, 0.3);
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
</style>
