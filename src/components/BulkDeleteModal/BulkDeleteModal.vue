<template>
  <div v-if="isVisible" :class="$style.modalOverlay" @click="closeModal">
    <div :class="$style.modalContent" @click.stop>
      <div :class="$style.modalHeader">
        <h3 :class="$style.modalTitle">{{ t('userManagement.messages.bulkDelete.confirm.title') }}</h3>
        <button :class="$style.closeButton" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div :class="$style.modalBody">
        <p :class="$style.warningText">
          {{ getConfirmText() }}
        </p>
        
        <!-- User list preview -->
        <div :class="$style.usersList" v-if="selectedUsers.length <= 10">
          <div :class="$style.usersListTitle">{{ t('userManagement.users.selectedUsers') }}:</div>
          <ul :class="$style.userItems">
            <li v-for="user in selectedUsers" :key="user.id" :class="$style.userItem">
              <span :class="$style.userName">{{ user.full_name }}</span>
              <span :class="$style.userEmail">{{ user.email }}</span>
              <span :class="[$style.userRole, $style[user.role]]">{{ user.role_display }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Large batch warning -->
        <div v-if="selectedUsers.length > 10" :class="$style.largeBatchWarning">
          <i class="fas fa-exclamation-triangle" :class="$style.warningIcon"></i>
          <span>{{ selectedUsers.length }} {{ t('userManagement.users.selectedUsers') }}</span>
        </div>
      </div>
      
      <div :class="$style.modalFooter">
        <button 
          :class="[$style.button, $style.cancelButton]"
          @click="closeModal"
          :disabled="isLoading"
        >
          {{ t('userManagement.messages.bulkDelete.confirm.cancelButtonText') }}
        </button>
        <button 
          :class="[$style.button, $style.dangerButton]"
          @click="confirmDelete"
          :disabled="isLoading"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-trash"></i>
          {{ t('userManagement.messages.bulkDelete.confirm.confirmButtonText') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { User } from '../../types/user-management.types'

// Props
interface Props {
  isVisible: boolean
  selectedUsers: User[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Emits
interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

const emit = defineEmits<Emits>()

// Store
const store = useAppStore()

// Computed
const t = computed(() => store.t)

// Methods
const closeModal = () => {
  emit('close')
}

const confirmDelete = () => {
  emit('confirm')
}

const getConfirmText = () => {
  const count = props.selectedUsers.length
  
  if (count > 20) {
    return t.value('userManagement.messages.bulkDelete.confirm.largeBatchWarning').replace('{{count}}', count.toString())
  }
  
  return t.value('userManagement.messages.bulkDelete.confirm.text')
}
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modalContent {
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modalTitle {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.closeButton {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.closeButton:hover {
  background: var(--bg-glass);
  color: var(--text-primary);
}

.modalBody {
  padding: 2rem;
}

.warningText {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.usersList {
  background: var(--bg-glass);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.usersListTitle {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.userItems {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.userItem {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
}

.userItem:last-child {
  border-bottom: none;
}

.userName {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 120px;
}

.userEmail {
  color: var(--text-muted);
  flex: 1;
  font-size: 0.85rem;
}

.userRole {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

.userRole.super_admin {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
}

.userRole.admin {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
}

.userRole.user {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.largeBatchWarning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.warningIcon {
  color: #ff6b6b;
  font-size: 1.25rem;
}

.modalFooter {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-glass);
}

.button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.cancelButton {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.cancelButton:hover:not(:disabled) {
  background: var(--bg-glass);
  color: var(--text-primary);
}

.dangerButton {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  margin-left: auto;
}

.dangerButton:hover:not(:disabled) {
  background: linear-gradient(135deg, #ee5a52, #dc4c3e);
  transform: translateY(-1px);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}
</style>
