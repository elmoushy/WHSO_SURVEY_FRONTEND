<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChat } from '../../composables/useChat'
import ChatThreadList from '../../components/Chat/ChatThreadList.vue'
import ChatMessageList from '../../components/Chat/ChatMessageList.vue'
import ChatMessageInput from '../../components/Chat/ChatMessageInput.vue'
import CreateThreadModal from '../../components/Chat/CreateThreadModal.vue'
import type { Message } from '../../types/chat.types'

const {
  currentThread,
  currentThreadDisplayName,
  selectThread,
  deleteMessage,
  setReplyingTo,
  setEditingMessage,
  disconnectFromChatWebSocket,
  setChatPageVisibility,
  updateGroupSettings,
} = useChat()

const showCreateModal = ref(false)
const showThreadInfo = ref(false)
const isThreadListCollapsed = ref(false)
const isUpdatingSettings = ref(false)

// Check if current user is admin or owner
const isAdmin = computed(() => {
  if (!currentThread.value) return false
  return currentThread.value.my_role === 'admin' || currentThread.value.my_role === 'owner'
})

const handleSelectThread = (threadId: string) => {
  selectThread(threadId)
  showThreadInfo.value = false
}

const handleCreateThread = () => {
  showCreateModal.value = true
}

const handleReply = (message: Message) => {
  setReplyingTo(message)
}

const handleEdit = (message: Message) => {
  setEditingMessage(message)
}

const handleDelete = async (messageId: string) => {
  if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
    await deleteMessage(messageId)
  }
}

const toggleThreadInfo = () => {
  showThreadInfo.value = !showThreadInfo.value
}

const toggleThreadList = () => {
  isThreadListCollapsed.value = !isThreadListCollapsed.value
}

// Handle posting mode change
const handlePostingModeChange = async (mode: 'all' | 'admins_only') => {
  if (!currentThread.value || isUpdatingSettings.value) return
  
  isUpdatingSettings.value = true
  try {
    await updateGroupSettings(currentThread.value.id, { posting_mode: mode })
  } finally {
    isUpdatingSettings.value = false
  }
}

// Handle members can add others toggle
const handleMembersCanAddToggle = async () => {
  if (!currentThread.value || !currentThread.value.group_settings || isUpdatingSettings.value) return
  
  isUpdatingSettings.value = true
  try {
    const newValue = !currentThread.value.group_settings.members_can_add_others
    await updateGroupSettings(currentThread.value.id, { members_can_add_others: newValue })
  } finally {
    isUpdatingSettings.value = false
  }
}

// Set chat page visibility on mount
onMounted(() => {
  setChatPageVisibility(true)
  // Request notification permission if not granted
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  setChatPageVisibility(false)
  disconnectFromChatWebSocket()
})
</script>

<template>
  <div :class="$style.chatPage">
    <!-- Sidebar Container -->
    <div :class="$style.sidebarContainer">
      <!-- Thread List Sidebar -->
      <aside :class="[$style.threadListSidebar, { [$style.collapsed]: isThreadListCollapsed }]">
        <ChatThreadList
          :is-collapsed="isThreadListCollapsed"
          :hide-toggle-button="true"
          @select-thread="handleSelectThread"
          @create-thread="handleCreateThread"
          @toggle-collapse="toggleThreadList"
        />
      </aside>

      <!-- Floating Toggle Button -->
      <button 
        :class="[$style.floatingToggleBtn, { [$style.collapsed]: isThreadListCollapsed }]"
        @click="toggleThreadList"
        :title="isThreadListCollapsed ? 'فتح قائمة المحادثات' : 'إغلاق قائمة المحادثات'"
      >
        <i :class="['bi', isThreadListCollapsed ? 'bi-chevron-left' : 'bi-chevron-right']"></i>
      </button>
    </div>

    <!-- Main Chat Area -->
    <main :class="$style.chatMain">
      <!-- No thread selected -->
      <div v-if="!currentThread" :class="$style.noThread">
        <div :class="$style.noThreadContent">
          <div :class="$style.iconWrapper">
            <i class="bi bi-chat-left-dots"></i>
          </div>
          <h2>المحادثات الداخلية</h2>
          <p>اختر محادثة من القائمة للبدء في المراسلة</p>
          <button :class="$style.startBtn" @click="showCreateModal = true">
            <i class="bi bi-plus-circle"></i>
            <span>ابدأ محادثة جديدة</span>
          </button>
        </div>
      </div>

      <!-- Thread selected -->
      <div v-else :class="$style.chatContainer">
        <!-- Chat Header -->
        <header :class="$style.chatHeader">
          <div :class="$style.headerLeft">
            <div :class="$style.threadAvatar">
              <span>{{ currentThreadDisplayName.charAt(0) }}</span>
            </div>
            <div :class="$style.headerInfo">
              <h3 :class="$style.threadTitle">{{ currentThreadDisplayName }}</h3>
              <span :class="$style.threadStatus">
                <template v-if="currentThread.type === 'direct'">
                  مباشرة
                </template>
                <template v-else>
                  {{ currentThread.participants.length }} المشاركون
                </template>
              </span>
            </div>
          </div>

          <div :class="$style.headerActions">
            <button 
              :class="$style.headerBtn"
              @click="toggleThreadInfo"
              title="Thread Info"
            >
              <i class="bi bi-info-circle"></i>
            </button>
          </div>
        </header>

        <!-- Messages -->
        <ChatMessageList
          @reply="handleReply"
          @edit="handleEdit"
          @delete="handleDelete"
        />

        <!-- Message Input -->
        <ChatMessageInput />
      </div>
    </main>

    <!-- Thread Info Sidebar (Simple version) -->
    <aside 
      v-if="showThreadInfo && currentThread" 
      :class="$style.threadInfoSidebar"
    >
      <div :class="$style.infoHeader">
        <h3>نوع المحادثة</h3>
        <button :class="$style.closeBtn" @click="showThreadInfo = false">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div :class="$style.infoContent">
        <div :class="$style.infoSection">
          <h4>نوع المحادثة</h4>
          <p>{{ currentThread.type === 'direct' ? 'رسالة مباشرة' : 'محادثة جماعية' }}</p>
        </div>

        <div :class="$style.infoSection">
          <h4>المشاركون ({{ currentThread.participants.length }})</h4>
          <div :class="$style.participantsList">
            <div 
              v-for="participant in currentThread.participants" 
              :key="participant.user.id"
              :class="$style.participant"
            >
              <div :class="$style.participantAvatar">
                {{ participant.user.first_name.charAt(0) }}{{ participant.user.last_name.charAt(0) }}
              </div>
              <div :class="$style.participantInfo">
                <span :class="$style.participantName">{{ participant.user.first_name }} {{ participant.user.last_name }}</span>
                <span :class="$style.participantRole">{{ participant.role === 'owner' ? 'المالك' : participant.role === 'admin' ? 'مسؤول' : 'عضو' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentThread.type === 'group' && currentThread.group_settings" :class="$style.infoSection">
          <h4>إعدادات المجموعة</h4>
          
          <!-- Posting Mode Setting -->
          <div :class="$style.settingGroup">
            <span :class="$style.settingLabel">من يمكنه إرسال الرسائل:</span>
            
            <!-- Admin View: Editable Radio Buttons -->
            <div v-if="isAdmin" :class="$style.radioGroup">
              <label :class="[$style.radioOption, { [$style.selected]: currentThread.group_settings.posting_mode === 'all' }]">
                <input 
                  type="radio" 
                  name="postingMode" 
                  value="all"
                  :checked="currentThread.group_settings.posting_mode === 'all'"
                  :disabled="isUpdatingSettings"
                  @change="handlePostingModeChange('all')"
                />
                <span :class="$style.radioLabel">الجميع</span>
              </label>
              <label :class="[$style.radioOption, { [$style.selected]: currentThread.group_settings.posting_mode === 'admins_only' }]">
                <input 
                  type="radio" 
                  name="postingMode" 
                  value="admins_only"
                  :checked="currentThread.group_settings.posting_mode === 'admins_only'"
                  :disabled="isUpdatingSettings"
                  @change="handlePostingModeChange('admins_only')"
                />
                <span :class="$style.radioLabel">المسؤولون فقط</span>
              </label>
            </div>
            
            <!-- Member View: Read-only -->
            <strong v-else>{{ currentThread.group_settings.posting_mode === 'all' ? 'الجميع' : 'المسؤولون فقط' }}</strong>
          </div>
          
          <!-- Members Can Add Others Setting -->
          <div :class="$style.settingGroup">
            <span :class="$style.settingLabel">يمكن للأعضاء إضافة آخرين:</span>
            
            <!-- Admin View: Toggle Switch -->
            <label v-if="isAdmin" :class="$style.toggleSwitch">
              <input 
                type="checkbox" 
                :checked="currentThread.group_settings.members_can_add_others"
                :disabled="isUpdatingSettings"
                @change="handleMembersCanAddToggle"
              />
              <span :class="$style.toggleSlider"></span>
              <span :class="$style.toggleText">
                {{ currentThread.group_settings.members_can_add_others ? 'نعم' : 'لا' }}
              </span>
            </label>
            
            <!-- Member View: Read-only -->
            <strong v-else>{{ currentThread.group_settings.members_can_add_others ? 'نعم' : 'لا' }}</strong>
          </div>
          
          <!-- Loading Indicator -->
          <div v-if="isUpdatingSettings" :class="$style.settingsLoading">
            <i class="bi bi-hourglass-split"></i>
            <span>جاري الحفظ...</span>
          </div>
          
          <!-- Last Updated Info -->
          <div v-if="currentThread.group_settings.updated_by" :class="$style.settingsUpdatedInfo">
            <i class="bi bi-clock-history"></i>
            <span>
              آخر تحديث: {{ currentThread.group_settings.updated_by.first_name }} {{ currentThread.group_settings.updated_by.last_name }}
            </span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Create Thread Modal -->
    <CreateThreadModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
    />
  </div>
</template>

<style module>
.chatPage {
  display: flex;
  /* Use 100dvh (dynamic viewport height) for better mobile support */
  /* Subtract approximate navigation height - adjust if needed */
  height: calc(100dvh - 80px);
  min-height: 0; /* Allow flex shrinking */
  background: #ffffff;
  overflow: hidden; /* Prevent page scroll */
  position: relative;
}

/* Fallback for browsers that don't support dvh */
@supports not (height: 100dvh) {
  .chatPage {
    height: calc(100vh - 80px);
  }
}

.sidebarContainer {
  position: relative;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.threadListSidebar {
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  overflow: hidden;
}

.threadListSidebar.collapsed {
  width: 0;
  min-width: 0;
}

/* Floating Toggle Button */
.floatingToggleBtn {
  position: absolute;
  top: 50%;
  left: 100%; /* Always attached to the right edge of the sidebar */
  transform: translateY(-50%);
  width: 32px;
  height: 64px;
  background: #ffffff;
  color: #d4af37;
  border: 1px solid #e5e7eb;
  border-left: none; /* Remove border adjacent to sidebar */
  border-radius: 0 12px 12px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
}

.floatingToggleBtn:hover {
  background: #f9fafb;
  color: #b78a41;
  width: 36px;
}

.floatingToggleBtn.collapsed {
  left: 100%; /* Stays at 100% of 0 width = 0 */
  border-radius: 0 12px 12px 0;
  transform: translateY(-50%);
}

/* RTL Support */
[dir="rtl"] .floatingToggleBtn {
  left: auto;
  right: 100%; /* Attached to left edge */
  border-right: none;
  border-left: 1px solid #e5e7eb;
  border-radius: 12px 0 0 12px;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.05);
}

[dir="rtl"] .floatingToggleBtn.collapsed {
  right: 100%;
  border-radius: 12px 0 0 12px;
  transform: translateY(-50%);
}

[dir="rtl"] .floatingToggleBtn i {
  transform: scaleX(-1);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .floatingToggleBtn {
    display: none; /* Hide on mobile, use hamburger menu or similar if needed */
  }
}

.chatMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0; /* Critical for nested flex containers */
  height: 100%;
  overflow: hidden; /* Important: prevent overflow */
}

.noThread {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f9fafb;
  overflow: auto;
}

.noThreadContent {
  text-align: center;
  max-width: 480px;
  padding: 3rem 2rem;
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.iconWrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 1rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);
}

.iconWrapper i {
  font-size: 2rem;
  color: #d4af37;
}

.noThreadContent h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.625rem 0;
  letter-spacing: -0.01em;
}

.noThreadContent p {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 2rem 0;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.startBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
  position: relative;
  overflow: hidden;
}

.startBtn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.25s;
}

.startBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(212, 175, 55, 0.35);
}

.startBtn:hover::before {
  opacity: 1;
}

.startBtn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
}

.startBtn i {
  font-size: 1.125rem;
}

.startBtn span {
  position: relative;
  z-index: 1;
}

.chatContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* Critical: allows flex children to shrink */
  overflow: hidden; /* Critical: contain all children */
}

.chatHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0; /* Don't shrink the header */
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.threadAvatar {
  width: 2.75rem;
  height: 2.75rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
}

.headerInfo {
  display: flex;
  flex-direction: column;
}

.threadTitle {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.125rem 0;
}

.threadStatus {
  font-size: 0.8125rem;
  color: #6b7280;
}

.headerActions {
  display: flex;
  gap: 0.5rem;
}

.headerBtn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-size: 1.125rem;
}

.headerBtn:hover {
  background: #f3f4f6;
  color: #111827;
}

.threadInfoSidebar {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid #e5e7eb;
  background: #ffffff;
  overflow-y: auto;
}

.infoHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.infoHeader h3 {
  font-size: 1.125rem;
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

.infoContent {
  padding: 1rem 1.25rem;
}

.infoSection {
  margin-bottom: 1.5rem;
}

.infoSection:last-child {
  margin-bottom: 0;
}

.infoSection h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.infoSection p {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

.participantsList {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.participant {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.participantAvatar {
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.participantInfo {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.participantName {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participantRole {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: capitalize;
}

.settingItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0;
  font-size: 0.875rem;
}

.settingItem span {
  color: #6b7280;
}

.settingItem strong {
  color: #111827;
}

/* Group Settings Styles */
.settingGroup {
  margin-bottom: 1.25rem;
}

.settingLabel {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.radioGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radioOption {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radioOption:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.radioOption.selected {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.1) 100%);
  border-color: #d4af37;
}

.radioOption input[type="radio"] {
  width: 1rem;
  height: 1rem;
  accent-color: #d4af37;
  cursor: pointer;
}

.radioOption input[type="radio"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.radioLabel {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}

/* Toggle Switch */
.toggleSwitch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggleSwitch input[type="checkbox"] {
  display: none;
}

.toggleSlider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggleSlider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggleSwitch input[type="checkbox"]:checked + .toggleSlider {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
}

.toggleSwitch input[type="checkbox"]:checked + .toggleSlider::before {
  transform: translateX(20px);
}

.toggleSwitch input[type="checkbox"]:disabled + .toggleSlider {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggleText {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.settingsLoading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.75rem;
  color: #d4af37;
}

.settingsLoading i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.settingsUpdatedInfo {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.6875rem;
  color: #9ca3af;
}

.settingsUpdatedInfo i {
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .threadInfoSidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -4px 0 6px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .threadListSidebar {
    position: relative;
    width: auto;
  }
}

/* Dark theme - Matching Surveys.vue color scheme */
[data-theme="night"] .chatPage {
  background: linear-gradient(135deg, #231F20 0%, #4D4D4F 50%, #2A2A2A 100%);
}

[data-theme="night"] .sidebarContainer {
  background: rgba(27, 30, 36, 0.92);
}

[data-theme="night"] .floatingToggleBtn {
  background: rgba(40, 43, 51, 0.9);
  border-color: rgba(161, 125, 35, 0.3);
  color: #CEA55B;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);
}

[data-theme="night"] .floatingToggleBtn:hover {
  background: rgba(161, 125, 35, 0.2);
  border-color: rgba(161, 125, 35, 0.5);
}

[data-theme="night"] .noThread {
  background: linear-gradient(135deg, #231F20 0%, #4D4D4F 50%, #2A2A2A 100%);
}

[data-theme="night"] .iconWrapper {
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.3) 0%, rgba(183, 138, 65, 0.2) 100%);
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.25);
}

[data-theme="night"] .iconWrapper i {
  color: #CEA55B;
}

[data-theme="night"] .noThreadContent h2 {
  background: linear-gradient(135deg, #E5E8E1 0%, #D1C6AC 50%, #B78A41 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme="night"] .noThreadContent p {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .startBtn {
  box-shadow: 0 2px 8px rgba(161, 125, 35, 0.35);
}

[data-theme="night"] .startBtn:hover {
  box-shadow: 0 6px 16px rgba(161, 125, 35, 0.45);
}

[data-theme="night"] .chatContainer {
  background: rgba(27, 30, 36, 0.92);
}

[data-theme="night"] .chatHeader {
  background: rgba(40, 43, 51, 0.7);
  border-bottom-color: rgba(161, 125, 35, 0.18);
}

[data-theme="night"] .threadAvatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

[data-theme="night"] .threadTitle {
  color: #E5E8E1;
}

[data-theme="night"] .threadStatus {
  color: rgba(209, 198, 172, 0.7);
}

[data-theme="night"] .headerBtn {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .headerBtn:hover {
  background: rgba(161, 125, 35, 0.2);
  color: #CEA55B;
}

[data-theme="night"] .threadInfoSidebar {
  background: rgba(27, 30, 36, 0.95);
  border-left-color: rgba(161, 125, 35, 0.18);
}

[data-theme="night"] .infoHeader {
  background: rgba(40, 43, 51, 0.7);
  border-bottom-color: rgba(161, 125, 35, 0.18);
}

[data-theme="night"] .infoHeader h3 {
  color: #E5E8E1;
}

[data-theme="night"] .closeBtn {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .closeBtn:hover {
  background: rgba(161, 125, 35, 0.2);
  color: #CEA55B;
}

[data-theme="night"] .infoSection h4 {
  color: #CEA55B;
}

[data-theme="night"] .infoSection p {
  color: rgba(226, 232, 240, 0.82);
}

[data-theme="night"] .participantAvatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

[data-theme="night"] .participantName {
  color: #E5E8E1;
}

[data-theme="night"] .participantRole {
  color: rgba(209, 198, 172, 0.7);
}

[data-theme="night"] .settingLabel {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .radioOption {
  background: rgba(40, 43, 51, 0.7);
  border-color: rgba(226, 232, 240, 0.18);
}

[data-theme="night"] .radioOption:hover {
  background: rgba(161, 125, 35, 0.15);
  border-color: rgba(161, 125, 35, 0.3);
}

[data-theme="night"] .radioOption.selected {
  background: rgba(161, 125, 35, 0.2);
  border-color: #CEA55B;
}

[data-theme="night"] .radioLabel {
  color: #E5E8E1;
}

[data-theme="night"] .toggleSlider {
  background: rgba(40, 43, 51, 0.7);
}

[data-theme="night"] .toggleText {
  color: #E5E8E1;
}

[data-theme="night"] .settingsLoading {
  color: #CEA55B;
}

[data-theme="night"] .settingsUpdatedInfo {
  border-top-color: rgba(161, 125, 35, 0.18);
  color: rgba(209, 198, 172, 0.6);
}

[data-theme="night"] .settingItem span {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .settingItem strong {
  color: #E5E8E1;
}
</style>
