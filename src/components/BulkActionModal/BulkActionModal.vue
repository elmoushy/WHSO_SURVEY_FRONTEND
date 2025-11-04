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
        <div :class="$style.selectedUsers">
          <h4>{{ t('userManagement.users.selectedUsers') }}: {{ mode.selected_users.length }}</h4>
          <div :class="$style.usersList">
            <div v-for="user in mode.selected_users" :key="user.id" :class="$style.userItem">
              {{ user.full_name }} ({{ user.email }})
            </div>
          </div>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div v-if="mode.type === 'add_to_group'" :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.modals.bulkActions.addToGroup') }}</label>
            <select v-model="formData.group_id" :class="$style.select" required>
              <option value="">{{ t('userManagement.forms.group.selectAdmins') }}</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
            
            <div :class="$style.checkboxGroup">
              <label :class="$style.checkboxItem">
                <input type="checkbox" v-model="formData.is_group_admin" :class="$style.checkbox" />
                {{ t('userManagement.forms.user.makeGroupAdmin') }}
              </label>
            </div>
          </div>
          
          <div v-else-if="mode.type === 'change_role'" :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.modals.bulkActions.changeRole') }}</label>
            <select v-model="formData.role" :class="$style.select" required>
              <option value="">{{ t('userManagement.forms.user.role') }}</option>
              <option v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.display }}
              </option>
            </select>
          </div>
        </form>
      </div>
      
      <div :class="$style.modalFooter">
        <button type="button" :class="[$style.btn, $style.cancelBtn]" @click="$emit('close')">
          {{ t('userManagement.buttons.cancel') }}
        </button>
        <button type="button" :class="[$style.btn, $style.applyBtn]" @click="handleSubmit">
          {{ t('userManagement.buttons.apply') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { BulkActionMode } from '../../types/user-management.types'

interface Props {
  mode: BulkActionMode
  groups: Array<{ id: number; name: string }>
  roles: Array<{ value: string; display: string }>
}

const props = defineProps<Props>()

interface Emits {
  (e: 'apply', data: any): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

const visible = computed(() => true)

const formData = ref({
  group_id: null as number | null,
  is_group_admin: false,
  role: ''
})

const getModalTitle = () => {
  switch (props.mode.type) {
    case 'add_to_group': return t.value('userManagement.modals.bulkActions.addToGroup')
    case 'change_role': return t.value('userManagement.modals.bulkActions.changeRole')
    default: return t.value('userManagement.modals.bulkActions.title')
  }
}

const handleSubmit = () => {
  if (props.mode.type === 'add_to_group') {
    emit('apply', {
      group_id: formData.value.group_id,
      user_ids: props.mode.selected_users.map(user => user.id),
      is_group_admin: formData.value.is_group_admin
    })
  } else if (props.mode.type === 'change_role') {
    // This would need to be implemented as multiple individual API calls
    emit('apply', {
      role: formData.value.role,
      user_ids: props.mode.selected_users.map(user => user.id)
    })
  }
}
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

.selectedUsers {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-glass);
  border-radius: 8px;
}

.selectedUsers h4 {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
}

.usersList {
  max-height: 200px;
  overflow-y: auto;
}

.userItem {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.userItem:last-child {
  border-bottom: none;
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

.checkboxGroup {
  margin-top: 1rem;
}

.checkboxItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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

.applyBtn {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
}

.applyBtn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(207, 163, 101, 0.3);
}
</style>
