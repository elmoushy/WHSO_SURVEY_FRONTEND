<template>
  <div v-if="visible" :class="$style.modalOverlay" @click.self="$emit('close')">
    <div :class="$style.modal" :dir="isRTL ? 'rtl' : 'ltr'">
      <div :class="$style.modalHeader">
        <h3 :class="$style.modalTitle">
          {{ t('userManagement.modals.changeRole.title') }}
        </h3>
        <button :class="$style.closeBtn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div :class="$style.modalBody">
        <div :class="$style.userInfo">
          <div :class="$style.userAvatar">
            <div :class="$style.avatarCircle">
              {{ user?.initials || user?.full_name?.charAt(0) || '?' }}
            </div>
          </div>
          <div :class="$style.userDetails">
            <div :class="$style.userName">{{ user?.full_name }}</div>
            <div :class="$style.userEmail">{{ user?.email }}</div>
            <div :class="$style.currentRole">
              {{ t('userManagement.modals.changeRole.currentRole') }}: 
              <span :class="$style.roleTag">{{ user?.role_display || user?.role }}</span>
            </div>
          </div>
        </div>

        <div :class="$style.formSection">
          <label :class="$style.label">
            {{ t('userManagement.modals.changeRole.newRole') }}
          </label>
          <select 
            v-model="selectedRole" 
            :class="$style.select"
            required
          >
            <option value="">{{ t('userManagement.modals.changeRole.selectRole') }}</option>
            <option 
              v-for="role in availableRoles" 
              :key="role.value" 
              :value="role.value"
              :disabled="role.value === user?.role"
            >
              {{ role.display }}
            </option>
          </select>
          
          <div v-if="selectedRole" :class="$style.roleDescription">
            <i class="fas fa-info-circle"></i>
            {{ getRoleDescription(selectedRole) }}
          </div>

          <div v-if="selectedRole && hasRoleChangeWarning" :class="$style.warning">
            <i class="fas fa-exclamation-triangle"></i>
            {{ getRoleChangeWarning(selectedRole) }}
          </div>
        </div>
      </div>
      
      <div :class="$style.modalFooter">
        <button 
          type="button" 
          :class="[$style.btn, $style.cancelBtn]" 
          @click="$emit('close')"
        >
          {{ t('userManagement.buttons.cancel') }}
        </button>
        <button 
          type="button" 
          :class="[$style.btn, $style.saveBtn]" 
          @click="handleRoleChange"
          :disabled="!selectedRole || selectedRole === user?.role || saving"
        >
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          {{ saving ? t('common.saving') : t('userManagement.buttons.changeRole') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import userManagementService from '../../services/userManagementService'
import type { User } from '../../types/user-management.types'

interface Props {
  visible: boolean
  user: User | null
}

const props = defineProps<Props>()

interface Emits {
  (e: 'close'): void
  (e: 'success', data: { user: User; oldRole: string; newRole: string }): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

const selectedRole = ref('')
const saving = ref(false)

const availableRoles = computed(() => [
  { value: 'user', display: t.value('userManagement.roles.user') },
  { value: 'admin', display: t.value('userManagement.roles.admin') },
  { value: 'super_admin', display: t.value('userManagement.roles.super_admin') }
])

const hasRoleChangeWarning = computed(() => {
  if (!props.user || !selectedRole.value) return false
  
  // Show warning when demoting from super_admin to admin/user
  if (props.user.role === 'super_admin' && selectedRole.value !== 'super_admin') {
    return true
  }
  
  // Show warning when promoting to super_admin
  if (selectedRole.value === 'super_admin') {
    return true
  }
  
  return false
})

const getRoleDescription = (role: string): string => {
  switch (role) {
    case 'user':
      return t.value('userManagement.modals.changeRole.descriptions.user')
    case 'admin':
      return t.value('userManagement.modals.changeRole.descriptions.admin')
    case 'super_admin':
      return t.value('userManagement.modals.changeRole.descriptions.super_admin')
    default:
      return ''
  }
}

const getRoleChangeWarning = (role: string): string => {
  if (props.user?.role === 'super_admin' && role !== 'super_admin') {
    return t.value('userManagement.modals.changeRole.warnings.demoteFromSuperAdmin')
  }
  
  if (role === 'super_admin') {
    return t.value('userManagement.modals.changeRole.warnings.promoteToSuperAdmin')
  }
  
  return ''
}

const handleRoleChange = async () => {
  if (!props.user || !selectedRole.value || selectedRole.value === props.user.role) {
    return
  }
  
  try {
    saving.value = true
    
    const response = await userManagementService.updateUserRole(
      props.user.id,
      { role: selectedRole.value as 'super_admin' | 'admin' | 'user' }
    )
    
    emit('success', {
      user: response.user,
      oldRole: props.user.role,
      newRole: selectedRole.value
    })
    
    // Reset form
    selectedRole.value = ''
    
  } catch (error) {
    // Logging removed for production
    // You could show an error notification here
  } finally {
    saving.value = false
  }
}

// Reset form when modal opens/closes
watch(() => props.visible, (visible) => {
  if (visible) {
    selectedRole.value = ''
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
}

.userInfo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.userAvatar {
  flex-shrink: 0;
}

.avatarCircle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.userDetails {
  flex: 1;
}

.userName {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.userEmail {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.currentRole {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.roleTag {
  background: var(--accent-primary);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.8rem;
}

.formSection {
  margin-top: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

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

.select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(207, 163, 101, 0.1);
}

.roleDescription {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(207, 163, 101, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.85rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.roleDescription i {
  color: var(--accent-primary);
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.warning {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  color: #856404;
  font-size: 0.85rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.warning i {
  color: #856404;
  margin-top: 0.1rem;
  flex-shrink: 0;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancelBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.cancelBtn:hover:not(:disabled) {
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
</style>
