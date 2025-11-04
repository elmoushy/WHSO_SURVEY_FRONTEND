<template>
  <div v-if="visible" :class="$style.modalOverlay" @click.self="$emit('close')">
    <div :class="$style.modal" :dir="isRTL ? 'rtl' : 'ltr'">
      <div :class="$style.modalHeader">
        <h3 :class="$style.modalTitle">
          {{ translations.title }}
        </h3>
        <button :class="$style.closeBtn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div :class="$style.modalBody">
        <div :class="$style.groupInfo">
          <div :class="$style.groupName">
            <i class="fas fa-users"></i>
            {{ group?.name }}
          </div>
          <div :class="$style.groupDescription">
            {{ group?.description }}
          </div>
        </div>

        <div :class="$style.formSection">
          <div :class="$style.sectionHeader">
            <h4>{{ t('userManagement.modals.addUsersToGroup.selectUsers') }}</h4>
            <p :class="$style.helpText">
              {{ t('userManagement.modals.addUsersToGroup.helpText') }}
            </p>
          </div>

          <!-- Search/Filter for Users -->
          <div :class="$style.userSearch">
            <input 
              type="text" 
              :placeholder="t('userManagement.users.searchUsers')"
              v-model="searchQuery"
              :class="$style.searchInput"
            />
          </div>

          <!-- Make Group Admin Toggle -->
          <div :class="$style.adminToggle">
            <label :class="$style.adminToggleLabel">
              <input 
                type="checkbox" 
                v-model="makeGroupAdmin"
                :class="$style.checkbox"
              />
              <span>{{ translations.makeGroupAdmin }}</span>
            </label>
          </div>
          
          <!-- Loading State -->
          <div v-if="loadingUsers" :class="$style.loadingUsers">
            <i class="fas fa-spinner fa-spin"></i>
            {{ t('common.loading') }}...
          </div>
          
          <!-- Users Checkbox List -->
          <div v-else :class="$style.usersList">
            <div 
              v-for="user in filteredAvailableUsers" 
              :key="user.id" 
              :class="$style.userCheckboxItem"
            >
              <label :class="$style.userCheckboxLabel">
                <input 
                  type="checkbox" 
                  :value="user.id"
                  v-model="selectedUserIds"
                  :class="$style.userCheckbox"
                />
                <div :class="$style.userInfo">
                  <div :class="$style.userName">{{ user.full_name }}</div>
                  <div :class="$style.userEmail">{{ user.email }}</div>
                  <div :class="$style.userRole">{{ user.role_display || user.role }}</div>
                </div>
              </label>
            </div>
            
            <!-- No Users Found -->
            <div v-if="filteredAvailableUsers.length === 0" :class="$style.noUsers">
              <i class="fas fa-users"></i>
              <p>{{ t('userManagement.modals.addUsersToGroup.noAvailableUsers') }}</p>
            </div>
          </div>
          
          <!-- Selected Count -->
          <div v-if="selectedUserIds.length > 0" :class="$style.selectedCount">
            {{ selectedUserIds.length }} {{ t('userManagement.modals.addUsersToGroup.selectedUsers') }}
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
          @click="handleAddUsers"
          :disabled="selectedUserIds.length === 0 || saving"
        >
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          {{ saving ? t('common.saving') : t('userManagement.buttons.addUsers') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import userManagementService from '../../services/userManagementService'
import type { Group, User } from '../../types/user-management.types'

interface Props {
  visible: boolean
  group: Group | null
}

const props = defineProps<Props>()

interface Emits {
  (e: 'close'): void
  (e: 'success', data: { group: Group; addedUsers: User[] }): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Direct translations
const translations = computed(() => ({
  title: isRTL.value 
    ? 'إضافة مستخدمين إلى المجموعة'
    : 'Add Users to Group',
  makeGroupAdmin: isRTL.value
    ? 'جعل مدير المجموعة'
    : 'Make Group Admin'
}))

const searchQuery = ref('')
const loadingUsers = ref(false)
const saving = ref(false)
const allUsers = ref<User[]>([])
const selectedUserIds = ref<number[]>([])
const makeGroupAdmin = ref(false)

const filteredAvailableUsers = computed(() => {
  let users = allUsers.value
  
  // Filter out users who are already in the group
  // Try using members array first (new approach), fallback to user_groups (old approach)
  if (props.group?.members && props.group.members.length > 0) {
    // Use the members array from the detailed group data
    const existingUserIds = props.group.members.map(member => member.id)
    users = users.filter(user => !existingUserIds.includes(user.id))
  } else if (props.group?.user_groups) {
    // Fallback to the old user_groups structure
    const existingUserIds = props.group.user_groups.map(ug => ug.user.id)
    users = users.filter(user => !existingUserIds.includes(user.id))
  }
  
  // Apply search filter
  if (searchQuery.value) {
    users = users.filter(user => 
      user.full_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return users
})

const loadUsers = async () => {
  try {
    loadingUsers.value = true
    const response = await userManagementService.getUsers()
    allUsers.value = response.users
  } catch (error) {
    // Logging removed for production
    // You could emit an error event here
  } finally {
    loadingUsers.value = false
  }
}

const handleAddUsers = async () => {
  if (!props.group || selectedUserIds.value.length === 0) return
  
  try {
    saving.value = true
    
    // Use bulk add if multiple users, single add if just one user
    if (selectedUserIds.value.length > 1) {
      const response = await userManagementService.bulkAddUsersToGroup({
        group_id: props.group.id,
        user_ids: selectedUserIds.value,
        is_group_admin: makeGroupAdmin.value
      })
      
      emit('success', {
        group: {
          ...response.group,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          description: '',
          user_groups: []
        } as Group,
        addedUsers: response.added_users || []
      })
    } else {
      // Single user add
      const response = await userManagementService.addUserToGroup(props.group.id, {
        user_id: selectedUserIds.value[0],
        is_group_admin: makeGroupAdmin.value
      })
      
      emit('success', {
        group: {
          ...response.group,
          created_at: response.group.created_at || new Date().toISOString(),
          updated_at: response.group.updated_at || new Date().toISOString()
        } as Group,
        addedUsers: [] // Will be refreshed by parent
      })
    }
    
    // Reset form
    selectedUserIds.value = []
    makeGroupAdmin.value = false
    searchQuery.value = ''
    
  } catch (error) {
    // Logging removed for production
    // You could show an error notification here
  } finally {
    saving.value = false
  }
}

// Load users when modal opens
watch(() => props.visible, (visible) => {
  // Logging removed for production
  if (visible) {
    loadUsers()
    // Reset form when modal opens
    selectedUserIds.value = []
    makeGroupAdmin.value = false
    searchQuery.value = ''
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
  z-index: 10000;
  backdrop-filter: blur(8px);
}

.modal {
  background: var(--bg-card);
  border-radius: 16px;
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  box-shadow: 0 8px 32px var(--shadow-color);
  max-width: 600px;
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

.groupInfo {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.groupName {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.groupName i {
  color: var(--accent-primary);
}

.groupDescription {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.formSection {
  margin-top: 1.5rem;
}

.sectionHeader h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.helpText {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.userSearch {
  margin-bottom: 1rem;
}

.searchInput {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.searchInput:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(207, 163, 101, 0.1);
}

.adminToggle {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.adminToggleLabel {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
}

.checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.loadingUsers {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.usersList {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.userCheckboxItem {
  border-bottom: 1px solid var(--border-color);
}

.userCheckboxItem:last-child {
  border-bottom: none;
}

.userCheckboxLabel {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 1rem;
}

.userCheckboxLabel:hover {
  background: var(--bg-glass);
}

.userCheckbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.userInfo {
  flex: 1;
}

.userName {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.userEmail {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.userRole {
  color: var(--text-muted);
  font-size: 0.8rem;
  background: var(--bg-glass);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
}

.noUsers {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.noUsers i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.selectedCount {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--accent-primary);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
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
