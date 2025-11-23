<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useChat } from '../../composables/useChat'
import { useUserSearch } from '../../composables/useUserSearch'
import type { CreateThreadRequest } from '../../types/chat.types'

const emit = defineEmits<{
  close: []
}>()

const { createThread } = useChat()
const {
  users: availableUsers,
  loading: isLoadingUsers,
  error: searchError,
  hasMore,
  remainingCount,
  searchUsers,
  loadNextPage,
  clearResults
} = useUserSearch()

const threadType = ref<'direct' | 'group'>('direct')
const groupTitle = ref('')
const selectedUsers = ref<number[]>([])
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const debounceTimer = ref<number | null>(null)

// Handle search input with debouncing
const handleSearchInput = () => {
  // Clear previous timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // Validate minimum length
  if (searchQuery.value.length < 2) {
    clearResults()
    return
  }
  
  // Debounce search (wait 300ms after user stops typing)
  debounceTimer.value = window.setTimeout(() => {
    performSearch()
  }, 300)
}

// Perform the actual search
const performSearch = async () => {
  await searchUsers(searchQuery.value)
}

// Load more users for pagination
const handleLoadMore = async () => {
  await loadNextPage(searchQuery.value)
}

const selectedCountText = computed(() => {
  if (selectedUsers.value.length === 0) return ''
  if (selectedUsers.value.length === 1) {
    return 'مستخدم واحد محدد'
  }
  return `${selectedUsers.value.length} مستخدمين محددين`
})

const canCreate = computed(() => {
  if (threadType.value === 'direct') {
    return selectedUsers.value.length === 1
  } else {
    return groupTitle.value.trim().length > 0 && selectedUsers.value.length >= 1
  }
})

const toggleUser = (userId: number) => {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    if (threadType.value === 'direct' && selectedUsers.value.length === 1) {
      selectedUsers.value = [userId]
    } else {
      selectedUsers.value.push(userId)
    }
  }
}

const handleCreate = async () => {
  if (!canCreate.value) return

  isLoading.value = true
  error.value = null

  try {
    let data: CreateThreadRequest

    if (threadType.value === 'direct') {
      data = {
        type: 'direct',
        participant_ids: [selectedUsers.value[0]]
      }
    } else {
      data = {
        type: 'group',
        title: groupTitle.value.trim(),
        participant_ids: selectedUsers.value
      }
    }

    const thread = await createThread(data)
    
    if (thread) {
      emit('close')
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Failed to create thread'
  } finally {
    isLoading.value = false
  }
}

// Clean up on unmount
const cleanup = () => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  clearResults()
}

// Register cleanup
onUnmounted(cleanup)
</script>

<template>
  <div :class="$style.modalOverlay" @click.self="emit('close')">
    <div :class="$style.modal">
      <!-- Header -->
      <div :class="$style.header">
        <h2>إنشاء محادثة جديدة</h2>
        <button :class="$style.closeBtn" @click="emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.body">
        <!-- Thread Type -->
        <div :class="$style.formGroup">
          <label :class="$style.label">نوع المحادثة</label>
          <div :class="$style.typeSelector">
            <button
              :class="[$style.typeBtn, { [$style.active]: threadType === 'direct' }]"
              @click="threadType = 'direct'; selectedUsers = []"
            >
              <i class="bi bi-person-fill"></i>
              <span>رسالة مباشرة</span>
            </button>
            <button
              :class="[$style.typeBtn, { [$style.active]: threadType === 'group' }]"
              @click="threadType = 'group'; selectedUsers = []"
            >
              <i class="bi bi-people-fill"></i>
              <span>محادثة جماعية</span>
            </button>
          </div>
        </div>

        <!-- Group Title (only for group) -->
        <div v-if="threadType === 'group'" :class="$style.formGroup">
          <label :class="$style.label">اسم المجموعة</label>
          <input
            v-model="groupTitle"
            type="text"
            :class="$style.input"
            placeholder="أدخل اسم المجموعة..."
            maxlength="200"
          />
        </div>

        <!-- User Search -->
        <div :class="$style.formGroup">
          <label :class="$style.label">
            {{ threadType === 'direct' ? 'اختر مستخدماً واحداً' : 'اختر المستخدمين' }}
            <span :class="$style.labelHint">(اكتب حرفين على الأقل للبحث)</span>
          </label>
          <div :class="$style.searchBox">
            <i class="bi bi-search"></i>
            <input
              v-model="searchQuery"
              @input="handleSearchInput"
              type="text"
              :class="$style.searchInput"
              placeholder="البحث عن المستخدمين... (حرفين على الأقل)"
              minlength="2"
            />
          </div>
        </div>

        <!-- User List -->
        <div :class="$style.userList">
          <!-- Loading State -->
          <div v-if="isLoadingUsers" :class="$style.loadingUsers">
            <i class="bi bi-hourglass-split"></i>
            <span>جاري البحث...</span>
          </div>

          <!-- Search Hint -->
          <div v-else-if="searchQuery.length === 0" :class="$style.searchHint">
            <i class="bi bi-search"></i>
            <span>ابدأ بكتابة اسم المستخدم أو البريد الإلكتروني للبحث</span>
          </div>

          <!-- Short Query Warning -->
          <div v-else-if="searchQuery.length < 2" :class="$style.searchHint">
            <i class="bi bi-info-circle"></i>
            <span>يجب إدخال حرفين على الأقل للبحث</span>
          </div>

          <!-- User Items -->
          <template v-else-if="availableUsers.length > 0">
            <div
              v-for="user in availableUsers"
              :key="user.id"
              :class="[
                $style.userItem,
                { [$style.selected]: selectedUsers.includes(user.id) }
              ]"
              @click="toggleUser(user.id)"
            >
              <div :class="$style.userAvatar">
                {{ (user.first_name || '').charAt(0) }}{{ (user.last_name || '').charAt(0) }}
              </div>
              <div :class="$style.userInfo">
                <span :class="$style.userName">{{ user.first_name || '' }} {{ user.last_name || '' }}</span>
                <span :class="$style.userEmail">{{ user.email || '' }}</span>
              </div>
              <span v-if="user.is_online" :class="$style.onlineIndicator" title="متصل">●</span>
              <i
                v-if="selectedUsers.includes(user.id)"
                class="bi bi-check-circle-fill"
                :class="$style.checkIcon"
              ></i>
            </div>

            <!-- Load More Button -->
            <button
              v-if="hasMore"
              :class="$style.loadMoreBtn"
              :disabled="isLoadingUsers"
              @click="handleLoadMore"
            >
              <i v-if="isLoadingUsers" class="bi bi-hourglass-split"></i>
              <i v-else class="bi bi-arrow-down-circle"></i>
              <span>تحميل المزيد ({{ remainingCount }} متبقي)</span>
            </button>
          </template>

          <!-- No Users Found -->
          <div v-else-if="!isLoadingUsers && searchQuery.length >= 2" :class="$style.noUsers">
            <i class="bi bi-person-x"></i>
            <span>لم يتم العثور على مستخدمين يطابقون "{{ searchQuery }}"</span>
          </div>

          <!-- Search Error -->
          <div v-if="searchError" :class="$style.searchErrorBox">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>{{ searchError }}</span>
          </div>
        </div>

        <!-- Selected Count -->
        <div v-if="selectedUsers.length > 0" :class="$style.selectedCount">
          <i class="bi bi-people-fill"></i>
          <span>{{ selectedCountText }}</span>
        </div>

        <!-- Error -->
        <div v-if="error" :class="$style.error">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div :class="$style.footer">
        <button :class="$style.cancelBtn" @click="emit('close')">
          إلغاء
        </button>
        <button
          :class="[$style.createBtn, { [$style.disabled]: !canCreate }]"
          :disabled="!canCreate || isLoading"
          @click="handleCreate"
        >
          <i v-if="isLoading" class="bi bi-hourglass-split"></i>
          <i v-else class="bi bi-plus-circle"></i>
          <span>{{ isLoading ? 'جاري الإنشاء...' : 'إنشاء' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

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
  padding: 1rem;
}

.modal {
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.closeBtn {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.closeBtn:hover {
  background: #f3f4f6;
  color: #111827;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.formGroup {
  margin-bottom: 1.25rem;
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.labelHint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
  margin-left: 0.5rem;
}

.typeSelector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.typeBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.typeBtn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.typeBtn.active {
  background: #fef3c7;
  border-color: #d4af37;
  color: #92400e;
}

.typeBtn i {
  font-size: 1.5rem;
}

.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #d4af37;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.searchBox {
  position: relative;
}

.searchBox i {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.searchInput {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  transition: all 0.2s;
}

.searchInput:focus {
  outline: none;
  border-color: #d4af37;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.userList {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
}

.loadingUsers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9ca3af;
}

.loadingUsers i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.userItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #e5e7eb;
}

.userItem:last-child {
  border-bottom: none;
}

.userItem:hover {
  background: #ffffff;
}

.userItem.selected {
  background: #fef3c7;
}

.userAvatar {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.userInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.userName {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.userEmail {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkIcon {
  color: #d4af37;
  font-size: 1.25rem;
}

.noUsers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9ca3af;
}

.noUsers i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.selectedCount {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
  margin-top: 1rem;
}

.error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #991b1b;
  margin-top: 1rem;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.cancelBtn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.cancelBtn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.createBtn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(212, 175, 55, 0.2);
}

.createBtn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
}

.createBtn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* New styles for search-based user list */
.searchHint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  color: #9ca3af;
  text-align: center;
}

.searchHint i {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.searchHint span {
  font-size: 0.875rem;
  line-height: 1.5;
}

.onlineIndicator {
  color: #10b981;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.loadMoreBtn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #f9fafb;
  border: none;
  border-top: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.loadMoreBtn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111827;
}

.loadMoreBtn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.loadMoreBtn i {
  font-size: 1rem;
}

.searchErrorBox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: #991b1b;
  margin: 0.75rem;
}

.searchErrorBox i {
  font-size: 1rem;
  flex-shrink: 0;
}
</style>
